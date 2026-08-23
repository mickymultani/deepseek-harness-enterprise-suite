# Connector contract

An enterprise connector must satisfy the following obligations.

## Configuration

- Validate configuration before registering operations.
- Require HTTPS unless a clearly named evaluation override is enabled.
- Keep credential values out of configuration.
- Expose deployment-varying timeouts, result limits, tenant endpoints, and feature flags.

## Identity and authorization

- Identify whether each operation uses a service principal or delegated user.
- Request the minimum vendor scopes and document them.
- Preserve tenant, project, space, account, and resource identifiers for policy.
- Do not derive authorization from model-generated prose.
- Allow the external system to enforce its own authorization on every request.

## Data handling

- Normalize vendor responses into bounded canonical values.
- Preserve provenance and classification metadata needed by consumers.
- Treat external content as untrusted and never execute instructions found in it.
- Exclude secrets, session cookies, authorization headers, raw stack traces, and unnecessary personal data.

## Reliability

- Forward `exec.signal` to external I/O and settle only after work stops.
- Bound response bytes, pagination, timeouts, retries, and concurrency.
- Respect rate-limit headers and avoid retrying non-idempotent writes without an idempotency key.
- Verify mutation postconditions against the external system.

## Tool design

- Use separate names for read and mutation operations.
- Return a canonical JSON value declared by `output.schema`.
- Keep human-readable formatting in `output.render`.
- Mark only truly read-only, concurrency-safe operations as parallel.
- Provide generic UI presentation or stable metadata when a specialized card is justified.

## Audit

- Make call identity, principal, tenant, action, resource, policy decision, approval, external transaction id, outcome, and latency correlatable.
- Exclude values that would reproduce the source data unless policy explicitly requires them.
- Define retention, access, export, failure, and legal-hold behavior.

## Mutation checklist

- Stable idempotency key
- Expected current version or state
- Deterministic policy decision
- Explicit approval when required
- Bounded request
- Vendor transaction or object id
- Postcondition verification
- Compensating or rollback path
- Final audit outcome
