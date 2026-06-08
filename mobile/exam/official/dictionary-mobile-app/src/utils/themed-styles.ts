import { Platform, StyleSheet, type ViewStyle } from "react-native";

export type ThemeColors = {
  background: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  border: string;
  card: string;
  separator: string;
  fill: string;
  secondary: string;
  destructive: string;
  link: string;
};

export function hairlineBorder(color: string): Pick<ViewStyle, "borderWidth" | "borderColor"> {
  if (Platform.OS === "android") {
    return {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color,
    };
  }

  return { borderColor: color };
}

export function screenSurface(colors: ThemeColors): ViewStyle {
  return {
    flex: 1,
    backgroundColor: colors.background,
  };
}

export function cardSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.card,
    ...hairlineBorder(colors.separator),
  };
}

export function fillSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.fill,
  };
}

export function secondarySurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.secondary,
  };
}

export function primarySurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.primary,
  };
}

export function androidElevation(level = 8): ViewStyle {
  return Platform.OS === "android" ? { elevation: level } : {};
}
