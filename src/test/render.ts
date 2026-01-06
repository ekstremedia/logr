import { render } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import type { Component } from 'vue';

/**
 * Renders a component with all necessary providers for testing.
 * @param component - The Vue component to render
 * @param options - Additional render options
 * @returns The render result
 */
export function renderWithProviders(
  component: Component,
  options: {
    props?: Record<string, unknown>;
    slots?: Record<string, unknown>;
    global?: Record<string, unknown>;
  } = {}
) {
  const pinia = createPinia();
  setActivePinia(pinia);

  return render(component, {
    ...options,
    global: {
      plugins: [pinia],
      ...options.global,
    },
  });
}
