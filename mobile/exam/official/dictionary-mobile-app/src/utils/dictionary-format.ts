import type { DictionaryEntry } from "@/types/dictionary";

export function getDisplayPhonetic(entry: DictionaryEntry): string | null {
  if (entry.phonetic?.trim()) {
    return entry.phonetic;
  }

  const phonetic = entry.phonetics.find((item) => item.text?.trim());
  return phonetic?.text ?? null;
}

export function findAudioUrls(entry: DictionaryEntry): string[] {
  const urls = entry.phonetics
    .map((item) => item.audio?.trim())
    .filter((audio): audio is string => Boolean(audio));

  return Array.from(new Set(urls));
}
