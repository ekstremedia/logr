# Logr - Cross-Platform Log Viewer

A modern, beautiful log tailing application built with Tauri 2.x and Vue 3.

## Project Overview

**Name:** Logr  
**Tech Stack:** Tauri 2.x (Rust backend) + Vue 3 + TypeScript + Tailwind CSS  
**Platforms:** macOS, Windows, Linux  
**License:** MIT  
**Architecture:** Domain-Driven Design (DDD)  
**Methodology:** Test-Driven Development (TDD)  

---

## Code Quality Standards

### Principles
- **Test-Driven Development:** Write tests first, then implementation
- **Domain-Driven Design:** Clear separation of concerns with bounded contexts
- **Clean Code:** Self-documenting, readable, maintainable
- **SOLID Principles:** Throughout the codebase
- **Documentation:** JSDoc/RustDoc comments on all public APIs

### Code Style Requirements
- All functions must have descriptive names that explain their purpose
- Maximum function length: ~30 lines (extract if longer)
- Maximum file length: ~300 lines (split if larger)
- All public functions/methods must have doc comments explaining:
  - What the function does
  - Parameters and their purpose
  - Return value
  - Example usage (where helpful)
- Use meaningful variable names (no single letters except loop indices)
- Prefer composition over inheritance
- No magic numbers - use named constants

### Commit Standards
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- Each commit should pass all tests
- Write commit messages that explain "why", not just "what"

---

## Open Source Setup

### Repository Structure
```
logr/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── workflows/
│   │   ├── ci.yml              # Run tests on PR
│   │   ├── release.yml         # Build & release binaries
│   │   └── lint.yml            # Code quality checks
│   ├── CONTRIBUTING.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODE_OF_CONDUCT.md
├── docs/
│   ├── architecture.md         # DDD architecture overview
│   ├── development.md          # Dev setup guide
│   └── api/                    # Generated API docs
├── src/                        # Frontend (Vue/TypeScript)
├── src-tauri/                  # Backend (Rust)
├── LICENSE                     # MIT License
├── README.md
├── CHANGELOG.md
└── TODO.md
```

### Open Source Files to Create

#### LICENSE (MIT)
- [ ] Create MIT license file with current year

#### README.md
- [ ] Project description and screenshots
- [ ] Features list
- [ ] Installation instructions (per platform)
- [ ] Development setup
- [ ] Building from source
- [ ] Contributing link
- [ ] License badge and info

#### CONTRIBUTING.md
- [ ] Code of conduct reference
- [ ] How to report bugs
- [ ] How to suggest features
- [ ] Development workflow
- [ ] Pull request process
- [ ] Code style guide reference
- [ ] Testing requirements (must include tests)

#### CHANGELOG.md
- [ ] Keep a changelog format
- [ ] Document all notable changes
- [ ] Follow semantic versioning

### GitHub Actions CI/CD
- [ ] **CI Pipeline:** Run on every PR
  - Lint (Rust + TypeScript)
  - Unit tests (Rust + TypeScript)
  - Integration tests
  - Build check for all platforms
- [ ] **Release Pipeline:** Run on version tags
  - Build binaries for macOS, Windows, Linux
  - Create GitHub release with artifacts
  - Generate changelog from commits

---

## Domain-Driven Design Architecture

### Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGR APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   LOG WATCHING   │  │  WINDOW MANAGER  │  │    PRESETS    │  │
│  │     CONTEXT      │  │     CONTEXT      │  │    CONTEXT    │  │
│  ├──────────────────┤  ├──────────────────┤  ├───────────────┤  │
│  │ Entities:        │  │ Entities:        │  │ Entities:     │  │
│  │ - LogSource      │  │ - LogWindow      │  │ - Preset      │  │
│  │ - LogEntry       │  │ - WindowLayout   │  │ - LogConfig   │  │
│  │ - LogFolder      │  │                  │  │               │  │
│  │                  │  │ Value Objects:   │  │ Value Objects:│  │
│  │ Value Objects:   │  │ - Position       │  │ - PresetName  │  │
│  │ - LogLevel       │  │ - Size           │  │               │  │
│  │ - LogFormat      │  │ - WindowState    │  │ Services:     │  │
│  │ - FilePath       │  │                  │  │ - PresetRepo  │  │
│  │ - LineNumber     │  │ Services:        │  │ - PresetMgr   │  │
│  │                  │  │ - WindowService  │  │               │  │
│  │ Services:        │  │ - LayoutService  │  └───────────────┘  │
│  │ - FileWatcher    │  │                  │                     │
│  │ - LogParser      │  └──────────────────┘  ┌───────────────┐  │
│  │ - TailService    │                        │ NOTIFICATION  │  │
│  │                  │                        │    CONTEXT    │  │
│  └──────────────────┘                        ├───────────────┤  │
│                                              │ Entities:     │  │
│  ┌──────────────────┐  ┌──────────────────┐  │ - NotifConfig │  │
│  │     PARSING      │  │     SETTINGS     │  │               │  │
│  │     CONTEXT      │  │     CONTEXT      │  │ Services:     │  │
│  ├──────────────────┤  ├──────────────────┤  │ - NotifSender │  │
│  │ Entities:        │  │ Entities:        │  │ - NotifQueue  │  │
│  │ - ParserConfig   │  │ - AppSettings    │  │               │  │
│  │                  │  │ - ThemeSettings  │  └───────────────┘  │
│  │ Value Objects:   │  │                  │                     │
│  │ - ParsedLine     │  │ Value Objects:   │                     │
│  │ - Timestamp      │  │ - Theme          │                     │
│  │ - StackTrace     │  │ - FontConfig     │                     │
│  │                  │  │                  │                     │
│  │ Services:        │  │ Services:        │                     │
│  │ - LaravelParser  │  │ - SettingsRepo   │                     │
│  │ - ApacheParser   │  │ - ThemeService   │                     │
│  │ - JsonParser     │  │                  │                     │
│  │ - GenericParser  │  └──────────────────┘                     │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure (DDD)

