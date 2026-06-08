import type { ThemeColors } from "@/utils/themed-styles";

/**
 * Single Lexi Dictionary palette for web, iOS, and Android.
 * Keep `global.css` tokens aligned with these hex values.
 */
export const APP_THEME_LIGHT: ThemeColors = {
  background: "#f2f4f7",
  foreground: "#111827",
  mutedForeground: "#6b7280",
  primary: "#0d7f92",
  primaryForeground: "#ffffff",
  border: "#e4e8ef",
  card: "#ffffff",
  separator: "#e4e8ef",
  fill: "#eef1f6",
  secondary: "#f7f8fb",
  destructive: "#dc2626",
  link: "#0d7f92",
};

export const APP_THEME_DARK: ThemeColors = {
  background: "#111827",
  foreground: "#f3f4f6",
  mutedForeground: "#9ca3af",
  primary: "#3eb8cc",
  primaryForeground: "#ffffff",
  border: "#374151",
  card: "#1f2937",
  separator: "#374151",
  fill: "#243041",
  secondary: "#1a2332",
  destructive: "#f87171",
  link: "#3eb8cc",
};

export type AppColorScheme = "light" | "dark";

export function getAppTheme(scheme: AppColorScheme): ThemeColors {
  return scheme === "dark" ? APP_THEME_DARK : APP_THEME_LIGHT;
}
