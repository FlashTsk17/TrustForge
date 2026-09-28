import type { Pool } from "pg";

export async function ensureSchema(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id),
      operation TEXT NOT NULL,
      amount NUMERIC(20, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
