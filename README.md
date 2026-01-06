# Logr

[![CI](https://github.com/ekstremedia/logr/actions/workflows/ci.yml/badge.svg)](https://github.com/ekstremedia/logr/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, beautiful log tailing application built with Tauri 2.x and Vue 3.

## Features

- **Real-time Log Tailing** - Watch log files update in real-time
- **Multi-Window Support** - Open multiple log files in separate windows
- **Laravel Log Support** - Auto-detect and follow Laravel daily log rotation
- **Syntax Highlighting** - Color-coded log levels for easy reading
- **Keyboard Navigation** - Switch between windows with Alt+1-9
- **Desktop Notifications** - Get notified of errors and important events
- **Presets/Profiles** - Save and restore your log watching configurations
- **Cross-Platform** - Works on macOS, Windows, and Linux
- **Dark Mode** - Beautiful dark theme (light mode also available)

## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/terje/logr/releases) page.

| Platform | Download |
|----------|----------|
| macOS (Intel) | `Logr_x64.dmg` |
| macOS (Apple Silicon) | `Logr_aarch64.dmg` |
| Windows | `Logr_x64_en-US.msi` |
| Linux (Debian/Ubuntu) | `logr_amd64.deb` |
| Linux (AppImage) | `Logr_amd64.AppImage` |

### Build from Source

See [Development](#development) section below.

## Usage

### Adding Log Files

1. Click "Add Log File" or press `Cmd/Ctrl+O`
2. Select a log file to watch
3. A new window will open showing the log content

### Adding Log Folders

1. Click "Add Log Folder"
2. Select a folder containing log files
3. Logr will automatically watch the newest log file (great for Laravel daily logs)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+1` - `Alt+9` | Switch to log window 1-9 |
| `Alt+0` | Return to main dashboard |
| `Cmd/Ctrl+W` | Close current log window |
| `Cmd/Ctrl+N` | Add new log file |
| `Cmd/Ctrl+F` | Search/filter logs |
| `Cmd/Ctrl+?` | Show keyboard shortcuts |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (1.70 or later)
- [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

### Setup

```bash
# Clone the repository
git clone https://github.com/ekstremedia/logr.git
cd logr

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Testing

```bash
# Run frontend tests
npm run test

# Run frontend tests with coverage
npm run test:coverage

# Run Rust tests
cd src-tauri && cargo test

# Run E2E tests
npm run test:e2e
```

### Building

```bash
# Build for production
npm run tauri build
```

## Architecture

Logr follows Domain-Driven Design (DDD) principles:

```
src/                        # Frontend (Vue/TypeScript)
├── domain/                 # Business logic and entities
├── application/            # Use cases
├── infrastructure/         # External adapters (Tauri APIs)
├── presentation/           # UI components and views
└── shared/                 # Shared utilities

src-tauri/                  # Backend (Rust)
├── src/
│   ├── domain/            # Core business logic
│   ├── application/       # Commands and events
│   └── infrastructure/    # File system, storage
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI powered by [Vue 3](https://vuejs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
