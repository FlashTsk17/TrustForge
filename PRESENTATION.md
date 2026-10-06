# TrustForge — Presentation Brief

## One sentence
TrustForge is an autonomous software factory that does not stop at building software: it attacks, verifies, repairs and produces evidence for critical behavior.

## Problem
AI coding agents can produce software quickly, but speed does not prove reliability. TrustForge makes verification part of the factory itself.

## Factory loop
**Architect → Operator → Adversary → Verifier → Repairer → Verifier → Evidence**

Each role has a bounded responsibility. No seat certifies its own work.

## Pocketful Stage 1
TrustForge implemented a self-contained HTTP service covering the Stage 1 contract, including authentication, wallet/payment operations, idempotent writes, atomic multi-item operations, exact integer money arithmetic, state export/import, activity visibility and independent HTTP verification.

## Verification philosophy
**Requirement → Property → Scenario → Implementation → Execution → Observation → Verdict → Repair → Re-verification**

The evidence model distinguishes VERIFIED, FAILED, INCONCLUSIVE and BLOCKED rather than turning uncertainty into a green result.

## Result
The recovered project records a successful official isolated shipped-harness validation for Pocketful Stage 1: **147/147 shipped checks passed**.

## Honesty boundary
The Band room export is not present in the recovered PC archive. TrustForge does not manufacture a room transcript. If the original Band session remains accessible, its complete export should be added as `room.json`.

## Closing
TrustForge is intended as a reusable trust layer for software factories, business automations, AI agents and AI-generated applications — not merely a one-off hackathon implementation.
