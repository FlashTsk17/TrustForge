# T12 — Pocketful Stage 1 Contract Conformance

Status: NEXT BUILD MILESTONE

## Objective
Migrate the Pocketful adapter from the provisional TrustForge wallet API to the official Dark Factory Pocketful Stage 1 HTTP contract.

## Scope
- Runtime: 0.0.0.0, PORT (default 8080), self-contained container, no runtime outbound network.
- Test controls: /_test/reset, /_test/export, /_test/import with atomic replacement semantics.
- Auth: /auth/signup and /auth/login, bearer tokens, hashed passwords, derived immutable handles.
- Wallet API: /me, /payments, /requests, /requests/{id}/pay, /requests/{id}/decline, /requests/{id}/cancel, /requests, /splits, /activity, /settlements.
- Exact integer minor-unit arithmetic and seeded-balance conservation.
- Published HTTP status/error contract.
- D04 idempotency semantics on the five specified write paths.
- Independent verification against the published HTTP contract.

## D04 acceptance
Idempotency is scoped to authenticated user + method + path + parsed JSON body. Exact replay returns 200 with the original response; first successful use returns 201; same key with a different body returns 409; failed 4xx requests do not consume the key; concurrent identical first uses produce one 201 and the remaining responses 200.

## Important boundary
The previous /accounts/:id/deposits, /transfers and client transactionId behavior is provisional and is not the published Pocketful external contract.

## Acceptance gates
1. Published Stage 1 API surfaces implemented.
2. D04 idempotency behavior independently verified.
3. Export/import round-trip preserves required state.
4. Settlement batches are atomic and idempotent.
5. Clean-container execution succeeds without runtime outbound access.
6. Existing critical invariants remain protected.
7. Independent verifier produces evidence against the published contract.

## Non-goals
Stage 2 browser UI, Stage 3 historical corrections, and Stage 4 features.

## Builder constraint
Implement from the published specification, not from hidden or inferred test behavior. Preserve failure history and keep standing agent mandates domain-generic.
