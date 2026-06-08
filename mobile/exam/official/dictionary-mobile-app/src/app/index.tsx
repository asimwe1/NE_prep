import { AppText } from "@/components/app-text";
import { DrawerHistory } from "@/components/drawer-history";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { MeaningSection } from "@/components/meaning-section";
import { PronunciationButton } from "@/components/pronunciation-button";
import { SearchBox } from "@/components/search-box";
import { useThemeColors } from "@/utils/use-theme-colors";
import {
  DictionaryApiError,
  DictionaryMalformedResponseError,
  DictionaryNetworkError,
  searchWord,
} from "@/services/dictionary-api";
import type { DictionaryEntry } from "@/types/dictionary";
import {
  findPronunciationAudios,
  getDisplayPhonetic,
} from "@/utils/dictionary-format";
import { updateSearchHistory } from "@/utils/history";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Clock3 } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getFriendlyError(error: unknown): string {
  if (error instanceof DictionaryApiError && error.status === 404) {
    return "No definition found for this word. Check the spelling and try again.";
  }

  if (error instanceof DictionaryNetworkError) {
    return "Unable to reach the dictionary service. Check your connection and try again.";
  }

  if (error instanceof DictionaryMalformedResponseError) {
    return "The dictionary service returned data this app could not read. Try another word.";
  }

  if (error instanceof DictionaryApiError) {
    return "The dictionary service could not complete this search. Try again.";
  }

  return "Unable to reach the dictionary service. Check your connection and try again.";
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const [query, setQuery] = React.useState("");
  const [entries, setEntries] = React.useState<DictionaryEntry[]>([]);
  const [error, setError] = React.useState<string | null>(null);
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
      setError("Enter a word to see definitions and examples.");
      setHasSearched(true);
      setSelectedPronunciationIndex(0);
      return;
    }

    setIsLoading(true);
    setError(null);
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
      setError(getFriendlyError(searchError));
      setSelectedPronunciationIndex(0);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    runSearch(query).catch(() => {
      setError("Something went wrong while searching. Try again.");
      setIsLoading(false);
    });
  }

  function handleHistorySelect(word: string) {
    setIsHistoryOpen(false);
    runSearch(word).catch(() => {
      setError("Something went wrong while searching. Try again.");
      setIsLoading(false);
    });
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={{ flex: 1 }}
      edges={["top", "left", "right"]}
    >
      <DrawerHistory
        history={history}
        isVisible={isHistoryOpen}
        isLoading={isLoading}
        onClose={() => setIsHistoryOpen(false)}
        onSelectWord={handleHistorySelect}
      />

      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between border-b border-separator">
        <View className="flex-1 pr-3" accessibilityRole="header">
          <AppText variant="title1">
            Lexi Dictionary
          </AppText>
          <AppText variant="subhead" muted className="mt-0.5">
            Definitions, examples, and pronunciation
          </AppText>
        </View>

        <Pressable
          onPress={() => setIsHistoryOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open search history"
          accessibilityHint="Shows your recent successful searches"
          className="rounded-full bg-card border border-separator items-center justify-center active:bg-muted border-continuous"
          style={minTouchTargetStyle()}
        >
          <Clock3 size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          contentContainerClassName="px-5 pt-4 pb-safe gap-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          nestedScrollEnabled
        >
          <SearchBox
            value={query}
            isLoading={isLoading}
            onChangeText={setQuery}
            onSubmit={handleSearch}
          />

          {isLoading && (
            <View
              className="items-center justify-center rounded-[12px] bg-card py-12 gap-3 border border-separator border-continuous"
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

          {!isLoading && error && <ErrorState message={error} />}

          {!isLoading && !error && !hasSearched && <EmptyState />}

          {!isLoading && !error && primaryEntry && (
            <View className="gap-4">
              <View className="rounded-[12px] bg-card p-5 gap-4 border border-separator border-continuous">
                <View className="gap-1">
                  <AppText variant="largeTitle" selectable>
                    {primaryEntry.word}
                  </AppText>
                  {phonetic && (
                    <AppText variant="body" muted selectable>
                      {phonetic}
                    </AppText>
                  )}
                </View>

                <PronunciationButton
                  key={
                    pronunciationAudios.map((audio) => audio.url).join("|") ||
                    "no-audio"
                  }
                  audios={pronunciationAudios}
                  selectedIndex={selectedPronunciationIndex}
                  onSelectedIndexChange={setSelectedPronunciationIndex}
                />
              </View>

              {entries.map((entry, entryIndex) => (
                <View key={`${entry.word}-${entryIndex}`} className="gap-3">
                  {entries.length > 1 && (
                    <AppText
                      variant="footnote"
                      muted
                      className="uppercase tracking-wide font-semibold px-1"
                    >
                      Entry {entryIndex + 1}
                    </AppText>
                  )}

                  {entry.meanings.map((meaning, meaningIndex) => (
                    <MeaningSection
                      key={`${meaning.partOfSpeech}-${meaningIndex}`}
                      meaning={meaning}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
