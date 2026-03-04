import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

const Calendar = () => {
  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-row justify-end">
        <TouchableOpacity
          onPress={() => router.push("/schedule")}
          className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-100"
        >
          <Ionicons name="calendar-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Calendar;
