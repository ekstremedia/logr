/**
 * FilePath value object representing a file system path.
 * Provides utilities for path manipulation and validation.
 */
export class FilePath {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('FilePath cannot be empty');
    }
    Object.freeze(this);
  }

  /**
   * Creates a FilePath from a string.
   * @param path - The file path string
   * @returns A new FilePath instance
   * @throws Error if the path is empty
   */
  static from(path: string | unknown): FilePath {
    if (typeof path !== 'string') {
      throw new Error('FilePath must be a string');
    }
    return new FilePath(path.trim());
  }

  /**
   * Gets the file name from the path.
   * @returns The file name including extension
   */
  get fileName(): string {
    const parts = this.value.split(/[/\\]/);
    return parts[parts.length - 1] || '';
  }

  /**
   * Gets the file extension.
   * @returns The file extension without the dot, or empty string if none
   */
  get extension(): string {
    const name = this.fileName;
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(lastDot + 1) : '';
  }

  /**
   * Gets the directory containing this file.
   * @returns The parent directory path
   */
  get directory(): string {
    const lastSeparator = Math.max(this.value.lastIndexOf('/'), this.value.lastIndexOf('\\'));
    return lastSeparator > 0 ? this.value.substring(0, lastSeparator) : '';
  }

  /**
   * Gets the file name without extension.
   * @returns The base name without extension
   */
  get baseName(): string {
    const name = this.fileName;
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(0, lastDot) : name;
  }

  /**
   * Checks if this path has a log file extension.
   * @returns True if the file appears to be a log file
   */
  isLogFile(): boolean {
    const logExtensions = ['log', 'txt', 'out', 'err'];
    return logExtensions.includes(this.extension.toLowerCase());
  }

  /**
   * Checks if this path matches the Laravel daily log pattern.
   * @returns True if the file matches laravel-YYYY-MM-DD.log pattern
   */
  isLaravelDailyLog(): boolean {
    return /laravel-\d{4}-\d{2}-\d{2}\.log$/.test(this.fileName);
  }

  /**
   * Checks equality with another FilePath.
   * @param other - The path to compare against
   * @returns True if the paths are equal
   */
  equals(other: FilePath): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
