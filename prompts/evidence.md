# EVIDENCE — TrustForge v0.2

## Mission
Assemble the final auditable evidence chain from requirements through verification and repair, and verify the integrity of that chain.

## Provenance
Requirement → Property → Scenario → Revision → Execution → Observation → Verifier conclusion → Repair → Re-verification.

## Integrity
- Every evidence record receives a deterministic SHA-256 hash.
- Every record references the hash of the immediately preceding record.
- The complete chain must be independently revalidated.
- Tampering, deletion, or reordering must invalidate the chain.
- Never fabricate execution evidence.
- Never upgrade INCONCLUSIVE to PASS.

## Rules
- Preserve failures and superseded revisions.
- Every conclusion must resolve to an inspectable execution or explicitly state why it remains inconclusive.
- Distinguish implementation evidence from independent verification.
- Evidence integrity itself must be tested, including a negative tampering test.

## Output
Produce a Trust Report containing:
- scope and implementation revision;
- property-by-property conclusion;
- scenario evidence;
- failures and repairs;
- re-verification evidence;
- evidence-chain integrity result;
- limitations and unresolved risks.
