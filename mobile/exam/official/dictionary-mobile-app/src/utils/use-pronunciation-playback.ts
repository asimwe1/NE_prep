import type { PronunciationAudio } from "@/utils/dictionary-format";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as React from "react";

export function usePronunciationPlayback(
  audios: PronunciationAudio[],
  selectedIndex: number,
  onSelectedIndexChange: (index: number) => void,
) {
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

  return {
    currentAudio,
    failed,
    hasAudio,
    hasMultipleAudio,
    isLoading,
    isPlaying,
    handlePlayPause,
    handleAccentSelect,
  };
}
