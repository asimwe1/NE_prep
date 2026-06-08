import { AppText } from "@/components/app-text";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { X } from "lucide-react-native";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DrawerHistoryProps = {
  history: string[];
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelectWord: (word: string) => void;
};

export function DrawerHistory({
  history,
  isVisible,
  isLoading,
  onClose,
  onSelectWord,
}: DrawerHistoryProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
      accessibilityViewIsModal
    >
      <View className="flex-1 flex-row bg-black/40">
        <SafeAreaView
          className="w-[84%] max-w-[340px] bg-background border-r border-separator"
          edges={["top", "left", "bottom"]}
        >
          <View className="px-5 py-4 flex-row items-start justify-between border-b border-separator">
            <View className="flex-1 pr-3">
              <AppText variant="title2">Search history</AppText>
              <AppText variant="subhead" muted className="mt-1">
                Tap a word to search again
              </AppText>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close search history"
              className="rounded-full bg-card border border-separator items-center justify-center active:bg-muted border-continuous"
              style={minTouchTargetStyle()}
            >
              <X size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerClassName="p-4 gap-2"
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {history.length === 0 ? (
              <View className="rounded-[12px] bg-card border border-separator p-4 gap-1 border-continuous">
                <AppText variant="headline">No searches yet</AppText>
                <AppText variant="subhead" muted>
                  Successful searches will appear here.
                </AppText>
              </View>
            ) : (
              history.map((word) => (
                <Pressable
                  key={word.toLowerCase()}
                  disabled={isLoading}
                  onPress={() => onSelectWord(word)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search ${word}`}
                  accessibilityState={{ disabled: isLoading }}
                  className="rounded-[10px] bg-card border border-separator px-4 active:bg-muted disabled:opacity-50 border-continuous"
                  style={{ ...minTouchTargetStyle(), paddingVertical: 10 }}
                >
                  <AppText variant="body" className="font-medium">
                    {word}
                  </AppText>
                </Pressable>
              ))
            )}
          </ScrollView>
        </SafeAreaView>

        <Pressable
          className="flex-1"
          accessibilityRole="button"
          accessibilityLabel="Close search history"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}
