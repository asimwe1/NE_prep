import { LAYOUT } from "@/utils/layout";
import { useWindowDimensions } from "react-native";

export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= LAYOUT.breakpointWide;
  const horizontalPadding = isWide
    ? LAYOUT.screenPaddingWide
    : LAYOUT.screenPaddingPhone;

  return {
    width,
    isWide,
    horizontalPadding,
  };
}
