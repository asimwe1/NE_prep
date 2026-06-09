import type { DictionaryEntry } from "@/types/dictionary";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@lexi_dictionary_saved_words";
const PREVIEW_MEANING_GROUPS = 2;
const PREVIEW_DEFINITIONS_PER_GROUP = 2;

export type SavedWordItem = {
  word: string;
  normalizedWord: string;
  summary: string;
  entries: DictionaryEntry[];
  savedAt: number;
};

export function createSavedWordItem(
  entries: DictionaryEntry[],
  savedAt = Date.now(),
): SavedWordItem | null {
  const primaryEntry = entries[0];
  const word = primaryEntry?.word?.trim();

  if (!word) {
    return null;
  }

  const previewEntries = getPreviewEntries(entries);

  return {
    word,
    normalizedWord: word.toLowerCase(),
    summary: getSummary(previewEntries),
    entries: previewEntries,
    savedAt,
  };
}

export function upsertSavedWord(
  savedWords: SavedWordItem[],
  item: SavedWordItem,
): SavedWordItem[] {
  const withoutDuplicate = savedWords.filter(
    (savedWord) => savedWord.normalizedWord !== item.normalizedWord,
  );

  return [item, ...withoutDuplicate];
}

export function removeSavedWord(
  savedWords: SavedWordItem[],
  normalizedWord: string,
): SavedWordItem[] {
  return savedWords.filter(
    (savedWord) => savedWord.normalizedWord !== normalizedWord,
  );
}

export function isWordSaved(
  savedWords: SavedWordItem[],
  word: string | undefined,
): boolean {
  const normalizedWord = word?.trim().toLowerCase();

  if (!normalizedWord) {
    return false;
  }

  return savedWords.some((savedWord) => savedWord.normalizedWord === normalizedWord);
}

export async function loadSavedWords(): Promise<SavedWordItem[]> {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isSavedWordItem);
  } catch {
    return [];
  }
}

export async function saveSavedWords(
  savedWords: SavedWordItem[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
  } catch {
    // Saved words still work for the current session.
  }
}

function getPreviewEntries(entries: DictionaryEntry[]): DictionaryEntry[] {
  let remainingMeaningGroups = PREVIEW_MEANING_GROUPS;

  return entries.reduce<DictionaryEntry[]>((previewEntries, entry) => {
    if (remainingMeaningGroups <= 0) {
      return previewEntries;
    }

    const meanings = entry.meanings
      .slice(0, remainingMeaningGroups)
      .map((meaning) => ({
        ...meaning,
        definitions: meaning.definitions.slice(0, PREVIEW_DEFINITIONS_PER_GROUP),
      }))
      .filter((meaning) => meaning.definitions.length > 0);

    remainingMeaningGroups -= meanings.length;

    if (meanings.length === 0) {
      return previewEntries;
    }

    previewEntries.push({
      ...entry,
      meanings,
    });

    return previewEntries;
  }, []);
}

function getSummary(entries: DictionaryEntry[]): string {
  for (const entry of entries) {
    for (const meaning of entry.meanings) {
      const definition = meaning.definitions[0]?.definition?.trim();

      if (definition) {
        return shortenDefinition(definition);
      }
    }
  }

  return "Saved dictionary preview";
}

function shortenDefinition(definition: string) {
  const normalizedDefinition = definition.replace(/\s+/g, " ").trim();

  if (normalizedDefinition.length <= 96) {
    return normalizedDefinition;
  }

  return `${normalizedDefinition.slice(0, 93).trim()}...`;
}

function isSavedWordItem(value: unknown): value is SavedWordItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SavedWordItem>;

  return (
    typeof item.word === "string" &&
    typeof item.normalizedWord === "string" &&
    typeof item.summary === "string" &&
    typeof item.savedAt === "number" &&
    Array.isArray(item.entries)
  );
}
