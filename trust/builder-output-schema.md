# Builder Output Contract v0.1

The Builder must return evidence that another agent can inspect without relying on undocumented context.

## Required fields

| Field | Required | Meaning |
|---|---|---|
| task_id | yes | Architect task identifier, e.g. T01 |
| status | yes | IMPLEMENTED, PARTIALLY_IMPLEMENTED, BLOCKED, or FAILED |
| implementation_revision | yes | Commit/revision used for the work |
| changed_files | yes | Exact files modified |
| objective | yes | Assigned objective |
| acceptance_criteria | yes | Criterion-by-criterion status |
| validation_commands | yes | Commands/checks actually executed |
| observed_results | yes | Actual observed outcomes |
| evidence_references | yes | Logs, test artifacts, reports, or other inspectable evidence |
| assumptions | yes | Any implementation assumptions |
| known_limitations | yes | Known gaps or constraints |
| unresolved_risks | yes | Risks remaining after implementation |
| next_handoff | yes | Recommended next workflow stage |

## Acceptance criterion record

Each criterion should contain:

- criterion_id
- expected_result
- status: PASS / FAIL / INCONCLUSIVE / NOT_RUN
- observation
- evidence_reference

## Evidence rules

- A command belongs in `validation_commands` only if it was actually executed.
- A PASS requires an observed result supporting the criterion.
- NOT_RUN must not be represented as PASS.
- Implementation evidence must not be labeled independent verification.
- Failed evidence must remain available for later repair and verification.

## Status semantics

### IMPLEMENTED
The assigned implementation is complete and relevant checks were executed, but independent verification is still pending.

### PARTIALLY_IMPLEMENTED
Some assigned criteria are implemented while others remain unresolved.

### BLOCKED
The Builder cannot proceed because a required dependency, specification detail, environment, credential, or access path is unavailable.

### FAILED
The available implementation or validation demonstrates that the assigned task currently does not satisfy its acceptance criteria.

## Example

```yaml
task_id: T03
status: IMPLEMENTED
implementation_revision: abc123
changed_files:
  - src/wallet/deposit.ts
objective: Implement deposit and balance behavior.
acceptance_criteria:
  - criterion_id: T03-C01
    expected_result: A controlled deposit increases the observable balance by the requested amount.
    status: PASS
    observation: Balance increased by the requested amount.
    evidence_reference: test-run-0042
validation_commands:
  - npm test -- deposit
observed_results:
  - deposit suite passed
 evidence_references:
  - test-run-0042
assumptions: []
known_limitations:
  - External deposit semantics remain undefined.
unresolved_risks:
  - K03
next_handoff: VERIFIER
```
