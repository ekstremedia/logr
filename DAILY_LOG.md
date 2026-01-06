# Daily Development Log

## 2026-01-07

### Session Summary
Added per-source view preferences (formatted/raw toggle, auto-scroll) that persist to workspaces, workspace overwrite confirmation, and improved raw log view to show full stack traces.

### Features Added

#### 1. Formatted/Raw Log Toggle (Per-Source)
- New toggle button in log viewer header to switch between formatted and raw views
- **Formatted mode:** Shows parsed timestamp, level badge, message, expandable stack traces
- **Raw mode:** Shows complete raw log content including full stack traces
- Setting is per-source and saved to workspace
- **Files:**
  - `src/presentation/components/log-viewer/LogLine.vue` - Added `showFormatted` prop and `fullRawContent` computed
  - `src/application/stores/logStore.ts` - Added `sourceFormatted` Map, `isFormatted()`, `setFormatted()`
  - `src/infrastructure/storage/localStorageService.ts` - Added `showFormatted` to `SessionSourceData`
  - `src/App.vue` - Added toggle button and integration

#### 2. Auto-Scroll Per-Source
- Auto-scroll setting is now per-source instead of global
- Setting persists to workspace
- **Files:**
  - `src/application/stores/logStore.ts` - Added `sourceAutoScroll` Map, `isAutoScroll()`, `setAutoScroll()`
  - `src/infrastructure/storage/localStorageService.ts` - Added `autoScroll` to `SessionSourceData`
  - `src/App.vue` - Changed from `ref` to `computed` reading from store

#### 3. Workspace Overwrite Confirmation
- When "Save As..." uses an existing workspace name, prompts for confirmation
- Shows "Overwrite?" dialog with Cancel/Overwrite buttons
- After overwrite, switches current session to the overwritten workspace
- **Files:** `src/presentation/components/common/SessionManager.vue`

#### 4. Raw View Shows Full Stack Trace
- Previously raw mode only showed `entry.raw` (first line)
- Now combines raw line + all stack trace lines for complete output
- Copy button also copies full content
- **Files:** `src/presentation/components/log-viewer/LogLine.vue` - Added `fullRawContent` computed

#### 5. Stack Trace Overflow Fix
- Fixed stack trace content overflowing its container
- Added `overflow-x-auto`, `min-w-0`, `whitespace-pre-wrap break-all`
- **Files:** `src/presentation/components/log-viewer/LogLine.vue`

### Files Modified
- `src/App.vue` - Per-source formatting/auto-scroll, toggle buttons
- `src/application/stores/logStore.ts` - Per-source preferences with persistence
- `src/infrastructure/storage/localStorageService.ts` - New `SessionSourceData` fields
- `src/presentation/components/log-viewer/LogLine.vue` - Raw view, overflow fix
- `src/presentation/components/common/SessionManager.vue` - Overwrite confirmation

### Tests Added
- `src/infrastructure/storage/__tests__/localStorageService.test.ts`:
  - Test for `showFormatted` and `autoScroll` persistence in sessions
  - Test for preferences in named sessions

### Technical Notes
- Per-source state uses `Map<string, boolean>` with `triggerRef()` for Vue reactivity
- Settings default to `true` when not explicitly set (`!== false` check)
- Vite HMR can cause webview to crash when changing reactive state types; restart dev server

---

## 2026-01-06 (Continued)

### Session Summary
Added several UX improvements: Add File modal, rename sources feature, unread indicators, and workspace save functionality.

### Features Added

#### 1. Add File Modal
- New modal dialog when clicking "Add File" button
- Text input field for pasting file paths directly
- "Find File" button opens system file browser
- Cancel/Add buttons with keyboard shortcuts (Escape/Enter)
- **Files:** `src/presentation/components/common/AddFileModal.vue`

#### 2. Rename Log Sources
- Double-click or use context menu to rename sources
- Smart name suggestions extracted from file path:
  - Removes date patterns (e.g., `laravel-2023-08-14.log` → `laravel`)
  - Extracts project name from Laravel storage path
  - Suggests parent folder names
