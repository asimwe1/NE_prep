import { AppText } from "@/components/app-text";
import { PronunciationControls } from "@/components/pronunciation-controls";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { LAYOUT } from "@/utils/layout";
import { heroSurface, primarySoftSurface } from "@/utils/themed-styles";
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
      className="rounded-[22px] overflow-hidden"
      style={{
        ...heroSurface(colors),
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${word}${phonetic ? `, ${phonetic}` : ""}`}
    >
      <View
        style={{
          height: 5,
          backgroundColor: colors.accent,
        }}
      />

      <View
        style={{
          padding: LAYOUT.heroCardPadding,
          gap: 10,
        }}
      >
        <AppText
          variant="largeTitle"
          selectable
          style={{
            fontSize: 40,
            lineHeight: 48,
            letterSpacing: 0,
          }}
        >
          {word}
        </AppText>

        {phonetic && (
          <View
            className="self-start rounded-full px-3 py-1"
            style={primarySoftSurface(colors)}
          >
            <AppText
              variant="subhead"
              tone="primary"
              selectable
              className="font-semibold"
            >
              {phonetic}
            </AppText>
          </View>
        )}

        {hasAudio && (
          <View style={{ paddingTop: 4 }}>
            <PronunciationControls
              key={
                pronunciationAudios.map((audio) => audio.url).join("|") ||
                "no-audio"
              }
              audios={pronunciationAudios}
              selectedIndex={selectedPronunciationIndex}
              onSelectedIndexChange={onSelectedPronunciationIndexChange}
            />
          </View>
        )}
      </View>
    </View>
  );
}
