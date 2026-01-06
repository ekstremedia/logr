/**
 * Notifications composable for managing log entry notifications.
 *
 * Uses the browser Notification API for desktop notifications.
 */
import { ref, computed } from 'vue';
import { NotificationConfig, type NotificationLevelType } from '@domain/notifications';

// Shared state
const configs = ref<Map<string, NotificationConfig>>(new Map());
const unreadCounts = ref<Map<string, number>>(new Map());
const permissionStatus = ref<NotificationPermission>('default');

/**
 * Request notification permission from the browser.
 */
async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    permissionStatus.value = 'granted';
    return true;
  }

  if (Notification.permission === 'denied') {
    permissionStatus.value = 'denied';
    return false;
  }

  const permission = await Notification.requestPermission();
  permissionStatus.value = permission;
  return permission === 'granted';
}

/**
 * Show a notification.
 */
function showNotification(title: string, body: string, onClick?: () => void): void {
  if (permissionStatus.value !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/logr.svg',
    tag: 'logr-notification',
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
    };
  }

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);
}

/**
 * Composable for notification management.
 */
export function useNotifications() {
  const hasPermission = computed(() => permissionStatus.value === 'granted');
  const canRequest = computed(() => permissionStatus.value === 'default');

  /**
   * Get notification config for a source.
   */
  function getConfig(sourceId: string): NotificationConfig {
    let config = configs.value.get(sourceId);
    if (!config) {
      config = NotificationConfig.defaultFor(sourceId);
      configs.value.set(sourceId, config);
    }
    return config;
  }

  /**
   * Update notification config for a source.
   */
  function setConfig(sourceId: string, config: NotificationConfig): void {
    configs.value.set(sourceId, config);
  }

  /**
   * Toggle notifications for a source.
   */
  function toggleNotifications(sourceId: string): void {
    const config = getConfig(sourceId);
    configs.value.set(sourceId, config.toggleEnabled());
  }

  /**
   * Toggle sound for a source.
   */
  function toggleSound(sourceId: string): void {
    const config = getConfig(sourceId);
    configs.value.set(sourceId, config.toggleSound());
  }

  /**
   * Set notification level for a source.
   */
  function setLevel(sourceId: string, level: NotificationLevelType): void {
    const config = getConfig(sourceId);
    configs.value.set(sourceId, config.withLevel(level));
  }

  /**
   * Set keyword filter for a source.
   */
  function setKeywordFilter(sourceId: string, filter: string | null): void {
    const config = getConfig(sourceId);
    configs.value.set(sourceId, config.withKeywordFilter(filter));
  }

  /**
   * Check if a log entry should trigger a notification.
   */
  function shouldNotify(sourceId: string, level: string, message: string): boolean {
    const config = getConfig(sourceId);
    return config.shouldNotify(level, message);
  }

  /**
   * Notify about a log entry if appropriate.
   */
  function notifyIfNeeded(
    sourceId: string,
    sourceName: string,
    level: string,
    message: string,
    onClick?: () => void
  ): void {
    if (!shouldNotify(sourceId, level, message)) return;

    // Increment unread count
    const currentCount = unreadCounts.value.get(sourceId) ?? 0;
    unreadCounts.value.set(sourceId, currentCount + 1);

    // Show notification if window is not focused
    if (!document.hasFocus()) {
      const title = `${sourceName} - ${level.toUpperCase()}`;
      const body = message.length > 100 ? message.slice(0, 100) + '...' : message;
      showNotification(title, body, onClick);
    }
  }

  /**
   * Get unread count for a source.
   */
  function getUnreadCount(sourceId: string): number {
    return unreadCounts.value.get(sourceId) ?? 0;
  }

  /**
   * Get total unread count across all sources.
   */
  const totalUnread = computed(() => {
    let total = 0;
    for (const count of unreadCounts.value.values()) {
      total += count;
    }
    return total;
  });

  /**
   * Mark source as read.
   */
  function markAsRead(sourceId: string): void {
    unreadCounts.value.set(sourceId, 0);
  }

  /**
   * Mark all sources as read.
   */
  function markAllAsRead(): void {
    for (const sourceId of unreadCounts.value.keys()) {
      unreadCounts.value.set(sourceId, 0);
    }
  }

  /**
   * Initialize - request permission on startup.
   */
  async function initialize(): Promise<void> {
    if ('Notification' in window) {
      permissionStatus.value = Notification.permission;
    }
  }

  return {
    // State
    hasPermission,
    canRequest,
    permissionStatus: computed(() => permissionStatus.value),
    totalUnread,

    // Config management
    getConfig,
    setConfig,
    toggleNotifications,
    toggleSound,
    setLevel,
    setKeywordFilter,

    // Notification actions
    requestPermission,
    shouldNotify,
    notifyIfNeeded,

    // Unread management
    getUnreadCount,
    markAsRead,
    markAllAsRead,

    // Lifecycle
    initialize,
  };
}
