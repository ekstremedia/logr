/**
 * PresetName value object for validated preset names.
 */
export class PresetName {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  /**
   * Creates a PresetName from a string.
   * @param name - The preset name
   * @throws Error if name is invalid
   */
  static from(name: string): PresetName {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new Error('Preset name cannot be empty');
    }

    if (trimmed.length > 50) {
      throw new Error('Preset name cannot exceed 50 characters');
    }

    if (!/^[\w\s-]+$/.test(trimmed)) {
      throw new Error('Preset name can only contain letters, numbers, spaces, and hyphens');
    }

    return new PresetName(trimmed);
  }

  /**
   * Attempts to create a PresetName, returning null if invalid.
   */
  static tryFrom(name: string): PresetName | null {
    try {
      return PresetName.from(name);
    } catch {
      return null;
    }
  }

  /**
   * Validates if a name would be valid.
   */
  static isValid(name: string): boolean {
    return PresetName.tryFrom(name) !== null;
  }

  equals(other: PresetName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
