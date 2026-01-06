/**
 * Theme composable for managing the application's theme state.
 *
 * Handles theme persistence, system preference detection, and DOM updates.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Theme, type ThemeMode, type ResolvedTheme } from '@domain/settings';

const STORAGE_KEY = 'logr-theme';

/**
 * Detects if the system prefers dark mode.
 * @returns true if system prefers dark mode
 */
function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Updates the DOM to reflect the current theme.
 * @param resolvedTheme - The theme to apply ('light' or 'dark')
 */
function applyThemeToDOM(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Loads the saved theme from storage.
 * @returns The saved Theme or default if not found
 */
function loadThemeFromStorage(): Theme {
  if (typeof localStorage === 'undefined') return Theme.default();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return Theme.from(saved as ThemeMode);
    }
  } catch {
    // localStorage might not be available
  }
  return Theme.default();
}

/**
 * Saves the theme to storage.
 * @param theme - The theme to save
 */
function saveThemeToStorage(theme: Theme): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, theme.mode);
  } catch {
    // localStorage might not be available
  }
}

// Shared state across all instances
const theme = ref<Theme>(loadThemeFromStorage());
const systemPrefersDark = ref(getSystemPrefersDark());

/**
 * Composable for managing application theme.
 *
 * @example
 * ```ts
 * const { theme, resolvedTheme, setTheme, cycleTheme, isDark } = useTheme();
 *
 * // Toggle between themes
 * cycleTheme();
 *
 * // Set specific theme
 * setTheme('light');
 *
 * // Check current state
 * if (isDark.value) {
 *   console.log('Dark mode active');
 * }
 * ```
 */
export function useTheme() {
  // Computed values
  const resolvedTheme = computed<ResolvedTheme>(() => {
    return theme.value.resolve(systemPrefersDark.value);
  });

  const isDark = computed(() => resolvedTheme.value === 'dark');
  const isLight = computed(() => resolvedTheme.value === 'light');
  const isSystemMode = computed(() => theme.value.isSystem());
  const themeLabel = computed(() => theme.value.label);

  // Actions
  function setTheme(mode: ThemeMode): void {
    theme.value = Theme.from(mode);
    saveThemeToStorage(theme.value);
  }

  function cycleTheme(): void {
    theme.value = theme.value.cycle();
    saveThemeToStorage(theme.value);
  }

  function setDark(): void {
    setTheme('dark');
  }

  function setLight(): void {
    setTheme('light');
  }

  function setSystem(): void {
    setTheme('system');
  }

  // Watch for theme changes and update DOM
  watch(
    resolvedTheme,
    newTheme => {
      applyThemeToDOM(newTheme);
    },
    { immediate: true }
  );

  // Listen for system preference changes
  let mediaQuery: MediaQueryList | null = null;

  function handleSystemChange(event: MediaQueryListEvent): void {
    systemPrefersDark.value = event.matches;
  }

  onMounted(() => {
    if (typeof window === 'undefined') return;

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemChange);

    // Apply theme on mount
    applyThemeToDOM(resolvedTheme.value);
  });

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemChange);
    }
  });

  return {
    // State
    theme: computed(() => theme.value),
    mode: computed(() => theme.value.mode),
    resolvedTheme,
    systemPrefersDark: computed(() => systemPrefersDark.value),

    // Computed flags
    isDark,
    isLight,
    isSystemMode,
    themeLabel,

    // Actions
    setTheme,
    cycleTheme,
    setDark,
    setLight,
    setSystem,
  };
}
