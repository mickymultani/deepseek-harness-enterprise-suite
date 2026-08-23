# Threat model

## Assets

- Enterprise credentials and authorization grants
- Internal documents, tickets, messages, source code, findings, and customer data
- Agent session history and tool results
- Policy definitions and decisions
- Approval identity and evidence
- External system integrity
- Audit records and release artifacts

## Trust boundaries

- User and model input
- Retrieved enterprise content
- Harness plugin process
- Credential and policy providers
- Approval surface
- External vendor APIs
- Audit exporter
- Package registry and source repository

## Primary threats

### Indirect prompt injection

Retrieved content may tell the model to reveal data or call another tool. Connectors label content as data and policy evaluates subsequent actions independently. Retrieved instructions never grant authority.

### Confused deputy

An agent with broad service credentials may act beyond the user's rights. Prefer delegated identity, resource allowlists, purpose binding, and external authorization. Service-principal access requires additional scope and approval controls.

### Secret exfiltration

Secrets can appear in prompts, arguments, vendor errors, logs, or canonical values. Resolve credential references per operation, scan protected egress, redact audit, normalize errors, and minimize returned fields.

### Unauthorized mutation

The model may propose a high-impact or malformed action. Separate reads from writes, apply monotonic policy, require approval, use idempotency, and verify postconditions.

### Cross-tenant access

Configuration or model arguments may select another tenant or resource. Bind tenant identity outside model input, use allowlists and provider credentials scoped to one tenant, and test isolation.

### Replay and duplicate writes

Retries or repeated model calls may duplicate effects. Use stable idempotency keys, expected versions, transaction identifiers, and read-after-write verification.

### Audit loss or tampering

Local records can be removed or modified. Export centrally, monitor delivery, sign or otherwise integrity-protect records, and define fail-open or fail-closed behavior.

### Supply-chain compromise

A plugin executes inside the Harness process and install scripts may execute before runtime controls. Pin commits, review source, restrict build scripts, scan dependencies, verify provenance, generate SBOMs, protect release tags, and canary updates.

### Denial of service

Unbounded searches, large responses, retries, and parallel calls can exhaust local or vendor resources. Enforce limits, timeouts, cancellation, rate coordination, backpressure, and circuit breakers.

## Security test requirements

Security-sensitive connectors should test indirect injection, cross-tenant arguments, missing policy, policy timeout, approval replay, secret-bearing input, vendor error redaction, pagination caps, cancellation, duplicate mutation, audit failure, and compromised or incompatible package upgrades.
