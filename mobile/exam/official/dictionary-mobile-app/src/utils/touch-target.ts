import type { StyleProp, ViewStyle } from "react-native";
import { IOS_MIN_TOUCH_TARGET } from "@/utils/ios-design";

export function minTouchTargetStyle(
  width = IOS_MIN_TOUCH_TARGET,
  height = IOS_MIN_TOUCH_TARGET,
): ViewStyle {
  return {
    minWidth: width,
    minHeight: height,
  };
}

export function mergeTouchTarget(
  style?: StyleProp<ViewStyle>,
  width = IOS_MIN_TOUCH_TARGET,
  height = IOS_MIN_TOUCH_TARGET,
): StyleProp<ViewStyle> {
  return [minTouchTargetStyle(width, height), style];
}
