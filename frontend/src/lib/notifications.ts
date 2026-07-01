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

export const pushNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => {
  const item: NotificationItem = {
    ...notification,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now()
  };

  listeners.forEach((listener) => listener(item));
  return item;
};

export const subscribeNotifications = (listener: NotificationListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
