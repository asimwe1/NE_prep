import { AppText } from "@/components/app-text";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { hairlineBorder, primarySoftSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Clock3 } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

type AppHeaderProps = {
  onOpenHistory: () => void;
};

export function AppHeader({ onOpenHistory }: AppHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      className="px-5 pt-2 pb-3 flex-row items-center justify-between"
      style={{
        backgroundColor: colors.cardStrong,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
      }}
    >
      <View
        className="flex-1 pr-3 flex-row items-center"
        style={{ gap: 10 }}
        accessibilityRole="header"
      >
        <View
          className="h-9 w-1.5 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        <View className="flex-1">
          <AppText variant="title2">Lexi Dictionary</AppText>
          <AppText variant="subhead" muted className="mt-0.5">
            Definitions, examples, and pronunciation
          </AppText>
        </View>
      </View>

      <View className="flex-row items-center" style={{ gap: 10 }}>
        <ThemeToggleButton />
        <Pressable
          onPress={onOpenHistory}
          accessibilityRole="button"
          accessibilityLabel="Open search history"
          accessibilityHint="Shows your recent successful searches"
          className="rounded-full items-center justify-center active:opacity-80"
          style={[
            minTouchTargetStyle(),
            primarySoftSurface(colors),
            hairlineBorder(colors.separator),
          ]}
        >
          <Clock3 size={20} color={colors.primarySoftForeground} />
        </Pressable>
      </View>
    </View>
  );
}
