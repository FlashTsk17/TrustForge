# T02 — Account State

## Task
T02 — Implement account creation and uniquely identifiable account state.

## Traceability
- Components: C01 Account Interface, C03 State Store
- Dependencies: T01
- Risk: K02
- Related properties: R1, R2, R6

## Scope
- Account creation
- Stable unique account identifier
- PostgreSQL-backed account state
- Read-back of account state
- Provisional adapter-level HTTP surface

## Contract boundary
The official Pocketful interface remains unresolved under D01/BLOCKING. Routes introduced here are provisional TrustForge adapter behavior and are not presented as confirmed external Pocketful requirements.

## Acceptance criteria
- T02-C01: account creation returns a unique identifier.
- T02-C02: a new account starts at balance zero.
- T02-C03: account state is persisted in PostgreSQL.
- T02-C04: persisted state can be read by identifier.
- T02-C05: database uniqueness prevents identifier collisions.
- T02-C06: no deposit, transfer, authorization, idempotency, or verification behavior is implemented here.

## Evidence required
- implementation revision
- schema definition
- account creation result
- read-back result
- persistence error behavior
- actual execution evidence when an execution environment is available

## Next handoff
T03 — Deposit/Balance.
