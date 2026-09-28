# TrustForge — Pocketful Architecture Package v0.2

> Generated against the v0.2 Architect contract. This package deliberately separates supplied facts, derived design decisions, assumptions, unknowns, and blockers.

## A. Executive Summary

### Objective
Build a minimal Pocketful wallet application for the hackathon and expose enough observable behavior for TrustForge to challenge, verify, repair, and re-verify critical properties.

### Scope
- Account creation
- Deposit value
- Read balance
- Transfer value between accounts
- Verification of R1–R7 from `SPEC.md`

### Non-goals
- Full banking platform
- Real-world payment rails
- Universal security certification
- Exhaustive formal verification
- Production-grade financial compliance

### Key assumptions
- The application can expose an executable interface suitable for automated tests.
- A transaction can be identified consistently enough to test idempotency.
- Account state can be observed after operations.

These are implementation assumptions, not confirmed hackathon facts.

### Unresolved questions
- Exact interface/API contract supplied by Pocketful.
- Authentication and authorization mechanism.
- Persistence technology and deployment/runtime constraints.
- Exact transaction identifier semantics.
- Supported failure-injection mechanism.

Status: **MATERIAL UNKNOWN** until supplied by the project context.

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
- Source: `SPEC.md` R1
- Statement: No unexplained value is created or destroyed by supported operations.
- Components: C02, C03, C05
- Verification: establish initial state, execute controlled operations, reconcile expected and observed total value.

### R2 — No overdraft
- Source: `SPEC.md` R2
- Statement: A successful operation never leaves an account below its allowed minimum balance.
- Components: C02, C03
- Verification: insufficient-funds and concurrent-spending scenarios.

### R3 — Idempotency
- Source: `SPEC.md` R3
- Statement: The same logical transaction is applied at most once.
- Components: C02, C03, C05
- Verification: repeat identical transaction identity and compare financial state/effects.

### R4 — Atomicity
- Source: `SPEC.md` R4
- Statement: A transfer is all-or-nothing from the persistent state perspective.
- Components: C02, C03
- Verification: inspect state after simulated/observed partial failure where the environment permits it.

### R5 — Concurrency
- Source: `SPEC.md` R5
- Statement: Race conditions cannot violate critical value invariants.
- Components: C02, C03, C05
- Verification: execute conflicting operations concurrently and reconcile final state.

### R6 — Authorization
- Source: `SPEC.md` R6
- Statement: Protected state cannot be manipulated without required authorization.
- Components: C04, C02, C03
- Verification: cross-account unauthorized operations and protected-state access attempts.

### R7 — Evidence integrity
- Source: `SPEC.md` R7
- Statement: Every verification conclusion remains traceable to observable evidence.
- Components: C06, C07, C08
- Verification: every report record must resolve to scenario, execution, observation, implementation revision, and verifier conclusion.

## D. Task Graph

| Task ID | Objective | Dependencies | Deliverable | Acceptance criteria | Verification | Risks |
|---|---|---|---|---|---|---|
| T01 | Establish runtime skeleton | — | Runnable application shell | Application starts in documented environment | Startup check | K01 |
| T02 | Implement account creation/state model | T01 | Account capability | Account can be created and uniquely identified | Account scenario | K02 |
| T03 | Implement deposit/balance | T02 | Deposit + balance capability | Controlled deposit produces expected observable balance | Balance reconciliation | K03 |
| T04 | Implement transaction identity | T02 | Transaction identity mechanism | Duplicate logical transaction can be recognized | Idempotency scenario | K04 |
| T05 | Implement transfer | T03, T04 | Transfer capability | Valid transfer updates both accounts consistently | Transfer checks | K05 |
| T06 | Implement authorization boundary | T02, T05 | Protected operations | Unauthorized protected operation is rejected/prevented | Authorization scenarios | K06 |
| T07 | Implement observability | T02–T06 | Testable state/results | Required observations can be captured reproducibly | Harness inspection | K07 |
| T08 | Build verification harness | T07 | Automated scenario runner | Acceptance and attack cases execute reproducibly | Harness self-check | K08 |
| T09 | Execute baseline verification | T08 | Baseline report | R1–R7 each has PASS/FAIL/INCONCLUSIVE evidence | Independent verification | K09 |
| T10 | Repair demonstrated defects | T09 | Corrective revisions | Each confirmed defect has root cause + regression coverage where applicable | Re-verification | K10 |
| T11 | Produce Trust Report | T10 | Final evidence package | Conclusions trace to execution evidence and revisions | Evidence audit | K11 |

