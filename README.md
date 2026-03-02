# DocScrive

[![CI/CD Pipeline](https://github.com/usaidam1n/docscrive/actions/workflows/ci.yml/badge.svg)](https://github.com/usaidam1n/docscrive/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/usaidam1n/docscrive/branch/main/graph/badge.svg)](https://codecov.io/gh/usaidam1n/docscrive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

> **Enterprise-grade AI-powered developer tools for documentation, code review, and translation.**

DocScrive is a production-ready monorepo: **Next.js client** (`apps/client`) and **Node.js backend** (`apps/backend`), with AI-powered documentation generation, code review, and code translation.

## ✨ Features

### 🤖 AI-Powered Tools

- **Documentation Generation**: Transform code files or GitHub URLs into comprehensive technical documentation
- **Code Translation**: Convert code between different programming languages with AI precision
- **Code Review**: Analyze code for performance, security, style, and best practices

### 🏗️ Production Architecture

- **Type-Safe**: Full TypeScript implementation with strict type checking
- **Error Handling**: Comprehensive error boundaries and logging system
- **Performance**: Optimized with caching, lazy loading, and code splitting
- **Security**: Hardened with CSP, security headers, and input validation
- **Testing**: Full test coverage with unit, integration, and E2E tests
- **Monitoring**: Built-in analytics, performance monitoring, and observability

### 🎨 Modern UI/UX

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: Persistent theme switching with system preference detection
- **Accessibility**: WCAG compliant with full keyboard navigation
- **Component Library**: shadcn/ui components with consistent design system

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git**

### Installation

DocScrive is a **monorepo**. From the repository root:

```bash
# Clone the repository
git clone https://github.com/usaidam1n/docscrive.git
cd docscrive

# Install dependencies (all workspaces)
npm install

# Set up environment variables (see "Environment Configuration" below)
cp .env.example .env
# Edit .env with your values. Minimum for client: NEXT_PUBLIC_API_SECRET, NEXT_PUBLIC_DOCSCRIVE_API.
# If you run the backend locally, set API_SECRET (same as NEXT_PUBLIC_API_SECRET, min 32 chars).

# Run the Next.js client (port 3000)
npm run dev:client

# In another terminal, run the backend (port 3003) for API features
npm run dev:backend
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Monorepo structure

| Path           | Description                 |
| -------------- | --------------------------- |
| `apps/client`  | Next.js frontend (this app) |
| `apps/backend` | Node.js API server          |
| `packages/*`   | Shared packages (optional)  |

### Environment Configuration

Copy `.env.example` to `.env` (or `.env.local`) at the **repository root**. Key variables:

- **Client (required):** `NEXT_PUBLIC_API_SECRET`, `NEXT_PUBLIC_DOCSCRIVE_API` (e.g. `http://localhost:3003/api` for local backend).
- **Backend (required when running backend):** `API_SECRET` (same value as `NEXT_PUBLIC_API_SECRET`, min 32 characters).
- **Optional:** See `.env.example` for GitHub OAuth, Redis, DB, analytics, and error tracking.

## 🛠️ Development

### Available Scripts (from repo root)

```bash
# Development
npm run dev:client          # Start Next.js client dev server
npm run dev:backend         # Start backend dev server
npm run build              # Build all workspaces
npm run start              # Start production backend (from repo root)
npm run start:backend      # Same as start

# Code Quality (runs in all workspaces)
npm run type-check         # TypeScript check
npm run lint               # ESLint check across workspaces (no auto-fix at root)
npm run lint:check         # Same as lint at root
npm run format             # Prettier format
npm run format:check       # Prettier check only

# Testing
npm run test               # Run tests in all workspaces
npm run validate           # type-check + lint:check + format:check + test
```

### Client-only scripts (run from `apps/client` or via workspace)

```bash
npm run test:coverage --workspace=@docscrive/client
npm run test:e2e --workspace=@docscrive/client
npm run analyze --workspace=@docscrive/client
```

### Project Structure

```
docscrive/
├── apps/
│   ├── client/              # Next.js frontend
│   │   ├── app/             # App Router, pages, API routes
│   │   ├── components/      # Shared components
│   │   ├── lib/            # Core utilities, config, auth
│   │   ├── types/
│   │   ├── utils/
│   │   └── public/
│   └── backend/             # Node.js API
│       └── src/
├── packages/                # Shared code (optional)
├── .github/
├── package.json             # Workspace root
├── .env.example
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

### Code Quality Standards

This project enforces high code quality through:

- **TypeScript**: Strict type checking with comprehensive rules
- **ESLint**: Code linting with custom rules for React, accessibility, and security
- **Prettier**: Consistent code formatting with Tailwind CSS plugin
- **Husky**: Pre-commit hooks for quality assurance
- **Jest**: Unit and integration testing with coverage requirements
- **Playwright**: End-to-end testing across multiple browsers

## 🏭 Production Deployment

### Docker (client)

Build from **monorepo root**:

```bash
docker build -f apps/client/Dockerfile .
```

### Backend (Railway)

Deploy `apps/backend` to Railway: set **Root directory** to `apps/backend`, **Build** to `npm install && npm run build`, **Start** to `npm run start`. Set env vars (e.g. `API_SECRET`, `NODE_ENV=production`, optional `REDIS_URL`, `DATABASE_URL`). Point the client's `NEXT_PUBLIC_DOCSCRIVE_API` at the Railway URL (e.g. `https://<your-app>.up.railway.app/api`).

### Netlify Deployment

The client is deployed via Netlify. CI triggers deploys using Netlify build hooks:

1. In Netlify, connect the repo and set **Base directory** to `apps/client`.
2. Set **Build command** to `npm run build`. Set **Publish directory** to `.next` (or leave to Next.js detection).
3. Add env vars in Netlify (e.g. `NEXT_PUBLIC_DOCSCRIVE_API`, `NEXT_PUBLIC_API_SECRET`) for production.
4. Add repository secrets in GitHub: `NETLIFY_BUILD_HOOK_STAGING` and `NETLIFY_BUILD_HOOK_PRODUCTION` (from Netlify: Site settings → Build & deploy → Build hooks). Pushes to `develop` trigger staging; pushes to `main` trigger production.

### Environment-Specific Configurations

- **Development**: Hot reloading, detailed error messages, debug logging
- **Staging**: Production-like environment with analytics disabled
- **Production**: Optimized builds, error tracking, performance monitoring

## 🔒 Security

### Security Features

- **Content Security Policy**: Strict CSP headers to prevent XSS attacks
- **Security Headers**: Comprehensive security headers (HSTS, X-Frame-Options, etc.)
- **Input Validation**: Zod-based schema validation for all inputs
- **API Security**: Request signing and validation
- **Dependency Scanning**: Automated vulnerability scanning with Snyk

### Security Best Practices

- Regular dependency updates
- Secrets management through environment variables
- Secure defaults for all configurations
- Error messages that don't leak sensitive information

## 📊 Monitoring & Analytics

### Performance Monitoring

- **Web Vitals**: Automatic tracking of Core Web Vitals (LCP, FID, CLS)
- **Performance Metrics**: API response times, component render times
- **Error Tracking**: Comprehensive error logging and reporting

### Analytics Integration

- **Umami**: Privacy-focused, GDPR-compliant analytics (production only)
- **Custom Events**: User interaction tracking
- **Performance Dashboard**: Real-time performance metrics

## 🧪 Testing Strategy

### Testing Pyramid

1. **Unit Tests**: Component logic, utility functions, API clients
2. **Integration Tests**: Component interactions, API integrations
3. **E2E Tests**: User journeys, critical business flows

### Coverage Requirements

- **Current**: Coverage thresholds are set to 0 in `apps/client/jest.config.js` (target: 70% for branches, functions, lines, and statements).
- **UI / E2E**: Playwright for user journeys and visual regression.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our coding standards
4. Run checks: `npm run validate`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://www.docscrive.com](https://docscrive.usaid.dev)
- **Issue Tracker**: [GitHub Issues](https://github.com/usaidam1n/docscrive/issues)
- **Discussions**: [GitHub Discussions](https://github.com/usaidam1n/docscrive/discussions)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Radix UI](https://www.radix-ui.com/) - Primitive components
- [OpenAI](https://openai.com/) - AI API integration
- [Netlify](https://www.netlify.com/) - Deployment platform

---

<div align="center">
  <strong>Built with ❤️ by <a href="https://github.com/usaidam1n">Usaid Amin</a></strong>
</div>
