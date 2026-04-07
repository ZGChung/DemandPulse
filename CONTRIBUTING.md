# Contributing to DemandPulse

Thank you for your interest in contributing to DemandPulse!

## Development Setup

### Prerequisites

- Node.js 18 or later
- npm or pnpm
- PostgreSQL (production) or SQLite (development)
- Claude Code (for plugin development)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ZGChung/DemandPulse.git
cd DemandPulse

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

Required for development:

```bash
# Authentication
GITHUB_ID=<your-github-oauth-app-id>
GITHUB_SECRET=<your-github-oauth-app-secret>
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Plugin API Key (for testing plugin integration)
PLUGIN_API_KEY=<your-plugin-api-key>
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/services/requirement-detection.test.ts
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

## Branch Naming

- `feature/` - New features (e.g., `feature/user-dashboard`)
- `fix/` - Bug fixes (e.g., `fix/login-redirect`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new dashboard widget
fix: resolve login redirect issue
docs: update API documentation
test: add coverage for requirement detection
refactor: simplify auth middleware
```

Format: `<type>: <description>`

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change that neither fixes nor adds
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes (`npm test`)
5. Update the CHANGELOG.md if applicable
6. Make sure linting passes (`npm run lint`)
7. Submit the PR with a clear description

### PR Description Template

```markdown
## Summary

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe what testing you performed.

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix works
- [ ] New and existing tests pass
```

## Plugin Development

If you're working on the Claude Code plugin:

```bash
# Test plugin locally
claude --plugin-dir ./claude-plugin-demandpulse

# Run plugin E2E tests
PLUGIN_API_KEY=<key> npm run e2e:plugin
```

See [claude-plugin-demandpulse/README.md](claude-plugin-demandpulse/README.md) for plugin details.

## Code of Conduct

Please be respectful and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
