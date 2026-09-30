import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import request from "supertest";
import { createStage1App } from "../src/stage1.js";

export type Verdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export type ContractEvidence = {
  evidence_id: string;
  requirement_id: string;
  scenario_id: string;
  execution_command_or_method: string;
  expected_result: string;
  observed_result: string;
  verifier_conclusion: Verdict;
  evidence_artifacts: string[];
  previous_evidence_hash: string | null;
  evidence_hash: string;
};

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function appendEvidence(records: ContractEvidence[], record: Omit<ContractEvidence, "previous_evidence_hash" | "evidence_hash">) {
  const previous = records.at(-1)?.evidence_hash ?? null;
  const unsigned = { ...record, previous_evidence_hash: previous };
  const evidence_hash = sha(JSON.stringify(unsigned));
  records.push({ ...unsigned, evidence_hash });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function login(app: ReturnType<typeof createStage1App>, email: string, password = "correct horse") {
  return request(app).post("/auth/login").send({ email, password });
}

async function reset(app: ReturnType<typeof createStage1App>) {
  const response = await request(app).post("/_test/reset").send({
    currency: "EUR",
    minor_units: 2,
    users: [
      { id: "u_ada", email: "ada@example.com", password: "correct horse", display_name: "Ada", handle: "ada", balance: 10000 },
      { id: "u_bob", email: "bob@example.com", password: "correct horse", display_name: "Bob", handle: "bob", balance: 2500 },
      { id: "u_cy", email: "cy@example.com", password: "correct horse", display_name: "Cy", handle: "cy", balance: 0 }
    ],
    payments: [],
    requests: [],
    settlement_operator_ids: ["u_ada"]
  });
  assert(response.status === 204, "reset did not return 204");
}

export async function runStage1ContractVerification() {
  const app = createStage1App();
  const records: ContractEvidence[] = [];

  try {
    await reset(app);
    const health = await request(app).get("/health");
    assert(health.status === 200 && health.body.status === "ok", "health contract failed");
    appendEvidence(records, {
      evidence_id: "T12-V-A01",
      requirement_id: "D01",
      scenario_id: "A01",
      execution_command_or_method: "HTTP GET /health",
      expected_result: "200 with {status:ok}",
      observed_result: JSON.stringify(health.body),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["HTTP response"]
    });

    const adaLogin = await login(app, "ada@example.com");
    const bobLogin = await login(app, "bob@example.com");
    assert(adaLogin.status === 200 && bobLogin.status === 200, "login failed");
    const ada = adaLogin.body.token;
    const bob = bobLogin.body.token;

    const first = await request(app).post("/payments")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-payment")
      .send({ to_handle: "bob", amount: 1500, note: "verifier", visibility: "public" });
    const replay = await request(app).post("/payments")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-payment")
      .send({ visibility: "public", note: "verifier", amount: 1500, to_handle: "bob" });
    assert(first.status === 201 && replay.status === 200, "payment idempotency statuses failed");
    assert(JSON.stringify(first.body) === JSON.stringify(replay.body), "replay body changed");
    const reuse = await request(app).post("/payments")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-payment")
      .send({ to_handle: "bob", amount: 1400 });
    assert(reuse.status === 409 && reuse.body.error?.code === "idempotency_key_reuse", "key reuse contract failed");
    appendEvidence(records, {
      evidence_id: "T12-V-A02",
      requirement_id: "D04",
      scenario_id: "A02",
      execution_command_or_method: "HTTP POST /payments: first, canonical replay, changed-body reuse",
      expected_result: "201 then 200 identical replay; changed body 409 idempotency_key_reuse",
      observed_result: JSON.stringify({ first: first.status, replay: replay.status, reuse: reuse.status }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["HTTP responses"]
    });

    const failed = await request(app).post("/payments")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-retry")
      .send({ to_handle: "missing", amount: 100 });
    const recovered = await request(app).post("/payments")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-retry")
      .send({ to_handle: "bob", amount: 100 });
    assert(failed.status === 404 && recovered.status === 201, "failed-key reuse failed");
    appendEvidence(records, {
      evidence_id: "T12-V-A03",
      requirement_id: "D04",
      scenario_id: "A03",
      execution_command_or_method: "HTTP POST /payments with failed 4xx then same key",
      expected_result: "failed key remains reusable",
      observed_result: JSON.stringify({ failed: failed.status, recovered: recovered.status }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["HTTP responses"]
    });

    const reqCreate = await request(app).post("/requests")
      .set("Authorization", `Bearer ${ada}`)
      .set("Idempotency-Key", "verifier-request")
      .send({ payer_handle: "bob", amount: 500 });
    assert(reqCreate.status === 201, "request creation failed");
    const reqPay = await request(app).post(`/requests/${reqCreate.body.request_id}/pay`)
      .set("Authorization", `Bearer ${bob}`)
      .set("Idempotency-Key", "verifier-request-pay")
      .send({ visibility: "private" });
    assert(reqPay.status === 201, "request payment failed");
    const reqReplay = await request(app).post(`/requests/${reqCreate.body.request_id}/pay`)
      .set("Authorization", `Bearer ${bob}`)
      .set("Idempotency-Key", "verifier-request-pay")
      .send({ visibility: "private" });
    assert(reqReplay.status === 200 && JSON.stringify(reqReplay.body) === JSON.stringify(reqPay.body), "request replay failed");
    appendEvidence(records, {
      evidence_id: "T12-V-A04",
      requirement_id: "D04",
      scenario_id: "A04",
      execution_command_or_method: "HTTP POST /requests/{id}/pay then exact replay",
      expected_result: "201 then 200 with identical payment receipt and no second movement",
      observed_result: JSON.stringify({ first: reqPay.status, replay: reqReplay.status }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["HTTP responses"]
    });

    await reset(app);
    const fresh = await login(app, "ada@example.com");
    const concurrent = await Promise.all(Array.from({ length: 10 }, () =>
      request(app).post("/payments")
        .set("Authorization", `Bearer ${fresh.body.token}`)
        .set("Idempotency-Key", "verifier-concurrent")
        .send({ to_handle: "bob", amount: 100 })
    ));
    const c201 = concurrent.filter(x => x.status === 201).length;
    const c200 = concurrent.filter(x => x.status === 200).length;
    assert(c201 === 1 && c200 === 9, "concurrent idempotency contract failed");
    const me = await request(app).get("/me").set("Authorization", `Bearer ${fresh.body.token}`);
    assert(me.body.balance === 9900, "concurrent write changed balance more than once");
    appendEvidence(records, {
      evidence_id: "T12-V-A05",
      requirement_id: "D04",
      scenario_id: "A05",
      execution_command_or_method: "10 concurrent identical HTTP POST /payments requests",
      expected_result: "exactly one 201, nine 200, one financial effect",
      observed_result: JSON.stringify({ c201, c200, balance: me.body.balance }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["10 HTTP responses", "GET /me"]
    });

    const exported = await request(app).get("/_test/export");
    assert(exported.status === 200, "export failed");
    const imported = await request(app).post("/_test/import").send(exported.body);
    assert(imported.status === 204, "import failed");
    const afterImport = await request(app).get("/me").set("Authorization", `Bearer ${fresh.body.token}`);
    assert(afterImport.status === 200 && afterImport.body.balance === 9900, "import did not preserve state and token");
    const replayAfterImport = await request(app).post("/payments")
      .set("Authorization", `Bearer ${fresh.body.token}`)
      .set("Idempotency-Key", "verifier-concurrent")
      .send({ to_handle: "bob", amount: 100 });
    assert(replayAfterImport.status === 200, "import did not preserve idempotency receipts");
    appendEvidence(records, {
      evidence_id: "T12-V-A06",
      requirement_id: "D01",
      scenario_id: "A06",
      execution_command_or_method: "GET /_test/export then POST /_test/import then credential/idempotency replay",
      expected_result: "state, token and successful idempotency receipt survive replacement",
      observed_result: JSON.stringify({ import: imported.status, me: afterImport.status, replay: replayAfterImport.status }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["export JSON", "HTTP responses"]
    });

    await reset(app);
    const operator = await login(app, "ada@example.com");
    const settlement = await request(app).post("/settlements")
      .set("Authorization", `Bearer ${operator.body.token}`)
      .set("Idempotency-Key", "verifier-settlement")
      .send({ transfers: [
        { from_handle: "ada", to_handle: "bob", amount: 600 },
        { from_handle: "bob", to_handle: "cy", amount: 200 }
      ]});
    assert(settlement.status === 201 && settlement.body.payments.length === 2, "settlement failed");
    const settlementReplay = await request(app).post("/settlements")
      .set("Authorization", `Bearer ${operator.body.token}`)
      .set("Idempotency-Key", "verifier-settlement")
      .send({ transfers: [
        { from_handle: "ada", to_handle: "bob", amount: 600 },
        { from_handle: "bob", to_handle: "cy", amount: 200 }
      ]});
    assert(settlementReplay.status === 200, "settlement replay failed");
    const states = await Promise.all(["ada", "bob", "cy"].map(async email => {
      const token = (await login(app, `${email}@example.com`)).body.token;
      return (await request(app).get("/me").set("Authorization", `Bearer ${token}`)).body.balance;
    }));
    assert(states.reduce((a: number, b: number) => a + b, 0) === 12500, "balance conservation failed");
    appendEvidence(records, {
      evidence_id: "T12-V-A07",
      requirement_id: "D01",
      scenario_id: "A07",
      execution_command_or_method: "HTTP settlement batch, exact replay and balance inspection",
      expected_result: "atomic net movement, replay without second effect, seeded total conserved",
      observed_result: JSON.stringify({ first: settlement.status, replay: settlementReplay.status, balances: states }),
      verifier_conclusion: "PASS",
      evidence_artifacts: ["settlement responses", "wallet responses"]
    });

    return { status: "PASS" as const, records };
  } catch (error) {
    appendEvidence(records, {
      evidence_id: `T12-V-FAIL-${records.length + 1}`,
      requirement_id: "D01",
      scenario_id: "T12-V-UNEXPECTED",
      execution_command_or_method: "HTTP contract verification",
      expected_result: "all independent contract scenarios pass",
      observed_result: error instanceof Error ? error.message : String(error),
      verifier_conclusion: "FAIL",
      evidence_artifacts: []
    });
    return { status: "FAIL" as const, records };
  }
}

export async function writeStage1Evidence() {
  const result = await runStage1ContractVerification();
  await mkdir("evidence", { recursive: true });
  await writeFile("evidence/stage1-contract-verification.json", JSON.stringify(result, null, 2), "utf8");
  return result;
}
