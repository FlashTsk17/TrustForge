import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { AccountRepository } from "../src/accounts.js";

export type VerifierConclusion = "PASS" | "FAIL" | "INCONCLUSIVE";

export type EvidenceRecord = {
  evidence_id: string;
  requirement_id: string;
  property_id: string;
  scenario_id: string;
  implementation_revision: string;
  execution_command_or_method: string;
  expected_result: string;
  observed_result: string;
  evidence_artifacts: string[];
  verifier_conclusion: VerifierConclusion;
  limitations: string[];
  repair_reference: string | null;
  re_verification_reference: string | null;
};

export type RuntimeVerificationReport = {
  verifier: "TrustForge Runtime Verifier";
  implementation_revision: string;
  generated_at: string;
  records: EvidenceRecord[];
  property_conclusions: Record<string, VerifierConclusion>;
};

const revision = process.env.GITHUB_SHA ?? process.env.TRUSTFORGE_IMPLEMENTATION_REVISION ?? "local";

function evidence(propertyId: string, scenarioId: string, expected: string, observed: string, artifacts: string[], conclusion: VerifierConclusion, limitations: string[] = []): EvidenceRecord {
  return {
    evidence_id: randomUUID(), requirement_id: `REQ-${propertyId}`, property_id: propertyId, scenario_id: scenarioId,
    implementation_revision: revision,
    execution_command_or_method: "Independent runtime verifier executed by Vitest against PostgreSQL.",
    expected_result: expected, observed_result: observed, evidence_artifacts: artifacts,
    verifier_conclusion: conclusion, limitations, repair_reference: null, re_verification_reference: null,
  };
}

