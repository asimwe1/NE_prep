import type { DictionaryEntry } from "@/types/dictionary";

export type PronunciationAudio = {
  id: string;
  label: string;
  accessibilityLabel: string;
  url: string;
  phoneticText?: string;
};

type RawPronunciationAudio = {
  id: string;
  accent: string | null;
  descriptor: string | null;
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

  const rawAudios = entry.phonetics.reduce<RawPronunciationAudio[]>(
    (audios, phonetic) => {
      const url = phonetic.audio?.trim();

      if (!url || seen.has(url)) {
        return audios;
      }

      const audioParts = getAudioParts(url);

      seen.add(url);
      audios.push({
        id: url,
        accent: audioParts.accent,
        descriptor: audioParts.descriptor,
        url,
        phoneticText: phonetic.text?.trim() || undefined,
      });

      return audios;
    },
    [],
  );

  return labelPronunciationAudios(rawAudios);
}

function labelPronunciationAudios(
  rawAudios: RawPronunciationAudio[],
): PronunciationAudio[] {
  const accentCounts = rawAudios.reduce<Record<string, number>>(
    (counts, audio) => {
      const accent = audio.accent ?? "ALT";
      counts[accent] = (counts[accent] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const accentIndexes: Record<string, number> = {};

  return rawAudios.map((audio, index) => {
    const accent = audio.accent ?? "ALT";
    const accentIndex = (accentIndexes[accent] ?? 0) + 1;
    accentIndexes[accent] = accentIndex;
    const label =
      accentCounts[accent] > 1 ? `${accent} ${accentIndex}` : accent;

    return {
      id: audio.id,
      label,
      accessibilityLabel: getAccessibilityLabel(
        accent,
        accentIndex,
        accentCounts[accent],
        audio.descriptor,
        index,
      ),
      url: audio.url,
      phoneticText: audio.phoneticText,
    };
  });
}

function getAudioParts(audioUrl: string): {
  accent: string | null;
  descriptor: string | null;
} {
  const fileName = decodeURIComponent(audioUrl.split("/").pop() ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase();
  const tokens = fileName.split(/[-_\s]+/).filter(Boolean);
  const accent = getAccent(tokens);

  return {
    accent,
    descriptor: getDescriptor(tokens),
  };
}

function getAccent(tokens: string[]): string | null {
  const accentToken = tokens.find((token) => ACCENT_LABELS[token]);

  if (accentToken) {
    return ACCENT_LABELS[accentToken];
  }

  if (tokens.includes("united") && tokens.includes("states")) {
    return "US";
  }

  if (tokens.includes("united") && tokens.includes("kingdom")) {
    return "UK";
  }

  return null;
}

function getDescriptor(tokens: string[]): string | null {
  if (tokens.includes("stressed")) {
    return "stressed";
  }

  if (tokens.includes("unstressed")) {
    return "unstressed";
  }

  return null;
}

function getAccessibilityLabel(
  accent: string,
  accentIndex: number,
  accentCount: number,
  descriptor: string | null,
  fallbackIndex: number,
) {
  const accentName = ACCENT_NAMES[accent] ?? `Pronunciation ${fallbackIndex + 1}`;
  const variant = accentCount > 1 ? ` variant ${accentIndex}` : "";
  const descriptorLabel = descriptor ? `, ${descriptor}` : "";

  return `${accentName}${variant}${descriptorLabel}`;
}

const ACCENT_LABELS: Record<string, string> = {
  au: "AU",
  australia: "AU",
  australian: "AU",
  ca: "CA",
  canada: "CA",
  canadian: "CA",
  gb: "UK",
  uk: "UK",
  unitedkingdom: "UK",
  us: "US",
  usa: "US",
  unitedstates: "US",
};

const ACCENT_NAMES: Record<string, string> = {
  ALT: "Alternative pronunciation",
  AU: "Australian pronunciation",
  CA: "Canadian pronunciation",
  UK: "UK pronunciation",
  US: "US pronunciation",
};
