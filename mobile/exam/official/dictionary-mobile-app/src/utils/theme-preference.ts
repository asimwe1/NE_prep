import type { AppColorScheme } from "@/utils/app-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "@lexi_dictionary_theme_preference";

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): AppColorScheme {
  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return preference;
}

export async function loadThemePreference(): Promise<ThemePreference | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);

    if (value === "system" || value === "light" || value === "dark") {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}

export async function saveThemePreference(
  preference: ThemePreference,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Preference still applies for the current session.
  }
}
