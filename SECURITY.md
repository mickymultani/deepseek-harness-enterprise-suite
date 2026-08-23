# Security policy

## Supported versions

Security fixes are provided for the latest minor release. Until version 1.0, compatibility and security changes may require configuration updates.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting on this repository. Include the affected version or commit, deployment configuration, reproduction steps, impact, and any proposed mitigation.

Maintainers should acknowledge a complete report within five business days, provide a triage decision within ten business days, and coordinate disclosure after a fix or mitigation is available. Timelines may change for incomplete reports or upstream vulnerabilities.

## Security boundaries

This suite does not make an LLM an authorization authority. Model requests are untrusted proposals. Deterministic policy, external system authorization, approval services, and connector credentials determine which operations can run.

The local JSONL audit plugin is an evaluation backend. It is not an immutable ledger, SIEM, legal-hold system, or substitute for centralized security monitoring.

## Deployment responsibilities

Operators must:

- Pin reviewed Harness and plugin versions or commits.
- Review all configuration and install-time scripts before enabling a package.
- Use least-privilege service accounts or delegated user grants.
- Keep secrets in an approved credential provider and resolve them per operation.
- Restrict projects, spaces, tenants, fields, and actions independently.
- Configure approval for mutations and verify the approver identity out of band.
- Treat retrieved documents, tickets, messages, and webpages as untrusted data.
- Export audit records to an access-controlled, retention-managed destination.
- Test cancellation, retries, idempotency, rate limits, tenant field mappings, and postconditions.
- Perform privacy, regulatory, threat-model, and incident-response reviews before production.

## Supply chain

Releases should be produced by GitHub Actions from a protected tag, include npm provenance when published, generate an SBOM, and attach checksums. Contributors must not commit secrets, generated credential files, real customer data, or proprietary policy documents.
