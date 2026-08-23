# Policy model

## Decision order

1. Tool arguments are parsed and frozen by Harness.
2. Reorderable policy may allow, deny, or request approval.
3. Monotonic guards apply final invariants such as tenant, project, space, data-classification, and secret-egress restrictions.
4. Approval decides only the remaining eligible request; approval cannot override a deterministic guard denial.
5. The connector executes with least-privilege credentials.
6. Post-execution policy may block or redact a result before model exposure.
7. Audit observes the final frozen outcome.

## Policy input

A centralized policy provider should receive principal and workload identity, tenant, tool name, immutable arguments or a minimal resource projection, purpose of use, data classifications, environment, policy version, change window, and risk level. Avoid sending complete document bodies or secrets when a hash or classification is sufficient.

## Policy output

Use a closed result such as allow, deny, or require approval with a stable decision id, policy version, reason code, human explanation, obligations, expiry, and evidence fields. A missing, malformed, timed-out, or unauthenticated policy response fails closed for protected operations.

## Approval

Approval is scoped to one immutable action. A grant should bind the tool, arguments hash, principal, resource, purpose, expiry, and approver. Long-lived or reusable grants require storage, revocation, and audit designs beyond the built-in one-time decision.

## Audit mode

Audit-only policy helps measure rollout impact but is not enforcement. Records must distinguish an audit violation from an enforced denial, and production cutover criteria should specify acceptable false-positive and false-negative rates.
