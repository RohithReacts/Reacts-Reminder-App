import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// We use dynamic requiring to avoid side-effects in Expo Go that cause crashes in SDK 54+
const getNotifications = () => {
  // No longer returning null immediately, let's try-catch require
  // to support local notifications in Expo Go if possible.
  try {
    return require("expo-notifications");
  } catch (e) {
    console.error("Failed to load expo-notifications", e);
    return null;
  }
};

export const initNotifications = async () => {
  const Notifications = getNotifications();
  if (!Notifications) {
    if (isExpoGo) {
      console.warn(
        "Notifications are disabled in Expo Go to prevent crashes. Use a development build for notifications.",
      );
    }
    return;
  }

  // Request permissions on init
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== "granted") {
    await Notifications.requestPermissionsAsync();
  }

  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Create notification channel for Android (required for custom sounds)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("task-reminders-v5", {
      name: "Task Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "notification.mp3", // Use mp3 and include extension for consistency
    });
  }
};

export const scheduleTaskNotification = async (
  taskId: string,
  title: string,
  date: string,
  time: string,
) => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(taskId);

    // Robust date parsing (YYYY-MM-DD + HH:mm:ss)
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes, seconds_part] = time.split(":").map(Number);

    const triggerDate = new Date(year, month - 1, day, hours, minutes, 0);

    console.log(`[Notification] Scheduling for: ${triggerDate.toString()}`);

    if (triggerDate <= new Date()) {
      console.warn(
        `[Notification] Trigger date is in the past: ${triggerDate.toString()}`,
      );
      return;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: taskId,
      content: {
        title: "Task Reminder",
        body: title,
        sound: "notification.mp3",
        data: { taskId, scheduledTime: triggerDate.getTime() },
        android: {
          channelId: "task-reminders-v5",
          sound: true, // `true` triggers the default sound or the channel sound
        },
      },
      trigger: {
        type: "date",
        date: triggerDate,
        channelId: "task-reminders-v5",
      },
    });
    console.log(`[Notification] Successfully scheduled: ${identifier}`);
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
};

export const getScheduledNotifications = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return [];

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return [];

    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};

export const cancelNotification = async (taskId: string) => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

export const testNotification8Seconds = async () => {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 8);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "Checking if sound works after 8 seconds!",
        sound: "notification.mp3",
        android: {
          channelId: "task-reminders-v5",
          sound: true,
        },
      },
      trigger: {
        type: "date",
        date: triggerDate,
        channelId: "task-reminders-v5",
      },
    });
    console.log(`[Notification] Test manually scheduled for 8s: ${identifier}`);
  } catch (error) {
    console.error("Error scheduling test notification:", error);
  }
};
