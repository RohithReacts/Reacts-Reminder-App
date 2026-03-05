import {
  cancelNotification,
  getScheduledNotifications,
} from "@/lib/notifications";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const itemWidth = isTablet ? (width - 64) / 2 : width - 40;

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await getScheduledNotifications();
      // If we got null or empty, check if it's due to permissions
      const Notifications = require("expo-notifications");
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === "granted");

      const sorted = list.sort((a: any, b: any) => {
        const getNotifTime = (n: any) => {
          if (n.content.data?.scheduledTime)
            return n.content.data.scheduledTime;
          if (n.trigger?.date) return new Date(n.trigger.date).getTime();
          if (n.trigger?.type === "timeInterval" || n.trigger?.seconds) {
            return Date.now() + (n.trigger.seconds || 0) * 1000;
          }
          return 0;
        };
        return getNotifTime(a) - getNotifTime(b);
      });
      setNotifications(sorted);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Cancel Reminder",
      "Are you sure you want to cancel this notification?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            await cancelNotification(id);
            await fetchNotifications();
          },
        },
      ],
    );
  };

  const formatTrigger = (notif: any) => {
    const trigger = notif.trigger;
    const data = notif.content.data;

    let date: Date;

    if (data?.scheduledTime) {
      date = new Date(data.scheduledTime);
    } else if (trigger?.date) {
      date = new Date(trigger.date);
    } else if (trigger?.type === "timeInterval" || trigger?.seconds) {
      date = new Date(Date.now() + (trigger.seconds || 0) * 1000);
    } else {
      return "Scheduled";
    }

    return date.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Task Reminders</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onRefresh}
            className="p-2 bg-blue-50 rounded-full"
          >
            <Ionicons name="refresh" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
          />
        }
      >
        {!permissionGranted ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="lock-closed-outline" size={80} color="#EF4444" />
            <Text className="text-gray-900 mt-4 text-lg font-bold">
              Notifications Disabled
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-10 leading-6">
              Please enable notification permissions in your device settings to
              see and receive task reminders.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                const Notifications = require("expo-notifications");
                await Notifications.requestPermissionsAsync();
                fetchNotifications();
              }}
              className="mt-6 px-6 py-3 bg-blue-600 rounded-2xl"
            >
              <Text className="text-white font-bold">Request Permissions</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center opacity-40 py-20">
            <Ionicons
              name="notifications-off-outline"
              size={80}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 mt-4 text-lg font-medium">
              No active reminders
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-10 leading-6">
              Create a task with a due date and time to receive sound
              notifications and see them here.
              {"\n"}Note: Custom sounds only work in the actual app build.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {notifications.map((notif) => (
              <View
                key={notif.identifier}
                className={`bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 ${isTablet ? "w-[48%]" : "w-full"}`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                      <View className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      <Text className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                        Scheduled
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {notif.content.body || "Task Reminder"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-500 ml-1 text-sm">
                        {formatTrigger(notif)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(notif.identifier)}
                    className="p-2 bg-red-50 rounded-xl"
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {notif.content.title !== "Task Reminder" && (
                  <Text className="text-xs text-gray-400 mt-3 italic">
                    Category: {notif.content.title}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
