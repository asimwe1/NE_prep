import { X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

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
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row bg-black/35">
        <View className="w-[82%] max-w-[340px] bg-background pt-safe pb-safe border-r border-border">
          <View className="px-5 py-4 flex-row items-center justify-between border-b border-border">
            <View>
              <Text className="text-[22px] font-bold text-foreground">
                Search history
              </Text>
              <Text className="text-[14px] text-muted-foreground">
                Tap a word to search again
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close search history"
              className="w-10 h-10 rounded-xl bg-secondary items-center justify-center active:bg-muted border-continuous"
            >
              <X size={20} color="#111827" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 gap-2"
            contentInsetAdjustmentBehavior="automatic"
          >
            {history.length === 0 ? (
              <View className="rounded-2xl bg-secondary p-4 gap-1 border-continuous">
                <Text className="text-[17px] font-semibold text-foreground">
                  No searches yet
                </Text>
                <Text className="text-[14px] leading-5 text-muted-foreground">
                  Successful searches will appear here.
                </Text>
              </View>
            ) : (
              history.map((word) => (
                <Pressable
                  key={word.toLowerCase()}
                  disabled={isLoading}
                  onPress={() => onSelectWord(word)}
                  className="rounded-xl bg-card border border-border px-4 py-3 active:bg-muted disabled:opacity-50 border-continuous"
                >
                  <Text className="text-[17px] font-semibold text-foreground">
                    {word}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

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
