import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_IDENTIFIER = "only-three-evening-reminder";
const DAILY_REMINDER_IDENTIFIER = "only-three-daily-reminder";

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requested.granted;
}

export async function cancelReminderNotification(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminder = scheduled.find((item) => item.identifier === REMINDER_IDENTIFIER);

  if (reminder) {
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
}

export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      console.log("[notifications] Badge count skipped - no permission");
      return;
    }
    await Notifications.setBadgeCountAsync(count);
    console.log("[notifications] Badge count set to", count);
  } catch (error) {
    console.log("[notifications] Failed to set badge count", error);
  }
}

export async function cancelDailyReminderNotification(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminder = scheduled.find((item) => item.identifier === DAILY_REMINDER_IDENTIFIER);

  if (reminder) {
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
}

export async function scheduleDailyReminderNotification(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return false;
  }

  await cancelDailyReminderNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_IDENTIFIER,
    content: {
      title: "Only Three",
      body: "Check in on your three tasks for today.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log("[notifications] Daily reminder scheduled", { hour, minute });
  return true;
}

export async function scheduleReminderNotification(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    return false;
  }

  await cancelReminderNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: "Only Three",
      body: "Tap here. Set your three tasks ready for tomorrow.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}
