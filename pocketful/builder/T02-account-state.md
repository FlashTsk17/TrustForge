# T02 — Account State

## Task
Implement account creation and uniquely identifiable account state on top of the approved Pocketful runtime baseline.

## Traceability
- Task: T02
- Components: C01 Account Interface, C03 State Store
- Property dependencies: R1, R2, R6
- Risks: K02
- Dependency: T01

## Scope
- Account creation
- Stable account identifier generation
- Account state persistence
- Readable account state for later tasks
- Minimal adapter-level HTTP surface

## Important contract boundary
The official Pocketful interface contract remains D01/BLOCKING. The HTTP routes introduced by this task are provisional internal adapter routes and must not be represented as confirmed Pocketful requirements.

## Acceptance criteria
- T02-C01: creating an account returns a unique identifier.
- T02-C02: newly created account has a deterministic initial balance of zero.
- T02-C03: account state is persisted through the selected PostgreSQL state store.
- T02-C04: account state can be read back by identifier.
- T02-C05: duplicate identifiers are prevented by the persistence layer.
- T02-C06: no deposit, transfer, authorization, idempotency, or verification logic is introduced.

## Evidence required
- Implementation revision
- Database schema/migration
- Account creation request/result
- Account read-back result
- Persistence error behavior
- Actual execution commands/results when an execution environment is available

## Handoff
T03 — Deposit/Balance may depend on the account state created here.
