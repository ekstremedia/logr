# Claude Memory - Logr Project

This file contains context and memory for Claude AI to help with the Logr project.

## Project Overview

**Logr** is a modern log tailing application built with:
- **Backend:** Tauri 2.x (Rust)
- **Frontend:** Vue 3 + TypeScript + Pinia
- **Styling:** Tailwind CSS
- **Architecture:** Domain-Driven Design (DDD)

## Key Architecture Decisions

### Frontend Structure
```
src/
├── domain/                 # Business entities (LogEntry, LogSource, etc.)
├── application/            # Pinia stores (logStore, windowStore)
├── infrastructure/         # Tauri API adapters, localStorage
├── presentation/           # Vue components
│   ├── components/
│   │   ├── common/        # ThemeToggle, SessionManager, ContextMenu, etc.
│   │   ├── log-viewer/    # LogLine, etc.
│   │   └── search/        # SearchBar, LogLevelFilter
│   └── composables/       # useKeyboardShortcuts, useTheme, useSearch
```

### Backend Structure
```
src-tauri/src/
├── domain/                # Core entities (LogEntry, LogSource)
├── application/           # Commands, state management
│   ├── commands/          # Tauri commands (add_log_file, etc.)
│   └── state.rs           # LogWatcherState
└── infrastructure/        # File watcher (notify crate)
```

## Important Technical Details

### Tauri 2.0 Parameter Convention
**CRITICAL:** Tauri 2.0 automatically converts snake_case Rust parameters to camelCase for JavaScript.
- Rust: `source_id: String`
- JS must send: `{ sourceId: "..." }` (NOT `{ source_id: "..." }`)

### Vue Reactivity with Maps
When using `ref<Map<K, V>>`, calling `.set()` doesn't automatically trigger computed properties.
Use `triggerRef(mapRef)` after Map operations to force reactivity updates.

```typescript
import { triggerRef } from 'vue';

entries.value.set(sourceId, newEntries);
triggerRef(entries);  // Required for computed properties to update
```

### Keyboard Shortcuts
- Platform-specific: `Cmd+number` on macOS, `Alt+number` on Windows/Linux
- Use `event.code` (e.g., "Digit1") instead of `event.key` for number keys
  (Option+number on macOS produces special characters)

## Current Features

### Implemented
- Real-time log tailing with file watching
- Multi-source support (files and folders)
- Search and log level filtering
- Dark/light theme toggle
- Auto-scroll to bottom (enabled by default)
- Workspace management (save/load named workspaces)
- Session persistence (auto-restore last session)
- Right-click context menu on sources:
  - Rename
  - Open in New Window
  - Open with System (uses @tauri-apps/plugin-opener)
  - Remove
- Keyboard shortcuts (Cmd/Alt+1-9 to switch sources)
- Laravel log parsing
- Rename log sources with smart name suggestions from path
- Add File modal with text input (paste path) + file browser
- Unread indicator (red dot) on sources with new entries
- Clickable stacktrace file paths (opens in configured IDE)

### Backend State Management
The `LogWatcherState` manages:
- `sources: HashMap<String, LogSource>` - Active log sources
- `path_to_source: HashMap<PathBuf, String>` - Path to source ID mapping
- `entries: HashMap<String, Vec<LogEntry>>` - Log entries per source
- `watcher: NotifyFileWatcher` - File system watcher

### Key Functions
- `clear_all_sources()` - Uses `watcher.unwatch_all()` to properly clear both notify subscriptions AND internal `file_states` HashMap
- `read_initial_content()` - Reads existing file content when source is added

## Common Issues & Solutions

### "Already watching" error
**Cause:** File watcher's internal `file_states` HashMap wasn't cleared.
**Solution:** Use `unwatch_all()` which clears both notify subscriptions and internal state.

### Entries not showing (no log entries)
**Cause:** API parameter naming mismatch (snake_case vs camelCase).
**Solution:** Use camelCase in JS: `{ sourceId, maxLines }` not `{ source_id, max_lines }`.

### Computed properties not updating after Map.set()
**Cause:** Vue doesn't track Map internal changes.
**Solution:** Call `triggerRef(mapRef)` after Map operations.

## Files to Know

| File | Purpose |
|------|---------|
| `src/application/stores/logStore.ts` | Main state management |
| `src/application/stores/settingsStore.ts` | App settings (IDE preferences) |
| `src/infrastructure/tauri/logApi.ts` | Tauri command invocations |
| `src-tauri/src/application/state.rs` | Backend state & file watching |
| `src-tauri/src/application/commands/mod.rs` | Tauri command definitions |
| `src/App.vue` | Main application component |
| `src/presentation/components/common/SessionManager.vue` | Workspace UI |
| `src/presentation/components/common/AddFileModal.vue` | Add file dialog |
| `src/presentation/components/common/RenameInput.vue` | Source rename input with suggestions |
| `src/presentation/components/common/SettingsModal.vue` | Settings dialog (IDE config) |
| `src/domain/log-watching/entities/LogSource.ts` | Log source entity with name suggestions |

## MCP Bridge Plugin (for Claude Code)

The app includes `tauri-plugin-mcp-bridge` for Claude Code automation and testing.

### What It Does
- Allows Claude Code to connect to the running app via WebSocket (port 9223)
- Enables screenshots, console log reading, DOM interaction, and IPC monitoring
- Only active in debug builds (won't affect production)

### Setup Files Modified
| File | Change |
|------|--------|
| `src-tauri/Cargo.toml` | Added `tauri-plugin-mcp-bridge = "0.7"` |
| `src-tauri/src/lib.rs` | Plugin registration in debug builds only |
| `src-tauri/tauri.conf.json` | Added `"withGlobalTauri": true` |
| `src-tauri/capabilities/default.json` | Added `"mcp-bridge:default"` permission |

### Usage
1. Start the app: `npm run tauri dev`
2. In Claude Code, the tauri-mcp server auto-connects via `.mcp.json`
3. Use `/mcp` to check connection status

### Available MCP Tools
- `tauri_driver_session` - Start/stop connection to app
- `tauri_webview_screenshot` - Capture screenshots
- `tauri_read_logs` - Read console logs
- `tauri_webview_find_element` - Find DOM elements
- `tauri_webview_interact` - Click, scroll, focus elements
- `tauri_webview_keyboard` - Type text, press keys
- `tauri_ipc_execute_command` - Call Tauri backend commands

## Development Commands

```bash
# Start development
npm run tauri dev

# With Rust logging
RUST_LOG=info npm run tauri dev

# Build for production
npm run tauri build

# Run tests
npm run test
cd src-tauri && cargo test
```

## Last Updated
2026-01-06
