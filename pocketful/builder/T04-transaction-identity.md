# T04 — Transaction Identity / Idempotency

## Builder handoff
- Objective: establish logical transaction identity needed for R3.
- Dependency: T02; integrates with the existing T03 deposit path.
- Property: R3 — Idempotency.
- Acceptance: repeating the same logical transaction identity produces at most one financial effect.
- Required evidence: first attempt, repeat attempt, transaction identity, state before/after.
- Constraint: do not implement transfer, authorization, or verification logic.
- Contract note: official Pocketful transaction-identity semantics remain unresolved. The identity used here is a provisional TrustForge adapter contract.

## Design decision
A client-supplied transaction ID is treated as the logical identity of an operation.
The database primary key makes the identity globally unique within the adapter.
A transaction is recorded before its financial effect in the same PostgreSQL transaction.
If the identity already exists, the financial effect is skipped.

## Safety boundary
The transaction record and balance update must commit atomically.
No successful transaction record may exist without its corresponding balance effect, and no balance effect may commit without its transaction record.

## Validation plan
Runtime validation remains pending:
- npm install
- npm run build
- docker compose up -d postgres
- npm test
- execute identical transaction ID twice and compare balance/effects.

## Status
PARTIALLY_IMPLEMENTED until runtime execution produces evidence.