```
src/                                    # Frontend (Vue/TypeScript)
├── domain/                             # Domain Layer - Business Logic
│   ├── log-watching/
│   │   ├── entities/
│   │   │   ├── LogSource.ts
│   │   │   ├── LogEntry.ts
│   │   │   └── LogFolder.ts
│   │   ├── value-objects/
│   │   │   ├── LogLevel.ts
│   │   │   ├── LogFormat.ts
│   │   │   └── FilePath.ts
│   │   ├── services/
│   │   │   └── LogWatchingService.ts
│   │   ├── events/
│   │   │   ├── LogEntryReceived.ts
│   │   │   └── LogSourceChanged.ts
│   │   └── index.ts
│   ├── window-manager/
│   │   ├── entities/
│   │   │   └── LogWindow.ts
│   │   ├── value-objects/
│   │   │   ├── WindowPosition.ts
│   │   │   └── WindowSize.ts
│   │   ├── services/
│   │   │   └── WindowManagerService.ts
│   │   └── index.ts
│   ├── presets/
│   │   ├── entities/
│   │   │   └── Preset.ts
│   │   ├── value-objects/
│   │   │   └── PresetName.ts
│   │   ├── repositories/
│   │   │   └── PresetRepository.ts
│   │   └── index.ts
│   ├── parsing/
│   │   ├── entities/
│   │   │   └── ParserConfig.ts
│   │   ├── value-objects/
│   │   │   ├── ParsedLine.ts
│   │   │   └── StackTrace.ts
│   │   ├── services/
│   │   │   ├── ParserService.ts
│   │   │   ├── parsers/
│   │   │   │   ├── LaravelParser.ts
│   │   │   │   ├── ApacheParser.ts
│   │   │   │   ├── JsonLogParser.ts
│   │   │   │   └── GenericParser.ts
│   │   │   └── ParserFactory.ts
│   │   └── index.ts
│   ├── notifications/
│   │   ├── entities/
│   │   │   └── NotificationConfig.ts
│   │   ├── services/
│   │   │   └── NotificationService.ts
│   │   └── index.ts
│   └── settings/
│       ├── entities/
│       │   └── AppSettings.ts
│       ├── value-objects/
│       │   └── Theme.ts
│       └── index.ts
│
├── application/                        # Application Layer - Use Cases
│   ├── use-cases/
│   │   ├── log-watching/
│   │   │   ├── AddLogFileUseCase.ts
│   │   │   ├── AddLogFolderUseCase.ts
│   │   │   ├── StopWatchingUseCase.ts
│   │   │   └── __tests__/
│   │   │       ├── AddLogFileUseCase.test.ts
│   │   │       └── AddLogFolderUseCase.test.ts
│   │   ├── window-manager/
│   │   │   ├── OpenLogWindowUseCase.ts
│   │   │   ├── CloseLogWindowUseCase.ts
│   │   │   ├── SwitchWindowUseCase.ts
│   │   │   └── __tests__/
│   │   ├── presets/
│   │   │   ├── CreatePresetUseCase.ts
│   │   │   ├── LoadPresetUseCase.ts
│   │   │   ├── DeletePresetUseCase.ts
│   │   │   └── __tests__/
│   │   └── notifications/
│   │       ├── ToggleNotificationsUseCase.ts
│   │       └── __tests__/
│   └── ports/                          # Interfaces for infrastructure
│       ├── FileWatcherPort.ts
│       ├── NotificationPort.ts
│       ├── StoragePort.ts
│       └── WindowPort.ts
│
├── infrastructure/                     # Infrastructure Layer - External
│   ├── tauri/
│   │   ├── TauriFileWatcher.ts         # Implements FileWatcherPort
│   │   ├── TauriNotifications.ts       # Implements NotificationPort
│   │   ├── TauriStorage.ts             # Implements StoragePort
│   │   ├── TauriWindowManager.ts       # Implements WindowPort
│   │   └── __tests__/
│   │       └── TauriFileWatcher.test.ts
│   └── adapters/
│       └── ... 
│
├── presentation/                       # Presentation Layer - UI
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   └── __tests__/
│   │   │       └── Button.test.ts
│   │   ├── log-viewer/
│   │   │   ├── LogViewer.vue
│   │   │   ├── LogLine.vue
│   │   │   ├── LogLevelBadge.vue
│   │   │   └── __tests__/
│   │   ├── window/
│   │   │   ├── TitleBar.vue
│   │   │   ├── WindowControls.vue
│   │   │   └── __tests__/
│   │   └── presets/
│   │       ├── PresetList.vue
│   │       ├── PresetItem.vue
│   │       └── __tests__/
│   ├── views/
│   │   ├── MainDashboard.vue
│   │   ├── LogWindow.vue
│   │   ├── SettingsView.vue
│   │   └── __tests__/
│   ├── stores/                         # Pinia stores
│   │   ├── useLogStore.ts
│   │   ├── useWindowStore.ts
│   │   ├── usePresetStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── __tests__/
│   ├── composables/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useTheme.ts
│   │   └── __tests__/
│   └── layouts/
│       └── DefaultLayout.vue
│
├── shared/                             # Shared Kernel
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── stringUtils.ts
│   │   └── __tests__/
│   └── constants/
│       └── index.ts
│
└── main.ts                             # App entry point


src-tauri/                              # Backend (Rust)
├── src/
│   ├── domain/                         # Domain Layer
│   │   ├── log_watching/
│   │   │   ├── mod.rs
│   │   │   ├── entities/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── log_source.rs
│   │   │   │   └── log_entry.rs
│   │   │   ├── value_objects/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── log_level.rs
│   │   │   │   └── file_path.rs
│   │   │   └── services/
│   │   │       ├── mod.rs
│   │   │       ├── file_watcher.rs
│   │   │       └── tail_service.rs
│   │   ├── parsing/
│   │   │   ├── mod.rs
│   │   │   ├── traits.rs               # Parser trait definition
│   │   │   ├── laravel_parser.rs
│   │   │   ├── apache_parser.rs
│   │   │   ├── json_parser.rs
│   │   │   └── generic_parser.rs
│   │   └── mod.rs
│   │
│   ├── application/                    # Application Layer
│   │   ├── commands/                   # Tauri commands (use cases)
│   │   │   ├── mod.rs
│   │   │   ├── log_commands.rs
│   │   │   ├── window_commands.rs
│   │   │   ├── preset_commands.rs
│   │   │   └── settings_commands.rs
│   │   ├── events/                     # Event emitters
│   │   │   ├── mod.rs
│   │   │   └── log_events.rs
│   │   └── mod.rs
│   │
│   ├── infrastructure/                 # Infrastructure Layer
│   │   ├── file_system/
│   │   │   ├── mod.rs
│   │   │   └── watcher.rs
│   │   ├── storage/
│   │   │   ├── mod.rs
│   │   │   └── json_storage.rs
│   │   └── mod.rs
│   │
│   ├── lib.rs
│   └── main.rs
│
├── tests/                              # Integration tests
│   ├── file_watcher_tests.rs
│   ├── parser_tests.rs
│   └── command_tests.rs
│
└── Cargo.toml
```

