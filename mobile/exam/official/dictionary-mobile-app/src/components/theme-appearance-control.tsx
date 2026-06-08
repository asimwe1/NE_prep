import { AppText } from "@/components/app-text";
import { useThemePreference } from "@/components/theme-preference-provider";
import { fillSurface, primarySurface } from "@/utils/themed-styles";
import type { ThemePreference } from "@/utils/theme-preference";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Pressable, View } from "react-native";

const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  accessibilityLabel: string;
}[] = [
  {
    id: "system",
    label: "Auto",
    accessibilityLabel: "Use system appearance",
  },
  {
    id: "light",
    label: "Light",
    accessibilityLabel: "Use light appearance",
  },
  {
    id: "dark",
    label: "Dark",
    accessibilityLabel: "Use dark appearance",
  },
];

export function ThemeAppearanceControl() {
  const colors = useThemeColors();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={{ gap: 10 }}>
      <AppText
        variant="footnote"
        muted
        className="uppercase tracking-wide font-semibold px-1"
        accessibilityRole="header"
      >
        Appearance
      </AppText>

      <View
        className="rounded-[10px] p-1 flex-row"
        style={fillSurface(colors)}
        accessibilityRole="radiogroup"
        accessibilityLabel="Appearance"
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = preference === option.id;

          return (
            <Pressable
              key={option.id}
              onPress={() => setPreference(option.id)}
              accessibilityRole="radio"
              accessibilityLabel={option.accessibilityLabel}
              accessibilityState={{ selected: isSelected }}
              className="flex-1 rounded-[8px] items-center justify-center active:opacity-80"
              style={{
                ...minTouchTargetStyle(),
                paddingVertical: 10,
                ...(isSelected ? primarySurface(colors) : {}),
              }}
            >
              <AppText
                variant="subhead"
                tone={isSelected ? "onPrimary" : "default"}
                allowFontScaling={false}
                className="font-medium"
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
