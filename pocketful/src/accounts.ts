import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { createOwnerCredential, ownerTokenMatches } from "./auth.js";
import { findTransaction, recordTransaction, type TransactionRecord } from "./transactions.js";

export type Account = {
  id: string;
  balance: string;
  createdAt: string;
};

export type CreatedAccount = Account & {
  accessSecret: string;
};

export type TransferResult = {
  source: Account;
  destination: Account;
  applied: boolean;
};

export type TransferFailurePoint = "after-debit-before-credit";
export type TransferFailureInjector = (point: TransferFailurePoint) => void;

export class AccountRepository {
  constructor(private readonly pool: Pool, private readonly failureInjector?: TransferFailureInjector) {}

  async create(): Promise<CreatedAccount> {
    const id = randomUUID();
    const credential = createOwnerCredential();
    const result = await this.pool.query<Account>(
      'INSERT INTO accounts (id, balance, owner_token_hash) VALUES ($1, 0, $2) RETURNING id, balance::text, created_at AS "createdAt"',
      [id, credential.tokenHash],
    );
    return { ...result.rows[0], accessSecret: credential.token };
  }

  async authorize(accountId: string, accessSecret: string): Promise<boolean> {
    const result = await this.pool.query<{ ownerTokenHash: string | null }>(
      'SELECT owner_token_hash AS "ownerTokenHash" FROM accounts WHERE id = $1',
      [accountId],
    );
    return ownerTokenMatches(accessSecret, result.rows[0]?.ownerTokenHash ?? null);
  }

  async findById(id: string): Promise<Account | null> {
    const result = await this.pool.query<Account>(
      'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findTransaction(id: string): Promise<TransactionRecord | null> {
    return findTransaction(this.pool, id);
  }

  async deposit(id: string, amount: string, transactionId: string): Promise<Account | null> {
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) throw new Error("invalid_deposit_amount");
    if (transactionId.trim().length === 0 || transactionId.length > 200) throw new Error("invalid_transaction_id");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const account = await client.query<Account>('SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1 FOR UPDATE', [id]);
      if (!account.rows[0]) { await client.query("ROLLBACK"); return null; }
      const recorded = await recordTransaction(client, transactionId, id, "deposit", amount);
      if (recorded) await client.query('UPDATE accounts SET balance = balance + $2::numeric WHERE id = $1', [id, amount]);
      const result = await client.query<Account>('SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1', [id]);
      await client.query("COMMIT");
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async transfer(sourceId: string, destinationId: string, amount: string, transactionId: string): Promise<TransferResult | null> {
    if (sourceId === destinationId) return null;
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) throw new Error("invalid_transfer_amount");
    if (transactionId.trim().length === 0 || transactionId.length > 200) throw new Error("invalid_transaction_id");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const firstId = sourceId < destinationId ? sourceId : destinationId;
      const secondId = sourceId < destinationId ? destinationId : sourceId;
      const locked = await client.query<Account>('SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [firstId, secondId]);
      if (locked.rows.length !== 2) { await client.query("ROLLBACK"); return null; }
      const recorded = await recordTransaction(client, transactionId, sourceId, "transfer", amount);
      if (recorded) {
        const debit = await client.query('UPDATE accounts SET balance = balance - $2::numeric WHERE id = $1 AND balance >= $2::numeric', [sourceId, amount]);
        if (debit.rowCount !== 1) { await client.query("ROLLBACK"); return null; }
        this.failureInjector?.("after-debit-before-credit");
        await client.query('UPDATE accounts SET balance = balance + $2::numeric WHERE id = $1', [destinationId, amount]);
      }
      const states = await client.query<Account>('SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id IN ($1, $2)', [sourceId, destinationId]);
      const source = states.rows.find((row) => row.id === sourceId);
      const destination = states.rows.find((row) => row.id === destinationId);
      if (!source || !destination) { await client.query("ROLLBACK"); return null; }
      await client.query("COMMIT");
      return { source, destination, applied: recorded };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
