import { View, Image, Text, TouchableOpacity, ImageSourcePropType } from "react-native";
import React from "react";

interface AvatarProps {
  imageUrl?: string;                 // for online image
  localImage?: ImageSourcePropType;  // for local image (require)
  name?: string;
  size?: number;
  onPress?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  localImage,
  name = "Rohith",
  size = 60,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden bg-gray-200 items-center justify-center"
      >
        {localImage ? (
          <Image
            source={localImage}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-lg font-bold text-gray-600">
            {name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Avatar;