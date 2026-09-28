# T11 — Trust Report

## Scope
Pocketful adapter baseline for TrustForge.

## Implementation revision
Runtime-validated revision: `c2f909ed00a4ab8d1ae71e9ce9a829295354d0f2`.

## Runtime evidence
GitHub Actions Run 5 completed successfully with Node.js 22 and PostgreSQL 16.
- `npm install`: PASS
- `npm run build`: PASS
- `npm test`: PASS

Executed critical scenarios:
- A01 duplicate transaction: PASS
- A02 insufficient funds: PASS
- A03 concurrent spending: PASS
- A06 boundary values: PASS
- A07 ambiguous-result retry: PASS

## Property conclusions

| Property | Conclusion | Tested scope |
|---|---|---|
| R1 | PASS | A02, A03, A06 |
| R2 | PASS | A02, A03, A06 |
| R3 | PASS | A01, A07 |
| R4 | PASS | A03, A07 |
| R5 | PASS | A03, A07 |
| R6 | INCONCLUSIVE | A05 blocked by D02 |
| R7 | INCONCLUSIVE | End-to-end evidence provenance still being assembled |

## Failures and repairs
The previous runtime revision failed the critical suite because valid decimal amounts were rejected by an incorrectly escaped validation expression. This was repaired in revision `c2f909ed00a4ab8d1ae71e9ce9a829295354d0f2`, after which Run 5 passed.

The original failure is retained as historical evidence; it is not erased by the repair.

## Pending verification
- A04: controlled partial-failure injection.
- A05: authorization scenario after D02 is resolved.
- R7: complete evidence provenance chain.
- D01: official Pocketful interface contract.
- D04: final transaction identity semantics.
- D05: controlled failure injection design.

## Trust state
**PARTIALLY VERIFIED**

This report is bounded to the executed scenarios and implementation revision. It is not a universal correctness or security guarantee.
