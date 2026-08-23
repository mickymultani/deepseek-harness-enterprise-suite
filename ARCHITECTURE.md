# Architecture

## Composition

DeepSeek Harness builds a runtime from ordered Cordis bundle layers. This repository publishes one bundle that inserts three independent plugin rows. Deployments can disable, replace, or reconfigure each row from a later profile layer without editing the package.

```text
Harness profile
  ├─ dsh-base
  ├─ dsh-web-app (when using the Web profile)
  └─ dsh-enterprise-suite
       ├─ enterprise-atlassian
       ├─ enterprise-policy
       └─ enterprise-audit
```

Plugin activation follows declared service dependencies rather than row order. Registrations are Cordis effects, so tool definitions, guards, and listeners are removed when their plugin unloads.

## Request path

```text
Model tool call
  → argument validation and immutable execution identity
  → enterprise pre-execution policy
  → monotonic DLP and scope guards
  → approval service when required
  → cancellation-aware connector operation
  → canonical structured value validation
  → model-facing rendering
  → immutable final tool outcome
  → redacted enterprise audit record
```

Connector plugins do not decide enterprise authorization. Policy plugins do not hold external credentials. Audit plugins do not transform successful values. Keeping these roles separate allows providers and controls to evolve independently.

## Plugin roles

### Connector

A connector translates a narrow internal capability into a vendor operation. It resolves credential references per operation, validates deployment configuration at load, forwards cancellation, returns one canonical JSON value, and avoids model-visible vendor diagnostics that may contain sensitive data.

### Policy

A policy plugin evaluates immutable tool identity and arguments before dispatch. Reorderable decisions use `tools/pre-execute`; invariants use monotonic guards so a later listener cannot restore access. Human approval is a separate decision after deterministic policy.

### Audit

Audit observes the final frozen outcome after connector execution and post-policy processing. It records correlation fields and outcome metadata, excludes canonical values, and redacts configured arguments. Production exporters should replace the local JSONL backend with a signed or centrally managed destination.

### Provider seam

Larger capabilities should use three roles: Service Definition, Service Provider, and Consumer. For example, an enterprise search definition can have SharePoint and Confluence providers while one permission-trimmed search tool consumes either provider. This avoids exposing vendor differences to the model-facing contract.

## Package layout

```text
bin/          Plugin project generator
catalog/      Machine-readable plugin portfolio and schema
docs/         Operations, security, extension, and roadmap documentation
examples/     Keyless runnable demonstration
src/core/     Shared URL, HTTP, credential, and redaction utilities
src/plugins/  Installable Cordis plugins
templates/    New connector and policy plugin starters
test/         Keyless behavior and contract tests
```

## Compatibility

The initial release targets DeepSeek Harness `0.1.1-rc.2`. Harness is a developer preview and may make breaking plugin changes. CI pins the supported version and the release process requires a clean installation plus a real profile composition smoke test before a compatibility declaration changes.