---

## Testing Strategy

### Test-Driven Development Workflow
1. **Red:** Write a failing test that defines expected behavior
2. **Green:** Write minimal code to make the test pass
3. **Refactor:** Clean up while keeping tests green

### Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲           ~10% - Critical user journeys
                 ╱──────╲
                ╱        ╲
               ╱Integration╲        ~20% - Component interaction
              ╱────────────╲
             ╱              ╲
            ╱   Unit Tests   ╲      ~70% - Domain logic, utilities
           ╱──────────────────╲
```

### Frontend Testing (TypeScript/Vue)

#### Test Framework Setup
- [ ] **Vitest** - Unit and integration tests
- [ ] **Vue Test Utils** - Component testing
- [ ] **Testing Library** - User-centric component tests
- [ ] **MSW (Mock Service Worker)** - Mock Tauri API calls
- [ ] **Playwright** - E2E tests

#### Unit Tests (Domain Layer)
```typescript
// Example: src/domain/log-watching/value-objects/__tests__/LogLevel.test.ts

import { describe, it, expect } from 'vitest';
import { LogLevel } from '../LogLevel';

describe('LogLevel', () => {
  describe('fromString', () => {
    it('should parse DEBUG level correctly', () => {
      const level = LogLevel.fromString('DEBUG');
      expect(level.value).toBe('debug');
      expect(level.severity).toBe(0);
    });

    it('should parse ERROR level case-insensitively', () => {
      const level = LogLevel.fromString('error');
      expect(level.value).toBe('error');
      expect(level.severity).toBe(3);
    });

    it('should default to INFO for unknown levels', () => {
      const level = LogLevel.fromString('UNKNOWN');
      expect(level.value).toBe('info');
    });
  });

  describe('isAtLeast', () => {
    it('should return true when level meets threshold', () => {
      const error = LogLevel.fromString('ERROR');
      const warning = LogLevel.fromString('WARNING');
      expect(error.isAtLeast(warning)).toBe(true);
    });
  });
});
```

#### Integration Tests (Use Cases)
```typescript
// Example: src/application/use-cases/log-watching/__tests__/AddLogFileUseCase.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddLogFileUseCase } from '../AddLogFileUseCase';
import { createMockFileWatcher } from '@/test-utils/mocks';