export async function runRuntimeVerification(pool: Pool): Promise<RuntimeVerificationReport> {
  const repo = new AccountRepository(pool);
  const records: EvidenceRecord[] = [];

  {
    const account = await repo.create(); const tx = randomUUID();
    await repo.deposit(account.id, "100.00", tx); await repo.deposit(account.id, "100.00", tx);
    const state = await repo.findById(account.id); const pass = state?.balance === "100.00";
    records.push(evidence("R3", "A01", "At most one financial effect.", `Final balance is ${state?.balance ?? "missing"} after two identical transaction identities.`, ["account final state", "transaction record"], pass ? "PASS" : "FAIL"));
  }

  {
    const source = await repo.create(); const destination = await repo.create();
    const result = await repo.transfer(source.id, destination.id, "1.00", randomUUID());
    const sourceState = await repo.findById(source.id); const destinationState = await repo.findById(destination.id);
    const notApplied = result === null;
    const pass = notApplied && sourceState?.balance === "0.00" && destinationState?.balance === "0.00";
    records.push(evidence("R1", "A02", "Insufficient-funds transfer is rejected without changing either balance.", `result=${result === null ? "not applied" : "applied"}; source=${sourceState?.balance}; destination=${destinationState?.balance}.`, ["source final state", "destination final state", "operation result"], pass ? "PASS" : "FAIL"));
    records.push(evidence("R2", "A02", "Insufficient-funds transfer cannot produce a negative balance.", `result=${result === null ? "not applied" : "applied"}; source=${sourceState?.balance}; destination=${destinationState?.balance}.`, ["source final state", "destination final state", "operation result"], pass ? "PASS" : "FAIL"));
  }

  {
    const source = await repo.create(); const destinationA = await repo.create(); const destinationB = await repo.create();
    await repo.deposit(source.id, "100.00", randomUUID());
    const [first, second] = await Promise.all([repo.transfer(source.id, destinationA.id, "80.00", randomUUID()), repo.transfer(source.id, destinationB.id, "80.00", randomUUID())]);
    const applied = [first, second].filter((item) => item?.applied).length; const sourceState = await repo.findById(source.id);
    const pass = applied === 1 && sourceState?.balance === "20.00";
    records.push(evidence("R2", "A03", "Concurrent spending cannot create an invalid negative balance.", `applied=${applied}; source=${sourceState?.balance}.`, ["concurrent operation results", "source final state"], pass ? "PASS" : "FAIL"));
    records.push(evidence("R5", "A03", "Race conditions cannot violate critical value invariants.", `applied=${applied}; source=${sourceState?.balance}.`, ["concurrent operation results", "source final state"], pass ? "PASS" : "FAIL"));
  }

  {
    const account = await repo.create(); let zeroRejected = false; let negativeRejected = false;
    try { await repo.deposit(account.id, "0.00", randomUUID()); } catch { zeroRejected = true; }
    try { await repo.deposit(account.id, "-1.00", randomUUID()); } catch { negativeRejected = true; }
    const state = await repo.findById(account.id); const pass = zeroRejected && negativeRejected && state?.balance === "0.00";
    records.push(evidence("R1", "A06", "Boundary rejection does not create unexplained value.", `zeroRejected=${zeroRejected}; negativeRejected=${negativeRejected}; balance=${state?.balance}.`, ["boundary operation results", "account final state"], pass ? "PASS" : "FAIL"));
    records.push(evidence("R2", "A06", "Invalid boundary inputs do not create an invalid balance.", `zeroRejected=${zeroRejected}; negativeRejected=${negativeRejected}; balance=${state?.balance}.`, ["boundary operation results", "account final state"], pass ? "PASS" : "FAIL"));
  }

  {
    const source = await repo.create(); const destination = await repo.create(); await repo.deposit(source.id, "50.00", randomUUID()); const tx = randomUUID();
    const first = await repo.transfer(source.id, destination.id, "30.00", tx); const retry = await repo.transfer(source.id, destination.id, "30.00", tx);
    const sourceState = await repo.findById(source.id); const destinationState = await repo.findById(destination.id);
    const pass = first?.applied === true && retry?.applied === false && sourceState?.balance === "20.00" && destinationState?.balance === "30.00";
    records.push(evidence("R3", "A07", "Retry does not duplicate the financial effect.", `first.applied=${first?.applied}; retry.applied=${retry?.applied}; source=${sourceState?.balance}; destination=${destinationState?.balance}.`, ["first operation result", "retry operation result", "source final state", "destination final state"], pass ? "PASS" : "FAIL"));
  }

  {
    const source = await repo.create();
    const destination = await repo.create();
    await repo.deposit(source.id, "100.00", randomUUID());
    const tx = randomUUID();
    let injectedFailure = false;
    const checkedRepo = new AccountRepository(pool, (point) => {
      if (point === "after-debit-before-credit") {
        injectedFailure = true;
        throw new Error("simulated_transfer_exception");
      }
    });

    try {
      await checkedRepo.transfer(source.id, destination.id, "40.00", tx);
    } catch {
      // Expected controlled failure.
    }

    const sourceState = await repo.findById(source.id);
    const destinationState = await repo.findById(destination.id);
    const transactionState = await repo.findTransaction(tx);
    const pass =
      injectedFailure &&
      sourceState?.balance === "100.00" &&
      destinationState?.balance === "0.00" &&
      transactionState === null;

    records.push(
      evidence(
        "R4",
        "A04",
        "A failure after debit and before credit must leave no partial persistent state.",
        `injectedFailure=${injectedFailure}; source=${sourceState?.balance}; destination=${destinationState?.balance}; transactionRecord=${transactionState ? "present" : "absent"}.`,
        ["source final state", "destination final state", "transaction record state"],
        pass ? "PASS" : "FAIL",
      ),
    );
  }

  const allPass = (property: string) => records.filter((item) => item.property_id === property).length > 0 && records.filter((item) => item.property_id === property).every((item) => item.verifier_conclusion === "PASS");
  return { verifier: "TrustForge Runtime Verifier", implementation_revision: revision, generated_at: new Date().toISOString(), records,
    property_conclusions: { R1: allPass("R1") ? "PASS" : "FAIL", R2: allPass("R2") ? "PASS" : "FAIL", R3: allPass("R3") ? "PASS" : "FAIL", R4: allPass("R4") ? "PASS" : "FAIL", R5: allPass("R5") ? "PASS" : "FAIL", R6: "INCONCLUSIVE", R7: "INCONCLUSIVE" } };
}
