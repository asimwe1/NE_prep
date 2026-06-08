import { useThemePreference } from "@/components/theme-preference-provider";
import { showThemePicker } from "@/utils/theme-picker";
import { cardSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Settings, SunMoon } from "lucide-react-native";
import { Pressable } from "react-native";

export function ThemeToggleButton() {
  const colors = useThemeColors();
  const { preference, resolvedScheme, setPreference } = useThemePreference();

  const accessibilityLabel =
    preference === "system"
      ? "Appearance: automatic. Opens appearance options."
      : `Appearance: ${resolvedScheme}. Opens appearance options.`;

  return (
    <Pressable
      onPress={() => showThemePicker(setPreference)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Choose light, dark, or system appearance"
      className="rounded-full items-center justify-center active:opacity-80"
      style={[minTouchTargetStyle(), cardSurface(colors)]}
    >
      {preference === "system" ? (
        <SunMoon size={20} color={colors.foreground} />
      ) : (
        <Settings size={20} color={colors.foreground} />
      )}
    </Pressable>
  );
}
