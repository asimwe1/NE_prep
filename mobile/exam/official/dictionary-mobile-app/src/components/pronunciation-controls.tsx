import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { usePronunciationPlayback } from "@/utils/use-pronunciation-playback";
import {
  cardSurface,
  fillSurface,
  primarySurface,
} from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Pause, Volume2 } from "lucide-react-native";
import { Pressable, View } from "react-native";

type PronunciationControlsProps = {
  audios: PronunciationAudio[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
};

export function PronunciationControls({
  audios,
  selectedIndex,
  onSelectedIndexChange,
}: PronunciationControlsProps) {
  const colors = useThemeColors();
  const {
    failed,
    hasAudio,
    hasMultipleAudio,
    isLoading,
    isPlaying,
    handlePlayPause,
    handleAccentSelect,
  } = usePronunciationPlayback(audios, selectedIndex, onSelectedIndexChange);

  if (!hasAudio) {
    return null;
  }

  return (
    <View
      className="flex-row flex-wrap items-center"
      style={{ gap: 8 }}
      accessibilityLabel="Pronunciation controls"
    >
      <Pressable
        onPress={() => {
          handlePlayPause().catch(() => undefined);
        }}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={
          isLoading
            ? "Loading pronunciation"
            : isPlaying
              ? "Pause pronunciation"
              : "Play pronunciation"
        }
        accessibilityState={{ disabled: isLoading, busy: isLoading }}
        className="rounded-full items-center justify-center active:opacity-80 disabled:opacity-50"
        style={{
          ...minTouchTargetStyle(40, 40),
          ...(isPlaying ? primarySurface(colors) : fillSurface(colors)),
        }}
      >
        {isPlaying ? (
          <Pause size={18} color={colors.primaryForeground} />
        ) : (
          <Volume2
            size={18}
            color={colors.foreground}
            {...getDecorativeIconA11yProps()}
          />
        )}
      </Pressable>

      {hasMultipleAudio &&
        audios.map((audio, index) => {
          const isSelected = index === selectedIndex;

          return (
            <Pressable
              key={audio.id}
              onPress={() => {
                handleAccentSelect(index).catch(() => undefined);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${audio.label} pronunciation`}
              className="rounded-full px-3.5 items-center justify-center active:opacity-80"
              style={{
                ...minTouchTargetStyle(0, 32),
                ...(isSelected ? primarySurface(colors) : cardSurface(colors)),
              }}
            >
              <AppText
                variant="caption"
                allowFontScaling={false}
                tone={isSelected ? "onPrimary" : "default"}
                className="font-semibold"
              >
                {audio.label}
              </AppText>
            </Pressable>
          );
        })}

      {failed && (
        <AppText
          variant="footnote"
          muted
          selectable
          accessibilityRole="alert"
          className="w-full"
        >
          {failed}
        </AppText>
      )}
    </View>
  );
}
