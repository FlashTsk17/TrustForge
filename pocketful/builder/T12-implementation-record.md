# T12 — Implementation Record

## Status
IMPLEMENTED — runtime validation pending.

## Revision
The official Stage 1 runtime is now wired through `pocketful/src/stage1.ts`.

## Implemented surfaces
- `GET /health`
- `POST /_test/reset`
- `GET /_test/export`
- `POST /_test/import`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /me`
- `POST /payments`
- `POST /requests`
- `POST /requests/:id/pay`
- `POST /requests/:id/decline`
- `POST /requests/:id/cancel`
- `GET /requests`
- `POST /splits`
- `GET /activity`
- `POST /settlements`

## Core guarantees implemented
- integer minor-unit amounts
- bearer authentication with hashed passwords/tokens
- immutable derived handles
- atomic in-memory balance mutations
- idempotency scoped by authenticated user + method + path + canonical parsed body
- exact replay response preservation
- failed 4xx idempotency keys remain reusable
- settlement batches compute collective affordability before mutation
- export/import replacement state

## Important limitation
This record is not a verification certificate. GitHub Actions/runtime execution must pass before T12 is marked VALIDATED. The existing provisional PostgreSQL adapter and its historical R1-R7 evidence remain separate from official Stage 1 conformance.

## Next verification targets
1. Build and TypeScript compilation.
2. Official HTTP contract tests.
3. D04 concurrency/idempotency tests.
4. Split rounding and request lifecycle.
5. Settlement atomicity.
6. Export/import preservation.
7. Clean Docker runtime.
