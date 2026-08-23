# DeepSeek Harness Enterprise Suite

Open-source enterprise integrations, governance controls, and plugin templates for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

The suite provides a secure starting point for organizations that want agent access to internal systems without placing connector credentials, authorization policy, and audit logic inside individual prompts or agent loops.

## Included plugins

| Plugin | Capabilities | Status |
|---|---|---|
| Atlassian | Confluence search; Jira read, create, and deterministic issue review | Working; mock and live modes |
| Enterprise policy | Project and space allowlists, configurable DLP checks, approval-gated Jira writes | Working |
| Enterprise audit | Redacted owner-only JSONL records from final tool outcomes | Working |

The repository also includes a plugin generator, reusable connector utilities, a machine-readable enterprise plugin catalog, deployment guidance, a threat model, and starter templates for new connectors and policy plugins.

## Install

DeepSeek Harness is currently a developer preview. Pin both Harness and this suite to reviewed versions or commits.

From a DeepSeek Harness source checkout:

```sh
export DSH_HOME=/absolute/path/to/an/evaluation-home
pnpm dsh plugin --profile web add github:mickymultani/deepseek-harness-enterprise-suite#v0.1.0
pnpm dsh --profile web --dump-config
pnpm dsh web --no-open
```

For local development:

```sh
git clone https://github.com/mickymultani/deepseek-harness-enterprise-suite.git
cd deepseek-harness-enterprise-suite
pnpm install
pnpm test

cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add /path/to/deepseek-harness-enterprise-suite
pnpm dsh web --no-open
```

The bundle starts in mock Atlassian mode. It cannot modify a real tenant until an operator explicitly changes the profile configuration to `mode: live` and supplies credential references.

## Configure live Atlassian access

Create an override at `$DSH_HOME/profiles/web/cordis.patch.yml`. Harness patch rows replace the complete config, so include every field:

```yaml
- id: enterprise-atlassian
  config:
    mode: live
    baseUrl: https://your-company.atlassian.net
    authMode: basic
    tokenRef: ATLASSIAN_API_TOKEN
    emailRef: ATLASSIAN_EMAIL
    requestTimeoutMs: 30000
    allowInsecureHttp: false

- id: enterprise-policy
  config:
    mode: enforce
    allowedJiraProjects: [ENG, SEC]
    allowedConfluenceSpaces: [ENG, SEC]
    protectedToolPrefixes: [jira_, confluence_]
    requireApprovalForWrites: true
```

Configuration contains references, never credential values. Resolve those references with the Harness credential provider, an injected process environment, or a custom provider backed by the enterprise vault.

## Create a plugin

Generate a standalone connector plugin:

```sh
npx dsh-enterprise-suite create-dsh-enterprise-plugin knowledge-search
```

The generated project includes an installable bundle manifest, typed canonical tool output, configuration validation, cancellation-aware HTTP, tests, and documentation prompts. See [Creating a plugin](docs/CREATING_A_PLUGIN.md) and the [connector contract](docs/CONNECTOR_CONTRACT.md).

## Design principles

- Separate read, propose, approve, execute, and verify operations.
- Resolve credentials for every external operation and never log their values.
- Treat retrieved enterprise content as untrusted data, not instructions.
- Put deterministic authorization in policy plugins, not model judgment.
- Make writes idempotent, approval-gated, cancellation-aware, and externally verified.
- Produce structured canonical values; keep prose in renderers.
- Record authoritative final outcomes with redaction and retention controls.
- Pin, review, scan, sign, and canary every plugin release.

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Enterprise plugin catalog](docs/PLUGIN_CATALOG.md)
- [Roadmap](ROADMAP.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Policy model](docs/POLICY_MODEL.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Project status

The shared plugin foundation and included plugins are suitable for evaluation. A production deployment must still validate its own tenant APIs, field mappings, identity propagation, approval experience, retention rules, regulatory controls, availability targets, and incident procedures. Capability status is tracked explicitly in the [plugin catalog](docs/PLUGIN_CATALOG.md).

## License

[MIT](LICENSE). This is an independent community project; see [Notices](NOTICE.md).
