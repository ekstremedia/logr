# Contributing to Logr

Thank you for your interest in contributing to Logr! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details**:
  - OS and version
  - Logr version
  - Log file format (if relevant)

### Suggesting Features

Feature requests are welcome! Please:

1. Check existing issues/discussions for similar suggestions
2. Open a new issue with the "feature request" label
3. Describe the feature and its use case
4. Explain why it would benefit other users

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main` for your changes
3. **Follow the coding standards** (see below)
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Submit a PR** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/logr.git
cd logr

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

## Coding Standards

### General Principles

- **Test-Driven Development**: Write tests first, then implementation
- **Clean Code**: Self-documenting, readable, maintainable
- **SOLID Principles**: Throughout the codebase

### Code Style

#### TypeScript/Vue

- Use ESLint and Prettier configurations provided
- Run `npm run lint` before committing
- Follow Vue 3 Composition API patterns

```typescript
// Good: Descriptive names, proper types
function parseLogEntry(rawLine: string, lineNumber: number): LogEntry {
  // ...
}

// Bad: Unclear names, implicit any
function parse(l, n) {
  // ...
}
```

#### Rust

- Run `cargo fmt` before committing
- Run `cargo clippy` and address warnings
- Document public APIs with rustdoc

```rust
/// Parses a log line into a structured entry.
///
/// # Arguments
/// * `line` - The raw log line to parse
///
/// # Returns
/// A parsed LogEntry or None if parsing fails
pub fn parse_line(line: &str) -> Option<LogEntry> {
    // ...
}
```

### File Length Guidelines

- Maximum function length: ~30 lines (extract if longer)
- Maximum file length: ~300 lines (split if larger)

### Testing Requirements

All PRs must include appropriate tests:

- **Unit tests** for domain logic
- **Integration tests** for use cases
- **Component tests** for Vue components
- **E2E tests** for critical user journeys

```bash
# Run all tests
npm run test
cargo test

# Check coverage
npm run test:coverage
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add log level filtering
fix: correct timestamp parsing for Laravel logs
test: add tests for FilePath value object
docs: update installation instructions
refactor: extract parser factory
```

## Project Structure

```
logr/
├── src/                    # Frontend (Vue/TypeScript)
│   ├── domain/            # Business logic
│   ├── application/       # Use cases
│   ├── infrastructure/    # External adapters
│   └── presentation/      # UI components
├── src-tauri/             # Backend (Rust)
│   ├── src/
│   │   ├── domain/       # Core logic
│   │   ├── application/  # Commands
│   │   └── infrastructure/
│   └── tests/            # Integration tests
└── e2e/                   # E2E tests
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add entry to CHANGELOG.md (if applicable)
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Questions?

Feel free to open a discussion or issue if you have questions about contributing.

Thank you for helping make Logr better!