describe('AddLogFileUseCase', () => {
  let useCase: AddLogFileUseCase;
  let mockFileWatcher: ReturnType<typeof createMockFileWatcher>;

  beforeEach(() => {
    mockFileWatcher = createMockFileWatcher();
    useCase = new AddLogFileUseCase(mockFileWatcher);
  });

  it('should start watching the specified file', async () => {
    const filePath = '/var/log/app.log';
    
    await useCase.execute(filePath);
    
    expect(mockFileWatcher.watch).toHaveBeenCalledWith(filePath);
  });

  it('should emit initial log entries', async () => {
    const filePath = '/var/log/app.log';
    const onEntry = vi.fn();
    
    await useCase.execute(filePath, { onEntry });
    
    expect(onEntry).toHaveBeenCalled();
  });

  it('should throw error for non-existent file', async () => {
    mockFileWatcher.watch.mockRejectedValue(new Error('File not found'));
    
    await expect(useCase.execute('/nonexistent.log'))
      .rejects.toThrow('File not found');
  });
});
```

#### Component Tests
```typescript
// Example: src/presentation/components/log-viewer/__tests__/LogLine.test.ts

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import LogLine from '../LogLine.vue';
import { LogEntry } from '@/domain/log-watching/entities/LogEntry';

describe('LogLine', () => {
  const createLogEntry = (overrides = {}): LogEntry => ({
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00'),
    level: 'error',
    message: 'Test error message',
    raw: '[2024-01-15 10:30:00] ERROR: Test error message',
    ...overrides,
  });

  it('should render log message', () => {
    render(LogLine, {
      props: { entry: createLogEntry() },
    });
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should apply error styling for error level', () => {
    render(LogLine, {
      props: { entry: createLogEntry({ level: 'error' }) },
    });
    
    const line = screen.getByTestId('log-line');
    expect(line).toHaveClass('text-red-500');
  });

  it('should make URLs clickable', () => {
    render(LogLine, {
      props: { 
        entry: createLogEntry({ 
          message: 'Visit https://example.com for info' 
        }) 
      },
    });
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });
});
```

### Backend Testing (Rust)

#### Unit Tests
```rust
// Example: src-tauri/src/domain/parsing/laravel_parser.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_standard_laravel_log_line() {
        let parser = LaravelParser::new();
        let line = "[2024-01-15 10:30:00] production.ERROR: Test error message";
        
        let result = parser.parse(line).unwrap();
        
        assert_eq!(result.level, LogLevel::Error);
        assert_eq!(result.environment, Some("production".to_string()));
        assert_eq!(result.message, "Test error message");
    }

    #[test]
    fn test_parse_laravel_log_with_context() {
        let parser = LaravelParser::new();
        let line = r#"[2024-01-15 10:30:00] local.INFO: User logged in {"user_id":123}"#;
        
        let result = parser.parse(line).unwrap();
        
        assert_eq!(result.level, LogLevel::Info);
        assert!(result.context.is_some());
    }

    #[test]
    fn test_parse_multiline_stack_trace() {
        let parser = LaravelParser::new();
        let lines = vec![
            "[2024-01-15 10:30:00] production.ERROR: Exception occurred",
            "#0 /app/Http/Controller.php(50): handleRequest()",
            "#1 /vendor/laravel/framework/Router.php(100): dispatch()",
        ];
        
        let result = parser.parse_multiline(&lines).unwrap();
        
        assert!(result.stack_trace.is_some());
        assert_eq!(result.stack_trace.unwrap().frames.len(), 2);
    }

    #[test]
    fn test_returns_none_for_non_laravel_format() {
        let parser = LaravelParser::new();
        let line = "This is not a Laravel log line";
        
        let result = parser.parse(line);
        
        assert!(result.is_none());
    }
}
```

#### Integration Tests
```rust
// Example: src-tauri/tests/file_watcher_tests.rs

