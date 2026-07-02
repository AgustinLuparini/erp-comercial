export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: number;
}

type NotificationListener = (notification: NotificationItem) => void;
const listeners = new Set<NotificationListener>();
let lastNotificationSignature = '';
let lastNotificationAt = 0;

export const pushNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => {
  const signature = `${notification.severity}|${notification.title}|${notification.message}`;
  const now = Date.now();

  // Evita duplicados idénticos disparados casi al mismo tiempo.
  if (signature === lastNotificationSignature && now - lastNotificationAt < 1500) {
    return null;
  }

  const item: NotificationItem = {
    ...notification,
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`,
    createdAt: now
  };

  lastNotificationSignature = signature;
  lastNotificationAt = now;

  listeners.forEach((listener) => listener(item));
  return item;
};

export const subscribeNotifications = (listener: NotificationListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
