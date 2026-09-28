import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { AccountRepository } from "../src/accounts.js";
import { ensureSchema } from "../src/schema.js";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://trustforge:trustforge@localhost:5432/trustforge",
});

let repo: AccountRepository;

beforeAll(async () => {
  await ensureSchema(pool);
  repo = new AccountRepository(pool);
});

beforeEach(async () => {
  await pool.query("TRUNCATE transactions, accounts CASCADE");
});

afterAll(async () => {
  await pool.end();
});

describe("TrustForge Pocketful critical scenarios", () => {
  it("A01 duplicate transaction: applies a deposit at most once", async () => {
    const account = await repo.create();
    const tx = randomUUID();

    await repo.deposit(account.id, "100.00", tx);
    const repeated = await repo.deposit(account.id, "100.00", tx);
    const finalState = await repo.findById(account.id);

    expect(repeated?.balance).toBe("100.00");
    expect(finalState?.balance).toBe("100.00");
    expect((await repo.findTransaction(tx))?.id).toBe(tx);
  });

  it("A02 insufficient funds: never creates negative balance", async () => {
    const source = await repo.create();
    const destination = await repo.create();

    const result = await repo.transfer(
      source.id,
      destination.id,
      "1.00",
      randomUUID(),
    );

    expect(result).toBeNull();
    expect((await repo.findById(source.id))?.balance).toBe("0.00");
    expect((await repo.findById(destination.id))?.balance).toBe("0.00");
  });

  it("A03 concurrent spending: only one conflicting transfer can succeed", async () => {
    const source = await repo.create();
    const destinationA = await repo.create();
    const destinationB = await repo.create();

    await repo.deposit(source.id, "100.00", randomUUID());

    const [first, second] = await Promise.all([
      repo.transfer(source.id, destinationA.id, "80.00", randomUUID()),
      repo.transfer(source.id, destinationB.id, "80.00", randomUUID()),
    ]);

    const applied = [first, second].filter((result) => result?.applied).length;
    const sourceAfter = await repo.findById(source.id);

    expect(applied).toBe(1);
    expect(sourceAfter?.balance).toBe("20.00");
  });

  it("A04 partial failure: transaction remains atomic", async () => {
    const source = await repo.create();
    const destination = await repo.create();
    await repo.deposit(source.id, "100.00", randomUUID());

    const tx = randomUUID();
    const injectedRepo = new AccountRepository(pool, (point) => {
      if (point === "after-debit-before-credit") {
        throw new Error("injected_transfer_error");
      }
    });

    await expect(
      injectedRepo.transfer(source.id, destination.id, "40.00", tx),
    ).rejects.toThrow("injected_transfer_error");

    expect((await repo.findById(source.id))?.balance).toBe("100.00");
    expect((await repo.findById(destination.id))?.balance).toBe("0.00");
    expect(await repo.findTransaction(tx)).toBeNull();
  });

  it("A06 boundary values: rejects non-positive deposits", async () => {
    const account = await repo.create();

    await expect(
      repo.deposit(account.id, "0.00", randomUUID()),
    ).rejects.toThrow();

    await expect(
      repo.deposit(account.id, "-1.00", randomUUID()),
    ).rejects.toThrow();

    expect((await repo.findById(account.id))?.balance).toBe("0.00");
  });

  it("A07 retry after an ambiguous result: same transaction identity is idempotent", async () => {
    const source = await repo.create();
    const destination = await repo.create();

    await repo.deposit(source.id, "50.00", randomUUID());
    const tx = randomUUID();

    const first = await repo.transfer(source.id, destination.id, "30.00", tx);
    const retry = await repo.transfer(source.id, destination.id, "30.00", tx);

    expect(first?.applied).toBe(true);
    expect(retry?.applied).toBe(false);
    expect((await repo.findById(source.id))?.balance).toBe("20.00");
    expect((await repo.findById(destination.id))?.balance).toBe("30.00");
  });
});
