# Enterprise plugin catalog

The catalog defines the intended enterprise platform, not a claim that every named integration is already implemented. `catalog/enterprise-plugins.json` is the authoritative machine-readable list.

## Status vocabulary

- **Available**: working code, keyless tests, bundle wiring, and documented configuration are present in this repository.
- **Foundation**: the shared contract or template is documented, but provider implementations remain to be built.
- **Planned**: the capability has an agreed scope, risk class, and target phase but no supported implementation.

## Available now

- Atlassian: Confluence search and Jira read, create, and deterministic ticket review.
- Enterprise scope and approval policy: project/space allowlists and approval-gated writes.
- Enterprise DLP: configurable outbound secret and regulated-identifier checks.
- Local audit: redacted JSONL final-outcome records.

## Foundation and governance

The portfolio covers enterprise identity and workload identity; Vault, cloud secret managers, and CyberArk; OPA/Rego and Cedar; OAuth lifecycle; DLP; model gateway policy; OpenTelemetry; SIEM; signed evidence; cost attribution; and policy simulation.

## Knowledge and collaboration

The portfolio covers Confluence, SharePoint, Google Drive, Slack, Microsoft Teams, email, and federated enterprise search. Retrieval implementations must preserve source, freshness, tenant, classification, and permission metadata and must treat returned content as untrusted.

## Work management

The portfolio covers Jira, ServiceNow, and Linear. Each provider should expose search/read separately from create/update/comment/transition, use idempotency for writes, and link mutations to approval and change evidence.

## Engineering and security operations

The portfolio covers GitHub Enterprise, GitLab, Bitbucket, CI evidence, vulnerability management, SOC operations, software supply-chain controls, cloud inventory, and Kubernetes. Infrastructure and containment actions use plan, approve, apply, and verify as separate operations.

## Business controls

The portfolio covers vendor risk, legal and contract review, privacy impact assessments, records retention, finance/ERP, HRIS, and customer support. These domains require organization-specific legal, privacy, regulatory, and segregation-of-duties review before implementation.

## Adding a catalog entry

Add one object to `catalog/enterprise-plugins.json`, keep ids unique, use a defined category/status/risk value, and update the relevant roadmap phase. `pnpm run check` validates the catalog vocabulary and documentation links.
