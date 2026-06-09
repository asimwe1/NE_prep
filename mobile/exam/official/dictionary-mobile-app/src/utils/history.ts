import type { DictionaryEntry } from "@/types/dictionary";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MAX_HISTORY_ITEMS = 20;
const STORAGE_KEY = "@lexi_dictionary_search_history";

export type SearchHistoryItem = {
  word: string;
  normalizedWord: string;
  summary: string;
  searchedAt: number;
};

export function updateSearchHistory(
  history: SearchHistoryItem[],
  word: string,
  entries: DictionaryEntry[],
  searchedAt = Date.now(),
): SearchHistoryItem[] {
  const displayWord = word.trim();
  const normalizedWord = displayWord.toLowerCase();

  if (!normalizedWord || entries.length === 0) {
    return history;
  }

  const withoutDuplicate = history.filter(
    (item) => item.normalizedWord !== normalizedWord,
  );

  return [
    {
      word: displayWord,
      normalizedWord,
      summary: getHistorySummary(entries),
      searchedAt,
    },
    ...withoutDuplicate,
  ].slice(0, MAX_HISTORY_ITEMS);
}

export async function loadSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isSearchHistoryItem).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export async function saveSearchHistory(
  history: SearchHistoryItem[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // History still works for the current session.
  }
}

export function getRelativeSearchTime(
  searchedAt: number,
  now = Date.now(),
): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - searchedAt) / 1000));

  if (elapsedSeconds < 1) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds} sec ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

function getHistorySummary(entries: DictionaryEntry[]): string {
  for (const entry of entries) {
    for (const meaning of entry.meanings) {
      const definition = meaning.definitions[0]?.definition?.trim();

      if (definition) {
        return shortenDefinition(definition);
      }
    }
  }

  return "Saved dictionary result";
}

function shortenDefinition(definition: string) {
  const normalizedDefinition = definition.replace(/\s+/g, " ").trim();

  if (normalizedDefinition.length <= 96) {
    return normalizedDefinition;
  }

  return `${normalizedDefinition.slice(0, 93).trim()}...`;
}

function isSearchHistoryItem(value: unknown): value is SearchHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SearchHistoryItem>;

  return (
    typeof item.word === "string" &&
    typeof item.normalizedWord === "string" &&
    typeof item.summary === "string" &&
    typeof item.searchedAt === "number"
  );
}
