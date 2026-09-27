# Evidence Schema

A verification record should preserve enough information for an independent reviewer to understand what happened.

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

## Provenance

Requirement → Property → Scenario → Revision → Execution → Observation → Conclusion → Repair → Re-verification.

Never delete failure history after a repair. A repaired system should show both the original failure and the evidence that the repair was subsequently checked.
