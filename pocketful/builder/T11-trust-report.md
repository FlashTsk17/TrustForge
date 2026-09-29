# T11 — Trust Report

## 1. Scope
Pocketful adapter baseline for TrustForge, limited to the currently executable TrustForge adapter surface and the scenarios exercised by the independent runtime verifier.

This report records tested behavior; it does not certify universal correctness, security, or every possible failure mode.

## 2. Implementation revision
Latest runtime-verified revision:
- Commit: 31c4395eb4446c097869344291f31f0b846f3462
- Runtime: Node.js 22 + PostgreSQL 16
- CI run: #45 (`36496965553`)
- CI conclusion: SUCCESS
- Evidence artifact: `trustforge-runtime-evidence` (`11003701657`)
- Artifact digest: `sha256:5b3ea43228f7b974629b3823c8bcebdc079a3a7dabb597ac7ea7e7bc7efa6843`

## 3. Requirements and critical properties
| Property | Current conclusion | Verified scenarios | Boundary |
|---|---|---|---|
| R1 Conservation of value | PASS | A02, A04, A06 | Tested scenarios only |
| R2 No overdraft | PASS | A02, A03, A06 | Tested scenarios only |
| R3 Idempotency | PASS | A01, A07 | Tested transaction-identity cases |
| R4 Atomicity | PASS | A03, A04, A07 | Tested concurrency and controlled failure |
| R5 Concurrency safety | PASS | A03 | Tested concurrent spending case |
| R6 Authorization | PASS | A05 | Tested adapter-local authorization scenario |
| R7 Evidence integrity | PASS | Evidence-chain audit | Tamper-evident chain independently checked |

## 4. T06 / D02 closure
D02 is now resolved for the TrustForge Pocketful adapter.

Adapter-local authorization contract:
- one cryptographically random opaque access secret per account;
- only its SHA-256 hash is persisted;
- protected API operations require a Bearer credential;
- a credential authorizes only its owning account;
- transfers authorize the source account;
- authorization failure returns HTTP 401 before mutation;
- A05 requires protected state to remain unchanged.

This is an adapter-local TrustForge decision and is not presented as an official Pocketful authentication contract.

## 5. Scenario matrix
| Scenario | Property | Current result |
|---|---|---|
| A01 Duplicate transaction | R3 | PASS |
| A02 Insufficient funds | R1, R2 | PASS |
| A03 Concurrent spending | R2, R4, R5 | PASS |
| A04 Partial failure | R4 | PASS |
| A05 Unauthorized access | R6 | PASS |
| A06 Boundary values | R1, R2 | PASS |
| A07 Ambiguous-result retry | R3, R4 | PASS |

## 6. Independent verification
The TrustForge Runtime Verifier now includes A05 through the HTTP application boundary. A05 creates separate victim and attacker credentials, attempts a victim mutation with the attacker's credential, expects HTTP 401, and checks that the victim state remains unchanged.

The verifier also checks that the legitimate credential is accepted and that the R6 evidence participates in the same tamper-evident R7 chain.

## 7. Validation status
T06 implementation files:
- pocketful/src/auth.ts
- pocketful/src/accounts.ts
- pocketful/src/schema.ts
- pocketful/src/app.ts
- pocketful/tests/critical-scenarios.test.ts
- pocketful/verifier/runtime-verifier.ts
- pocketful/verifier/runtime-verifier.test.ts
- pocketful/builder/T06-authorization.md
- pocketful/DECISIONS.md

Required final gate:
- npm install: PASS (CI run #45)
- npm run build: PASS (CI run #45)
- npm test: PASS (CI run #45)
- independent A05/R6: PASS
- R7 chain after A05: PASS

## 8. Limitations
- D01 official Pocketful interface contract remains unresolved.
- D04 final transaction identity semantics remain unresolved for external-contract alignment.
- D05 controlled failure injection remains adapter-specific.
- The authorization mechanism is minimal and does not establish universal security.
- R6 is now supported by fresh independent runtime evidence from CI run #45.

## 9. Conclusion
**Trust state: VERIFIED FOR EXERCISED CRITICAL SCENARIOS — R1–R7 all PASS.**

R1–R7 have independent runtime evidence for the scenarios currently exercised by TrustForge. This is not a claim of universal correctness or security.
