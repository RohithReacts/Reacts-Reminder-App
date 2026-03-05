import {
  Poppins_400Regular,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { AlarmOverlay } from "@/components/AlarmOverlay";
import { initNotifications } from "@/lib/notifications";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { audioManager } from "../lib/audioManager";
import "./global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [alarmVisible, setAlarmVisible] = useState(false);
  const [currentTaskTitle, setCurrentTaskTitle] = useState("");
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize notifications
    initNotifications();

    // Foreground notification listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Notification] Received in foreground:", notification);
        const title = notification.request.content.body || "Task Reminder";
        setCurrentTaskTitle(title);
        setAlarmVisible(true);
        audioManager.playAlarm();
      });

    // Notification response listener (when user taps notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[Notification] Response received:", response);
        const title =
          response.notification.request.content.body || "Task Reminder";
        setCurrentTaskTitle(title);
        setAlarmVisible(true);
        audioManager.playAlarm();
      });

    if (loaded || error) {
      SplashScreen.hideAsync();
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [loaded, error]);

  const handleStopAlarm = async () => {
    await audioManager.stopAlarm();
    setAlarmVisible(false);
  };

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen
          name="(screens)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <AlarmOverlay
        isVisible={alarmVisible}
        taskTitle={currentTaskTitle}
        onStop={handleStopAlarm}
      />
    </SafeAreaProvider>
  );
}
