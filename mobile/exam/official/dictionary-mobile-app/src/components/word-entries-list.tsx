import { AppText } from "@/components/app-text";
import { MeaningSection } from "@/components/meaning-section";
import type { DictionaryEntry } from "@/types/dictionary";
import { LAYOUT } from "@/utils/layout";
import { View } from "react-native";

type WordEntriesListProps = {
  entries: DictionaryEntry[];
};

export function WordEntriesList({ entries }: WordEntriesListProps) {
  return (
    <View style={{ gap: LAYOUT.meaningSectionGap }}>
      {entries.map((entry, entryIndex) => (
        <View key={`${entry.word}-${entryIndex}`} style={{ gap: LAYOUT.sectionGap }}>
          {entries.length > 1 && (
            <AppText
              variant="footnote"
              muted
              className="uppercase tracking-wide font-semibold px-1"
            >
              Entry {entryIndex + 1}
            </AppText>
          )}

          <View style={{ gap: LAYOUT.meaningSectionGap }}>
            {entry.meanings.map((meaning, meaningIndex) => (
              <MeaningSection
                key={`${meaning.partOfSpeech}-${meaningIndex}`}
                meaning={meaning}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
