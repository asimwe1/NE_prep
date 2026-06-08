import type { PronunciationAudio } from "@/utils/dictionary-format";
import { Pause, Play, Square, Volume2 } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as React from "react";
import { Pressable, Text, View } from "react-native";

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
      <View className="rounded-xl bg-card border border-border px-4 py-3 border-continuous">
        <Text className="text-[14px] text-muted-foreground">
          No pronunciation audio is available for this word.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
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
          className="h-11 flex-1 rounded-xl bg-card border border-border px-4 flex-row items-center justify-center gap-2 active:bg-muted disabled:opacity-50 border-continuous"
        >
          {isPlaying ? (
            <Pause size={18} color="#111827" />
          ) : (
            <Play size={18} color="#111827" />
          )}
          <Text className="text-[15px] font-semibold text-foreground">
            {isLoading ? "Loading audio..." : isPlaying ? "Pause" : "Play"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            handleStop().catch(() => {
              setFailed("Pronunciation audio could not be stopped.");
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Stop pronunciation"
          className="h-11 w-12 rounded-xl bg-card border border-border items-center justify-center active:bg-muted border-continuous"
        >
          <Square size={17} color="#111827" />
        </Pressable>
      </View>

      <View className="gap-2">
        <View className="flex-row flex-wrap gap-2">
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
                accessibilityRole="button"
                accessibilityLabel={`Select ${audio.label} pronunciation`}
                className={
                  isSelected
                    ? "h-10 rounded-xl bg-primary px-4 flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-100 border-continuous"
                    : "h-10 rounded-xl bg-secondary border border-border px-4 flex-row items-center justify-center gap-2 active:bg-muted disabled:opacity-50 border-continuous"
                }
              >
                <Text
                  className={
                    isSelected
                      ? "text-[14px] font-semibold text-primary-foreground"
                      : "text-[14px] font-semibold text-foreground"
                  }
                >
                  {audio.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center gap-2">
          <Volume2 size={16} color="#111827" />
          <Text className="text-[14px] font-medium text-muted-foreground">
            {hasMultipleAudio
              ? `${currentAudio?.label} accent selected`
              : `${currentAudio?.label} pronunciation available`}
            {currentAudio?.phoneticText ? ` - ${currentAudio.phoneticText}` : ""}
          </Text>
        </View>
      </View>

      {failed && (
        <Text selectable className="text-[13px] text-muted-foreground">
          {failed}
        </Text>
      )}
    </View>
  );
}
