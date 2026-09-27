# Trust Invariants

| ID | Property | Required outcome |
|---|---|---|
| R1 | Conservation of value | No unexplained value is created or destroyed |
| R2 | No overdraft | No successful operation leaves an invalid negative balance |
| R3 | Idempotency | A logical transaction is applied at most once |
| R4 | Atomicity | Transfer state is all-or-nothing |
| R5 | Concurrency | Race conditions cannot violate critical value invariants |
| R6 | Authorization | Protected state cannot be modified without authorization |
| R7 | Evidence integrity | Verification claims remain traceable to observations |

These are domain properties, not endpoint-specific assumptions. Concrete endpoints, schemas, status codes and storage details belong to the Pocketful implementation context.
