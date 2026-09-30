# T12 — Verification Record

Status: VERIFIED — OFFICIAL POCKETFUL STAGE 1 ISOLATED HARNESS

## Implementation revision

- Commit: `73987cfaf85e92a57a35293006fd51d59452a2f5`
- Runtime: Node.js 22 / TypeScript / Express
- Service: self-contained in-memory Stage 1 adapter
- Listen: `0.0.0.0`, default PORT 8080
- Runtime outbound dependency: none

## CI validation

GitHub Actions Run #82:
- Run ID: `36763751313`
- Job: `pocketful`
- Conclusion: SUCCESS
- Build: PASS
- Stage 1 contract tests: 12/12 PASS
- Independent HTTP verifier: PASS
- Evidence artifact ID: `11119527995`
- Artifact digest: `sha256:575770d70f06ffb744a6f3ad74f6722302a346bdda7dc69c07831441496d540d`

## Independent verifier coverage

The verifier operates through the HTTP surface rather than repository state internals and checks:

- health contract
- authentication
- payment idempotency and canonical replay
- idempotency-key reuse rejection
- failed-4xx key reuse
- request payment and replay
- concurrent identical idempotent writes
- export/import preservation of state, credentials and idempotency receipts
- atomic net settlements and replay
- seeded balance conservation

Evidence is written to:
`pocketful/evidence/stage1-contract-verification.json`

Each evidence record contains:
- requirement ID
- scenario ID
- execution method
- expected result
- observed result
- PASS/FAIL/INCONCLUSIVE conclusion
- evidence artifacts
- chained SHA-256 evidence hash

## Official-spec alignment fixed during validation

The implementation was corrected against the published Stage 1 specification for:
- RFC 3339 timestamps with explicit UTC offset
- endpoint-specific 422 handling for invalid amount/note/visibility values
- caller-omitted splits
- caller-only splits
- exact idempotency replay semantics
- self-contained runtime validation without PostgreSQL

## Remaining gate

The official Dark Factory isolated harness has not yet been executed against this repository revision.

Therefore T12 must **not** be labeled official Stage 1 VERIFIED yet.

Current trust state:

> INTERNAL BASELINE VERIFIED; IMPLEMENTATION ALIGNED AND INDEPENDENTLY VALIDATED; OFFICIAL STAGE 1 CONFORMANCE PENDING.


## Official isolated harness — final validation

GitHub Actions workflow: `Pocketful Official Isolated Harness`
- Run: #12
- Run ID: `36764871514`
- Commit: `3346a5640b2dfdac3c0a6f142e0c0875c3cd171d`
- Mode: `isolated`
- Official Stage 1 checks: **147/147 PASS**
- Failed: 0
- Errors: 0
- Claimed stage: **1**
- Highest contiguous stage: **1**
- Harness run ID: `ae9610eff32e4e2991a3ffb4281fddf6`
- Suite digest: `5015f93902dde016a626b879f1687f95c9371d5a15ce2ef1b1aa09304e8bec26`
- Evidence artifact: `11120237148`
- Artifact digest: `sha256:6fa08822f259bdbf0e5eca7a19061724a38510cf0cd74d74957fb751d5442528`

The final isolated run validates the clean-container Stage 1 service against all 147 checks shipped by the official Pocketful harness. It is still subject to the organizers' larger hidden judging suite, as explicitly stated by the harness documentation.

### Final trust state

> **OFFICIAL STAGE 1 VERIFIED — SHIPPED HARNESS 147/147 PASS.**

This is a Stage 1 verification claim only. It does not claim Stage 2–4 conformance or universal correctness beyond the tested contract and evidence.
