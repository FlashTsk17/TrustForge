import { Pool } from "pg";
import { createApp } from "./app.js";
import { AccountRepository } from "./accounts.js";
import { ensureSchema } from "./schema.js";

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://trustforge:trustforge@localhost:5432/trustforge";
const pool = new Pool({ connectionString: databaseUrl });

await ensureSchema(pool);

const accounts = new AccountRepository(pool);
const app = createApp(accounts);

app.listen(port, () => {
  console.log(`Pocketful adapter listening on port ${port}`);
});
