import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

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
      "INSERT INTO accounts (id, balance) VALUES ($1, 0) RETURNING id, balance::text, created_at AS \"createdAt\"",
      [id]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Account | null> {
    const result = await this.pool.query<Account>(
      "SELECT id, balance::text, created_at AS \"createdAt\" FROM accounts WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  }
}
