/**
 * Pinia store for preset management.
 *
 * Handles saving, loading, and applying presets.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Preset, type PresetProps } from '@domain/presets';
import { StorageService, StorageKeys } from '@infrastructure/storage/localStorageService';

/**
 * Serializable preset data for storage.
 */
interface PresetStorageData {
  id: string;
  name: string;
  description?: string;
  sources: PresetProps['sources'];
  windows: PresetProps['windows'];
  theme?: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export const usePresetStore = defineStore('presets', () => {
  // State
  const presets = ref<Map<string, Preset>>(new Map());
  const activePresetId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const allPresets = computed(() => Array.from(presets.value.values()));
  const activePreset = computed(() =>
    activePresetId.value ? (presets.value.get(activePresetId.value) ?? null) : null
  );
  const presetCount = computed(() => presets.value.size);

  /**
   * Load presets from storage.
   */
  async function loadPresets(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      const stored = StorageService.get<PresetStorageData[]>(StorageKeys.PRESETS);
      if (stored && Array.isArray(stored)) {
        presets.value.clear();
        for (const data of stored) {
          const preset = Preset.create({
            id: data.id,
            name: data.name,
            description: data.description,
            sources: data.sources,
            windows: data.windows,
            theme: data.theme,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          });
          presets.value.set(preset.id, preset);
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load presets';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Save presets to storage.
   */
  function savePresets(): void {
    try {
      const data: PresetStorageData[] = Array.from(presets.value.values()).map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        sources: preset.sources,
        windows: preset.windows,
        theme: preset.theme,
        createdAt: preset.createdAt.toISOString(),
        updatedAt: preset.updatedAt.toISOString(),
      }));
      StorageService.set(StorageKeys.PRESETS, data);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save presets';
    }
  }

  /**
   * Create a new preset.
   */
  function createPreset(name: string): Preset {
    const preset = Preset.createEmpty(crypto.randomUUID(), name);
    presets.value.set(preset.id, preset);
    savePresets();
    return preset;
  }

  /**
   * Update an existing preset.
   */
  function updatePreset(preset: Preset): void {
    presets.value.set(preset.id, preset);
    savePresets();
  }

  /**
   * Delete a preset.
   */
  function deletePreset(presetId: string): void {
    presets.value.delete(presetId);
    if (activePresetId.value === presetId) {
      activePresetId.value = null;
    }
    savePresets();
  }

  /**
   * Set the active preset.
   */
  function setActivePreset(presetId: string | null): void {
    activePresetId.value = presetId;
  }

  /**
   * Get a preset by ID.
   */
  function getPreset(presetId: string): Preset | null {
    return presets.value.get(presetId) ?? null;
  }

  /**
   * Save current configuration as a new preset.
   */
  function saveCurrentAsPreset(
    name: string,
    sources: PresetProps['sources'],
    windows: PresetProps['windows']
  ): Preset {
    const preset = Preset.create({
      id: crypto.randomUUID(),
      name,
      sources,
      windows,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    presets.value.set(preset.id, preset);
    savePresets();
    return preset;
  }

  /**
   * Update an existing preset with current configuration.
   */
  function updatePresetConfiguration(
    presetId: string,
    sources: PresetProps['sources'],
    windows: PresetProps['windows']
  ): Preset | null {
    const existing = presets.value.get(presetId);
    if (!existing) return null;

    const updated = existing.withConfiguration(sources, windows);
    presets.value.set(presetId, updated);
    savePresets();
    return updated;
  }

  /**
   * Rename a preset.
   */
  function renamePreset(presetId: string, newName: string): Preset | null {
    const existing = presets.value.get(presetId);
    if (!existing) return null;

    const updated = existing.withName(newName);
    presets.value.set(presetId, updated);
    savePresets();
    return updated;
  }

  /**
   * Initialize the store.
   */
  async function initialize(): Promise<void> {
    await loadPresets();
  }

  return {
    // State
    presets,
    activePresetId,
    isLoading,
    error,

    // Computed
    allPresets,
    activePreset,
    presetCount,

    // Actions
    initialize,
    loadPresets,
    createPreset,
    updatePreset,
    deletePreset,
    setActivePreset,
    getPreset,
    saveCurrentAsPreset,
    updatePresetConfiguration,
    renamePreset,
  };
});
