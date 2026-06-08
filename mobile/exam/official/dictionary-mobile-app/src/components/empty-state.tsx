import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { cardSurface, fillSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { BookMarked } from "lucide-react-native";
import { View } from "react-native";

export function EmptyState() {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-[12px] p-5"
      style={{ ...cardSurface(colors), gap: 12 }}
      accessibilityRole="text"
      accessibilityLabel="Ready to explore. Enter a word above to see definitions, examples, and pronunciation."
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={fillSurface(colors)}
      >
        <BookMarked
          size={20}
          color={colors.mutedForeground}
          {...getDecorativeIconA11yProps()}
        />
      </View>
      <View style={{ gap: 4 }}>
        <AppText variant="headline">Ready to explore</AppText>
        <AppText variant="subhead" muted>
          Enter a word above to see definitions, examples, and pronunciation.
        </AppText>
      </View>
    </View>
  );
}
