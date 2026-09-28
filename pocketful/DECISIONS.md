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
