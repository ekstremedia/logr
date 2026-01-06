/**
 * WindowPosition value object representing a window's position on screen.
 */
export class WindowPosition {
  private constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a WindowPosition from coordinates.
   * @param x - The x coordinate
   * @param y - The y coordinate
   * @returns A new WindowPosition instance
   */
  static from(x: number, y: number): WindowPosition {
    return new WindowPosition(x, y);
  }

  /**
   * Creates a centered position (placeholder, actual centering done by window manager).
   * @returns A WindowPosition representing center
   */
  static center(): WindowPosition {
    return new WindowPosition(-1, -1);
  }

  /**
   * Checks if this represents a centered position.
   * @returns True if this is a center position
   */
  isCentered(): boolean {
    return this.x === -1 && this.y === -1;
  }

  /**
   * Creates a new position offset from this one.
   * @param dx - The x offset
   * @param dy - The y offset
   * @returns A new WindowPosition
   */
  offset(dx: number, dy: number): WindowPosition {
    return WindowPosition.from(this.x + dx, this.y + dy);
  }

  equals(other: WindowPosition): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toJSON(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
