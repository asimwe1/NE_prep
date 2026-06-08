import { AppText } from "@/components/app-text";
import { PronunciationControls } from "@/components/pronunciation-controls";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { LAYOUT } from "@/utils/layout";
import { cardSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { View } from "react-native";

type WordHeaderCardProps = {
  word: string;
  phonetic: string | null;
  pronunciationAudios: PronunciationAudio[];
  selectedPronunciationIndex: number;
  onSelectedPronunciationIndexChange: (index: number) => void;
};

export function WordHeaderCard({
  word,
  phonetic,
  pronunciationAudios,
  selectedPronunciationIndex,
  onSelectedPronunciationIndexChange,
}: WordHeaderCardProps) {
  const colors = useThemeColors();
  const hasAudio = pronunciationAudios.length > 0;

  return (
    <View
      className="rounded-[12px]"
      style={{
        ...cardSurface(colors),
        padding: LAYOUT.heroCardPadding,
        gap: 8,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${word}${phonetic ? `, ${phonetic}` : ""}`}
    >
      <AppText variant="largeTitle" selectable>
        {word}
      </AppText>

      {phonetic && (
        <AppText variant="body" muted selectable>
          {phonetic}
        </AppText>
      )}

      {hasAudio && (
        <PronunciationControls
          key={
            pronunciationAudios.map((audio) => audio.url).join("|") || "no-audio"
          }
          audios={pronunciationAudios}
          selectedIndex={selectedPronunciationIndex}
          onSelectedIndexChange={onSelectedPronunciationIndexChange}
        />
      )}
    </View>
  );
}
