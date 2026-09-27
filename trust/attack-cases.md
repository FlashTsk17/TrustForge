# Initial Adversarial Cases

These cases are starting points, not a fixed test suite.

## A1 — Duplicate transaction
Attempt to submit the same logical transaction more than once. Target: R3.

## A2 — Insufficient funds
Attempt an operation that would exceed available balance. Targets: R2, R1.

## A3 — Concurrent spending
Execute conflicting spending operations concurrently against the same balance. Targets: R2, R4, R5.

## A4 — Partial failure
Force or simulate failure during a multi-step transfer. Targets: R1, R4.

## A5 — Unauthorized access
Attempt to modify or inspect protected state outside the caller's authorization scope. Target: R6.

## A6 — Boundary values
Exercise zero, minimum, maximum and other domain-relevant boundaries.

## A7 — Retry after ambiguous result
Repeat an operation after an uncertain execution outcome. Targets: R3, R4, R5.

The Adversary must derive additional scenarios from the actual specification and implementation rather than relying only on this list.
