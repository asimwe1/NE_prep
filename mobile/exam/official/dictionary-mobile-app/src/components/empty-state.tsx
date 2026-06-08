import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { useThemeColors } from "@/utils/use-theme-colors";
import { BookMarked } from "lucide-react-native";
import { View } from "react-native";

export function EmptyState() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-[12px] bg-card border border-separator p-5 gap-3 border-continuous"
      accessibilityRole="text"
      accessibilityLabel="Ready to explore. Enter a word above to see definitions, examples, and pronunciation."
    >
      <View className="w-11 h-11 rounded-full bg-fill items-center justify-center">
        <BookMarked
          size={20}
          color={colors.mutedForeground}
          {...getDecorativeIconA11yProps()}
        />
      </View>
      <View className="gap-1">
        <AppText variant="headline">Ready to explore</AppText>
        <AppText variant="subhead" muted>
          Enter a word above to see definitions, examples, and pronunciation.
        </AppText>
      </View>
    </View>
  );
}
