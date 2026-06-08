import { ThemePickerModal } from "@/components/theme-picker-modal";
import { useThemePreference } from "@/components/theme-preference-provider";
import { hairlineBorder, primarySoftSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Monitor, Moon, Sun } from "lucide-react-native";
import * as React from "react";
import { Pressable } from "react-native";

export function ThemeToggleButton() {
  const colors = useThemeColors();
  const { preference, resolvedScheme } = useThemePreference();
  const [isPickerVisible, setIsPickerVisible] = React.useState(false);
  const Icon =
    preference === "system" ? Monitor : resolvedScheme === "dark" ? Moon : Sun;

  const accessibilityLabel =
    preference === "system"
      ? "Appearance: automatic. Opens appearance options."
      : `Appearance: ${resolvedScheme}. Opens appearance options.`;

  return (
    <>
      <Pressable
        onPress={() => setIsPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Choose light, dark, or system appearance"
        className="rounded-full items-center justify-center active:opacity-80"
        style={[
          minTouchTargetStyle(),
          primarySoftSurface(colors),
          hairlineBorder(colors.separator),
        ]}
      >
        <Icon size={20} color={colors.primarySoftForeground} />
      </Pressable>

      <ThemePickerModal
        isVisible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
      />
    </>
  );
}
