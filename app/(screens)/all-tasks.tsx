import Avatar from "@/components/Avatar";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import SuccessModal from "@/components/SuccessModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskModal from "@/components/TaskModal";
import { testNotification8Seconds } from "@/lib/notifications";
import { deleteTask, getTasks, Task } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AllTasksScreen() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const numColumns = isTablet ? 2 : 1;
  const itemWidth = isTablet ? (width - 64) / 2 : width - 40;
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

  const isTaskOverdue = (task: Task) => {
    if (!task.due_date || !task.due_time) return false;

    const [hours, minutes] = task.due_time.split(":").map(Number);
    const taskDateTime = new Date(task.due_date);
    taskDateTime.setHours(hours, minutes, 0, 0);

    return new Date() > taskDateTime;
  };

  const isTaskDone = (task: Task) => task.completed || isTaskOverdue(task);

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

  const renderTaskItem = (item: Task) => {
    const cardColor = item.color || "#FEF3C7";
    const progress = item.progress || 0;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => {
          setEditingTask(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
        className={`bg-white rounded-[24px] mb-6 overflow-hidden shadow-sm border border-gray-100 ${isTaskDone(item) ? "opacity-60" : ""}`}
        style={{ width: itemWidth }}
      >
        <View className="p-5">
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

          <View className="h-px bg-gray-100 w-full mb-4" />

          <View className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold mb-1">
              Description :
            </Text>
            <Text className="text-gray-600 text-sm leading-5" numberOfLines={2}>
              {item.description || "No description provided."}
            </Text>
          </View>

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
              <CircularProgress
                progress={progress}
                color={item.color || "#2563EB"}
              />
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
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-5">
        <Text className="text-xl font-bold text-gray-900 font-poppins-bold">
          All Tasks
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await testNotification8Seconds();
            Alert.alert(
              "Test Scheduled",
              "A notification will trigger in 8 seconds. Turn off your screen now to test the sound!",
            );
          }}
          className="bg-purple-600 px-4 py-2 rounded-xl flex-row items-center shadow-sm"
        >
          <Ionicons name="notifications" size={16} color="white" />
          <Text className="text-white font-bold text-xs font-poppins-bold ml-1">
            Test Sound (8s)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-5"
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
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : tasks.length === 0 ? (
          <View className="flex-1 items-center justify-center opacity-50 py-20">
            <Ionicons name="clipboard-outline" size={64} color="gray" />
            <Text className="text-gray-500 mt-4 text-lg font-medium">
              No tasks available
            </Text>
          </View>
        ) : (
          <View>
            {/* Progress Section */}
            {(tasks.filter((t) => !isTaskDone(t)).length > 0 || loading) && (
              <View className="mt-2">
                <Text className="text-2xl font-bold text-gray-900 mb-4 font-poppins-bold text-center">
                  On Progress{" "}
                  <Text className="text-gray-400">
                    ({tasks.filter((t) => !isTaskDone(t)).length})
                  </Text>
                </Text>
                <View className="flex-row flex-wrap justify-between">
                  {tasks.filter((t) => !isTaskDone(t)).map(renderTaskItem)}
                </View>
              </View>
            )}

            {/* Completed Section (matching Home style) */}
            <View className="mt-8 pb-10">
              <Text className="text-xl font-bold text-gray-900 mb-4 font-poppins-bold text-center">
                Completed ({tasks.filter((t) => isTaskDone(t)).length})
              </Text>
              {tasks.filter((t) => isTaskDone(t)).length === 0 ? (
                <View className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 items-center justify-center">
                  <Text className="text-gray-400 font-medium">
                    No tasks completed yet
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {tasks.filter((t) => isTaskDone(t)).map(renderTaskItem)}
                </View>
              )}
            </View>
          </View>
        )}
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

      <TaskDetailModal
        visible={showDetailModal}
        task={editingTask}
        onClose={() => {
          setShowDetailModal(false);
          setEditingTask(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          // Do not setEditingTask(null) here so TaskModal receives it
          setTimeout(() => {
            setOpen(true);
          }, 50); // Small delay to allow TaskDetailModal to close smoothly before opening TaskModal
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
