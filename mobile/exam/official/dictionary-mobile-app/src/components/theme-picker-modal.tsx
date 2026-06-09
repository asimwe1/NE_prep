import { AppText } from "@/components/app-text";
import { useThemePreference } from "@/components/theme-preference-provider";
import type { ThemePreference } from "@/utils/theme-preference";
import {
  androidElevation,
  cardSurface,
  hairlineBorder,
  primarySoftSurface,
  primarySurface,
} from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Monitor, Moon, Sun, X } from "lucide-react-native";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

type ThemePickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

const OPTIONS: {
  id: ThemePreference;
  title: string;
  description: string;
  Icon: typeof Monitor;
}[] = [
  {
    id: "system",
    title: "Automatic",
    description: "Follow this device appearance",
    Icon: Monitor,
  },
  {
    id: "light",
    title: "Light",
    description: "Bright reading surfaces",
    Icon: Sun,
  },
  {
    id: "dark",
    title: "Dark",
    description: "Dimmed interface for low light",
    Icon: Moon,
  },
];

export function ThemePickerModal({
  isVisible,
  onClose,
}: ThemePickerModalProps) {
  const colors = useThemeColors();
  const { preference, setPreference } = useThemePreference();

  function selectPreference(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    onClose();
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
      accessibilityViewIsModal
    >
      <View style={styles.root}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close appearance options"
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />

        <View
          className="rounded-[22px] overflow-hidden"
          style={[
            styles.dialog,
            cardSurface(colors),
            androidElevation(14),
            Platform.OS === "web" ? styles.webDialog : null,
          ]}
        >
          <View
            className="px-5 pt-5 pb-4 flex-row items-start justify-between"
            style={{
              backgroundColor: colors.cardStrong,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.separator,
            }}
          >
            <View className="flex-1 pr-3">
              <AppText variant="title2">Appearance</AppText>
              <AppText variant="subhead" muted className="mt-1">
                Choose how Lexi Dictionary looks.
              </AppText>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close appearance options"
              className="rounded-full items-center justify-center active:opacity-80"
              style={[
                minTouchTargetStyle(40, 40),
                primarySoftSurface(colors),
                hairlineBorder(colors.separator),
              ]}
            >
              <X size={18} color={colors.primarySoftForeground} />
            </Pressable>
          </View>

          <View
            className="px-4 py-4"
            style={{ backgroundColor: colors.background, gap: 10 }}
          >
            {OPTIONS.map(({ id, title, description, Icon }) => {
              const isSelected = preference === id;

              return (
                <Pressable
                  key={id}
                  onPress={() => selectPreference(id)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${title} appearance`}
                  accessibilityHint={description}
                  accessibilityState={{ selected: isSelected }}
                  className="rounded-[16px] px-4 active:opacity-80"
                  style={{
                    ...minTouchTargetStyle(0, 64),
                    ...(isSelected ? primarySurface(colors) : cardSurface(colors)),
                    paddingVertical: 12,
                    borderColor: isSelected ? colors.primary : colors.separator,
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      className="h-10 w-10 rounded-full items-center justify-center"
                      style={
                        isSelected
                          ? { backgroundColor: colors.primaryForeground }
                          : primarySoftSurface(colors)
                      }
                    >
                      <Icon
                        size={19}
                        color={
                          isSelected
                            ? colors.primary
                            : colors.primarySoftForeground
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <AppText
                        variant="headline"
                        tone={isSelected ? "onPrimary" : "default"}
                      >
                        {title}
                      </AppText>
                      <AppText
                        variant="footnote"
                        tone={isSelected ? "onPrimary" : "default"}
                        style={isSelected ? { opacity: 0.86 } : undefined}
                      >
                        {description}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    backgroundColor: "rgba(16, 25, 22, 0.48)",
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  webDialog: {
    maxWidth: 380,
  },
});
