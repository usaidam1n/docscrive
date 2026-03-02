# Security Policy

## Supported Versions

We release security updates for the current major version. Older major versions are not officially supported.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

To report a vulnerability:

1. Email the maintainers or open a **private** security advisory on GitHub: [Security Advisories](https://github.com/usaidpeerzada/docscrive/security/advisories/new).
2. Include a clear description, steps to reproduce, and impact.
3. We will acknowledge and respond as soon as possible.

We ask that you allow a reasonable time for a fix before any public disclosure.

## Security Practices

- Secrets and API keys are never committed; use environment variables and `.env.local` (see [.env.example](.env.example)).
- Dependencies are audited in CI; run `npm run security` (or equivalent) locally.
- Follow the security guidance in the [README](README.md#security).

Thank you for helping keep DocScrive and its users safe.
