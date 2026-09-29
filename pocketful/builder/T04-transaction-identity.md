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
The provisional transaction-ID implementation is superseded as the public contract by D04.

## External contract alignment
D04 is now resolved against the official Pocketful Stage 1 specification. R3 must use `Idempotency-Key` semantics:
- scoped to authenticated user;
- same method + path + parsed JSON body;
- exact replay returns the original response with HTTP 200;
- same key/different body returns 409 `idempotency_key_reuse`;
- failed 4xx requests do not consume the key;
- concurrent identical first uses produce one 201 and remaining 200 responses.

The current repository implementation is **not yet Stage 1-conformant** and must be migrated from `transactionId` to this contract before R3 can be called externally verified.

## Status
DECISION RESOLVED; IMPLEMENTATION MIGRATION PENDING.
