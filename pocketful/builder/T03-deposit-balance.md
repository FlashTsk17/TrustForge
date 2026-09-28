# T03 — Deposit / Balance

## Builder handoff
- Objective: implement supported deposit and balance behavior.
- Dependency: T02.
- Property coverage: R1 Conservation, R2 No overdraft.
- Acceptance: a controlled deposit changes an existing account balance by the expected amount.
- Required evidence: balance before, deposit request/result, balance after, implementation revision.
- Constraint: do not implement transfer, idempotency, authorization, or verification logic.
- Contract note: official Pocketful interface remains unresolved; HTTP routes here are provisional TrustForge adapter routes.

## Implementation boundary
- Reuse T02 account persistence.
- Store balances as PostgreSQL NUMERIC.
- Apply deposits with a single SQL UPDATE so the balance change is persisted at the statement level.
- Accept positive decimal amounts with at most two fractional digits, matching the current balance precision.
- Do not introduce an undocumented maximum amount.

## Validation plan
Runtime validation remains pending in the GitHub-only implementation environment:
1. npm install
2. npm run build
3. docker compose up -d postgres
4. npm test
5. Execute account creation → deposit → balance read-back against PostgreSQL.

## Status
PARTIALLY_IMPLEMENTED until runtime execution produces observable evidence.
