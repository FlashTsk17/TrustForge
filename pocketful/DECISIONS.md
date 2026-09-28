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