use logr::domain::log_watching::services::FileWatcher;
use std::fs::{File, OpenOptions};
use std::io::Write;
use tempfile::TempDir;
use tokio::sync::mpsc;
use tokio::time::{timeout, Duration};

#[tokio::test]
async fn test_file_watcher_detects_new_lines() {
    // Arrange
    let temp_dir = TempDir::new().unwrap();
    let log_path = temp_dir.path().join("test.log");
    File::create(&log_path).unwrap();
    
    let (tx, mut rx) = mpsc::channel(100);
    let watcher = FileWatcher::new(tx);
    
    // Act
    watcher.watch(&log_path).await.unwrap();
    
    // Append new line to file
    let mut file = OpenOptions::new().append(true).open(&log_path).unwrap();
    writeln!(file, "New log entry").unwrap();
    
    // Assert
    let result = timeout(Duration::from_secs(1), rx.recv()).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap().unwrap().content, "New log entry");
}

#[tokio::test]
async fn test_file_watcher_handles_file_rotation() {
    // Test that watcher detects when file is rotated (truncated/replaced)
    // ...
}

#[tokio::test]
async fn test_folder_watcher_follows_newest_laravel_log() {
    // Test that folder watcher switches to newest laravel-YYYY-MM-DD.log
    // ...
}
```

### E2E Tests (Playwright)

```typescript
// Example: e2e/log-viewing.spec.ts

import { test, expect } from '@playwright/test';
import { startApp, createTestLogFile } from './helpers';

