# TRUSTFORGE

> An autonomous software factory that doesn't just build an application — it challenges, verifies, repairs and proves its critical behaviors.

TrustForge is a software factory focused on trust in software and automation.

## Core loop

ARCHITECT → BUILDER → ADVERSARY → VERIFIER → REPAIRER → VERIFIER → EVIDENCE

## Current target

The first adapter is Pocketful for the Dark Factory Hackathon.

Initial scope: account creation, deposits, balances, transfers.

Critical properties: conservation of value, no overdraft, idempotency, atomicity, concurrency, authorization, and evidence integrity.

## Trust states

- VERIFIED — required checks passed with sufficient evidence.
- PARTIALLY VERIFIED — some critical properties remain unverified or failed.
- FAILED — a required property was demonstrated to fail.
- UNKNOWN — insufficient evidence to conclude.

See SPEC.md and ARCHITECTURE.md.
