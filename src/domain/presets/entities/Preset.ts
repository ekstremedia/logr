import type { LogSourceProps } from '@domain/log-watching';
import type { LogWindowProps } from '@domain/window-manager';

/**
 * Represents a saved preset/profile configuration.
 */
export interface PresetProps {
  id: string;
  name: string;
  description?: string;
  sources: LogSourceProps[];
  windows: LogWindowProps[];
  theme?: 'light' | 'dark' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preset entity representing a saved configuration of log sources and windows.
 */
export class Preset {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly sources: LogSourceProps[];
  public readonly windows: LogWindowProps[];
  public readonly theme: 'light' | 'dark' | 'system';
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: PresetProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? '';
    this.sources = props.sources;
    this.windows = props.windows;
    this.theme = props.theme ?? 'system';
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  /**
   * Creates a new Preset.
   * @param props - The preset properties
   * @returns A new Preset instance
   */
  static create(props: PresetProps): Preset {
    return new Preset(props);
  }

  /**
   * Creates an empty preset with just a name.
   * @param id - Unique identifier
   * @param name - Preset name
   * @returns A new empty Preset instance
   */
  static createEmpty(id: string, name: string): Preset {
    const now = new Date();
    return new Preset({
      id,
      name,
      sources: [],
      windows: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Creates a copy with updated name.
   * @param name - New name
   * @returns A new Preset with updated name
   */
  withName(name: string): Preset {
    return new Preset({
      ...this.toProps(),
      name,
      updatedAt: new Date(),
    });
  }

  /**
   * Creates a copy with updated sources and windows.
   * @param sources - New sources
   * @param windows - New windows
   * @returns A new Preset with updated configuration
   */
  withConfiguration(sources: LogSourceProps[], windows: LogWindowProps[]): Preset {
    return new Preset({
      ...this.toProps(),
      sources,
      windows,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if this preset is empty.
   * @returns True if no sources are configured
   */
  isEmpty(): boolean {
    return this.sources.length === 0;
  }

  toProps(): PresetProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      sources: this.sources,
      windows: this.windows,
      theme: this.theme,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
