import { describe, expect, it } from "vitest";
import { runStage1ContractVerification } from "./stage1-contract-verifier.js";

describe("independent Stage 1 HTTP verifier", () => {
  it("produces PASS evidence without accessing adapter internals", async () => {
    const result = await runStage1ContractVerification();
    expect(result.status).toBe("PASS");
    expect(result.records.length).toBeGreaterThanOrEqual(7);
    expect(result.records.every(r => r.verifier_conclusion === "PASS")).toBe(true);
    expect(result.records.every(r => r.evidence_hash.length === 64)).toBe(true);
  });
});
