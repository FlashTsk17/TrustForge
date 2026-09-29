# TrustForge — Pocketful Architecture Package v0.2

> Updated after T06/D02 resolution. This package separates supplied facts from adapter-local implementation decisions.

## A. Executive Summary
Build a minimal Pocketful wallet application for the hackathon and expose enough observable behavior for TrustForge to challenge, verify, repair, and re-verify critical properties.

## B. Component Map
| ID | Component | Responsibility | Dependencies | Critical risks |
|---|---|---|---|---|
| C01 | Account Interface | Create accounts and expose account identity | Runtime | Identity collisions |
| C02 | Wallet Operations | Deposit, balance, transfer behavior | C01, C03 | R1–R5 |
| C03 | State Store | Persist account and transaction state | Runtime | Atomicity, concurrency |
| C04 | Authorization Boundary | Enforce protected account access | C01, C02 | R6 |
| C05 | Transaction Identity | Track logical transaction identity | C02, C03 | R3 |
| C06 | Observability Surface | Expose results/state required for verification | C01–C05 | Evidence gaps |
| C07 | Verification Harness | Execute functional/adversarial scenarios | C06 | False conclusions |
| C08 | Evidence Recorder | Persist execution observations and provenance | C07 | R7 |

## C. Critical Properties
### R1 — Conservation
No unexplained value is created or destroyed by supported operations.
### R2 — No overdraft
A successful operation never leaves an account below its allowed minimum balance.
### R3 — Idempotency
The same logical transaction is applied at most once.
### R4 — Atomicity
A transfer is all-or-nothing from the persistent state perspective.
### R5 — Concurrency
Race conditions cannot violate critical value invariants.
### R6 — Authorization
Protected state cannot be manipulated without required authorization.
### R7 — Evidence integrity
Every verification conclusion remains traceable to observable evidence.

## D. Task Graph
| Task ID | Objective | Dependencies | Deliverable | Acceptance criteria | Verification | Risks |
|---|---|---|---|---|---|---|
| T01 | Establish runtime skeleton | — | Runnable application shell | Application starts in documented environment | Startup check | K01 |
| T02 | Implement account creation/state model | T01 | Account capability | Account can be created and uniquely identified | Account scenario | K02 |
| T03 | Implement deposit/balance | T02 | Deposit + balance capability | Controlled deposit produces expected observable balance | Balance reconciliation | K03 |
| T04 | Implement transaction identity | T02 | Transaction identity mechanism | Duplicate logical transaction can be recognized | Idempotency scenario | K04 |
| T05 | Implement transfer | T03, T04 | Transfer capability | Valid transfer updates both accounts consistently | Transfer checks | K05 |
| T06 | Implement authorization boundary | T02, T05 | Protected operations | Unauthorized protected operation is rejected/prevented | A05 + independent verifier | K06 |
| T07 | Implement observability | T02–T06 | Testable state/results | Required observations can be captured reproducibly | Harness inspection | K07 |
| T08 | Build verification harness | T07 | Automated scenario runner | Acceptance and attack cases execute reproducibly | Harness self-check | K08 |
| T09 | Execute baseline verification | T08 | Baseline report | R1–R7 each has PASS/FAIL/INCONCLUSIVE evidence | Independent verification | K09 |
| T10 | Repair demonstrated defects | T09 | Corrective revisions | Each confirmed defect has root cause + regression coverage where applicable | Re-verification | K10 |
| T11 | Produce Trust Report | T10 | Final evidence package | Conclusions trace to execution evidence and revisions | Evidence audit | K11 |

## E. Acceptance Matrix
| Requirement | Property | Test/check | Expected evidence | Pass condition |
|---|---|---|---|---|
| Wallet value integrity | R1 | Controlled deposits/transfers reconciliation | Before/after balances + operation records | Reconciliation matches expected value movement |
| Balance safety | R2 | Insufficient funds + concurrent spending | Requests + final balances | No successful invalid negative state |
| Duplicate protection | R3 | Repeat same transaction identity | Both executions + final state | One financial effect at most |
| Transfer integrity | R4 | Partial-failure scenario where feasible | Failure point + final state | No one-sided persistent transfer |
| Race safety | R5 | Concurrent conflicting operations | Concurrent actions + final state | Critical invariants remain true |
| Access control | R6 | Cross-account unauthorized action | Principal/context + response/state | Protected state remains unchanged/denied |
| Auditability | R7 | Evidence-chain audit | IDs linking requirement→scenario→execution→revision→conclusion | Every conclusion is traceable |

