import { useColorScheme } from "react-native";
import { useCSSVariable } from "uniwind";

const LIGHT_COLORS = {
  background: "#f2f2f7",
  foreground: "#000000",
  mutedForeground: "rgba(60, 60, 67, 0.6)",
  primary: "#007aff",
  primaryForeground: "#ffffff",
  border: "rgba(60, 60, 67, 0.29)",
  card: "#ffffff",
  separator: "rgba(60, 60, 67, 0.29)",
  fill: "rgba(118, 118, 128, 0.12)",
  destructive: "#ff3b30",
  link: "#007aff",
} as const;

const DARK_COLORS = {
  background: "#000000",
  foreground: "#ffffff",
  mutedForeground: "rgba(235, 235, 245, 0.6)",
  primary: "#0a84ff",
  primaryForeground: "#ffffff",
  border: "rgba(84, 84, 89, 0.6)",
  card: "#1c1c1e",
  separator: "rgba(84, 84, 89, 0.6)",
  fill: "rgba(118, 118, 128, 0.24)",
  destructive: "#ff453a",
  link: "#0a84ff",
} as const;

function isNativeColor(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return (
    value.startsWith("#") ||
    value.startsWith("rgb") ||
    value.startsWith("hsl") ||
    /^[a-zA-Z]+$/.test(value)
  );
}

function resolveColor(
  cssValue: string | undefined,
  fallback: string,
): string {
  return isNativeColor(cssValue) ? cssValue : fallback;
}

export function useThemeColors() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const defaults = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  const cssBackground = useCSSVariable("--app-background") as string | undefined;
  const cssForeground = useCSSVariable("--app-foreground") as string | undefined;
  const cssMutedForeground = useCSSVariable(
    "--app-muted-foreground",
  ) as string | undefined;
  const cssPrimary = useCSSVariable("--app-primary") as string | undefined;
  const cssPrimaryForeground = useCSSVariable(
    "--app-primary-foreground",
  ) as string | undefined;
  const cssBorder = useCSSVariable("--app-border") as string | undefined;
  const cssCard = useCSSVariable("--app-card") as string | undefined;
  const cssSeparator = useCSSVariable("--app-separator") as string | undefined;
  const cssFill = useCSSVariable("--app-fill") as string | undefined;
  const cssDestructive = useCSSVariable("--sf-red") as string | undefined;
  const cssLink = useCSSVariable("--sf-link") as string | undefined;

  return {
    background: resolveColor(cssBackground, defaults.background),
    foreground: resolveColor(cssForeground, defaults.foreground),
    mutedForeground: resolveColor(cssMutedForeground, defaults.mutedForeground),
    primary: resolveColor(cssPrimary, defaults.primary),
    primaryForeground: resolveColor(
      cssPrimaryForeground,
      defaults.primaryForeground,
    ),
    border: resolveColor(cssBorder, defaults.border),
    card: resolveColor(cssCard, defaults.card),
    separator: resolveColor(cssSeparator, defaults.separator),
    fill: resolveColor(cssFill, defaults.fill),
    destructive: resolveColor(cssDestructive, defaults.destructive),
    link: resolveColor(cssLink, defaults.link),
  };
}
