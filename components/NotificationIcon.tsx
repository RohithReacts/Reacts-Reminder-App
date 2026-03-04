import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NotificationIconProps {
  count?: number;
  size?: number;
  onPress?: () => void;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  count = 0,
  size = 26,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} className="relative">
      {/* Icon Background */}
      <View className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
        <Ionicons name="notifications-outline" size={size} color="#111827" />
      </View>

      {/* Badge */}
      {count > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationIcon;