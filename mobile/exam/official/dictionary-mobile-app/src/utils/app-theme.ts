import type { ThemeColors } from "@/utils/themed-styles";

/**
 * Single Lexi Dictionary palette for web, iOS, and Android.
 * Keep `global.css` tokens aligned with these hex values.
 */
export const APP_THEME_LIGHT: ThemeColors = {
  background: "#eef5f2",
  foreground: "#1f2933",
  mutedForeground: "#66756f",
  primary: "#0b7f72",
  primaryForeground: "#ffffff",
  primarySoft: "#dff3ef",
  primarySoftForeground: "#075f56",
  accent: "#d9783d",
  accentForeground: "#ffffff",
  border: "#dce8e3",
  card: "#ffffff",
  cardStrong: "#ffffff",
  hero: "#fff4ec",
  heroBorder: "#f0c9b3",
  quote: "#f1f8f5",
  separator: "#dce8e3",
  fill: "#e5efeb",
  secondary: "#f7faf8",
  destructive: "#b42318",
  link: "#0b7f72",
};

export const APP_THEME_DARK: ThemeColors = {
  background: "#101916",
  foreground: "#f7f2e8",
  mutedForeground: "#b0bdb7",
  primary: "#54c7b8",
  primaryForeground: "#ffffff",
  primarySoft: "#123f3c",
  primarySoftForeground: "#bdf5ec",
  accent: "#f08f54",
  accentForeground: "#1f130c",
  border: "#2f443d",
  card: "#17231f",
  cardStrong: "#20312b",
  hero: "#271f1a",
  heroBorder: "#513a2d",
  quote: "#1d302b",
  separator: "#2f443d",
  fill: "#20322d",
  secondary: "#172820",
  destructive: "#ff8a80",
  link: "#54c7b8",
};

export type AppColorScheme = "light" | "dark";

export function getAppTheme(scheme: AppColorScheme): ThemeColors {
  return scheme === "dark" ? APP_THEME_DARK : APP_THEME_LIGHT;
}
