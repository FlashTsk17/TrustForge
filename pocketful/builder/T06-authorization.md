# T06 — Authorization

Status: **VALIDATED — independent runtime verification completed successfully**

## Scope
T06 closes D02 for the Pocketful adapter by defining an adapter-local authorization contract. This is a TrustForge implementation decision, not a claim about an official Pocketful authentication contract.

## Authorization contract
- Each newly created account receives a cryptographically random opaque access secret.
- Only a SHA-256 hash of that secret is persisted.
- The clear secret is returned once at account creation.
- Protected account reads and mutations require Authorization: Bearer <access-secret>.
- The secret authorizes only its owning account.
- A transfer authorizes the source account; the destination is the recipient of the value.
- Transaction inspection is authorized against the account recorded on the transaction.
- Missing, malformed, or wrong-account credentials are rejected with HTTP 401.
- Authorization failure must occur before the protected mutation and must leave protected state unchanged.

## R6 acceptance
A principal without authority cannot mutate protected state.

## A05 evidence
The independent runtime verifier creates a victim and attacker account, attempts a victim mutation with the attacker secret, requires HTTP 401, verifies the victim balance is unchanged, and independently checks both denial and valid owner authorization.

## Security boundary
This mechanism is intentionally minimal for the adapter. It is not presented as a full production identity system, session system, role model, OAuth flow, or universal security guarantee.

## Validation
Required CI evidence:
- npm install
- npm run build
- npm test
- independent verifier A05/R6 PASS
- evidence-chain R7 remains valid after adding the R6 record

## Latest validation record

See `pocketful/builder/T06-verification-record.md` for the immutable CI evidence reference.
