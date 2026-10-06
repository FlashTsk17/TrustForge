# TrustForge — Submission Package

## Track
**Pocketful — Dark Factory Hackathon**

## Repository
https://github.com/FlashTsk17/TrustForge

## Included
- `README.md` — project and factory overview
- `FACTORY.md` — factory architecture, seats, handoffs and evidence rules
- `mandates/` — six generic seat mandates
- `stage-1/` — complete Pocketful Stage 1 service
- `pocketful/` — implementation, verification and development evidence
- `trust/` — invariants, evidence schema and attack cases
- `audits/` — architecture/audit records
- `prompts/` — factory role prompts

## Factory
Six seats: Architect, Operator, Adversary, Verifier, Repairer, Evidence.

Configured runtime:
- Harness: OpenCode
- Model: mimo-v2.5-free

Factory loop:
**ARCHITECT → OPERATOR → ADVERSARY → VERIFIER → REPAIRER → VERIFIER → EVIDENCE**

## Stage 1 result
The Pocketful Stage 1 implementation is documented as having passed the official isolated shipped harness:
- 147/147 shipped checks
- independent HTTP verification
- isolated official harness validation

The service is self-contained and uses Node.js/TypeScript.

## Evidence policy
TrustForge distinguishes implementation evidence, independent verification, official harness evidence and Band room provenance.

No room history, collaboration event or execution result is fabricated.

## Remaining provenance item
The official challenge rules require the complete Band room export at repository root as `room.json`. The recovered PC archive does not contain that export, so this repository does **not** invent one.

If the original Band room remains accessible, download the full session and add it unchanged as `room.json`, then run:

```bash
python -m harness check . --track pocketful
```

## Scope
This recovered submission claims **Stage 1** only. It does not claim completion of Stages 2–4.

TrustForge does not claim universal correctness or security; trust states are scoped to the properties actually tested and independently verified.
