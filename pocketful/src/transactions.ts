import type { Pool, PoolClient } from "pg";

export type TransactionRecord = {
  id: string;
  accountId: string;
  operation: string;
  amount: string;
  createdAt: string;
};

export async function recordTransaction(
  client: PoolClient,
  id: string,
  accountId: string,
  operation: string,
  amount: string
): Promise<boolean> {
  const result = await client.query(
    `INSERT INTO transactions (id, account_id, operation, amount)
     VALUES ($1, $2, $3, $4::numeric)
     ON CONFLICT (id) DO NOTHING`,
    [id, accountId, operation, amount]
  );
  return result.rowCount === 1;
}

export async function findTransaction(pool: Pool, id: string): Promise<TransactionRecord | null> {
  const result = await pool.query<TransactionRecord>(
    `SELECT id, account_id AS "accountId", operation, amount::text,
            created_at AS "createdAt"
     FROM transactions WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}
