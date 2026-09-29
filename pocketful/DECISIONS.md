# Pocketful Adapter — Decisions

## Runtime & Tooling Decision v0.1

Status: ACCEPTED
Scope: Pocketful adapter only. This does not constrain the Trust Engine Core or future adapters.

| Concern | Decision |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| HTTP API | Express |
| Tests | Vitest |
| Persistence | PostgreSQL |
| Containerization | Docker |
| Package manager | npm |
| Concurrency validation | Node.js + Vitest |

### Rationale
The stack is intentionally conventional and small for the Pocketful MVP. It supports a runnable API, typed domain/application code, integration testing against PostgreSQL, and explicit adversarial/concurrency validation without coupling TrustForge's core trust engine to the adapter implementation.

### Constraints
- This decision is adapter-scoped.
- No domain invariant is weakened to fit the stack.
- Runtime/tooling choices must remain traceable to Builder tasks and evidence.
- The Builder must not claim execution evidence unless commands actually ran.
- Persistence/concurrency details remain subject to the architecture package and later implementation decisions.

### Decision impact
This decision unblocks T01 (runtime skeleton) and permits subsequent implementation tasks to depend on a concrete runtime/tooling baseline.

## D02 — Authorization contract v0.1

Status: ACCEPTED
Scope: Pocketful adapter only.
Classification: Adapter-local implementation contract; not an official Pocketful API claim.

| Concern | Decision |
|---|---|
| Principal | Account owner |
| Credential | Cryptographically random opaque access secret |
| Persistence | SHA-256 hash only |
| Transport | HTTP Authorization Bearer header |
| Account scope | One secret authorizes one account |
| Transfer authority | Source account owner |
| Transaction inspection | Owner of the transaction's recorded account |
| Failure behavior | HTTP 401 before protected mutation |
| Secret exposure | Clear secret returned at account creation only |

### R6 acceptance
A principal without authority cannot mutate protected state, and the protected state remains unchanged after the denied operation.

### Rationale
The adapter needs a concrete authority boundary to make R6 executable and independently verifiable. An opaque per-account bearer secret is intentionally smaller than a full identity/session system and avoids inventing an unsupported external identity provider or OAuth contract.

### Security boundary
This decision is sufficient for the tested adapter authorization invariant. It is not a production identity architecture or a universal security guarantee.


## D01 — Official Pocketful Stage 1 HTTP contract

Status: **RESOLVED — external specification confirmed**

Source: official Dark Factory participant guide and Pocketful Stage 1 specification released for the hackathon.

The submitted Pocketful adapter must implement the published Stage 1 HTTP behavior. This is not an invented TrustForge API.

Required Stage 1 surfaces include:
- `GET /health`
- `POST /_test/reset`
- `GET /_test/export`
- `POST /_test/import`
- `POST /auth/signup`
- `POST /auth/login`
- wallet/payment/request/split/activity APIs
- `POST /settlements`

The service listens on `0.0.0.0`, honors `PORT` (default 8080), runs from one container, and has no runtime outbound-network dependency.

Monetary contract:
- one fixture-declared currency;
- exact integer minor-unit amounts;
- no deposits, top-ups, withdrawals, cards or bank integrations;
- balances conserve the seeded total and never become negative.

Errors follow the published `{ error: { code, message } }` shape and endpoint-specific status/code contract.

The previously implemented `/accounts/:id/deposits` and `/transfers` routes are therefore provisional/internal and are not the external Pocketful contract.

## D04 — Pocketful idempotency identity semantics

Status: **RESOLVED — external specification confirmed**

The published Stage 1 contract defines idempotency independently for five write paths:
`POST /payments`, `POST /requests`, `POST /requests/{id}/pay`, `POST /splits`, and `POST /settlements`.

For each path:
- `Idempotency-Key` is required and scoped to the authenticated user;
- identity includes the same method, same path and same parsed JSON body;
- JSON key order/whitespace do not change body identity;
- first successful use returns 201;
- exact replay returns 200 with the original response body and no new state change;
- same key with a different body returns 409 `idempotency_key_reuse`;
- a key whose original request failed with 4xx remains reusable;
- concurrent identical unused requests produce exactly one 201 and the remaining responses are 200;
- successful replay is resolved before current-resource/field validation after parsing/authentication.

The former client-supplied `transactionId` mechanism is therefore **not** the official Pocketful idempotency contract and must not be used as the public API identity.

### R3 consequence

R3 is now defined around the published idempotency-key semantics rather than a generic transaction identifier. Internal database records may use generated identifiers, but externally observable idempotency behavior must follow D04 exactly.

### Verification gate

D04 is considered implementation-resolved only when the Stage 1 conformance suite exercises:
1. first-use 201;
2. exact replay 200 with identical JSON value;
3. same-key/different-body 409;
4. user scoping;
5. path scoping;
6. failed-4xx key reuse;
7. concurrent identical requests with one state change.
