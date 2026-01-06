import { WindowPosition } from '../value-objects/WindowPosition';
import { WindowSize } from '../value-objects/WindowSize';

export type WindowState = 'normal' | 'minimized' | 'maximized';

/**
 * Represents the configuration and state of a log viewer window.
 */
export interface LogWindowProps {
  id: string;
  label: string;
  sourceId: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  state: WindowState;
  index: number;
  isVisible: boolean;
  isFocused: boolean;
  notificationsEnabled: boolean;
}

/**
 * LogWindow entity representing a window that displays log entries.
 */
export class LogWindow {
  public readonly id: string;
  public readonly label: string;
  public readonly sourceId: string;
  public readonly title: string;
  public readonly position: WindowPosition;
  public readonly size: WindowSize;
  public readonly state: WindowState;
  public readonly index: number;
  public readonly isVisible: boolean;
  public readonly isFocused: boolean;
  public readonly notificationsEnabled: boolean;

  private constructor(props: LogWindowProps) {
    this.id = props.id;
    this.label = props.label;
    this.sourceId = props.sourceId;
    this.title = props.title;
    this.position = props.position;
    this.size = props.size;
    this.state = props.state;
    this.index = props.index;
    this.isVisible = props.isVisible;
    this.isFocused = props.isFocused;
    this.notificationsEnabled = props.notificationsEnabled;
    Object.freeze(this);
  }

  /**
   * Creates a new LogWindow.
   * @param props - The window properties
   * @returns A new LogWindow instance
   */
  static create(props: LogWindowProps): LogWindow {
    return new LogWindow(props);
  }

  /**
   * Creates a new LogWindow with default settings.
   * @param id - Unique identifier
   * @param sourceId - The log source ID this window displays
   * @param title - The window title
   * @param index - The window index (for Alt+N shortcuts)
   * @returns A new LogWindow instance
   */
  static createDefault(id: string, sourceId: string, title: string, index: number): LogWindow {
    return new LogWindow({
      id,
      label: `log-window-${id}`,
      sourceId,
      title,
      position: WindowPosition.center(),
      size: WindowSize.default(),
      state: 'normal',
      index,
      isVisible: true,
      isFocused: false,
      notificationsEnabled: true,
    });
  }

  /**
   * Creates a copy with updated position and size.
   * @param position - New position
   * @param size - New size
   * @returns A new LogWindow with updated geometry
   */
  withGeometry(position: WindowPosition, size: WindowSize): LogWindow {
    return new LogWindow({
      ...this.toProps(),
      position,
      size,
    });
  }

  /**
   * Creates a copy with updated state.
   * @param state - New window state
   * @returns A new LogWindow with updated state
   */
  withState(state: WindowState): LogWindow {
    return new LogWindow({
      ...this.toProps(),
      state,
    });
  }

  /**
   * Creates a copy with updated focus state.
   * @param isFocused - Whether the window is focused
   * @returns A new LogWindow with updated focus
   */
  withFocus(isFocused: boolean): LogWindow {
    return new LogWindow({
      ...this.toProps(),
      isFocused,
    });
  }

  /**
   * Creates a copy with toggled notifications.
   * @returns A new LogWindow with toggled notifications
   */
  toggleNotifications(): LogWindow {
    return new LogWindow({
      ...this.toProps(),
      notificationsEnabled: !this.notificationsEnabled,
    });
  }

  /**
   * Gets the keyboard shortcut for this window.
   * @returns The shortcut string (e.g., "Alt+1") or null if index > 9
   */
  get shortcut(): string | null {
    if (this.index >= 1 && this.index <= 9) {
      return `Alt+${this.index}`;
    }
    return null;
  }

  private toProps(): LogWindowProps {
    return {
      id: this.id,
      label: this.label,
      sourceId: this.sourceId,
      title: this.title,
      position: this.position,
      size: this.size,
      state: this.state,
      index: this.index,
      isVisible: this.isVisible,
      isFocused: this.isFocused,
      notificationsEnabled: this.notificationsEnabled,
    };
  }
}
