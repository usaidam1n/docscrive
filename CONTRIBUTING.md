# Contributing to DocScrive

Thank you for your interest in contributing to DocScrive. This document explains how to get set up and submit changes.

## Development setup

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git**

### Clone and install

```bash
git clone https://github.com/usaidpeerzada/docscrive.git
cd docscrive
npm install
```

### Environment

Copy the example env file and add your own values (no secrets in the repo):

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

See [.env.example](.env.example) and the [README](README.md#environment-configuration) for which variables are required for the client vs backend.

### Run the app

- **Client (Next.js):** `npm run dev:client` (or `npm run dev --workspace=@docscrive/client`)
- **Backend:** `npm run dev:backend` (requires Redis and PostgreSQL; see [.env.example](.env.example))

## Branch and PR flow

1. **Fork** the repository and clone your fork.
2. Create a **feature branch**: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. Make your changes and ensure they follow the project’s code style (see below).
4. Run **quality checks**: `npm run validate`
5. **Commit** with a clear message (see [Commit convention](#commit-convention)).
6. **Push** to your fork and open a **Pull Request** against the default branch.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style (formatting, no logic change)
- `refactor:` Refactoring
- `perf:` Performance improvements
- `test:` Test additions or changes
- `chore:` Build/tooling/other changes

Example: `feat(client): add export to PDF`

## Code quality

Before opening a PR, run from the **repo root**:

```bash
npm run validate
```

This runs:

- **Type check** – `npm run type-check` (all workspaces)
- **Lint** – `npm run lint:check`
- **Format check** – `npm run format:check`
- **Tests** – `npm run test`

To fix lint/format automatically:

```bash
npm run lint
npm run format
```

### Per-workspace commands

- **Client only:**
  - Tests with coverage: `npm run test:coverage --workspace=@docscrive/client`
  - E2E: `npm run test:e2e --workspace=@docscrive/client`
- **Backend:** Commands are defined in `apps/backend/package.json`.

## CI and forks

Full CI (security scans, deploy, Slack, Lighthouse) runs with maintainer secrets. As a contributor you can:

- Run `npm run validate` and `npm run build` locally.
- Open a PR; CI will run quality, tests, and build. Jobs that require secrets may be skipped on forks.

## Questions

- **Issues:** [GitHub Issues](https://github.com/usaidpeerzada/docscrive/issues)
- **Discussions:** [GitHub Discussions](https://github.com/usaidpeerzada/docscrive/discussions)

Thank you for contributing.
