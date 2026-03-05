import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import SuccessModal from "@/components/SuccessModal";
import TaskModal from "@/components/TaskModal";
import { deleteTask, getTasks, Task } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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

// Native helpers to replace date-fns
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isTaskOnDay = (taskDateStr: string | null, selectedDate: Date) => {
  if (!taskDateStr) return false;
  // Parse YYYY-MM-DD manually to avoid UTC shifts
  const [year, month, day] = taskDateStr.split("-").map(Number);
  return (
    year === selectedDate.getFullYear() &&
    month - 1 === selectedDate.getMonth() &&
    day === selectedDate.getDate()
  );
};

const formatDay = (date: Date) => date.getDate().toString().padStart(2, "0");
const formatWeekday = (date: Date) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
const formatMonthYear = (date: Date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Task interface moved to lib/storage.ts

export default function ScheduleScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const fetchTasks = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getTasks();

      // Sort: by due_time ascending
      const sortedData = [...data].sort((a, b) => {
        if (!a.due_time) return 1;
        if (!b.due_time) return -1;
        return a.due_time.localeCompare(b.due_time);
      });

      setTasks(sortedData);
    } catch (error: any) {
      console.error("Error fetching tasks:", error.message);
      Alert.alert("Error", "Could not load tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks(true);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete);
      fetchTasks();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  // Generate days for the selector
  const days = Array.from({ length: 14 }).map((_, i) =>
    addDays(startOfToday(), i),
  );

  // Timeline slots (7 AM to 11 PM)
  const timeSlots: string[] = [];
  for (let i = 7; i <= 23; i++) {
    timeSlots.push(`${i.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${i.toString().padStart(2, "0")}:30`);
  }

  const formatDisplayTime = (time: string | null) => {
    if (!time) return "12:00 AM";
    const [hours, minutes] = time.split(":");
    const hourInt = parseInt(hours);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const renderTimelineSlot = (time: string, nextTime: string | null) => {
    const tasksAtTime = tasks.filter((t) => {
      if (!isTaskOnDay(t.due_date, selectedDate)) return false;

      const taskTime = t.due_time?.substring(0, 5); // "HH:mm"
      if (!taskTime) return false;

      // Match tasks that start at or after this time, but before the next time slot
      if (!nextTime) {
        return taskTime >= time;
      }
      return taskTime >= time && taskTime < nextTime;
    });

    return (
      <View key={time} className="flex-row items-start mb-10 relative">
        {/* Connection Line */}
        {nextTime && (
          <View
            className="absolute left-[39px] top-6 w-[2px] h-[70px] bg-gray-100"
            style={{ zIndex: -1 }}
          />
        )}

        <View className="w-20 pt-1">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">
            {formatDisplayTime(time)}
          </Text>
        </View>

        <View className="flex-1 relative min-h-[60px] gap-y-4">
          {tasksAtTime.map((task) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => {
                setEditingTask(task);
                setOpen(true);
              }}
              activeOpacity={0.8}
              className="bg-white rounded-2xl flex-row items-center p-3 shadow-md border-l-4"
              style={{
                borderLeftColor: task.color || "#2563EB",
                minWidth: 200,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: (task.color || "#2563EB") + "15" }}
              >
                <Ionicons
                  name={task.category === "Teams" ? "people" : "person"}
                  size={18}
                  color={task.color || "#2563EB"}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-gray-900 font-bold text-sm mb-0.5"
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={10} color="#9CA3AF" />
                  <Text className="text-[10px] text-gray-400 font-medium ml-1">
                    {task.due_time?.substring(0, 5)}
                  </Text>
                </View>
              </View>
              <View className="ml-2">
                <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Schedule</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
      >
        {/* Date Selector */}
        <View className="px-6 py-4">
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900 mr-2">
              {formatMonthYear(selectedDate)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#374151" />
          </View>
          <Text className="text-gray-400 mb-6">
            you have total{" "}
            {tasks.filter((t) => isTaskOnDay(t.due_date, selectedDate)).length}{" "}
            tasks today
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {days.map((day, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedDate(day)}
                className={`w-16 h-24 rounded-2xl items-center justify-center mr-4 border ${isSameDay(day, selectedDate) ? "bg-blue-600 border-blue-600 shadow-lg" : "bg-gray-50 border-gray-100"}`}
              >
                <Text
                  className={`text-lg font-bold mb-1 ${isSameDay(day, selectedDate) ? "text-white" : "text-gray-900"}`}
                >
                  {formatDay(day)}
                </Text>
                <Text
                  className={`text-sm font-medium ${isSameDay(day, selectedDate) ? "text-white/80" : "text-gray-400"}`}
                >
                  {formatWeekday(day)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timeline */}
        <View className="px-6 py-4">
          <Text className="text-xl font-bold text-gray-900 mb-8">Timeline</Text>
          {timeSlots.map((time, index) =>
            renderTimelineSlot(time, timeSlots[index + 1] || null),
          )}
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Modals */}
      <TaskModal
        visible={open}
        task={editingTask}
        onClose={() => {
          setOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          fetchTasks();
        }}
        onTaskCreated={() => {
          setShowSuccessModal(true);
        }}
        onDelete={(taskId) => {
          setTaskToDelete(taskId);
          setShowDeleteModal(true);
        }}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <DeleteConfirmationModal
        visible={showDeleteModal}
        loading={isDeleting}
        onClose={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}