test.describe('Log Viewing', () => {
  test('should open log file and display entries', async () => {
    const app = await startApp();
    const logPath = await createTestLogFile([
      '[2024-01-15 10:30:00] ERROR: Test error',
      '[2024-01-15 10:30:01] INFO: Test info',
    ]);
    
    // Add log file
    await app.click('[data-testid="add-log-button"]');
    await app.fill('[data-testid="file-path-input"]', logPath);
    await app.click('[data-testid="confirm-add"]');
    
    // Verify log window opens
    const logWindow = await app.waitForWindow();
    await expect(logWindow.locator('[data-testid="log-line"]')).toHaveCount(2);
    
    // Verify error styling
    const errorLine = logWindow.locator('[data-testid="log-line"]').first();
    await expect(errorLine).toHaveClass(/text-red/);
  });

  test('should update in real-time when new logs arrive', async () => {
    const app = await startApp();
    const logPath = await createTestLogFile(['Initial entry']);
    
    await app.addLogFile(logPath);
    const logWindow = await app.waitForWindow();
    
    // Append new entry
    await appendToFile(logPath, '[2024-01-15 10:31:00] INFO: New entry');
    
    // Verify update appears
    await expect(logWindow.locator('[data-testid="log-line"]')).toHaveCount(2);
  });

  test('should switch windows with Alt+N shortcuts', async () => {
    const app = await startApp();
    
    // Open two log windows
    await app.addLogFile(await createTestLogFile(['Log 1']));
    await app.addLogFile(await createTestLogFile(['Log 2']));
    
    // Switch to first window
    await app.keyboard.press('Alt+1');
    await expect(app.getActiveWindow()).toHaveTitle(/Log 1/);
    
    // Switch to second window
    await app.keyboard.press('Alt+2');
    await expect(app.getActiveWindow()).toHaveTitle(/Log 2/);
  });
});
```

### Test Coverage Requirements

| Layer | Minimum Coverage | Target Coverage |
|-------|-----------------|-----------------|
| Domain (Entities, Value Objects) | 90% | 95% |
| Domain (Services) | 85% | 90% |
| Application (Use Cases) | 85% | 90% |
| Infrastructure | 70% | 80% |
| Presentation (Components) | 75% | 85% |
| Presentation (Stores) | 80% | 90% |
| E2E Critical Paths | 100% | 100% |

### Test Utilities to Create
- [ ] `createMockLogEntry()` - Factory for test log entries
- [ ] `createMockFileWatcher()` - Mock file watcher for unit tests
- [ ] `createMockTauriApi()` - Mock all Tauri commands
- [ ] `renderWithProviders()` - Render helper with all providers
- [ ] `createTestLogFile()` - Create temp log files for tests
- [ ] Rust test fixtures for common log formats

### CI Test Requirements
- [ ] All tests must pass before merge
- [ ] Coverage cannot decrease on PR
- [ ] E2E tests run on all platforms in CI

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Project
- [ ] Create Tauri 2.x project with Vue 3 + TypeScript template
- [ ] Set up Tailwind CSS with dark mode support (class-based)
- [ ] Configure ESLint and Prettier
- [ ] Set up Vitest for frontend testing
- [ ] Set up Rust test configuration
- [ ] Set up Playwright for E2E testing
- [ ] Configure code coverage reporting
- [ ] Set up project structure as defined in DDD Architecture section
- [ ] Create initial test utilities and mocks

### 1.2 Tauri Configuration
- [ ] Configure multi-window support in `tauri.conf.json`
- [ ] Set up file system permissions (read access for log files)
- [ ] Configure notification permissions
- [ ] Set app icons and metadata for all platforms

### 1.3 Open Source Setup
- [ ] Create LICENSE file (MIT)
- [ ] Create README.md with badges
- [ ] Create CONTRIBUTING.md
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Set up GitHub issue templates
- [ ] Set up GitHub PR template
- [ ] Create CI workflow (lint, test, build)
- [ ] Create release workflow

---

## Phase 2: Core File Watching & Tailing

### 2.1 Domain Layer - Log Watching (TDD)
- [ ] **Test first:** Write tests for `LogLevel` value object
- [ ] Implement `LogLevel` value object
- [ ] **Test first:** Write tests for `FilePath` value object
- [ ] Implement `FilePath` value object
- [ ] **Test first:** Write tests for `LogEntry` entity
- [ ] Implement `LogEntry` entity
- [ ] **Test first:** Write tests for `LogSource` entity
- [ ] Implement `LogSource` entity

### 2.2 Rust Backend - File Watcher (TDD)
- [ ] **Test first:** Write tests for file watching service
- [ ] Implement file watcher using `notify` crate
- [ ] **Test first:** Write tests for tail functionality
- [ ] Create tail functionality that:
  - Reads last N lines on initial load (configurable, default 100)
  - Streams new lines as they're appended
  - Handles file rotation (common with Laravel daily logs)
  - Handles file truncation gracefully
- [ ] **Test first:** Write tests for event emission
- [ ] Emit events to frontend via Tauri event system

### 2.3 Laravel Daily Log Detection (TDD)
- [ ] **Test first:** Write tests for folder watching mode
- [ ] Implement folder watching mode
- [ ] **Test first:** Write tests for Laravel log pattern detection
- [ ] Logic to detect Laravel log naming pattern: `laravel-YYYY-MM-DD.log`
- [ ] Automatically switch to newest log file when date changes
- [ ] Support other common patterns:
  - `*.log` (newest by modification time)
  - Apache: `access.log`, `error.log`
  - Custom pattern matching (user configurable)

### 2.4 Tauri Commands (TDD)
- [ ] **Test first:** Write tests for each command
- [ ] `add_log_file(path: String)` - Start tailing a specific file
- [ ] `add_log_folder(path: String, pattern: String)` - Watch folder for latest log
- [ ] `stop_watching(watcher_id: String)` - Stop a specific watcher
- [ ] `get_initial_lines(path: String, count: u32)` - Get last N lines
- [ ] `open_file_dialog()` - Native file picker
- [ ] `open_folder_dialog()` - Native folder picker

---

## Phase 3: Multi-Window Management

### 3.1 Domain Layer - Window Manager (TDD)
- [ ] **Test first:** Write tests for `WindowPosition` value object
- [ ] Implement `WindowPosition` value object
- [ ] **Test first:** Write tests for `WindowSize` value object
- [ ] Implement `WindowSize` value object
- [ ] **Test first:** Write tests for `LogWindow` entity
- [ ] Implement `LogWindow` entity
- [ ] **Test first:** Write tests for `WindowManagerService`
- [ ] Implement `WindowManagerService`

### 3.2 Window System Implementation
- [ ] Main window acts as "control center" / dashboard
- [ ] Each log source opens in its own window
- [ ] Window state tracking:
  - Position and size (remembered per log)
  - Minimized/maximized state
  - Which log file/folder it's watching
- [ ] Window title shows log file name and live status indicator

### 3.3 Keyboard Navigation (TDD)
- [ ] **Test first:** Write tests for keyboard shortcuts composable
- [ ] Global shortcut handler for window switching
- [ ] `Alt+1` through `Alt+9` to switch between log windows
- [ ] `Alt+0` to return to main/dashboard window
- [ ] Display window number badge/indicator in each window
- [ ] `Cmd/Ctrl+W` to close current log window
- [ ] `Cmd/Ctrl+N` to add new log (opens file dialog)

### 3.4 Window Management UI (Main Window)
- [ ] **Test first:** Write component tests
- [ ] List of all active log windows with:
  - Log name/path
  - Status (active/paused/error)
  - Quick actions (focus, close, toggle notifications)
- [ ] Drag to reorder (affects Alt+N numbering)

---

## Phase 4: Theme & Visual Design

### 4.1 Theme System (TDD)
- [ ] **Test first:** Write tests for theme service
- [ ] Dark theme (default)
- [ ] Light theme
- [ ] Theme toggle in settings and quick-access in UI
- [ ] System theme detection option ("Follow system")
- [ ] Persist theme preference

### 4.2 Design System
- [ ] Modern, clean aesthetic (inspired by Warp terminal, Linear app)
- [ ] Smooth animations and transitions
- [ ] Custom window chrome (frameless with custom title bar)
- [ ] Consistent spacing and typography
- [ ] Accent color customization (optional)

### 4.3 Log Window UI Components (TDD)
- [ ] **Test first:** Write component tests for each
- [ ] Monospace font for log content (configurable font/size)
- [ ] Line numbers (optional)
- [ ] Timestamps clearly visible
- [ ] Auto-scroll with "jump to bottom" button when scrolled up
- [ ] Scroll position indicator
- [ ] Search/filter bar (`Cmd/Ctrl+F`)

---

## Phase 5: Log Parsing & Syntax Highlighting

### 5.1 Domain Layer - Parsing (TDD)
- [ ] **Test first:** Write tests for `ParsedLine` value object
- [ ] Implement `ParsedLine` value object
- [ ] **Test first:** Write tests for `StackTrace` value object
- [ ] Implement `StackTrace` value object
- [ ] **Test first:** Write tests for `ParserService`
- [ ] Implement `ParserService` with parser factory

### 5.2 Log Parsers (TDD)
- [ ] **Test first:** Write comprehensive tests for Laravel parser
- [ ] Implement `LaravelParser`
- [ ] **Test first:** Write tests for Apache parser
- [ ] Implement `ApacheParser`
- [ ] **Test first:** Write tests for JSON parser
- [ ] Implement `JsonLogParser`
- [ ] **Test first:** Write tests for Generic parser
- [ ] Implement `GenericParser`
- [ ] Auto-detect log format

### 5.3 Syntax Highlighting (TDD)
- [ ] **Test first:** Write tests for highlighting logic
- [ ] Log level coloring:
  - DEBUG: gray/dim
  - INFO: blue/cyan
  - WARNING: yellow/orange
  - ERROR: red
  - CRITICAL/EMERGENCY: red background
- [ ] Timestamp highlighting
- [ ] Stack trace formatting (collapsible)
- [ ] JSON syntax highlighting for JSON logs
- [ ] SQL query highlighting (common in Laravel logs)

### 5.4 Interactive Elements (TDD)
- [ ] **Test first:** Write tests for URL detection
- [ ] Clickable URLs (open in browser)
- [ ] **Test first:** Write tests for file path detection
- [ ] Clickable file paths (open in default editor or file manager)
- [ ] Copy line / copy selection
- [ ] Click on stack trace file:line to copy or open

---

## Phase 6: Notifications

### 6.1 Domain Layer - Notifications (TDD)
- [ ] **Test first:** Write tests for `NotificationConfig` entity
- [ ] Implement `NotificationConfig` entity
- [ ] **Test first:** Write tests for `NotificationService`
- [ ] Implement `NotificationService`

### 6.2 Notification System Implementation
- [ ] Per-window notification toggle
- [ ] Native OS notifications when:
  - New log entries arrive (when window not focused)
  - Error-level or above entries (configurable)
- [ ] Notification preferences:
  - All new entries
  - Only errors and above
  - Only when matching filter/keyword
  - Off
- [ ] Sound option (on/off)
- [ ] Notification grouping (don't spam)

### 6.3 Notification UI (TDD)
- [ ] **Test first:** Write component tests
- [ ] Visual indicator in main window for logs with new unread entries
- [ ] Badge count on window/dock icon (if supported)
- [ ] "Mark as read" functionality

---

## Phase 7: Presets & Persistence

### 7.1 Domain Layer - Presets (TDD)
- [ ] **Test first:** Write tests for `PresetName` value object
- [ ] Implement `PresetName` value object
- [ ] **Test first:** Write tests for `Preset` entity
- [ ] Implement `Preset` entity
- [ ] **Test first:** Write tests for `PresetRepository`
- [ ] Implement `PresetRepository` interface and JSON implementation

### 7.2 Preset/Profile System (TDD)
- [ ] **Test first:** Write use case tests
- [ ] Create named presets (e.g., "Work", "Personal Projects", "Production")
- [ ] Preset stores:
  - List of log files/folders to open
  - Window positions and sizes
  - Per-log settings (notifications, filters)
  - Theme preference (optional override)
- [ ] Quick-switch between presets from main window
- [ ] Import/export presets (JSON)

### 7.3 Data Persistence
- [ ] Use Tauri's `app_data_dir` for config storage
- [ ] Store as JSON
- [ ] Save on change (debounced)
- [ ] Config schema validation

### 7.4 Startup Behavior
- [ ] Option: Open last session on startup
- [ ] Option: Open specific preset on startup
- [ ] Option: Start empty
- [ ] Remember last used preset

---

## Phase 8: Search & Filtering

### 8.1 Search (TDD)
- [ ] **Test first:** Write tests for search functionality
- [ ] Real-time search within current log (`Cmd/Ctrl+F`)
- [ ] Highlight matches
- [ ] Navigate between matches (Enter / Shift+Enter)
- [ ] Search history
- [ ] Regex search option

### 8.2 Filtering (TDD)
- [ ] **Test first:** Write tests for filtering
- [ ] Filter by log level (show only errors, etc.)
- [ ] Text filter (show only lines matching)
- [ ] Negative filter (hide lines matching)
- [ ] Save filters per log source

---

## Phase 9: Polish & Platform-Specific

### 9.1 macOS
- [ ] Native menu bar integration
- [ ] Dock icon badges
- [ ] Touch Bar support (if applicable)
- [ ] Proper app signing for distribution

### 9.2 Windows
- [ ] System tray integration
- [ ] Native notifications
- [ ] Proper installer (MSI or NSIS)
- [ ] File association for .log files (optional)

### 9.3 Linux
- [ ] System tray / app indicator
- [ ] .deb and .AppImage builds
- [ ] Desktop file with proper categories

### 9.4 General Polish
- [ ] Loading states and skeletons
- [ ] Error handling with user-friendly messages
- [ ] Empty states with helpful guidance
- [ ] Keyboard shortcut help modal (`Cmd/Ctrl+?`)
- [ ] About window with version info
- [ ] Check for updates functionality

---

## Phase 10: Documentation & Release

### 10.1 Documentation
- [ ] Complete README with screenshots
- [ ] Architecture documentation
- [ ] API documentation (generated)
- [ ] User guide / wiki
- [ ] Video demo

### 10.2 Release Preparation
- [ ] All tests passing on all platforms
- [ ] Coverage targets met
- [ ] Performance testing
- [ ] Accessibility review
- [ ] Security review
- [ ] Create v1.0.0 release

---

## Phase 11: Future Enhancements (Nice to Have)

- [ ] SSH/remote log tailing
- [ ] Multiple logs in single window (tabbed or split view)
- [ ] Log analytics (error frequency graphs)
- [ ] Log export (filtered logs to file)
- [ ] Plugin system for custom parsers
- [ ] Collaborative features (share log view link)
- [ ] Custom color schemes
- [ ] Vim keybindings option

---

## Technical Notes

### Key Dependencies (Rust/Tauri)
- `tauri` 2.x
- `notify` - File system watching
- `tokio` - Async runtime
- `serde` / `serde_json` - Serialization
- `regex` - Pattern matching

### Key Dependencies (Frontend)
- Vue 3 (Composition API)
- TypeScript
- Pinia - State management
- Tailwind CSS - Styling
- VueUse - Composables
- Lucide Vue - Icons
- Vitest - Unit testing
- Vue Test Utils - Component testing
- Playwright - E2E testing

### File Watching Strategy
Use `notify` crate in Rust with:
1. Poll-based watching for network drives (slower but reliable)
2. Native watching for local files (faster)
3. Debounce rapid changes
4. Handle file rotation by watching directory and comparing inodes/timestamps

### Log Parsing Strategy
1. Read file from end (seek to end, read backwards for initial lines)
2. Stream new content via `BufReader` with file position tracking
3. Parse lines through format-specific parsers
4. Emit structured log entries to frontend

---

## Getting Started Commands

```bash
# Install Tauri CLI
cargo install tauri-cli

# Create project (if starting fresh)
cargo tauri init

# Install frontend dependencies
npm install

# Run tests (frontend)
npm run test

# Run tests (backend)
cargo test

# Run tests with coverage
npm run test:coverage
cargo tarpaulin

# Development
cargo tauri dev

# Build for production
cargo tauri build
```

---

## Success Criteria

### Functional
- [ ] App launches and displays main window on all three platforms
- [ ] Can add a log file and see live updates
- [ ] Can add a Laravel log folder and it auto-follows the newest log
- [ ] Alt+N switching works reliably
- [ ] Notifications work per-window
- [ ] Presets save and restore correctly
- [ ] Log highlighting makes logs easy to read
- [ ] Links are clickable
- [ ] Theme switching works smoothly
- [ ] App feels native and responsive on each platform

### Quality
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Domain layer coverage ≥ 90%
- [ ] Overall coverage ≥ 80%
- [ ] No critical/high security vulnerabilities
- [ ] Performance: Opens 10MB log file in < 2 seconds
- [ ] Memory: < 200MB RAM with 5 log windows open
- [ ] All public APIs documented
- [ ] Code passes all linting rules
