/**
 * Local notification service
 * Schedules all due reminders and budget alerts using expo-notifications.
 * No push server — all notifications are local / device-only.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationType } from '../constants/enums';

// Configure foreground behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

// ─── Permission ──────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('dues', {
      name: 'Payment Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('budget', {
      name: 'Budget Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

/**
 * Schedule a "due soon" notification N days before the due date.
 */
export async function scheduleDueSoonNotification(
  entryId: number,
  name: string,
  amount: number | null,
  dueDate: Date,
  leadDays: number
): Promise<string | null> {
  const triggerDate = new Date(dueDate);
  triggerDate.setDate(triggerDate.getDate() - leadDays);
  triggerDate.setHours(9, 0, 0, 0); // 9 AM

  if (triggerDate <= new Date()) return null; // already past

  const amountStr = amount ? `₹${amount.toLocaleString('en-IN')}` : '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ Payment due in ${leadDays} day${leadDays > 1 ? 's' : ''}`,
      body: `${name}${amountStr ? ' — ' + amountStr : ''} is due on ${dueDate.toLocaleDateString('en-IN')}`,
      data: { type: NotificationType.DUE_SOON, entryId },
      // @ts-ignore
      channelId: 'dues',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return id;
}

/**
 * Schedule a "due today" notification on the due date.
 */
export async function scheduleDueTodayNotification(
  entryId: number,
  name: string,
  amount: number | null,
  dueDate: Date
): Promise<string | null> {
  const triggerDate = new Date(dueDate);
  triggerDate.setHours(8, 0, 0, 0); // 8 AM on due date

  if (triggerDate <= new Date()) return null;

  const amountStr = amount ? `₹${amount.toLocaleString('en-IN')}` : '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔴 Payment due today`,
      body: `${name}${amountStr ? ' — ' + amountStr : ''} is due today. Tap to mark as paid.`,
      data: { type: NotificationType.DUE_TODAY, entryId },
      // @ts-ignore
      channelId: 'dues',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return id;
}

/**
 * Schedule an overdue notification 1 day after the due date.
 */
export async function scheduleOverdueNotification(
  entryId: number,
  name: string,
  dueDate: Date
): Promise<string | null> {
  const triggerDate = new Date(dueDate);
  triggerDate.setDate(triggerDate.getDate() + 1);
  triggerDate.setHours(9, 0, 0, 0);

  if (triggerDate <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ Payment Overdue`,
      body: `${name} was due on ${dueDate.toLocaleDateString('en-IN')} and is still unpaid.`,
      data: { type: NotificationType.OVERDUE, entryId },
      // @ts-ignore
      channelId: 'dues',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return id;
}

/**
 * Send an immediate budget warning notification.
 */
export async function sendBudgetWarningNotification(
  budgetId: number,
  categoryName: string,
  pct: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💸 Budget Alert`,
      body: `You've used ${pct}% of your ${categoryName} budget this month.`,
      data: { type: NotificationType.BUDGET_WARNING, budgetId },
      // @ts-ignore
      channelId: 'budget',
    },
    trigger: null, // immediate
  });
}

/**
 * Send an immediate budget exceeded notification.
 */
export async function sendBudgetExceededNotification(
  budgetId: number,
  categoryName: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 Budget Exceeded`,
      body: `Your ${categoryName} budget has been exceeded this month!`,
      data: { type: NotificationType.BUDGET_EXCEEDED, budgetId },
      // @ts-ignore
      channelId: 'budget',
    },
    trigger: null,
  });
}

/**
 * Cancel a previously scheduled notification by ID.
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
