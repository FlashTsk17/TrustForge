import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { findTransaction, recordTransaction, type TransactionRecord } from "./transactions.js";

export type Account = {
  id: string;
  balance: string;
  createdAt: string;
};

export type TransferResult = {
  source: Account;
  destination: Account;
  applied: boolean;
};

export class AccountRepository {
  constructor(private readonly pool: Pool) {}

  async create(): Promise<Account> {
    const id = randomUUID();
    const result = await this.pool.query<Account>(
      'INSERT INTO accounts (id, balance) VALUES ($1, 0) RETURNING id, balance::text, created_at AS "createdAt"',
      [id]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Account | null> {
    const result = await this.pool.query<Account>(
      'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findTransaction(id: string): Promise<TransactionRecord | null> {
    return findTransaction(this.pool, id);
  }

  async deposit(id: string, amount: string, transactionId: string): Promise<Account | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const account = await client.query<Account>(
        'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (!account.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      const recorded = await recordTransaction(client, transactionId, id, "deposit", amount);
      if (recorded) {
        await client.query(
          'UPDATE accounts SET balance = balance + $2::numeric WHERE id = $1',
          [id, amount]
        );
      }
      const result = await client.query<Account>(
        'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id = $1',
        [id]
      );
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
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const firstId = sourceId < destinationId ? sourceId : destinationId;
      const secondId = sourceId < destinationId ? destinationId : sourceId;
      const locked = await client.query<Account>(
        'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE',
        [firstId, secondId]
      );
      if (locked.rows.length !== 2) {
        await client.query("ROLLBACK");
        return null;
      }
      const recorded = await recordTransaction(client, transactionId, sourceId, "transfer", amount);
      if (recorded) {
        const debit = await client.query(
          'UPDATE accounts SET balance = balance - $2::numeric WHERE id = $1 AND balance >= $2::numeric',
          [sourceId, amount]
        );
        if (debit.rowCount !== 1) {
          await client.query("ROLLBACK");
          return null;
        }
        await client.query(
          'UPDATE accounts SET balance = balance + $2::numeric WHERE id = $1',
          [destinationId, amount]
        );
      }
      const states = await client.query<Account>(
        'SELECT id, balance::text, created_at AS "createdAt" FROM accounts WHERE id IN ($1, $2)',
        [sourceId, destinationId]
      );
      const source = states.rows.find(row => row.id === sourceId);
      const destination = states.rows.find(row => row.id === destinationId);
      if (!source || !destination) {
        await client.query("ROLLBACK");
        return null;
      }
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