- **Files:**
  - `src/presentation/components/common/RenameInput.vue` - Input component with suggestions
  - `src/domain/log-watching/entities/LogSource.ts` - Added `withName()` and `getNameSuggestions()`
  - `src/application/stores/logStore.ts` - Added `renameSource()` and `getNameSuggestions()`

#### 3. Save Current Workspace
- Previously only "Save As..." was available
- Now shows "Save [workspace name]" when a workspace is loaded
- Updates the existing workspace instead of creating a new one
- **Files:** `src/presentation/components/common/SessionManager.vue`

#### 4. Unread Indicator
- Red dot appears next to log sources with new entries
- Only shows when viewing a different source
- Clears when you click on the source to view it
- **Files:**
  - `src/application/stores/logStore.ts` - Added `unreadSources` Map and `hasUnread()`
  - `src/App.vue` - Added indicator dot in sidebar

### Files Modified
- `src/App.vue` - AddFileModal integration, unread indicator, rename UI
- `src/application/stores/logStore.ts` - Rename and unread functionality
- `src/domain/log-watching/entities/LogSource.ts` - Name suggestions logic
- `src/presentation/components/common/SessionManager.vue` - Save workspace
- `src/presentation/components/common/index.ts` - Export new components

### Files Created
- `src/presentation/components/common/AddFileModal.vue`
- `src/presentation/components/common/RenameInput.vue`

### Technical Notes
- Used `v-if` on modal component in parent rather than internal `v-if` with prop for simpler lifecycle management
- Used Map instead of Set for `unreadSources` for better Vue reactivity tracking
- Name suggestions use regex to extract project names from common path patterns

---

## 2025-01-06

### Session Summary
Major bug fixing session focused on workspace management, API parameter issues, and Vue reactivity.

### Issues Fixed

#### 1. "Already watching" error persisting after workspace switch
- **Root cause:** File watcher's internal `file_states` HashMap wasn't being cleared when sources were removed
- **Solution:** Modified `clear_all_sources()` in `state.rs` to use `unwatch_all()` which properly clears both notify subscriptions AND internal state

#### 2. "No log entries" showing even when files have content
- **Root cause:** Tauri 2.0 API parameter naming mismatch
  - Rust uses `source_id` (snake_case)
  - Tauri automatically converts to `sourceId` (camelCase) for JavaScript
  - Our JS was sending `source_id` which didn't match
- **Solution:** Updated all API calls in `logApi.ts` to use camelCase: `{ sourceId, maxLines }` instead of `{ source_id, max_lines }`

#### 3. Vue reactivity not updating when Map entries change
- **Root cause:** Vue's `ref<Map<K,V>>` doesn't automatically track internal Map operations like `.set()`
- **Solution:** Added `triggerRef(entries)` calls after every `entries.value.set()` operation in `logStore.ts`

#### 4. "Failed to remove source" errors
- **Root cause:** Same API parameter naming issue as above
- **Solution:** Fixed with camelCase parameters

#### 5. Alt+number shortcuts not working on macOS
- **Root cause:** Option+number on macOS produces special characters (e.g., Option+1 = "!")
- **Solution:** Use `event.code` (e.g., "Digit1") instead of `event.key`, and detect platform for Cmd vs Alt

### Features Added

#### Right-click Context Menu
- Created `ContextMenu.vue` component
- Added to log sources in sidebar
- Options: Open in New Window, Open with System, Remove
- Uses `@tauri-apps/plugin-opener` for system file opening

#### Workspace Management Improvements
- Renamed "Sessions" to "Workspaces"
- Moved controls to top header bar
- Added "New Workspace" option to clear all sources

