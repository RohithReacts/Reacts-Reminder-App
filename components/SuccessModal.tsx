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

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const { width, height } = Dimensions.get("window");

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title = "Success!",
  message = "Your task has been created successfully.",
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
          friction: 7,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 250,
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
      <View className="flex-1 justify-center items-center bg-black/40">
        <Animated.View
          style={{
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
            width: width * 0.85,
          }}
          className="bg-white rounded-3xl p-6 items-center shadow-2xl"
        >
          {/* Icon Container with subtle background */}
          <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-5">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="checkmark-done" size={32} color="#10B981" />
            </View>
          </View>

          {/* Text Content */}
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {title}
          </Text>
          <Text className="text-base text-gray-500 text-center mb-8 px-2 leading-6">
            {message}
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-200"
          >
            <Text className="text-white font-bold text-lg">Awesome</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SuccessModal;
