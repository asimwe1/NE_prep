import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { MeaningSection } from "@/components/meaning-section";
import { PronunciationButton } from "@/components/pronunciation-button";
import { SearchBox } from "@/components/search-box";
import { DictionaryApiError, searchWord } from "@/services/dictionary-api";
import type { DictionaryEntry } from "@/types/dictionary";
import {
  findPronunciationAudios,
  getDisplayPhonetic,
} from "@/utils/dictionary-format";
import { BookOpenText } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

function getFriendlyError(error: unknown): string {
  if (error instanceof DictionaryApiError && error.status === 404) {
    return "No definition found for this word. Check the spelling and try again.";
  }

  if (error instanceof DictionaryApiError) {
    return "The dictionary service could not complete this search. Try again.";
  }

  return "Unable to reach the dictionary service. Check your connection and try again.";
}

export default function HomeScreen() {
  const [query, setQuery] = React.useState("");
  const [entries, setEntries] = React.useState<DictionaryEntry[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const primaryEntry = entries[0];
  const pronunciationAudios = primaryEntry
    ? findPronunciationAudios(primaryEntry)
    : [];
  const phonetic = primaryEntry ? getDisplayPhonetic(primaryEntry) : null;

  async function handleSearch() {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      setEntries([]);
      setError("Enter a word to see definitions and examples.");
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await searchWord(normalizedQuery);
      setEntries(result);
    } catch (searchError) {
      setEntries([]);
      setError(getFriendlyError(searchError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="px-5 pt-5 pb-safe gap-5"
    >
      <View className="gap-3">
        <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center border-continuous">
          <BookOpenText size={24} color="#ffffff" />
        </View>
        <View className="gap-1">
          <Text className="text-[30px] font-bold text-foreground">
            Find any English word
          </Text>
          <Text className="text-[16px] leading-6 text-muted-foreground">
            Search definitions, examples, meanings, and pronunciation from the
            free Dictionary API.
          </Text>
        </View>
      </View>

      <SearchBox
        value={query}
        isLoading={isLoading}
        onChangeText={setQuery}
        onSubmit={handleSearch}
      />

      {isLoading && (
        <View className="items-center justify-center rounded-2xl bg-secondary py-10 gap-3 border-continuous">
          <ActivityIndicator size="large" colorClassName="accent-primary" />
          <Text className="text-[15px] text-muted-foreground">
            Searching dictionary...
          </Text>
        </View>
      )}

      {!isLoading && error && <ErrorState message={error} />}

      {!isLoading && !error && !hasSearched && <EmptyState />}

      {!isLoading && !error && primaryEntry && (
        <View className="gap-5">
          <View className="rounded-2xl bg-secondary p-5 gap-4 border-continuous">
            <View className="gap-1">
              <Text selectable className="text-[34px] font-bold text-foreground">
                {primaryEntry.word}
              </Text>
              {phonetic && (
                <Text selectable className="text-[17px] text-muted-foreground">
                  {phonetic}
                </Text>
              )}
            </View>

            <PronunciationButton
              key={
                pronunciationAudios.map((audio) => audio.url).join("|") ||
                "no-audio"
              }
              audios={pronunciationAudios}
            />
          </View>

          {entries.map((entry, entryIndex) => (
            <View key={`${entry.word}-${entryIndex}`} className="gap-4">
              {entries.length > 1 && (
                <Text className="text-[13px] font-semibold uppercase text-muted-foreground">
                  Entry {entryIndex + 1}
                </Text>
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
  );
}