### Files Modified
- `src-tauri/src/application/state.rs` - `clear_all_sources()` fix
- `src-tauri/src/application/commands/mod.rs` - Added `clear_all_sources` command
- `src/infrastructure/tauri/logApi.ts` - Fixed all parameter names to camelCase
- `src/application/stores/logStore.ts` - Added `triggerRef()` calls for reactivity
- `src/presentation/composables/useKeyboardShortcuts.ts` - Platform-specific shortcuts
- `src/presentation/components/common/ContextMenu.vue` - New component
- `src/presentation/components/common/SessionManager.vue` - Workspace UI
- `src/App.vue` - Context menu integration

### MCP Server Setup for Claude Code

#### Problem: Rust-based tauri-mcp doesn't work with Claude
- **Package:** `tauri-mcp` (crates.io, v0.1.4)
- **Issue:** The README states "Claude Desktop currently has compatibility issues with Rust-based MCP servers, causing immediate disconnections after initialization"
- **Symptoms:**
  - Server logs "Starting MCP server on 127.0.0.1:3000" but doesn't actually bind to the port
  - `/mcp` reconnect always fails

#### Solution: Use the Node.js npm package instead
- **Working package:** `@hypothesi/tauri-mcp-server` (npm, v0.7.0)
- **Install:** `npm install -g @hypothesi/tauri-mcp-server`
- **Binary location:** `/opt/homebrew/bin/mcp-server-tauri`

#### Configuration (`.mcp.json`)
```json
{
  "mcpServers": {
    "tauri-mcp": {
      "command": "/opt/homebrew/bin/mcp-server-tauri"
    }
  }
}
```

#### Important Notes
- Changes to `.mcp.json` require restarting Claude Code to take effect
- The npm package uses proper stdio transport (JSON-RPC 2.0)
- Verified working with manual test: responds correctly to MCP initialize message

### Lessons Learned
1. **Tauri 2.0 naming convention:** Always use camelCase in JS when calling Tauri commands, even if Rust uses snake_case
2. **Vue Map reactivity:** Always call `triggerRef()` after Map operations
3. **macOS keyboard events:** Use `event.code` for consistent key detection across platforms
4. **Rust MCP servers:** Claude Code/Desktop has compatibility issues with Rust-based MCP servers - use Node.js wrappers or native Node.js implementations instead

### MCP Bridge Plugin Setup (Later Session)

#### Problem: Could not connect to running Tauri app
- The `mcp-server-tauri` (npm package) was working, but couldn't connect to the app
- Reason: The app didn't have the MCP Bridge plugin installed

#### Solution: Install `tauri-plugin-mcp-bridge`
Added the plugin to enable WebSocket communication between Claude Code and the app.

**Files modified:**
1. `src-tauri/Cargo.toml` - Added dependency:
   ```toml
   tauri-plugin-mcp-bridge = "0.7"
   ```

2. `src-tauri/src/lib.rs` - Registered plugin (debug only):
   ```rust
   let mut builder = tauri::Builder::default()
       // ... other plugins ...

   #[cfg(debug_assertions)]
   {
       builder = builder.plugin(tauri_plugin_mcp_bridge::init());
   }

   builder.manage(...)  // continue building
   ```

3. `src-tauri/tauri.conf.json` - Added global Tauri API:
   ```json
   "app": {
     "withGlobalTauri": true,
     ...
   }
   ```

4. `src-tauri/capabilities/default.json` - Added permission:
   ```json
   "permissions": [
     ...
     "mcp-bridge:default"
   ]
   ```

#### Result
- App now shows: `[MCP][PLUGIN][INFO] MCP Bridge plugin initialized... on 0.0.0.0:9223`
- Claude Code can connect and:
  - Take screenshots
  - Read console logs
  - Interact with DOM elements
  - Execute IPC commands

---

## Template for New Entries

```markdown
## YYYY-MM-DD

### Session Summary
Brief description of what was worked on.

### Issues Fixed
- **Issue:** Description
  - **Root cause:** Why it happened
  - **Solution:** How it was fixed

### Features Added
- Feature description

### Files Modified
- List of files changed

### Lessons Learned
- Key takeaways
```
