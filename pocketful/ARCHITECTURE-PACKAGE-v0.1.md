# TrustForge — Pocketful Architecture Package v0.1

> First execution of the Architect against the Pocketful target specification.

## A. Executive Summary

### Objective
Build a minimal wallet application for the hackathon and make its critical behavior independently testable by TrustForge.

### Scope
- account creation
- deposits
- balance retrieval
- transfers
- verification surfaces needed to exercise critical properties

### Non-goals
- real-world payment rails
- full banking infrastructure
- universal security certification
- exhaustive formal verification
- production-scale banking compliance

### Key assumptions
- Money/value is represented with a precise, non-floating-point representation.
- The application exposes an executable interface suitable for automated tests.
- Transaction identity can be represented or introduced for idempotency testing.

### Unresolved questions
- Exact API/interface contract supplied by the challenge.
- Persistence technology and deployment target.
- Authentication mechanism and authorization model.
- Exact transaction semantics for deposits.

These remain UNKNOWN until the actual implementation requirements provide them.

## B. Component Map

| ID | Component | Responsibility | Dependencies | Critical risks |
|---|---|---|---|---|
| C1 | Account Domain | Create and represent accounts | C4 | identity/state consistency |
| C2 | Wallet Operations | Deposit, balance, transfer rules | C1, C4 | value corruption, overdraft |
| C3 | Interface/API | Expose operations to callers | C1, C2, C5 | validation, authorization |
| C4 | Persistence/State | Store account and transaction state | implementation-dependent | atomicity, concurrency |
| C5 | Identity/Auth | Establish caller/account authority | implementation-dependent | unauthorized access |
| C6 | Verification Surface | Make observable behavior testable | C3, C2 | insufficient evidence |
| C7 | Evidence Layer | Record reproducible verification evidence | C6 | provenance gaps |

## C. Critical Properties

### R1 — Conservation
A valid operation must not create or destroy unexplained value.

**Verification:** controlled deposits/transfers plus invariant checks over balances and transaction effects.

### R2 — No overdraft
A successful operation must not leave an account below its permitted minimum balance.

**Verification:** insufficient-funds and boundary scenarios, including concurrent attempts.

### R3 — Idempotency
The same logical transaction must not apply its financial effect more than once.

**Verification:** repeated identical transaction identity and retry-after-uncertain-result scenarios.

### R4 — Atomicity
A transfer must not persist a state in which only one side of the intended value movement has occurred.

**Verification:** injected/simulated partial failure and post-failure state inspection.

### R5 — Concurrency safety
Concurrent operations must preserve critical invariants and prevent race-condition overspending.

**Verification:** controlled concurrent conflicting operations with final-state and transaction assertions.

### R6 — Authorization
Protected state must not be manipulated outside the caller's authority.

**Verification:** cross-account access and mutation attempts under distinct identities.

### R7 — Evidence integrity
Trust conclusions must remain traceable to executable scenarios, observations, implementation revision and verifier decision.

**Verification:** inspect evidence records and reproduce representative scenarios.

## D. Task Graph

| ID | Objective | Dependencies | Deliverable | Acceptance | Verification | Risk |
|---|---|---|---|---|---|---|
| T01 | Freeze domain contract | — | domain/API contract | all required operations and unknowns explicitly listed | contract review | K1 |
| T02 | Establish project skeleton | T01 | runnable application skeleton | build/test command succeeds | clean environment run | K2 |
| T03 | Implement account state | T02 | account model/store | accounts can be created and retrieved correctly | functional tests | K3 |
| T04 | Implement deposits/balance | T03 | value operations | deposits and balances satisfy R1 | invariant tests | K4 |
| T05 | Implement transfer | T04 | transfer operation | valid transfer moves value correctly | functional + invariant tests | K4,K5 |
| T06 | Add transaction identity | T05 | idempotency mechanism | duplicate logical transaction has one financial effect | retry test | K6 |
| T07 | Harden atomicity/concurrency | T05,T06 | safe state transitions | partial failure and concurrent tests preserve invariants | adversarial tests | K5,K7 |
| T08 | Enforce authorization | T03,T05 | authorization controls | unauthorized protected mutation is rejected | authorization tests | K8 |
| T09 | Expose verification surface | T03-T08 | deterministic test interface | verifier can reproduce critical scenarios | verifier dry run | K9 |
| T10 | Produce evidence | T09 | evidence records | each critical property maps to observable evidence | evidence audit | K10 |

### Risk IDs

- K1: incomplete challenge contract
- K2: environment/dependency mismatch
- K3: state-model inconsistency
- K4: value accounting defect
- K5: transfer atomicity defect
- K6: duplicate/retry defect
- K7: race-condition defect
- K8: authorization defect
- K9: weak observability/test surface
- K10: unverifiable evidence provenance