### Dependency order
`T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11`

T10 may iterate with T09 until the verification gate is satisfied or the property remains FAILED/INCONCLUSIVE with explicit evidence.

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

### A01 — Duplicate transaction
- Target: R3
- Preconditions: valid transaction identity and repeatable operation
- Action: submit the same logical operation more than once
- Expected safe behavior: at most one financial effect
- Evidence: requests, transaction identity, state before/after, execution timestamps

### A02 — Insufficient funds
- Target: R2/R1
- Preconditions: account balance below requested transfer
- Action: attempt transfer exceeding available balance
- Expected safe behavior: operation does not create invalid negative state or unexplained value
- Evidence: initial balance, requested amount, result, final balance

### A03 — Concurrent spending
- Target: R2/R5
- Preconditions: one balance and competing spend operations
- Action: execute conflicting operations concurrently
- Expected safe behavior: invariants remain true
- Evidence: concurrency schedule, results, final state

### A04 — Partial transfer failure
- Target: R4/R1
- Preconditions: environment capable of controlled failure or equivalent simulation
- Action: fail execution between transfer stages
- Expected safe behavior: no persistent one-sided transfer
- Evidence: failure injection, state before/after, transaction record

### A05 — Unauthorized account manipulation
- Target: R6
- Preconditions: two distinct principals/accounts
- Action: attempt protected operation outside authorization scope
- Expected safe behavior: denied or otherwise prevented; protected state unchanged
- Evidence: principal context, action, result, state delta

### A06 — Boundary values
- Target: applicable R1–R6
- Preconditions: supported numeric/domain boundaries
- Action: test zero, minimum, maximum and malformed boundary inputs as applicable
- Expected safe behavior: documented valid/invalid handling without invariant violation
- Evidence: input, result, state delta

### A07 — Ambiguous-result retry
- Target: R3/R4/R5
- Preconditions: operation can produce an uncertain client outcome
- Action: retry the same logical operation
- Expected safe behavior: retry does not duplicate financial effect
- Evidence: original attempt, ambiguity condition, retry, final state

## G. Risk Register

| Risk ID | Description | Affected components/properties | Likelihood/uncertainty | Impact | Mitigation | Verification |
|---|---|---|---|---|---|---|
| K01 | Runtime constraints differ from assumed environment | C01–C08 | High uncertainty | High | Confirm environment before implementation | T01 |
| K02 | Account identity semantics are unspecified | C01 | Medium | High | Resolve contract before final implementation | T02 |
| K03 | Deposit semantics may differ from assumptions | C02/C03, R1 | Medium | High | Confirm supported value lifecycle | T03 |
| K04 | Transaction identity semantics unspecified | C05, R3 | High uncertainty | High | Resolve contract; make identity explicit | T04 |
| K05 | Transfer atomicity depends on persistence/runtime behavior | C02/C03, R4 | Medium | High | Design transaction boundary explicitly | T05/T09 |
| K06 | Authorization contract unspecified | C04, R6 | High uncertainty | High | Resolve authentication model before final tests | T06 |
| K07 | Required state may not be observable | C06, R7 | Medium | High | Define evidence surface early | T07 |
| K08 | Harness may produce false confidence | C07 | Medium | High | Independent verifier and negative/adversarial cases | T08/T09 |
| K09 | Some failures cannot be reproduced deterministically | C07 | Medium | Medium | Capture execution context and repeatability | T09 |
| K10 | Repair changes unrelated behavior | C02–C06 | Medium | High | Minimal patches + regression tests + re-verification | T10 |
| K11 | Final report overstates evidence | C08, R7 | Medium | High | Evidence schema + explicit INCONCLUSIVE state | T11 |

## H. Builder Handoffs

