import { AppHeader } from "@/components/app-header";
import { AppText } from "@/components/app-text";
import { DrawerHistory } from "@/components/drawer-history";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { SearchSection } from "@/components/search-section";
import { WordResults } from "@/components/word-results";
import { useThemeColors } from "@/utils/use-theme-colors";
import { DictionaryNetworkError, searchWord } from "@/services/dictionary-api";
import type { DictionaryEntry } from "@/types/dictionary";
import {
  findPronunciationAudios,
  getDisplayPhonetic,
} from "@/utils/dictionary-format";
import {
  loadSearchHistory,
  saveSearchHistory,
  updateSearchHistory,
  type SearchHistoryItem,
} from "@/utils/history";
import {
  createSavedWordItem,
  isWordSaved,
  loadSavedWords,
  removeSavedWord,
  saveSavedWords,
  upsertSavedWord,
  type SavedWordItem,
} from "@/utils/saved-words";
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
  const [history, setHistory] = React.useState<SearchHistoryItem[]>([]);
  const [savedWords, setSavedWords] = React.useState<SavedWordItem[]>([]);
  const [isSavedResult, setIsSavedResult] = React.useState(false);
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
  const isCurrentWordSaved = isWordSaved(savedWords, primaryEntry?.word);

  React.useEffect(() => {
    let isMounted = true;

    Promise.all([loadSearchHistory(), loadSavedWords()]).then(
      ([storedHistory, storedSavedWords]) => {
        if (isMounted) {
          setHistory(storedHistory);
          setSavedWords(storedSavedWords);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const applyHistoryUpdate = React.useCallback(
    (updater: (currentHistory: SearchHistoryItem[]) => SearchHistoryItem[]) => {
      setHistory((currentHistory) => {
        const nextHistory = updater(currentHistory);
        saveSearchHistory(nextHistory).catch(() => undefined);
        return nextHistory;
      });
    },
    [],
  );

  const applySavedWordsUpdate = React.useCallback(
    (updater: (currentSavedWords: SavedWordItem[]) => SavedWordItem[]) => {
      setSavedWords((currentSavedWords) => {
        const nextSavedWords = updater(currentSavedWords);
        saveSavedWords(nextSavedWords).catch(() => undefined);
        return nextSavedWords;
      });
    },
    [],
  );

  async function runSearch(rawWord: string) {
    const normalizedQuery = rawWord.trim().toLowerCase();

    if (!normalizedQuery) {
      setEntries([]);
      setFeedback(EMPTY_SEARCH_FEEDBACK);
      setHasSearched(true);
      setSelectedPronunciationIndex(0);
      setIsSavedResult(false);
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
      setIsSavedResult(false);
      applyHistoryUpdate((currentHistory) =>
        updateSearchHistory(
          currentHistory,
          result[0]?.word?.trim() || normalizedQuery,
          result,
        ),
      );
    } catch (searchError) {
      const savedItem =
        searchError instanceof DictionaryNetworkError
          ? savedWords.find(
              (item) => item.normalizedWord === normalizedQuery,
            ) ?? null
          : null;

      if (savedItem) {
        setEntries(savedItem.entries);
        setFeedback(null);
        setSelectedPronunciationIndex(0);
        setIsSavedResult(true);
        setQuery(savedItem.word);
        return;
      }

      setEntries([]);
      setFeedback(getSearchFeedback(searchError, normalizedQuery));
      setSelectedPronunciationIndex(0);
      setIsSavedResult(false);
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

  function handleHistorySelect(item: SearchHistoryItem) {
    setIsHistoryOpen(false);
    runSearch(item.word).catch(() => {
      setFeedback(getSearchFeedback(new Error("search failed")));
      setIsLoading(false);
    });
  }

  function handleSavedWordSelect(item: SavedWordItem) {
    setIsHistoryOpen(false);
    setQuery(item.word);
    setEntries(item.entries);
    setFeedback(null);
    setHasSearched(true);
    setSelectedPronunciationIndex(0);
    setIsSavedResult(true);
  }

  function handleToggleSavedWord() {
    if (!primaryEntry) {
      return;
    }

    if (isCurrentWordSaved) {
      applySavedWordsUpdate((currentSavedWords) =>
        removeSavedWord(currentSavedWords, primaryEntry.word.trim().toLowerCase()),
      );
      return;
    }

    const savedWordItem = createSavedWordItem(entries);

    if (!savedWordItem) {
      return;
    }

    applySavedWordsUpdate((currentSavedWords) =>
      upsertSavedWord(currentSavedWords, savedWordItem),
    );
  }

  return (
    <SafeAreaView
      style={screenSurface(colors)}
      edges={["top", "left", "right"]}
    >
      <DrawerHistory
        history={history}
        savedWords={savedWords}
        isVisible={isHistoryOpen}
        isLoading={isLoading}
        onClose={() => setIsHistoryOpen(false)}
        onSelectWord={handleHistorySelect}
        onSelectSavedWord={handleSavedWordSelect}
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
                isSaved={isCurrentWordSaved}
                onToggleSaved={handleToggleSavedWord}
                isSavedResult={isSavedResult}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
