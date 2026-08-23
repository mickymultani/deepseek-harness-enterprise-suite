# Contributing

Contributions are welcome for connectors, service definitions, policy providers, tests, documentation, and security improvements.

## Before opening a change

1. Search existing issues and the plugin catalog.
2. For a new connector or public contract, open a design issue describing the use case, trust boundaries, external permissions, read/write operations, failure modes, and test strategy.
3. Keep one pull request focused on one independently reviewable change.

## Development

```sh
pnpm install
pnpm run check
pnpm test
pnpm run demo
```

Generate a connector starter with:

```sh
node ./bin/create-plugin.js example-connector --out /tmp/example-connector
```

## Contribution requirements

- Follow the architecture and connector contract.
- Separate read and mutation tools.
- Put deployment-varying values in validated configuration.
- Resolve credential references per external operation.
- Forward the execution cancellation signal.
- Return typed canonical JSON values and render model-facing text separately.
- Use deterministic policy for authorization; do not ask the model whether its own call is allowed.
- Add keyless tests for success, denial, invalid input, cancellation, redaction, and disposal where applicable.
- Document required external permissions, data flows, rate limits, idempotency, and production gaps.
- Add or update the machine-readable plugin catalog entry.
- Do not claim production readiness without the release criteria in `docs/RELEASE.md`.

## Commit and pull-request style

Use concise imperative commit subjects. Pull requests should explain behavior, risk, security impact, validation performed, and any compatibility change. Generated files and unrelated formatting changes should be separate.

## Developer Certificate of Origin

By contributing, you certify that you have the right to submit the work under this repository's license. Sign off commits with `git commit -s` when requested by maintainers.

All participants must follow the [Code of Conduct](CODE_OF_CONDUCT.md).
