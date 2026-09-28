# Architecture Package Contract v0.1

The Architect's output is a structured planning artifact consumed by the Builder, Adversary and Verifier.

## Required sections

1. Executive Summary
2. Component Map
3. Critical Properties
4. Task Graph
5. Acceptance Matrix
6. Adversarial Plan
7. Risk Register
8. Builder Handoffs
9. Verification Plan
10. Open Decisions

## Required traceability

Every critical requirement must trace to:

`Requirement → Property → Task/Component → Acceptance Check → Evidence`

Every verification target must trace back to a requirement or explicit system invariant.

## Status values

Use these states where applicable:

- READY — sufficient information exists to proceed.
- BLOCKED — a missing or contradictory decision prevents safe planning.
- UNKNOWN — information is insufficient but does not yet block planning.

## Quality gate

An Architecture Package is ready for Builder handoff only when all critical requirements have observable acceptance criteria and verification methods.
