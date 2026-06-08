import type { ThemePreference } from "@/utils/theme-preference";
import { ActionSheetIOS, Alert, Platform } from "react-native";

const PICKER_OPTIONS: {
  preference: ThemePreference;
  label: string;
}[] = [
  { preference: "system", label: "Automatic" },
  { preference: "light", label: "Light" },
  { preference: "dark", label: "Dark" },
];

export function showThemePicker(
  setPreference: (preference: ThemePreference) => void,
) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Appearance",
        message: "Choose how Lexi Dictionary looks on this device.",
        options: [...PICKER_OPTIONS.map((option) => option.label), "Cancel"],
        cancelButtonIndex: PICKER_OPTIONS.length,
      },
      (buttonIndex) => {
        const selected = PICKER_OPTIONS[buttonIndex];

        if (selected) {
          setPreference(selected.preference);
        }
      },
    );
    return;
  }

  Alert.alert(
    "Appearance",
    "Choose how Lexi Dictionary looks on this device.",
    [
      ...PICKER_OPTIONS.map((option) => ({
        text: option.label,
        onPress: () => setPreference(option.preference),
      })),
      { text: "Cancel", style: "cancel" as const },
    ],
  );
}
