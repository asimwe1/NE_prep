import { Volume2 } from "lucide-react-native";
import * as React from "react";
import { Linking, Pressable, Text } from "react-native";

type PronunciationButtonProps = {
  audioUrl: string;
};

export function PronunciationButton({ audioUrl }: PronunciationButtonProps) {
  const [failed, setFailed] = React.useState(false);

  async function handlePress() {
    setFailed(false);

    try {
      await Linking.openURL(audioUrl);
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Play pronunciation"
        className="h-11 rounded-xl bg-card border border-border px-4 flex-row items-center justify-center gap-2 active:bg-muted border-continuous"
      >
        <Volume2 size={18} color="#111827" />
        <Text className="text-[15px] font-semibold text-foreground">
          Play pronunciation
        </Text>
      </Pressable>

      {failed && (
        <Text selectable className="text-[13px] text-muted-foreground">
          Pronunciation audio could not be opened on this device.
        </Text>
      )}
    </>
  );
}
