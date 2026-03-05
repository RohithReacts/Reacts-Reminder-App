import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Avatar from "./Avatar";

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: any | null;
  onEdit?: () => void;
  onDelete?: (taskId: string) => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const CircularProgress = ({
  progress,
  size = 120,
  color = "#2563EB",
}: {
  progress: number;
  size?: number;
  color?: string;
}) => {
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
        <Text className="text-2xl font-bold text-gray-900">{progress}%</Text>
        <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Progress
        </Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 8,
            borderColor: "#F3F4F6",
            position: "absolute",
          }}
        />
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 8,
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

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  task,
  onEdit,
  onDelete,
}) => {
  const { width, height: S_HEIGHT } = useWindowDimensions();
  const isTablet = width > 768;
  const modalWidth = isTablet ? Math.min(width * 0.7, 600) : width;
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
            toValue: S_HEIGHT,
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
    }
  }, [visible]);

  if (!task) return null;

  const cardColor = task.color || "#2563EB";

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
          className="bg-white rounded-t-[40px] shadow-2xl overflow-hidden"
        >
          {/* Header Background Pattern */}
          <View
            className="absolute top-0 left-0 right-0 h-40 opacity-10"
            style={{ backgroundColor: cardColor }}
          />

          {/* Draggable Handle */}
          <View
            {...panResponder.panHandlers}
            className="w-full py-4 items-center justify-center z-10"
          >
            <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
          >
            {/* Task Header Info */}
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-2">
                  <View
                    className="px-3 py-1 rounded-full mr-2"
                    style={{ backgroundColor: cardColor + "20" }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: cardColor }}
                    >
                      {task.category || "Personal"}
                    </Text>
                  </View>
                  {task.completed && (
                    <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#10B981"
                      />
                      <Text className="text-[10px] font-bold text-green-600 uppercase tracking-wider ml-1">
                        Completed
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-3xl font-bold text-gray-900 leading-tight">
                  {task.title}
                </Text>
              </View>
            </View>

            {/* Date and Time Grid */}
            <View className="flex-row mb-8 bg-gray-50 rounded-3xl p-5 border border-gray-100">
              <View className="flex-1 flex-row items-center">
                <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm mr-3">
                  <Ionicons name="calendar" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-[10px] text-gray-400 font-bold uppercase">
                    Date
                  </Text>
                  <Text className="text-gray-900 font-bold">
                    {task.due_date || "Today"}
                  </Text>
                </View>
              </View>
              <View className="w-px h-full bg-gray-200 mx-4" />
              <View className="flex-1 flex-row items-center">
                <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center shadow-sm mr-3">
                  <Ionicons name="time" size={20} color="#D97706" />
                </View>
                <View>
                  <Text className="text-[10px] text-gray-400 font-bold uppercase">
                    Time
                  </Text>
                  <Text className="text-gray-900 font-bold">
                    {task.due_time?.substring(0, 5) || "All Day"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Section */}
            <View className="items-center mb-8">
              <CircularProgress
                progress={task.progress || 0}
                color={cardColor}
              />
            </View>

            {/* Description */}
            <View className="mb-8">
              <Text className="text-gray-900 font-bold text-lg mb-3">
                Description
              </Text>
              <View className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                <Text className="text-gray-600 leading-6 text-base">
                  {task.description || "No description provided for this task."}
                </Text>
              </View>
            </View>

            {/* Team Section */}
            <View className="mb-10">
              <Text className="text-gray-900 font-bold text-lg mb-4">
                Team Members
              </Text>
              <View className="flex-row items-center">
                {[
                  require("../assets/images/avatar1.jpg"),
                  require("../assets/images/avatar2.jpg"),
                  require("../assets/images/avatar3.jpg"),
                  require("../assets/images/rohith.png"),
                ].map((avatarImg, i) => (
                  <View
                    key={i}
                    className="w-12 h-12 rounded-full border-4 border-white -ml-3 first:ml-0 overflow-hidden bg-gray-200 shadow-sm"
                  >
                    <Avatar localImage={avatarImg} size={44} />
                  </View>
                ))}
                <TouchableOpacity className="w-10 h-10 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 -ml-3 items-center justify-center">
                  <Ionicons name="add" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              {onEdit && (
                <TouchableOpacity
                  onPress={() => {
                    onEdit();
                  }}
                  className="flex-1 bg-blue-600 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-blue-200"
                >
                  <Ionicons name="create" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Edit Task
                  </Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => {
                    onDelete(task.id);
                  }}
                  className="flex-1 bg-red-50 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-red-100"
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-bold text-lg ml-2">
                    Delete Task
                  </Text>
                </TouchableOpacity>
              )}
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

export default TaskDetailModal;
