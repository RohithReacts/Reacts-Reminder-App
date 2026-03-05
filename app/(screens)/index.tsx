import Avatar from "@/components/Avatar";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import SuccessModal from "@/components/SuccessModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskModal from "@/components/TaskModal";
import { deleteTask, getTasks, Task, updateTask } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Task interface moved to lib/storage.ts

const CircularProgress = ({
  progress,
  size = 40,
  color = "#2563EB",
}: {
  progress: number;
  size?: number;
  color?: string;
}) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View className="absolute items-center justify-center">
        <Text className="text-[10px] font-bold text-gray-700">{progress}%</Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* SVG-like circular stroke using multiple views or just a simple container for now if SVG is not available */}
        {/* Since react-native-svg might not be installed, I'll use a simplified version with border styling if possible, or just a text fallback */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: "#E5E7EB",
            position: "absolute",
          }}
        />
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: color,
            borderTopColor: "transparent",
            borderRightColor: progress > 25 ? color : "transparent",
            borderBottomColor: progress > 50 ? color : "transparent",
            borderLeftColor: progress > 75 ? color : "transparent",
          }}
        />
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const cardWidth = isTablet ? (width - 60) / 2 : Math.min(width * 0.85, 320);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const fetchTasks = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getTasks();

      // Sort: incomplete first, then by created_at descending
      const sortedData = [...data].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      console.log("Fetched tasks count:", sortedData.length);
      setTasks(sortedData);
    } catch (error: any) {
      console.error("Error fetching tasks:", error.message);
      Alert.alert("Fetch Error", "Could not load tasks: " + error.message);
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

  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || !task.due_time) return false;

    const [hours, minutes] = task.due_time.split(":").map(Number);
    const taskDateTime = new Date(task.due_date);
    taskDateTime.setHours(hours, minutes, 0, 0);

    return new Date() > taskDateTime;
  };

  const isTaskDone = (task: Task) => task.completed || isTaskOverdue(task);

  const isTaskOnDay = (taskDateStr: string | null, selectedDate: Date) => {
    if (!taskDateStr) return false;
    const [year, month, day] = taskDateStr.split("-").map(Number);
    return (
      year === selectedDate.getFullYear() &&
      month - 1 === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  const formatDisplayTime = (time: string | null) => {
    if (!time) return "12:00 AM";
    const [hours, minutes] = time.split(":");
    const hourInt = parseInt(hours);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning,";
    if (hour >= 12 && hour < 17) return "Good Afternoon,";
    if (hour >= 17 && hour < 21) return "Good Evening,";
    return "Good Night,";
  };

  // Timeline slots (7 AM to 11 PM)
  const timeSlots: string[] = [];
  for (let i = 7; i <= 23; i++) {
    timeSlots.push(`${i.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${i.toString().padStart(2, "0")}:30`);
  }

  const renderTimelineSlot = (time: string, nextTime: string | null) => {
    const today = new Date();
    const tasksAtTime = tasks.filter((t) => {
      if (!isTaskOnDay(t.due_date, today)) return false;

      const taskTime = t.due_time?.substring(0, 5); // "HH:mm"
      if (!taskTime) return false;

      if (!nextTime) {
        return taskTime >= time;
      }
      return taskTime >= time && taskTime < nextTime;
    });

    if (tasksAtTime.length === 0) return null;

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
                setShowDetailModal(true);
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

  const toggleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      fetchTasks();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

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

  const renderTaskItem = ({ item }: { item: Task }) => {
    const cardColor = item.color || "#FEF3C7"; // Default yellow-ish like in the screenshot
    const progress = item.progress || 0;

    return (
      <TouchableOpacity
        onPress={() => {
          setEditingTask(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
        className={`bg-white rounded-[24px] mb-6 overflow-hidden shadow-sm border border-gray-100 ${isTaskDone(item) ? "opacity-60" : ""}`}
        style={{ width: cardWidth, marginRight: 16 }}
      >
        <View className="p-5">
          {/* Header: Title and Date */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 leading-6 mb-1">
                {item.title}
              </Text>
              <Text className="text-gray-400 text-xs font-medium">
                {item.due_date || "Today"} •{" "}
                {item.due_time?.substring(0, 5) || "All Day"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: cardColor + "40" }}
              >
                <Ionicons
                  name={item.category === "Teams" ? "people" : "person"}
                  size={20}
                  color={item.color || "#D97706"}
                />
              </View>
            </View>
          </View>

          <View className="h-1px bg-gray-100 w-full mb-4" />

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold mb-1">
              Description :
            </Text>
            <Text className="text-gray-600 text-sm leading-5" numberOfLines={2}>
              {item.description || "No description provided."}
            </Text>
          </View>

          {/* Teams and Progress row */}
          <View className="flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-gray-400 text-xs font-semibold mb-2">
                Teams :
              </Text>
              <View className="flex-row">
                {[
                  require("../../assets/images/avatar1.jpg"),
                  require("../../assets/images/avatar2.jpg"),
                  require("../../assets/images/avatar3.jpg"),
                  require("../../assets/images/rohith.png"),
                ].map((avatarImg, i) => (
                  <View
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-200"
                  >
                    <Avatar localImage={avatarImg} size={28} />
                  </View>
                ))}
                <TouchableOpacity className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white -ml-2 items-center justify-center">
                  <Ionicons name="add" size={14} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-gray-400 text-xs font-semibold mb-2">
                Progress :
              </Text>
              <View className="flex-row items-center">
                <CircularProgress
                  progress={progress}
                  color={item.color || "#2563EB"}
                />
              </View>
            </View>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: item.color || "#2563EB" }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      edges={["top"]}
    >
      <StatusBar style="auto" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-5">
        <View className="flex-row items-center">
          <Avatar
            localImage={require("../../assets/images/rohith.png")}
            size={50}
          />
          <View className="ml-3">
            <Text className="text-sm text-gray-500 font-poppins-regular">
              {getGreeting()}
            </Text>
            <Text className="text-xl font-bold text-gray-900 font-poppins-bold">
              Rohith Kumar
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm"
          >
            <Ionicons name="notifications-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/schedule")}
            className="bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm"
          >
            <Ionicons name="calendar-number" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task List Section */}
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
            title="Updating your tasks..."
            titleColor="#2563EB"
          />
        }
      >
        {tasks.filter((t) => !isTaskDone(t)).length > 0 && (
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-xl font-bold text-gray-900 font-poppins-bold">
              On Progress{" "}
              <Text className="text-white font-poppins-bold">
                ({tasks.filter((t) => !isTaskDone(t)).length})
              </Text>
            </Text>
            <TouchableOpacity onPress={() => router.push("/all-tasks")}>
              <Text className="text-blue-600 font-bold">View More</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : tasks.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Image
              source={require("../../assets/images/clock.jpg")}
              style={{
                width: width * 0.6,
                height: width * 0.6,
                borderRadius: 30,
              }}
              resizeMode="cover"
            />
            <Text className="text-gray-400 mt-6 font-poppins-medium text-center text-lg">
              Time to relax! No tasks for today.
            </Text>
          </View>
        ) : (
          <View>
            <FlatList
              data={tasks.filter((t) => !isTaskDone(t))}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />

            {/* Daily Schedule Timeline */}
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900 font-poppins-bold">
                  Daily Schedule
                </Text>
              </View>
              <View className="pl-2">
                {timeSlots.map((time, index) =>
                  renderTimelineSlot(time, timeSlots[index + 1] || null),
                )}
                {tasks.filter((t) => isTaskOnDay(t.due_date, new Date()))
                  .length === 0 && (
                  <View className="bg-blue-50/50 p-6 rounded-3xl border border-dashed border-blue-200 items-center justify-center mb-6">
                    <Ionicons
                      name="calendar-outline"
                      size={32}
                      color="#93C5FD"
                    />
                    <Text className="text-blue-400 font-medium mt-2">
                      No events scheduled for today
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Completed section */}
            <View className="mt-8 pb-10">
              <Text className="text-xl font-bold text-gray-900 mb-4 font-poppins-bold">
                Completed ({tasks.filter((t) => isTaskDone(t)).length})
              </Text>
              {tasks.filter((t) => isTaskDone(t)).length === 0 ? (
                <View className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 items-center justify-center">
                  <Text className="text-gray-400 font-medium">
                    No tasks completed yet
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={tasks.filter((t) => isTaskDone(t))}
                  renderItem={renderTaskItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with Button */}
      <View className="px-5 py-6 pb-8">
        <TouchableOpacity
          onPress={() => {
            setEditingTask(null);
            setOpen(true);
          }}
          className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center shadow-lg"
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text className="text-white font-bold text-lg font-poppins-bold ml-2">
            Create New Task
          </Text>
        </TouchableOpacity>
      </View>

      <View className="justify-center items-center mb-5">
        <Text className="text-sm text-gray-500 font-poppins-regular">
          © 2026 Rohithreacts.dev
        </Text>
      </View>

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

      <TaskDetailModal
        visible={showDetailModal}
        task={editingTask}
        onClose={() => {
          setShowDetailModal(false);
          setEditingTask(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          setTimeout(() => {
            setOpen(true);
          }, 50);
        }}
        onDelete={(taskId) => {
          setShowDetailModal(false);
          setTaskToDelete(taskId);
          setShowDeleteModal(true);
        }}
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
