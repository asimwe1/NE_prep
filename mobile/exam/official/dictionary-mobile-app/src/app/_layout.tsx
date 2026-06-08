import "@/global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router/react-navigation";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaListener } from "react-native-safe-area-context";
import { Uniwind, useCSSVariable } from "uniwind";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        {children}
      </SafeAreaListener>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const foreground = useCSSVariable("--app-foreground") as string;
  const background = useCSSVariable("--app-background") as string;

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerTintColor: foreground,
          headerStyle: { backgroundColor: background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Lexi Dictionary",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
