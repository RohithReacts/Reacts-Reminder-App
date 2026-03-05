import Avatar from "@/components/Avatar";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

interface AlarmOverlayProps {
  isVisible: boolean;
  taskTitle: string;
  onStop: () => void;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({
  isVisible,
  taskTitle,
  onStop,
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [isVisible]);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.3 - (pulse.value - 1),
  }));

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View className="flex-1 justify-center items-center px-6">
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          className="absolute inset-0 bg-black/70"
        />

        <Animated.View
          entering={ZoomIn.duration(500)}
          className="bg-white rounded-[32px] w-full overflow-hidden shadow-2xl border border-gray-100"
        >
          {/* Accent Header */}
          <View className="bg-red-500 h-2 w-full" />

          <View className="p-8">
            {/* Pulsing Alarm Icon */}
            <View className="items-center justify-center mb-8 h-24">
              <Animated.View
                style={[animatedPulse]}
                className="absolute w-24 h-24 rounded-full bg-red-500"
              />
              <View className="bg-red-500 w-20 h-20 rounded-full items-center justify-center shadow-lg">
                <Ionicons name="notifications" size={40} color="white" />
              </View>
            </View>

            <View className="items-center mb-8">
              <Text className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">
                Task Reminder
              </Text>
              <Text className="text-2xl font-bold text-gray-900 text-center leading-8 px-2">
                {taskTitle}
              </Text>
            </View>

            <View className="h-px bg-gray-100 w-full mb-6" />

            {/* Mock Team Info to match Task Card style */}
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-gray-400 text-xs font-semibold mb-2">
                  Teams :
                </Text>
                <View className="flex-row">
                  {[
                    require("../assets/images/avatar1.jpg"),
                    require("../assets/images/avatar2.jpg"),
                    require("../assets/images/avatar3.jpg"),
                  ].map((avatarImg, i) => (
                    <View
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-200"
                    >
                      <Avatar localImage={avatarImg} size={28} />
                    </View>
                  ))}
                </View>
              </View>

              <View className="items-end">
                <Text className="text-gray-400 text-xs font-semibold mb-2">
                  Notice :
                </Text>
                <View className="bg-orange-100 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 font-bold text-[10px]">
                    URGENT
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onStop}
              className="bg-red-600 py-5 rounded-[20px] items-center shadow-lg shadow-red-200"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="stop-circle"
                  size={24}
                  color="white"
                  className="mr-2"
                />
                <Text className="color-white text-lg font-bold ml-2">
                  STOP ALARM
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
