import { AppText } from "@/components/app-text";
import { useThemeColors } from "@/utils/use-theme-colors";
import type { PronunciationAudio } from "@/utils/dictionary-format";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { minTouchTargetStyle } from "@/utils/touch-target";
import { Pause, Play, Square, Volume2 } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as React from "react";
import { Pressable, View } from "react-native";

type PronunciationButtonProps = {
  audios: PronunciationAudio[];
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
};

export function PronunciationButton({
  audios,
  selectedIndex,
  onSelectedIndexChange,
}: PronunciationButtonProps) {
  const colors = useThemeColors();
  const [failed, setFailed] = React.useState<string | null>(null);
  const currentAudio = audios[selectedIndex] ?? null;
  const currentUrl = currentAudio?.url ?? null;
  const player = useAudioPlayer(currentUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const hasAudio = audios.length > 0;
  const isLoading = hasAudio && !status.isLoaded;
  const isPlaying = status.playing;
  const hasMultipleAudio = audios.length > 1;

  async function handlePlayPause() {
    if (!hasAudio) {
      return;
    }

    setFailed(null);

    if (isPlaying) {
      player.pause();
      return;
    }

    if (status.didJustFinish || status.currentTime >= status.duration) {
      await player.seekTo(0);
    }

    player.play();
  }

  async function handleStop() {
    setFailed(null);

    if (!hasAudio) {
      return;
    }

    try {
      player.pause();
      await player.seekTo(0);
    } catch {
      setFailed("Pronunciation audio could not be stopped cleanly.");
    }
  }

  async function handleAccentSelect(index: number) {
    if (index === selectedIndex) {
      return;
    }

    setFailed(null);

    try {
      player.pause();
      await player.seekTo(0);
      onSelectedIndexChange(index);
    } catch {
      setFailed("The selected accent audio could not be loaded.");
    }
  }

  if (!hasAudio) {
    return (
      <View className="rounded-[10px] bg-secondary px-4 py-3 border-continuous">
        <AppText variant="subhead" muted>
          No pronunciation audio is available for this word.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3" accessibilityLabel="Pronunciation controls">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => {
            handlePlayPause().catch(() => {
              setFailed("Pronunciation audio could not be played.");
            });
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isPlaying ? "Pause pronunciation" : "Play pronunciation"
          }
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
          className="flex-1 rounded-[10px] bg-secondary px-4 flex-row items-center justify-center gap-2 active:bg-muted disabled:opacity-50 border-continuous"
          style={minTouchTargetStyle()}
        >
          {isPlaying ? (
            <Pause size={18} color={colors.foreground} />
          ) : (
            <Play size={18} color={colors.foreground} />
          )}
          <AppText variant="headline" allowFontScaling={false}>
            {isLoading ? "Loading audio..." : isPlaying ? "Pause" : "Play"}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => {
            handleStop().catch(() => {
              setFailed("Pronunciation audio could not be stopped.");
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Stop pronunciation"
          className="rounded-[10px] bg-secondary items-center justify-center active:bg-muted border-continuous"
          style={minTouchTargetStyle()}
        >
          <Square size={17} color={colors.foreground} />
        </Pressable>
      </View>

      <View className="gap-2">
        <View
          className="flex-row flex-wrap gap-2"
          accessibilityRole="radiogroup"
          accessibilityLabel="Pronunciation accent"
        >
          {audios.map((audio, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={audio.id}
                onPress={() => {
                  handleAccentSelect(index).catch(() => {
                    setFailed("The selected accent audio could not be used.");
                  });
                }}
                disabled={!hasMultipleAudio}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: !hasMultipleAudio }}
                accessibilityLabel={`${audio.label} pronunciation`}
                className={
                  isSelected
                    ? "rounded-full bg-primary px-4 flex-row items-center justify-center active:opacity-80 border-continuous"
                    : "rounded-full bg-card border border-separator px-4 flex-row items-center justify-center active:bg-muted disabled:opacity-50 border-continuous"
                }
                style={minTouchTargetStyle()}
              >
                <AppText
                  variant="footnote"
                  allowFontScaling={false}
                  className={
                    isSelected
                      ? "font-semibold text-primary-foreground"
                      : "font-semibold"
                  }
                >
                  {audio.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center gap-2 px-0.5">
          <Volume2
            size={15}
            color={colors.mutedForeground}
            {...getDecorativeIconA11yProps()}
          />
          <AppText variant="footnote" muted className="flex-1">
            {hasMultipleAudio
              ? `${currentAudio?.label} accent selected`
              : `${currentAudio?.label} pronunciation available`}
            {currentAudio?.phoneticText ? ` · ${currentAudio.phoneticText}` : ""}
          </AppText>
        </View>
      </View>

      {failed && (
        <AppText variant="footnote" muted selectable accessibilityRole="alert">
          {failed}
        </AppText>
      )}
    </View>
  );
}
