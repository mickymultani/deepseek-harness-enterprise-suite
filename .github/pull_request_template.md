## Summary

Describe the behavior, security boundary, or documentation being changed.

## Risk review

- [ ] Read, propose, write, and control-plane operations are classified.
- [ ] Credential values are never stored in configuration, output, or logs.
- [ ] Authorization is deterministic and independent of model judgment.
- [ ] External content is treated as untrusted data.
- [ ] Writes are approval-gated, idempotent where possible, and verified.
- [ ] Canonical outputs have bounded size and redact sensitive values.

## Verification

- [ ] `pnpm run check`
- [ ] `pnpm test`
- [ ] `pnpm run demo`
- [ ] Harness integration test, when bundle behavior changes

## Documentation

List the user, operator, catalog, or threat-model updates included in this pull request.
