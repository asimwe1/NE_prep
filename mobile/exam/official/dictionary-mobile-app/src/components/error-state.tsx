import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { useThemeColors } from "@/utils/use-theme-colors";
import { CircleAlert } from "lucide-react-native";
import { View } from "react-native";

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-[12px] bg-card border border-separator p-5 gap-3 border-continuous"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View className="w-11 h-11 rounded-full bg-fill items-center justify-center">
        <CircleAlert
          size={20}
          color={colors.destructive}
          {...getDecorativeIconA11yProps()}
        />
      </View>
      <View className="gap-1">
        <AppText variant="headline">Could not load result</AppText>
        <AppText variant="subhead" muted selectable>
          {message}
        </AppText>
      </View>
    </View>
  );
}
