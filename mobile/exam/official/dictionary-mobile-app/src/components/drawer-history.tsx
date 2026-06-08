import { AppText } from "@/components/app-text";
import { ThemeAppearanceControl } from "@/components/theme-appearance-control";
import {
  getRelativeSearchTime,
  type SearchHistoryItem,
} from "@/utils/history";
import type { SavedWordItem } from "@/utils/saved-words";
import { useThemeColors } from "@/utils/use-theme-colors";
import {
  androidElevation,
  cardSurface,
  hairlineBorder,
  screenSurface,
} from "@/utils/themed-styles";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Bookmark, X } from "lucide-react-native";
import * as React from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DRAWER_SLIDE_OFFSET = -360;
const OPEN_DURATION_MS = 280;

type DrawerHistoryProps = {
  history: SearchHistoryItem[];
  savedWords: SavedWordItem[];
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelectWord: (item: SearchHistoryItem) => void;
  onSelectSavedWord: (item: SavedWordItem) => void;
};

export function DrawerHistory({
  history,
  savedWords,
  isVisible,
  isLoading,
  onClose,
  onSelectWord,
  onSelectSavedWord,
}: DrawerHistoryProps) {
  const colors = useThemeColors();
  const translateX = React.useMemo(
    () => new Animated.Value(DRAWER_SLIDE_OFFSET),
    [],
  );
  const backdropOpacity = React.useMemo(() => new Animated.Value(0), []);
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) {
      translateX.setValue(DRAWER_SLIDE_OFFSET);
      backdropOpacity.setValue(0);
      return;
    }

    translateX.setValue(DRAWER_SLIDE_OFFSET);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: OPEN_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: OPEN_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, translateX, backdropOpacity]);

  React.useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const refreshId = setTimeout(() => setNow(Date.now()), 0);
    const intervalId = setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      clearTimeout(refreshId);
      clearInterval(intervalId);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
      accessibilityViewIsModal
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
        >
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close search history"
            style={[StyleSheet.absoluteFill, styles.backdrop]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            screenSurface(colors),
            androidElevation(12),
            {
              transform: [{ translateX }],
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: colors.separator,
            },
          ]}
        >
          <SafeAreaView style={screenSurface(colors)} edges={["top", "left", "bottom"]}>
            <View
              className="px-5 py-4 flex-row items-start justify-between"
              style={{
                ...hairlineBorder(colors.separator),
                borderBottomWidth: StyleSheet.hairlineWidth,
                backgroundColor: colors.cardStrong,
              }}
            >
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
                className="rounded-full items-center justify-center active:opacity-80"
                style={[minTouchTargetStyle(), cardSurface(colors)]}
              >
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView
              style={[screenSurface(colors), { flex: 1 }]}
              contentContainerStyle={styles.historyList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {history.length === 0 && savedWords.length === 0 ? (
                <View className="rounded-[18px] p-4 gap-1" style={cardSurface(colors)}>
                  <AppText variant="headline">No searches yet</AppText>
                  <AppText variant="subhead" muted>
                    Successful searches will appear here.
                  </AppText>
                </View>
              ) : (
                <View style={{ gap: 18 }}>
                  {savedWords.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <View className="flex-row items-center px-1" style={{ gap: 6 }}>
                        <Bookmark
                          size={14}
                          color={colors.primary}
                          fill={colors.primary}
                        />
                        <AppText
                          variant="footnote"
                          tone="primary"
                          className="uppercase tracking-wide font-semibold"
                        >
                          Saved words
                        </AppText>
                      </View>
                      {savedWords.map((item) => (
                        <HistoryRow
                          key={item.normalizedWord}
                          word={item.word}
                          summary={item.summary}
                          relativeTime={getRelativeSearchTime(
                            item.savedAt,
                            now || item.savedAt,
                          )}
                          isLoading={isLoading}
                          onPress={() => onSelectSavedWord(item)}
                          accessibilityLabel={`${item.word}. ${item.summary}. Saved ${getRelativeSearchTime(item.savedAt, now || item.savedAt)}`}
                        />
                      ))}
                    </View>
                  )}

                  {history.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <AppText
                        variant="footnote"
                        muted
                        className="uppercase tracking-wide font-semibold px-1"
                      >
                        Recent searches
                      </AppText>
                      {history.map((item) => (
                        <HistoryRow
                          key={item.normalizedWord}
                          word={item.word}
                          summary={item.summary}
                          relativeTime={getRelativeSearchTime(
                            item.searchedAt,
                            now || item.searchedAt,
                          )}
                          isLoading={isLoading}
                          onPress={() => onSelectWord(item)}
                          accessibilityLabel={`${item.word}. ${item.summary}. Searched ${getRelativeSearchTime(item.searchedAt, now || item.searchedAt)}`}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View
              className="px-4 pt-3 pb-4"
              style={{
                ...hairlineBorder(colors.separator),
                borderTopWidth: StyleSheet.hairlineWidth,
                backgroundColor: colors.cardStrong,
              }}
            >
              <ThemeAppearanceControl />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "84%",
    maxWidth: 340,
    zIndex: 2,
  },
  historyList: {
    padding: 16,
    paddingBottom: 24,
  },
});

type HistoryRowProps = {
  word: string;
  summary: string;
  relativeTime: string;
  isLoading: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

function HistoryRow({
  word,
  summary,
  relativeTime,
  isLoading,
  accessibilityLabel,
  onPress,
}: HistoryRowProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      disabled={isLoading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isLoading }}
      className="rounded-[14px] px-4 active:opacity-80 disabled:opacity-50"
      style={{
        ...minTouchTargetStyle(),
        ...cardSurface(colors),
        paddingVertical: 12,
      }}
    >
      <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
        <View className="flex-1">
          <AppText variant="body" className="font-semibold">
            {word}
          </AppText>
          <AppText variant="footnote" muted numberOfLines={2} className="mt-1">
            {summary}
          </AppText>
        </View>
        <AppText
          variant="caption"
          muted
          allowFontScaling={false}
          className="pt-0.5"
        >
          {relativeTime}
        </AppText>
      </View>
    </Pressable>
  );
}
