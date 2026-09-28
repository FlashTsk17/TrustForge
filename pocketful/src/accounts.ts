import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { recordTransaction } from "./transactions.js";

export type Account = {
  id: string;
  balance: string;
  createdAt: string;
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
}
