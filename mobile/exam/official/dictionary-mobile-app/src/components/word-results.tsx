import { WordEntriesList } from "@/components/word-entries-list";
import { WordHeaderCard } from "@/components/word-header-card";
import type { DictionaryEntry } from "@/types/dictionary";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { LAYOUT } from "@/utils/layout";
import { View } from "react-native";

type WordResultsProps = {
  entries: DictionaryEntry[];
  phonetic: string | null;
  pronunciationAudios: PronunciationAudio[];
  selectedPronunciationIndex: number;
  onSelectedPronunciationIndexChange: (index: number) => void;
  isWide: boolean;
  isSaved: boolean;
  onToggleSaved: () => void;
  isSavedPreviewResult: boolean;
  playbackDisabledMessage?: string;
};

export function WordResults({
  entries,
  phonetic,
  pronunciationAudios,
  selectedPronunciationIndex,
  onSelectedPronunciationIndexChange,
  isWide,
  isSaved,
  onToggleSaved,
  isSavedPreviewResult,
  playbackDisabledMessage,
}: WordResultsProps) {
  const primaryEntry = entries[0];

  if (!primaryEntry) {
    return null;
  }

  const header = (
    <WordHeaderCard
      word={primaryEntry.word}
      phonetic={phonetic}
      pronunciationAudios={pronunciationAudios}
      selectedPronunciationIndex={selectedPronunciationIndex}
      onSelectedPronunciationIndexChange={onSelectedPronunciationIndexChange}
      isSaved={isSaved}
      onToggleSaved={onToggleSaved}
      isSavedPreviewResult={isSavedPreviewResult}
      playbackDisabledMessage={playbackDisabledMessage}
    />
  );

  const meanings = <WordEntriesList entries={entries} />;

  if (!isWide) {
    return (
      <View style={{ gap: LAYOUT.sectionGap }}>
        {header}
        {meanings}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 24,
      }}
    >
      <View style={{ flex: 1, maxWidth: LAYOUT.heroColumnMaxWidth }}>{header}</View>
      <View
        style={{
          flex: 1.35,
          maxWidth: LAYOUT.definitionColumnMaxWidth,
          gap: LAYOUT.meaningSectionGap,
        }}
      >
        {meanings}
      </View>
    </View>
  );
}