### H01 — T01 Runtime Skeleton
- Objective: establish the smallest runnable application environment.
- Requirements: project must be executable and observable.
- Dependencies: none.
- Constraints: do not add unnecessary infrastructure.
- Acceptance: documented startup succeeds and exposes a deterministic health/entry surface.
- Required evidence: runtime version, startup command, output, revision.
- Must not change: TrustForge verification rules.

### H02 — T02 Account State
- Objective: implement account creation and persistent account identity.
- Requirements: accounts must be uniquely identifiable and observable.
- Dependencies: T01.
- Acceptance: account creation produces an observable account identity and initial state.
- Required evidence: scenario execution + resulting state.
- Must not change: R1–R7 definitions.

### H03 — T03 Deposit/Balance
- Objective: implement supported deposit and balance behavior.
- Requirements: observable value state must support R1/R2 verification.
- Dependencies: T02.
- Acceptance: controlled deposit changes balance by expected amount.
- Required evidence: before/after state and operation result.
- Must not change: transaction semantics without documenting the decision.

### H04 — T04 Transaction Identity
- Objective: establish logical transaction identity needed for idempotency.
- Dependencies: T02.
- Acceptance: repeated identity can be detected without double application.
- Required evidence: first attempt, repeat attempt, final state.
- Must not change: unrelated account behavior.

### H05 — T05 Transfer
- Objective: implement transfer between accounts with a defined state boundary.
- Dependencies: T03, T04.
- Acceptance: valid transfer produces consistent source/destination state and preserves applicable invariants.
- Required evidence: pre-state, operation, post-state, transaction identity.
- Must not change: authorization policy without H06.

### H06 — T06 Authorization
- Objective: enforce the supplied authorization model around protected operations.
- Dependencies: T02, T05.
- Acceptance: unauthorized protected operation cannot modify protected state.
- Required evidence: principal context, action, result, state comparison.
- Must not assume an authentication mechanism not supplied by project context.

### H07 — T07 Observability
- Objective: make required behavior and state inspectable by the verification harness.
- Dependencies: T02–T06.
- Acceptance: every critical property has an observable evidence surface.
- Required evidence: mapping of property to observation source.
- Must not weaken application security merely for testing.

### H08 — T08 Verification Harness
- Objective: execute acceptance and adversarial scenarios reproducibly.
- Dependencies: T07.
- Acceptance: scenarios produce structured evidence records.
- Required evidence: scenario ID, execution, expected/observed result, artifact references.
- Must not declare trust states.

## I. Verification Plan

The Verifier independently evaluates each R1–R7 using the acceptance matrix and adversarial evidence. It must not treat implementation completion as proof.

For every property:

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

### Independence gate
A property cannot be VERIFIED solely because the Builder's tests pass. The Verifier must have independent evidence and must retain negative findings in the evidence history.

## J. Open Decisions

### D01 — Pocketful interface contract
**Status: BLOCKING.** Exact interface and execution surface are not present in the current specification.

### D02 — Authentication/authorization contract
**Status: BLOCKING for final R6 implementation.** The required authorization mechanism is unspecified.

### D03 — Persistence/runtime
**Status: MATERIAL.** Required to finalize atomicity and concurrency implementation strategy.

### D04 — Transaction identity semantics
**Status: BLOCKING for final R3 implementation.** The current specification defines idempotency but not the transaction identity contract.

### D05 — Failure injection
**Status: MATERIAL.** Determines how strongly R4 can be demonstrated in the hackathon environment.

### Package quality gate

- Every stated requirement maps to a property: **PASS**.
- Every critical property has a verification method: **PASS**.
- Every implementation task has dependencies, deliverable, acceptance criteria, verification and risk IDs: **PASS**.
- Adversarial scenarios target defined properties and specify evidence: **PASS**.
- Builder handoffs contain bounded objectives, dependencies, acceptance and evidence requirements: **PASS**.
- Unknowns are explicitly labeled and not silently invented: **PASS**.
- Blocking decisions are explicitly separated from material decisions: **PASS**.
- Verifier independence is explicit: **PASS**.

**Architecture Package v0.2 status: READY FOR BUILDER PLANNING, subject to resolution of blocking project-context decisions before final implementation of affected components.**
