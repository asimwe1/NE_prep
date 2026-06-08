import { useThemePreference } from "@/components/theme-preference-provider";
import { getAppTheme } from "@/utils/app-theme";
import type { ThemeColors } from "@/utils/themed-styles";

/** Shared palette for web, iOS, and Android native surfaces. */
export function useThemeColors(): ThemeColors {
  const { resolvedScheme } = useThemePreference();
  return getAppTheme(resolvedScheme);
}
