/**
 * WindowSize value object representing a window's dimensions.
 */
export class WindowSize {
  public static readonly MIN_WIDTH = 400;
  public static readonly MIN_HEIGHT = 300;
  public static readonly DEFAULT_WIDTH = 800;
  public static readonly DEFAULT_HEIGHT = 600;

  private constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a WindowSize from dimensions.
   * @param width - The width in pixels
   * @param height - The height in pixels
   * @returns A new WindowSize instance
   */
  static from(width: number, height: number): WindowSize {
    const validWidth = Math.max(width, WindowSize.MIN_WIDTH);
    const validHeight = Math.max(height, WindowSize.MIN_HEIGHT);
    return new WindowSize(validWidth, validHeight);
  }

  /**
   * Creates a default window size.
   * @returns A WindowSize with default dimensions
   */
  static default(): WindowSize {
    return WindowSize.from(WindowSize.DEFAULT_WIDTH, WindowSize.DEFAULT_HEIGHT);
  }

  /**
   * Scales this size by a factor.
   * @param factor - The scale factor
   * @returns A new WindowSize scaled by the factor
   */
  scale(factor: number): WindowSize {
    return WindowSize.from(this.width * factor, this.height * factor);
  }

  equals(other: WindowSize): boolean {
    return this.width === other.width && this.height === other.height;
  }

  toJSON(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
