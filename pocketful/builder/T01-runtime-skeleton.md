# T01 — Runtime Skeleton

## Status
READY FOR BUILDER

## Objective
Create the smallest runnable project skeleton required for the Pocketful adapter, without implementing domain behavior that belongs to later tasks.

## Scope

The Builder may establish:
- project/package metadata;
- source and test directory structure;
- deterministic development/test commands;
- minimal application entry point or placeholder;
- minimal configuration required to run the project.

The Builder must not implement:
- account business rules;
- deposits;
- transfers;
- authorization behavior;
- concurrency logic;
- verification logic.

## Inputs

- Architecture Package v0.2
- TrustForge Builder contract
- Repository state

## Dependencies

None beyond repository access and the runtime/tooling selected by the implementation environment.

## Acceptance criteria

### T01-C01 — Runnable
A documented command starts or executes the project successfully in the selected development environment.

### T01-C02 — Testable
A documented test command executes deterministically, even if the initial suite contains only a minimal smoke test.

### T01-C03 — Traceable
The implementation records the runtime/tooling assumptions needed to reproduce the setup.

### T01-C04 — Scope isolation
No Pocketful domain behavior is implemented as part of T01.

### T01-C05 — Repository clarity
The project structure makes a clear boundary between application code, tests, trust/verification material, and prompts/agent contracts.

## Validation required from Builder

The Builder must actually execute the available setup/run and test commands and report their observed results.

## Evidence required

- implementation revision;
- changed files;
- commands actually executed;
- observed outputs/results;
- criterion-by-criterion status;
- assumptions and limitations;
- unresolved risks;
- next handoff recommendation.

## Completion boundary

A successful T01 implementation is **IMPLEMENTED**, not VERIFIED. Independent verification remains the responsibility of the Verifier.
