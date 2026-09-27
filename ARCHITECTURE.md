# TrustForge Architecture

## Principle

**The factory is not the product. Trust in the result is the product.**

TrustForge is designed around a reusable Trust Engine with domain-specific adapters.

## Layers

### TRUST ENGINE CORE
Requirement decomposition, acceptance criteria, adversarial scenario generation, invariant verification, repair loop, evidence/provenance, and trust-state reporting.

### HACKATHON ADAPTER
Pocketful provides the application domain and execution environment used to demonstrate the Trust Engine.

### FUTURE ADAPTERS
n8n workflows, Make/Zapier automations, APIs, AI agents, AI-generated applications, e-commerce workflows, and custom business software.

## Agent roles

- **Architect:** creates the implementation and verification plan; does not implement or certify trust.
- **Builder:** implements assigned work and reports evidence; does not self-certify.
- **Adversary:** actively seeks failures from requirements, invariants, concurrency, retries, boundaries and authorization.
- **Verifier:** independently evaluates critical properties with PASS, FAIL, or INCONCLUSIVE conclusions.
- **Repairer:** fixes evidenced defects and adds regression coverage where appropriate; never declares verification.
- **Evidence:** assembles the auditable provenance chain and final Trust Report.

## Workflow

Requirement → Architect → Builder → Adversary → Verifier → Repairer → Verifier → Evidence → Trust Report.

The verifier remains the authority for verification conclusions.
