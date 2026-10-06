# TrustForge — Video Script

## 0:00–0:15 — Problem
“AI can build software fast. But a working application is not the same thing as a trusted application. TrustForge is our answer: a software factory that builds, attacks, verifies, repairs and proves critical behavior.”

## 0:15–0:35 — Factory
Show the six Band seats:
Architect → Operator → Adversary → Verifier → Repairer → Evidence.

Say:
“Each seat has a bounded responsibility. The Verifier does not trust implementation claims, and the Evidence seat preserves provenance.”

## 0:35–0:55 — Pocketful
Show the repository and Stage 1 service.

Say:
“For the Pocketful track, the factory produced a self-contained wallet/payment API with idempotent writes, atomic operations, exact integer money arithmetic, export/import and independent HTTP verification.”

## 0:55–1:15 — Trust loop
Show:
Requirement → Property → Scenario → Implementation → Execution → Observation → Verdict → Repair → Re-verification.

Say:
“The important output is not only code. It is a traceable claim about what was actually checked and what remains uncertain.”

## 1:15–1:30 — Evidence
Show the verification records and official validation evidence.

Say:
“Our recovered project records 147 out of 147 shipped checks passing in the official isolated Stage 1 harness, alongside independent verification evidence.”

## 1:30–1:45 — Honest limitation
Say:
“One artifact was not recoverable after the development machine failed: the complete Band room export. We do not fabricate it. If the original session remains accessible, it must be exported unchanged as room.json.”

## 1:45–2:00 — Closing
“TrustForge is designed to become a reusable trust layer for software factories, AI agents, automations and AI-generated applications. The goal is simple: build quickly, challenge aggressively, verify independently, repair when necessary, and prove what can actually be trusted.”
