import type { DictionaryEntry } from "@/types/dictionary";

export function getDisplayPhonetic(entry: DictionaryEntry): string | null {
  if (entry.phonetic?.trim()) {
    return entry.phonetic;
  }

  const phonetic = entry.phonetics.find((item) => item.text?.trim());
  return phonetic?.text ?? null;
}

export function findFirstAudioUrl(entry: DictionaryEntry): string | null {
  const phonetic = entry.phonetics.find((item) => item.audio?.trim());
  return phonetic?.audio ?? null;
}