## F. Adversarial Plan
### A05 — Unauthorized account manipulation
- Target: R6
- Preconditions: two distinct principals/accounts with distinct adapter access secrets
- Action: attempt a protected operation using the other account's secret
- Expected safe behavior: HTTP 401; protected state unchanged
- Evidence: principal context, action, response, authorization result, state delta

## G. Risk Register
| Risk ID | Description | Affected components/properties | Mitigation | Verification |
|---|---|---|---|---|
| K01 | Runtime constraints differ from assumed environment | C01–C08 | Confirm environment before implementation | T01 |
| K02 | Account identity semantics are unspecified | C01 | Resolve contract before final implementation | T02 |
| K03 | Deposit semantics may differ from assumptions | C02/C03, R1 | Confirm supported value lifecycle | T03 |
| K04 | Transaction identity semantics unspecified | C05, R3 | Resolve contract; make identity explicit | T04 |
| K05 | Transfer atomicity depends on persistence/runtime behavior | C02/C03, R4 | Design transaction boundary explicitly | T05/T09 |
| K06 | Authorization contract was initially unspecified | C04, R6 | Resolved by adapter-local D02 decision and A05 verifier | T06/T09 |
| K07 | Required state may not be observable | C06, R7 | Define evidence surface early | T07 |
| K08 | Harness may produce false confidence | C07 | Independent verifier and negative/adversarial cases | T08/T09 |
| K09 | Some failures cannot be reproduced deterministically | C07 | Capture execution context and repeatability | T09 |
| K10 | Repair changes unrelated behavior | C02–C06 | Minimal patches + regression tests + re-verification | T10 |
| K11 | Final report overstates evidence | C08, R7 | Evidence schema + explicit INCONCLUSIVE state | T11 |

## H. Builder Handoffs
### H06 — T06 Authorization
- Objective: enforce the accepted adapter-local authorization model around protected operations.
- Dependencies: T02, T05.
- Model: one opaque access secret per account; SHA-256 hash persisted; HTTP Bearer transport; source-owner authority for transfers.
- Acceptance: unauthorized protected operation cannot modify protected state; valid owner access succeeds.
- Required evidence: principal context, action, response, authorization result, state comparison.
- Must not claim this contract is an official external Pocketful authentication requirement.

## I. Verification Plan
The Verifier independently evaluates each R1–R7 using the acceptance matrix and adversarial evidence. It must not treat implementation completion as proof.

1. identify the requirement source;
2. select or generate executable scenarios;
3. record expected behavior before execution;
4. execute against the implementation revision;
5. capture observable evidence;
6. compare observation with the property;
7. classify PASS, FAIL, or INCONCLUSIVE;
8. record limitations and reproducibility;
9. if FAIL, hand the defect to Repairer;
10. after repair, execute the relevant regression and adversarial checks again.

## J. Open Decisions
### D01 — Pocketful interface contract
Status: **RESOLVED — official Stage 1 specification confirmed.**
The adapter must conform to the published Pocketful Stage 1 HTTP contract, including authentication, payments, requests, splits, activity, settlements, reset/export/import, exact minor-unit arithmetic, and the published error contract.

### D04 — Transaction identity semantics
Status: **RESOLVED — official idempotency semantics confirmed.**
External idempotency is defined by authenticated user + HTTP method + path + parsed JSON body, keyed by the `Idempotency-Key` header. The old `transactionId` mechanism is provisional and cannot remain the public contract.

### D02 — Authentication/authorization contract
Status: RESOLVED for the TrustForge Pocketful adapter. Adapter-local contract accepted in pocketful/DECISIONS.md and implemented in T06. This is not presented as an official Pocketful identity contract.

### D03 — Persistence/runtime
Status: RESOLVED for adapter implementation. Node.js/TypeScript/Express/PostgreSQL/Docker/npm/Vitest accepted in pocketful/DECISIONS.md.

### D05 — Failure injection
Status: MATERIAL. Current controlled failure seam is sufficient for the exercised A04 proof but remains adapter-specific.

## Package quality gate
- Requirements map to properties: PASS.
- Critical properties have verification methods: PASS.
- Implementation tasks have dependencies, acceptance, verification and risks: PASS.
- Adversarial scenarios specify evidence: PASS.
- Builder handoffs are bounded and traceable: PASS.
- Unknowns are explicitly labeled: PASS.
- D02 is resolved for the adapter without being misrepresented as an external Pocketful fact: PASS.
- Verifier independence is explicit: PASS.

**Architecture Package v0.2 status: D01/D04 resolved; implementation conformance work is now the next build milestone.**