import type { DictionaryEntry } from "@/types/dictionary";

export type PronunciationAudio = {
  id: string;
  label: string;
  url: string;
  phoneticText?: string;
};

export function getDisplayPhonetic(entry: DictionaryEntry): string | null {
  if (entry.phonetic?.trim()) {
    return entry.phonetic;
  }

  const phonetic = entry.phonetics.find((item) => item.text?.trim());
  return phonetic?.text ?? null;
}

export function findPronunciationAudios(
  entry: DictionaryEntry,
): PronunciationAudio[] {
  const seen = new Set<string>();

  return entry.phonetics.reduce<PronunciationAudio[]>((audios, phonetic) => {
    const url = phonetic.audio?.trim();

    if (!url || seen.has(url)) {
      return audios;
    }

    seen.add(url);
    audios.push({
      id: url,
      label: getAccentLabel(url, audios.length),
      url,
      phoneticText: phonetic.text?.trim() || undefined,
    });

    return audios;
  }, []);
}

function getAccentLabel(audioUrl: string, fallbackIndex: number): string {
  const fileName = audioUrl.split("/").pop() ?? "";
  const match = fileName.match(/-([a-z]{2})(?:\.[a-z0-9]+)?$/i);
  const accent = match?.[1]?.toUpperCase();

  if (accent) {
    return accent;
  }

  return `Audio ${fallbackIndex + 1}`;
}
