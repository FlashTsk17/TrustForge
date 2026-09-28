# Evidence Schema

A verification record must preserve enough information for an independent reviewer to understand what happened and verify that the record was not altered after creation.

## Minimum fields

- evidence_id
- requirement_id
- property_id
- scenario_id
- implementation_revision
- execution_command_or_method
- expected_result
- observed_result
- evidence_artifacts
- verifier_conclusion
- limitations
- repair_reference
- re_verification_reference
- previous_evidence_hash
- evidence_hash

## Tamper-evident provenance

Records form an ordered SHA-256 hash chain:

Requirement → Property → Scenario → Revision → Execution → Observation → Conclusion → Repair → Re-verification.

Each record stores previous_evidence_hash: hash of the immediately preceding record, and evidence_hash: SHA-256 of the complete record excluding evidence_hash itself.

An independent checker must reject the chain if a record is modified, removed, reordered, or linked to the wrong predecessor.

Never delete failure history after a repair. A repaired system should show both the original failure and the evidence that the repair was subsequently checked.
