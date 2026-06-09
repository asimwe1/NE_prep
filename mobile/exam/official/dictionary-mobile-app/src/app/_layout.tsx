import "@/global.css";
import { ThemePreferenceProvider, useThemePreference } from "@/components/theme-preference-provider";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { resolvedScheme } = useThemePreference();

  return (
    <NavigationThemeProvider
      value={resolvedScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        {children}
      </SafeAreaListener>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <NavigationThemeBridge>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </NavigationThemeBridge>
    </ThemePreferenceProvider>
  );
}
