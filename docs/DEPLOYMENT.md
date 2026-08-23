# Deployment guide

## Evaluation

Pin a DeepSeek Harness commit and install this suite into an isolated Harness home and non-production workspace. Keep Atlassian in mock mode until policy, audit, and approval behavior are verified.

```sh
export DSH_HOME=/srv/dsh/evaluation
dsh plugin --profile web add github:mickymultani/deepseek-harness-enterprise-suite#<commit>
dsh --profile web --dump-config
dsh web --no-open
```

## Credentials

Use the Harness credential service. For production, implement or select a provider backed by the enterprise secret manager and workload identity. Prefer short-lived OAuth tokens over user API tokens. Rotate credentials without changing plugin configuration.

## Network

Restrict egress to approved vendor and policy endpoints. Use corporate DNS, proxies, private connectivity, certificate validation, and regional endpoints where required. Do not enable insecure HTTP in production.

## Policy

Start with explicit allowlists and approval for every mutation. Add centralized OPA or Cedar evaluation before broadening access. Treat absence or timeout of a required policy service as denial.

## Audit

The included JSONL backend is for evaluation. Production should export to an authenticated central collector with encryption, integrity protection, access control, retention, monitoring, and alerting. Decide whether audit-export failure blocks protected operations.

## Rollout

1. Read-only shadow evaluation with synthetic data.
2. Read-only access to a small non-sensitive tenant scope.
3. Policy simulation and audit completeness review.
4. Draft-only actions with mandatory human review.
5. Approval-gated mutation for a limited group and resource set.
6. Canary expansion with rollback criteria.
7. General availability after security, privacy, legal, reliability, and incident-response approval.

## Operations

Monitor policy latency and errors, connector latency and error classes, vendor rate limits, credential failures, approval queues, audit-export health, data-egress violations, version compatibility, and plugin load failures. Maintain a tested rollback to the last approved profile and package lockfile.
