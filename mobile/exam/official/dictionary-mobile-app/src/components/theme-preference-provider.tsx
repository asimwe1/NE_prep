import {
  loadThemePreference,
  resolveColorScheme,
  saveThemePreference,
  type ThemePreference,
} from "@/utils/theme-preference";
import type { AppColorScheme } from "@/utils/app-theme";
import * as React from "react";
import { useColorScheme } from "react-native";
import { Uniwind } from "uniwind";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedScheme: AppColorScheme;
  isReady: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext =
  React.createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    React.useState<ThemePreference>("system");
  const [isReady, setIsReady] = React.useState(false);

  const resolvedScheme = React.useMemo(
    () => resolveColorScheme(preference, systemScheme),
    [preference, systemScheme],
  );

  React.useEffect(() => {
    let isMounted = true;

    loadThemePreference().then((savedPreference) => {
      if (!isMounted) {
        return;
      }

      if (savedPreference) {
        setPreferenceState(savedPreference);
      }

      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isReady) {
      return;
    }

    Uniwind.setTheme(preference === "system" ? "system" : preference);
  }, [preference, isReady]);

  const setPreference = React.useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    saveThemePreference(nextPreference).catch(() => undefined);
  }, []);

  const value = React.useMemo(
    () => ({
      preference,
      resolvedScheme,
      isReady,
      setPreference,
    }),
    [preference, resolvedScheme, isReady, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = React.useContext(ThemePreferenceContext);
  const systemScheme = useColorScheme();

  if (!context) {
    return {
      preference: "system",
      resolvedScheme: resolveColorScheme("system", systemScheme),
      isReady: true,
      setPreference: () => undefined,
    };
  }

  return context;
}
