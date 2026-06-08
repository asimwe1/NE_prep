import { Pause, Play, SkipForward, Square, Volume2 } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as React from "react";
import { Pressable, Text, View } from "react-native";

type PronunciationButtonProps = {
  audioUrls: string[];
};

export function PronunciationButton({ audioUrls }: PronunciationButtonProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [failed, setFailed] = React.useState<string | null>(null);
  const currentUrl = audioUrls[selectedIndex] ?? null;
  const player = useAudioPlayer(currentUrl, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const hasAudio = audioUrls.length > 0;
  const isLoading = hasAudio && !status.isLoaded;
  const isPlaying = status.playing;
  const hasMultipleAudio = audioUrls.length > 1;

  React.useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0).catch(() => {
        setFailed("Pronunciation finished, but the player could not reset.");
      });
    }
  }, [player, status.didJustFinish]);

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

  async function handleNextAudio() {
    if (!hasMultipleAudio) {
      return;
    }

    setFailed(null);

    try {
      player.pause();
      await player.seekTo(0);
      setSelectedIndex((current) => (current + 1) % audioUrls.length);
    } catch {
      setFailed("The next pronunciation audio could not be loaded.");
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

      <Pressable
        onPress={() => {
          handleNextAudio().catch(() => {
            setFailed("The next pronunciation audio could not be selected.");
          });
        }}
        disabled={!hasMultipleAudio}
        accessibilityRole="button"
        accessibilityLabel="Use next pronunciation audio"
        className="h-10 rounded-xl bg-secondary border border-border px-4 flex-row items-center justify-center gap-2 active:bg-muted disabled:opacity-50 border-continuous"
      >
        {hasMultipleAudio ? (
          <SkipForward size={16} color="#111827" />
        ) : (
          <Volume2 size={16} color="#111827" />
        )}
        <Text className="text-[14px] font-medium text-foreground">
          {hasMultipleAudio
            ? `Pronunciation ${selectedIndex + 1} of ${audioUrls.length}`
            : "One pronunciation available"}
        </Text>
      </Pressable>

      {failed && (
        <Text selectable className="text-[13px] text-muted-foreground">
          {failed}
        </Text>
      )}
    </View>
  );
}