## E. Acceptance Matrix

| Requirement | Property | Test/check | Expected evidence | Pass condition |
|---|---|---|---|---|
| Account creation | Account validity | create/retrieve account | request + resulting state | created account is uniquely retrievable |
| Deposit/balance | R1 | controlled deposit then balance | before/after balances | expected value appears exactly once |
| Transfer | R1 | valid transfer | source/destination before/after | total value conserved and movement matches request |
| Insufficient funds | R2 | transfer above balance | attempted operation + final state | operation cannot create invalid negative state |
| Duplicate transaction | R3 | repeat same logical transaction | two executions + final state | financial effect occurs once |
| Partial failure | R4 | fail during transfer path | failure + both account states | no half-applied transfer remains |
| Concurrent spending | R5 | simultaneous conflicting transfers | concurrent traces + final state | invariants remain true |
| Unauthorized mutation | R6 | cross-account mutation attempt | identity + action + result | protected state remains unchanged |
| Evidence | R7 | inspect report/provenance | evidence records | every conclusion links to observable evidence |

## F. Adversarial Plan

### A1 — Duplicate transaction
Target: R3. Submit the same logical operation repeatedly. Safe behavior: one financial effect.

### A2 — Insufficient funds
Target: R2/R1. Attempt to spend beyond available balance. Safe behavior: no invalid state and no unexplained value movement.

### A3 — Concurrent spend
Target: R2/R5. Race multiple spending operations against one balance. Safe behavior: invariants remain true.

### A4 — Partial transfer failure
Target: R4. Interrupt the transfer path between its logical sides. Safe behavior: no persistent half-transfer.

### A5 — Unauthorized access
Target: R6. Attempt protected operations using a principal without authority. Safe behavior: operation is denied and state is unchanged.

### A6 — Boundary values
Target: applicable properties. Exercise zero, minimum, maximum and invalid boundary values. Safe behavior: explicit, consistent handling.

### A7 — Retry after ambiguous outcome
Target: R3/R4/R5. Repeat an operation after uncertain execution. Safe behavior: no duplicate financial effect and no inconsistent state.

## G. Risk Register

| Risk | Impact | Mitigation | Verification |
|---|---|---|---|
| Incomplete domain contract | high | freeze unknowns before implementation | contract review |
| Precision/value representation | high | use precise value representation | conservation tests |
| Race conditions | critical | atomic state transition strategy | concurrent adversarial tests |
| Partial transfer | critical | transactional/atomic operation design | failure injection |
| Duplicate requests | high | stable transaction identity | retry/idempotency tests |
| Authorization gaps | high | explicit identity boundary | cross-account tests |
| Weak evidence | high | deterministic verification surface | evidence audit |

## H. Builder Handoffs

### H01 — Domain contract
Implement only after exact challenge interface requirements are known. Preserve all unresolved questions as explicit decisions.

### H02 — State foundation
Create the minimal account/state model required by the approved contract. Do not introduce unrelated banking features.

### H03 — Value operations
Implement deposits, balances and transfers with precise accounting and observable outcomes.

### H04 — Reliability controls
Implement idempotency, atomicity and concurrency protections. Add regression tests for each demonstrated failure mode.

### H05 — Authorization
Implement the minimum authorization boundary required by the approved interface.

### H06 — Verification surface
Provide deterministic setup, execution and inspection capabilities so an independent Verifier can run critical scenarios without relying on Builder assertions.

### H07 — Evidence
Emit or collect the artifacts needed to connect scenarios, executions, observations and implementation revisions.

## I. Verification Plan

The Verifier must independently execute or inspect evidence for each property.

- R1: controlled value-flow tests and final-state invariant checks.
- R2: insufficient-funds and concurrent-spend tests.
- R3: duplicate/retry tests using stable logical transaction identity.
- R4: failure-injection and post-failure state checks.
- R5: concurrent conflicting operations and invariant checks.
- R6: cross-identity authorization tests.
- R7: provenance/evidence audit plus reproduction of representative scenarios.

Each property receives PASS, FAIL or INCONCLUSIVE. TrustForge's overall state is derived from those evidence-backed conclusions; it is never inferred from implementation completion.

## J. Open Decisions

1. What exact interface/API contract does the challenge require?
2. What authentication/authorization mechanism is permitted or expected?
3. What persistence and deployment environment are available?
4. What failure-injection mechanism can be used during verification?
5. What exact transaction identity semantics does the challenge provide?

Until these are answered, implementation details depending on them remain BLOCKED rather than invented.
