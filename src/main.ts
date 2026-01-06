import { createApp, type Component } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import LogWindow from './LogWindow.vue';
import './assets/main.css';
import { WindowApi } from '@infrastructure/tauri';

/**
 * Get the source ID from URL query parameters.
 * Used when opening log windows with a specific source.
 */
function getSourceIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('sourceId');
}

/**
 * Determine which component to mount based on the current window.
 */
function getWindowComponent(): { component: Component; props: Record<string, unknown> } {
  const isLogWindow = WindowApi.isLogWindow();
  const sourceId = getSourceIdFromUrl() ?? WindowApi.getSourceIdFromWindow();

  if (isLogWindow && sourceId) {
    return {
      component: LogWindow,
      props: { sourceId },
    };
  }

  return {
    component: App,
    props: {},
  };
}

// Create the app with the appropriate component
const { component, props } = getWindowComponent();
const app = createApp(component, props);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
