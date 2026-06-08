import { Platform } from "react-native";

/** Hides decorative icons from assistive tech without leaking RN-only props to web DOM. */
export function getDecorativeIconA11yProps():
  | { "aria-hidden": true }
  | {
      accessibilityElementsHidden: true;
      importantForAccessibility: "no";
    } {
  if (Platform.OS === "web") {
    return { "aria-hidden": true };
  }

  return {
    accessibilityElementsHidden: true,
    importantForAccessibility: "no",
  };
}
