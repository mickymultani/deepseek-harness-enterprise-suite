# Creating an enterprise plugin

## Generate a project

```sh
npx dsh-enterprise-suite create-dsh-enterprise-plugin asset-inventory
cd asset-inventory
pnpm install
pnpm test
```

The generator creates a standalone installable bundle. It does not register the project in this repository or publish it.

## Define the operation before the API call

Write down the principal, action, resource, tenant, data classes, external permissions, expected result, failure modes, cancellation behavior, and audit evidence. Split reads and mutations. Split proposal, approval, execution, and verification when one external action has material impact.

## Register a narrow tool

Use `defineTool` to declare validated arguments and a canonical output value. The canonical value is the programmatic API used by Code Mode and policy; model-facing prose belongs in `output.render`.

Do not return vendor response objects directly. Normalize them into stable domain fields and exclude headers, tokens, internal URLs, stack traces, and unbounded payloads.

## Configure deployment differences

Export a Schemastery `Config` with explicit defaults. Base URLs, credential reference names, timeouts, result limits, tenant identifiers, allowed resources, and feature flags belong in configuration. Validate invalid combinations when the plugin loads.

## Resolve credentials

Configuration carries credential reference names. Resolve a reference through `ctx.credentials` at the start of every external operation. Never cache values across operations and never include them in thrown errors, logs, canonical values, or renderers.

## Apply policy outside the connector

Use an independent policy plugin on `tools/pre-execute` for allow, deny, or ask. Use `ctx.tools.guard()` for invariants that later listeners must not reverse. The external service's authorization remains the final enforcement layer.

## Test

At minimum, cover registration, successful canonical output, invalid arguments, missing credentials, authorization denial, cancellation, vendor failure normalization, DLP/redaction, and disposal. Use a mock provider for keyless tests and a non-production tenant for credentialed integration tests.

## Package and install

Declare `dsh.bundle.patch` in `package.json`, include the patch and runtime files in `files`, and ensure Git installs do not depend on unbuilt TypeScript. Publish prebuilt artifacts or a tarball when possible. Pin Git installs to a reviewed commit.

## Document

Document permissions, data flow, configuration, tools, output fields, rate limits, retry policy, pagination, idempotency, audit fields, security considerations, production gaps, compatibility, and ownership.
