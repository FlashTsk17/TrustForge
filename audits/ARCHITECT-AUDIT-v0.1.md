# TrustForge — Architect Audit v0.1

## Verdict

**REVISION REQUIRED — not yet ready for Builder handoff.**

The v0.1 package has a sound overall structure and correctly refuses to invent several missing Pocketful details. However, several output-contract requirements are only partially satisfied. These weaknesses are structural: they should be fixed in the Architect mandate rather than manually patched in downstream work.

## Findings

### A1 — Critical Properties are under-specified

The package gives each property a statement and verification method, but does not consistently expose the required requirement source and affected components.

**Impact:** traceability from requirement → property → implementation scope is weaker than intended.

**Required correction:** make `requirement_source` and `affected_components` mandatory fields.

### A2 — Task Graph loses machine-actionable inputs

The prompt requires task inputs and expected outputs, but the v0.1 package omits them.

**Impact:** a Builder or future orchestrator must reconstruct context from other sections.

**Required correction:** require `inputs`, `expected_output`, and explicit dependency IDs for every task.

### A3 — Acceptance Matrix needs stronger traceability

The matrix is useful, but the requirement source is expressed as a generic label rather than a stable requirement ID/source reference.

**Impact:** later evidence cannot reliably point back to the original requirement.

**Required correction:** use stable IDs for requirements and properties and preserve their source.

### A4 — Adversarial scenarios omit mandatory execution context

The v0.1 scenarios identify targets and actions but do not consistently specify preconditions and evidence artifacts.

**Impact:** scenarios are not always directly executable or reproducible.

**Required correction:** require `scenario_id`, `preconditions`, `action`, `expected_safe_behavior`, and `evidence_to_capture`.

### A5 — Risk Register is incomplete relative to the mandate

The v0.1 risk table contains impact and mitigation, but not a consistent likelihood/uncertainty field or affected component/property mapping.

**Impact:** prioritization and risk-to-verification traceability are weakened.

**Required correction:** require likelihood/uncertainty, impact, affected component/property, mitigation, and verification approach.

### A6 — Builder handoffs are too compressed

The handoffs identify objectives and some dependencies, but they do not consistently provide all required fields: relevant requirements, constraints, required evidence, and explicit non-goals/what must not change.

**Impact:** the Builder may still need to infer architectural intent.

**Required correction:** make the full handoff schema mandatory.

### A7 — Dependency notation is ambiguous

Entries such as `T03-T08` are convenient for humans but ambiguous for orchestration.

**Impact:** automated task scheduling cannot safely infer exact dependencies.

**Required correction:** dependencies must be an explicit list of task IDs.

### A8 — Open Decisions need classification

The package correctly identifies unresolved decisions, but does not distinguish hard blockers from decisions that merely affect implementation.

**Impact:** the Builder may not know what is actually blocked.

**Required correction:** classify each decision as `BLOCKING` or `MATERIAL` and identify affected tasks.

## What worked

- The Architect preserved unknowns instead of inventing API/auth/deployment details.
- Critical wallet properties were translated into observable verification targets.
- Adversarial planning was introduced before implementation.
- Verification was kept independent from Builder completion claims.
- The package separates the reusable Trust Engine from the Pocketful adapter.

## Required v0.2 quality gate

Before a package can be handed to the Builder:

1. every requirement has a stable ID/source;
2. every critical property maps to a requirement and affected components;
3. every task has inputs, outputs, exact dependencies, acceptance and verification;
4. every acceptance check is observable and traceable;
5. every attack scenario is reproducible and specifies evidence;
6. every risk maps to affected scope and verification;
7. every Builder handoff is self-contained;
8. every open decision is classified by blocking impact;
9. no domain-specific assumption is silently introduced;
10. the package is suitable for machine parsing as well as human review.
