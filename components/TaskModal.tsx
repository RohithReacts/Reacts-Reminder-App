import { scheduleTaskNotification } from "@/lib/notifications";
import { addTask, updateTask } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onTaskCreated?: () => void;
  onDelete?: (taskId: string) => void;
  task?: any | null;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onTaskCreated,
  onDelete,
  task,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Personal" | "Teams">("Personal");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("#2563EB");
  const [loading, setLoading] = useState(false);
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const modalWidth = isTablet ? Math.min(width * 0.7, 600) : width;

  const colors = [
    "#2563EB",
    "#D97706",
    "#059669",
    "#DC2626",
    "#7C3AED",
    "#DB2777",
  ];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      if (task) {
        setTitle(task.title || "");
        setCategory(task.category || "Personal");
        setDescription(task.description || "");
        setDate(task.due_date || "");
        setTime(task.due_time || "");
        setProgress(task.progress || 0);
        setColor(task.color || "#2563EB");
      } else {
        setTitle("");
        setCategory("Personal");
        setDescription("");
        setDate("");
        setTime("");
        setProgress(0);
        setColor("#2563EB");
      }
    }
  }, [visible, task]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setDate(year + "-" + month + "-" + day);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, "0");
      const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
      setTime(hours + ":" + minutes + ":00");
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      Alert.alert("Required", "Please enter a task title");
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title,
        category,
        description,
        due_date: date || null,
        due_time: time || null,
        progress: progress,
        color: color,
      };

      let result;
      if (task?.id) {
        result = await updateTask(task.id, taskData);
      } else {
        result = await addTask(taskData);
      }

      if (!result) {
        throw new Error("Failed to save task");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onSuccess?.();
      onClose();

      if (!task) {
        onTaskCreated?.();
      }

      // Schedule or cancel notification
      const idToNotify = result.id || task?.id;
      if (idToNotify) {
        if (date && time) {
          await scheduleTaskNotification(idToNotify, title, date, time);
        } else {
          const { cancelNotification } = require("@/lib/notifications");
          await cancelNotification(idToNotify);
        }
      }
    } catch (error: any) {
      console.error("TaskModal handleSubmit Error:", error);
      Alert.alert("System Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: panY }],
              width: modalWidth,
              alignSelf: "center",
            },
          ]}
          className="bg-white rounded-t-[40px] pt-2 shadow-2xl"
        >
          {/* Dedicated Drag Handle */}
          <View
            {...panResponder.panHandlers}
            className="w-full py-4 items-center justify-center"
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 40,
              paddingTop: 0,
            }}
          >
            {/* Header */}
            <View className="mb-8 flex-row items-center justify-between">
              <View className="w-20" />
              <Text className="text-2xl font-bold text-gray-900 font-poppins-bold text-center">
                {task ? "Edit Task" : "New Task"}
              </Text>
              {task && onDelete ? (
                <TouchableOpacity
                  onPress={() => onDelete(task.id)}
                  className="px-4 py-2 flex-row items-center justify-center bg-red-50 rounded-full"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text className="text-red-500 font-bold ml-1.5 text-sm">
                    Delete
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="w-20" />
              )}
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Task Title
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  placeholder="What needs to be done?"
                  className="flex-1 ml-3 text-gray-900 text-base"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Category
              </Text>
              <View className="flex-row bg-gray-50 border border-gray-200 p-1 rounded-2xl">
                <TouchableOpacity
                  onPress={() => setCategory("Personal")}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${category === "Personal" ? "bg-blue-600 shadow-sm" : ""}`}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={category === "Personal" ? "white" : "#6B7280"}
                  />
                  <Text
                    className={`ml-2 font-medium ${category === "Personal" ? "text-white" : "text-gray-500"}`}
                  >
                    Personal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCategory("Teams")}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${category === "Teams" ? "bg-blue-600 shadow-sm" : ""}`}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={category === "Teams" ? "white" : "#6B7280"}
                  />
                  <Text
                    className={`ml-2 font-medium ${category === "Teams" ? "text-white" : "text-gray-500"}`}
                  >
                    Teams
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Description (Optional)
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <TextInput
                  placeholder="Add more details..."
                  multiline
                  numberOfLines={3}
                  className="text-gray-900 text-base"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Progress Slider */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Progress ({progress}%)
              </Text>
              <View className="flex-row items-center gap-2">
                {[0, 25, 50, 75, 100].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setProgress(val)}
                    className={`flex-1 py-2 rounded-lg items-center ${progress === val ? "bg-blue-600" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`font-bold ${progress === val ? "text-white" : "text-gray-600"}`}
                    >
                      {val}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-2 ml-1">
                Card Stripe Color
              </Text>
              <View className="flex-row gap-3">
                {colors.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-10 h-10 rounded-full border-4 ${color === c ? "border-gray-300" : "border-transparent"}`}
                  />
                ))}
              </View>
            </View>

            {/* Date & Time Pickers */}
            <View className="flex-row gap-3 mb-8">
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 ml-1">
                  Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={date ? "#2563EB" : "#9CA3AF"}
                  />
                  <Text
                    className={`ml-3 text-base ${date ? "text-gray-900 font-medium" : "text-gray-400"}`}
                  >
                    {date || "Select Date"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 ml-1">
                  Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={time ? "#2563EB" : "#9CA3AF"}
                  />
                  <Text
                    className={`ml-3 text-base ${time ? "text-gray-900 font-medium" : "text-gray-400"}`}
                  >
                    {time || "Select Time"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display="spinner"
                onChange={onDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={time ? new Date(`2000-01-01T${time}`) : new Date()}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={onTimeChange}
              />
            )}

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={loading}
                className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
              >
                <Text className="text-gray-600 font-bold text-lg">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 py-4 rounded-xl items-center flex-row justify-center shadow-md"
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {task ? "Save Changes" : "Create Task"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
});

export default TaskModal;
