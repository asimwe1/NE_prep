import { Platform, StyleSheet, type ViewStyle } from "react-native";

export type ThemeColors = {
  background: string;
  foreground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  primarySoftForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  card: string;
  cardStrong: string;
  hero: string;
  heroBorder: string;
  quote: string;
  separator: string;
  fill: string;
  secondary: string;
  destructive: string;
  link: string;
};

export function hairlineBorder(color: string): Pick<ViewStyle, "borderWidth" | "borderColor"> {
  return {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color,
  };
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
    ...softShadow(),
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

export function primarySoftSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.primarySoft,
  };
}

export function heroSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.hero,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.heroBorder,
    ...softShadow(0.12),
  };
}

export function quoteSurface(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.quote,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  };
}

export function androidElevation(level = 8): ViewStyle {
  return Platform.OS === "android" ? { elevation: level } : {};
}

export function softShadow(opacity = 0.08): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation: 2 };
  }

  return {
    shadowColor: "#0f172a",
    shadowOpacity: opacity,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  };
}
