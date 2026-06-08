import { AppText } from "@/components/app-text";
import { PronunciationControls } from "@/components/pronunciation-controls";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { LAYOUT } from "@/utils/layout";
import {
  hairlineBorder,
  heroSurface,
  primarySoftSurface,
  primarySurface,
} from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Bookmark } from "lucide-react-native";
import { Pressable, View } from "react-native";

type WordHeaderCardProps = {
  word: string;
  phonetic: string | null;
  pronunciationAudios: PronunciationAudio[];
  selectedPronunciationIndex: number;
  onSelectedPronunciationIndexChange: (index: number) => void;
  isSaved: boolean;
  onToggleSaved: () => void;
  isOfflineSavedResult?: boolean;
};

export function WordHeaderCard({
  word,
  phonetic,
  pronunciationAudios,
  selectedPronunciationIndex,
  onSelectedPronunciationIndexChange,
  isSaved,
  onToggleSaved,
  isOfflineSavedResult = false,
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
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <AppText
            variant="largeTitle"
            selectable
            className="flex-1"
            style={{
              fontSize: 40,
              lineHeight: 48,
              letterSpacing: 0,
            }}
          >
            {word}
          </AppText>

          <Pressable
            onPress={onToggleSaved}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove saved word" : "Save word"}
            accessibilityState={{ selected: isSaved }}
            className="rounded-full items-center justify-center active:opacity-80"
            style={[
              minTouchTargetStyle(42, 42),
              isSaved ? primarySurface(colors) : primarySoftSurface(colors),
              hairlineBorder(isSaved ? colors.primary : colors.separator),
            ]}
          >
            <Bookmark
              size={19}
              color={isSaved ? colors.primaryForeground : colors.primarySoftForeground}
              fill={isSaved ? colors.primaryForeground : "none"}
            />
          </Pressable>
        </View>

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
              isPlaybackDisabled={isOfflineSavedResult}
            />
          </View>
        )}
      </View>
    </View>
  );
}
