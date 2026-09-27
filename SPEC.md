# TrustForge Specification

## Mission

TrustForge builds software, challenges its implementation, independently verifies critical behaviors, repairs demonstrated defects, and records the evidence chain.

No agent may convert an unverified claim into a verified fact.

## Pocketful MVP

The hackathon adapter targets a minimal wallet application: create account, deposit value, read balance, transfer value.

## Critical properties

- **R1 — Conservation:** no unexplained value is created or destroyed.
- **R2 — No overdraft:** successful operations never produce an invalid negative balance.
- **R3 — Idempotency:** the same logical transaction is applied at most once.
- **R4 — Atomicity:** a transfer is all-or-nothing.
- **R5 — Concurrency:** race conditions cannot violate critical value invariants.
- **R6 — Authorization:** protected state cannot be manipulated without authorization.
- **R7 — Evidence integrity:** conclusions remain traceable to observable evidence.

## Verification states

VERIFIED, PARTIALLY VERIFIED, FAILED, UNKNOWN.

## Evidence chain

Requirement → Property → Scenario → Implementation revision → Execution → Observation → Verifier conclusion → Repair → Re-verification.

Failures remain visible in history. Evidence must never be fabricated.

## Scope discipline

TrustForge is not a guarantee of universal correctness or security. It reports what was tested, observed, independently verified, and what remains unknown.
