import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

const { width } = Dimensions.get("window");

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Delete Task?",
  message = "Are you sure you want to delete this task? This action cannot be undone.",
  loading = false,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
            width: width * 0.85,
          }}
          className="bg-white rounded-3xl p-6 items-center shadow-2xl"
        >
          {/* Warning Icon Container */}
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-5">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center">
              <Ionicons name="trash" size={32} color="#EF4444" />
            </View>
          </View>

          {/* Text Content */}
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {title}
          </Text>
          <Text className="text-base text-gray-500 text-center mb-8 px-2 leading-6">
            {message}
          </Text>

          {/* Buttons Layout */}
          <View className="flex-row w-full gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
            >
              <Text className="text-gray-600 font-bold text-lg">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 bg-red-500 py-4 rounded-2xl items-center shadow-lg shadow-red-200"
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmationModal;
