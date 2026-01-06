# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Tauri 2.x and Vue 3
- Domain-driven design architecture
- TypeScript frontend with Tailwind CSS
- Rust backend with DDD structure
- ESLint and Prettier configuration
- Vitest for frontend testing
- Playwright for E2E testing
- GitHub Actions CI/CD pipeline

## [0.2.0] - 2025-01-06

### Added
- **Workspace Management** - Save and load named workspaces from the top bar
- **Session Persistence** - Auto-restore log sources from last session
- **Right-click Context Menu** on log sources with options:
  - Open in New Window
  - Open with System (native file opener)
  - Remove source
- **New Workspace** button to clear all sources and start fresh
- Platform-specific keyboard shortcuts (Cmd+1-9 on macOS, Alt+1-9 on Windows/Linux)

### Changed
- Renamed "Sessions" to "Workspaces" throughout the UI
- Moved workspace controls from sidebar to top header bar
- Improved initial content loading when adding log sources

### Fixed
- **"Already watching" error** - Fixed by properly clearing file watcher internal state with `unwatch_all()`
- **"No log entries" bug** - Fixed Tauri API parameter naming (snake_case to camelCase for JS)
- **Vue reactivity with Maps** - Added `triggerRef()` calls to ensure computed properties update
- **Alt+number shortcuts on macOS** - Use `event.code` instead of `event.key` (Option+number produces special chars)
- **Error messages persisting** - Clear error state when creating new workspace
- **Failed to add file errors** - Wrapped `readInitialContent` in try/catch so failures don't block source addition

### Technical
- Fixed Tauri 2.0 parameter convention: Rust snake_case converts to JS camelCase automatically

## [0.1.0] - TBD

### Added
- Core log tailing functionality
- Multi-window support
- Laravel daily log detection
- Syntax highlighting for log levels
- Desktop notifications
- Preset/profile system
- Dark mode support
- Keyboard navigation (Alt+1-9)
