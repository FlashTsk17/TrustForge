import { mkdir, writeFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ensureSchema } from "../src/schema.js";
import { runRuntimeVerification } from "./runtime-verifier.js";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://trustforge:trustforge@localhost:5432/trustforge",
});

describe("TrustForge independent runtime verifier", () => {
  beforeAll(async () => {
    await ensureSchema(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("produces structured evidence with runtime-verified atomicity", async () => {
    const report = await runRuntimeVerification(pool);

    await mkdir("evidence", { recursive: true });
    await writeFile(
      "evidence/runtime-verification.json",
      JSON.stringify(report, null, 2),
      "utf8",
    );

    expect(report.records.length).toBeGreaterThan(0);
    expect(report.property_conclusions.R1).toBe("PASS");
    expect(report.property_conclusions.R2).toBe("PASS");
    expect(report.property_conclusions.R3).toBe("PASS");
    expect(report.property_conclusions.R4).toBe("PASS");
    expect(report.property_conclusions.R5).toBe("PASS");
    expect(report.property_conclusions.R6).toBe("INCONCLUSIVE");
    expect(report.property_conclusions.R7).toBe("INCONCLUSIVE");

    expect(
      report.records.every(
        (item) =>
          item.evidence_id &&
          item.requirement_id &&
          item.property_id &&
          item.scenario_id &&
          item.implementation_revision &&
          item.execution_command_or_method &&
          item.expected_result &&
          item.observed_result &&
          item.evidence_artifacts.length > 0 &&
          ["PASS", "FAIL", "INCONCLUSIVE"].includes(item.verifier_conclusion),
      ),
    ).toBe(true);
  });
});
