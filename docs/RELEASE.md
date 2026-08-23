# Release process

## Readiness levels

- Experimental: contract exploration; no compatibility promise.
- Evaluation: keyless tests, configuration docs, security notes, and installable package.
- Production candidate: credentialed non-production tests, permission review, rate-limit and failure testing, idempotency, audit export, and named maintainers.
- Production ready: defined SLOs, threat-model signoff, incident and rollback procedures, compatibility matrix, signed release, and at least one controlled production validation.

Only maintainers may change a plugin's declared readiness level.

## Release checklist

1. Update the changelog and compatibility statement.
2. Run `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm test`, and the keyless demo.
3. Pack the tarball and inspect its file list.
4. Install the tarball into a clean DeepSeek Harness profile.
5. Dump and boot the composed profile.
6. Run credentialed integration tests when a provider changed.
7. Generate an SBOM and checksums.
8. Review dependency and code scanning results.
9. Tag a protected commit and create release notes.
10. Publish with provenance and verify the registry artifact.
11. Canary the release and monitor load, policy, connector, and audit signals.

## Compatibility

DeepSeek Harness is a developer preview. Every suite release declares the exact Harness versions tested. A compatibility upgrade requires the full clean-profile integration test, not only unit tests.
