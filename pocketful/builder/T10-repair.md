# T10 — Failure Injection and Repair Loop

## Objective
Demonstrate that TrustForge can force a controlled failure at a transaction boundary, observe the resulting behavior, and verify whether atomicity is preserved.

## A04 target
- Property: R4 Atomicity
- Scenario: A04 Partial Failure
- Injection point: after source debit, before destination credit
- Expected result: PostgreSQL rollback leaves source, destination, and transaction record unchanged.

## Implementation
A test-only injectable seam was added to `AccountRepository`:
- `TransferFailurePoint = "after-debit-before-credit"`
- optional `TransferFailureInjector`
- production behavior remains unchanged when no injector is supplied.

Regression scenario added to `pocketful/tests/critical-scenarios.test.ts`.

Independent Verifier coverage added to:
`pocketful/verifier/runtime-verifier.ts`

## Evidence rule
A04 can only become PASS after GitHub Actions executes the scenario successfully. Source inspection alone is insufficient.

## Repair policy
If A04 produces FAIL evidence:
1. preserve the failure;
2. identify the transaction-boundary root cause;
3. apply the smallest safe repair;
4. retain A04 as regression coverage;
5. send the repaired revision back to the Verifier;
6. record the original failure and re-verification separately.

## Current status
IMPLEMENTED — CI runtime validation pending.

## Related commits
- `28d1bca2a3580cce794931a53565ea196024a29e` — controlled transfer failure seam
- `289c4b28b1c9e302cc59f052d4ebdb8a49b5b32c` — A04 regression scenario
- `991efd5b2c578e201648c6b0fd18a619ad93f638` — independent A04 verification

## Limitation
A successful A04 result proves the tested rollback behavior for this controlled failure point; it does not prove universal atomicity under every possible failure mode.
