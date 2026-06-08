import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import type { SearchFeedback } from "@/utils/search-feedback";
import { cardSurface, primarySoftSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { CircleAlert, Search, SearchX, WifiOff } from "lucide-react-native";
import { View } from "react-native";

type ErrorStateProps = SearchFeedback;

export function ErrorState({ kind, title, message, hint }: ErrorStateProps) {
  const colors = useThemeColors();
  const isValidation = kind === "validation";
  const isNotFound = kind === "not-found";
  const isNetwork = kind === "network";
  const isService = kind === "service";
  const iconColor =
    isValidation || isNotFound || isNetwork
      ? colors.mutedForeground
      : colors.destructive;

  const Icon = isValidation
    ? Search
    : isNotFound
      ? SearchX
      : isNetwork
        ? WifiOff
        : CircleAlert;

  return (
    <View
      className="rounded-[18px] p-5"
      style={{ ...cardSurface(colors), gap: 12 }}
      accessibilityRole={isNetwork || isService ? "alert" : "text"}
      accessibilityLiveRegion={isNetwork || isService ? "polite" : undefined}
      accessibilityLabel={[title, message, hint].filter(Boolean).join(". ")}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center"
        style={primarySoftSurface(colors)}
      >
        <Icon size={20} color={iconColor} {...getDecorativeIconA11yProps()} />
      </View>
      <View style={{ gap: 6 }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead" muted selectable>
          {message}
        </AppText>
        {hint ? (
          <AppText variant="footnote" muted selectable className="pt-0.5">
            {hint}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
