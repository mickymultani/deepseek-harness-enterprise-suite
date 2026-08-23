# Roadmap

The roadmap separates platform maturity from connector count. A connector is not production-ready merely because it can call an API; identity, authorization, data handling, audit, availability, and operational ownership must also be complete.

## 0.1 — Open-source foundation

- Installable DeepSeek Harness bundle
- Atlassian mock and live connector
- Jira and Confluence scope policy
- DLP-style outbound argument checks
- Approval-gated Jira creation
- Redacted JSONL audit backend
- Connector and policy plugin templates
- Plugin generator and machine-readable catalog
- CI, contribution, governance, security, and release documentation

## 0.2 — Identity, secrets, and centralized policy

- Workload and delegated-user identity service definitions
- Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, and CyberArk provider contracts
- OPA/Rego and Cedar policy-decision providers
- Policy decision identifiers, versions, simulation, and evidence export
- OAuth authorization-code and device-code lifecycle helpers
- OpenTelemetry audit exporter and SIEM adapters

## 0.3 — Read-only enterprise knowledge

- Permission-trimmed Confluence and Jira pagination
- SharePoint, Google Drive, Slack, Teams, and enterprise-search providers
- Provenance, freshness, classification, region, and access-control metadata
- Injection-resistant retrieval envelopes
- Search quality, authorization leakage, citation, and freshness evaluations

## 0.4 — Proposed actions

- Jira and ServiceNow draft operations
- Confluence and SharePoint page drafts
- Slack, Teams, and email draft-only tools
- GitHub Enterprise and GitLab change proposals
- Structured plans, diffs, idempotency keys, and policy evidence

## 0.5 — Approval-gated mutation

- Verified Jira and ServiceNow writes and transitions
- Approval-gated messaging and document publishing
- Time-bound grants, revocation, separation of duties, and break-glass review
- Postcondition verification against the source system
- Change-window, incident, and maintenance-policy plugins

## 1.0 — Enterprise scale

- Multi-tenant and regional isolation
- HA providers, rate-limit coordination, queues, backpressure, and disaster recovery
- Signed releases, SBOM, provenance, compatibility matrix, and canary profiles
- SOC 2, ISO 27001, NIST AI RMF, and organization-specific control mapping templates
- Red-team prompt-injection and confused-deputy test suites
- Stable extension APIs and documented deprecation policy

## Portfolio

The complete portfolio includes identity, credential, policy, DLP, model-gateway, audit, knowledge, work-management, engineering, security-operations, infrastructure, legal, privacy, procurement, finance, HR, and customer-support plugins. Every item and its implementation status is tracked in [the enterprise plugin catalog](docs/PLUGIN_CATALOG.md) and `catalog/enterprise-plugins.json`.
