import { AppHeader } from "@/components/app-header";
import { AppText } from "@/components/app-text";
import { DrawerHistory } from "@/components/drawer-history";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { SearchSection } from "@/components/search-section";
import { WordResults } from "@/components/word-results";
import { useThemeColors } from "@/utils/use-theme-colors";
import { searchWord } from "@/services/dictionary-api";
import type { DictionaryEntry } from "@/types/dictionary";
import {
  findPronunciationAudios,
  getDisplayPhonetic,
} from "@/utils/dictionary-format";
import { updateSearchHistory } from "@/utils/history";
import { LAYOUT } from "@/utils/layout";
import {
  EMPTY_SEARCH_FEEDBACK,
  getSearchFeedback,
  type SearchFeedback,
} from "@/utils/search-feedback";
import { cardSurface, screenSurface } from "@/utils/themed-styles";
import { useLayout } from "@/utils/use-layout";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useThemeColors();
  const { isWide, horizontalPadding } = useLayout();
  const [query, setQuery] = React.useState("");
  const [entries, setEntries] = React.useState<DictionaryEntry[]>([]);
  const [feedback, setFeedback] = React.useState<SearchFeedback | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [selectedPronunciationIndex, setSelectedPronunciationIndex] =
    React.useState(0);
  const [history, setHistory] = React.useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const primaryEntry = entries[0];
  const pronunciationAudios = primaryEntry
    ? findPronunciationAudios(primaryEntry)
    : [];
  const selectedPronunciation =
    pronunciationAudios[selectedPronunciationIndex] ?? null;
  const phonetic =
    selectedPronunciation?.phoneticText ??
    (primaryEntry ? getDisplayPhonetic(primaryEntry) : null);

  async function runSearch(rawWord: string) {
    const normalizedQuery = rawWord.trim().toLowerCase();

    if (!normalizedQuery) {
      setEntries([]);
      setFeedback(EMPTY_SEARCH_FEEDBACK);
      setHasSearched(true);
      setSelectedPronunciationIndex(0);
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setHasSearched(true);
    setQuery(normalizedQuery);

    try {
      const result = await searchWord(normalizedQuery);
      setEntries(result);
      setSelectedPronunciationIndex(0);
      setHistory((currentHistory) =>
        updateSearchHistory(
          currentHistory,
          result[0]?.word?.trim() || normalizedQuery,
        ),
      );
    } catch (searchError) {
      setEntries([]);
      setFeedback(getSearchFeedback(searchError, normalizedQuery));
      setSelectedPronunciationIndex(0);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    runSearch(query).catch(() => {
      setFeedback(getSearchFeedback(new Error("search failed")));
      setIsLoading(false);
    });
  }

  function handleHistorySelect(word: string) {
    setIsHistoryOpen(false);
    runSearch(word).catch(() => {
      setFeedback(getSearchFeedback(new Error("search failed")));
      setIsLoading(false);
    });
  }

  return (
    <SafeAreaView
      style={screenSurface(colors)}
      edges={["top", "left", "right"]}
    >
      <DrawerHistory
        history={history}
        isVisible={isHistoryOpen}
        isLoading={isLoading}
        onClose={() => setIsHistoryOpen(false)}
        onSelectWord={handleHistorySelect}
      />

      <AppHeader onOpenHistory={() => setIsHistoryOpen(true)} />

      <SearchSection
        horizontalPadding={horizontalPadding}
        value={query}
        isLoading={isLoading}
        onChangeText={setQuery}
        onSubmit={handleSearch}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: isWide ? "center" : "stretch",
            paddingHorizontal: horizontalPadding,
            paddingTop: LAYOUT.sectionGap,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          nestedScrollEnabled
        >
          <View
            style={{
              width: "100%",
              maxWidth: isWide ? LAYOUT.contentMaxWidth : undefined,
              gap: LAYOUT.sectionGap,
            }}
          >
            {isLoading && (
              <View
                className="items-center justify-center rounded-[18px] py-12"
                style={{ ...cardSurface(colors), gap: 12 }}
                accessibilityRole="progressbar"
                accessibilityLabel="Searching dictionary"
                accessibilityState={{ busy: true }}
              >
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText variant="subhead" muted>
                  Searching dictionary...
                </AppText>
              </View>
            )}

            {!isLoading && feedback && <ErrorState {...feedback} />}

            {!isLoading && !feedback && !hasSearched && <EmptyState />}

            {!isLoading && !feedback && primaryEntry && (
              <WordResults
                entries={entries}
                phonetic={phonetic}
                pronunciationAudios={pronunciationAudios}
                selectedPronunciationIndex={selectedPronunciationIndex}
                onSelectedPronunciationIndexChange={setSelectedPronunciationIndex}
                isWide={isWide}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
