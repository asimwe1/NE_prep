import type { DictionaryMeaning } from "@/types/dictionary";
import { DefinitionCard } from "@/components/definition-card";
import { AppText } from "@/components/app-text";
import { cardSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { View } from "react-native";

type MeaningSectionProps = {
  meaning: DictionaryMeaning;
};

export function MeaningSection({ meaning }: MeaningSectionProps) {
  const colors = useThemeColors();
  const partOfSpeech = meaning.partOfSpeech || "meaning";

  return (
    <View style={{ gap: 8 }} accessibilityLabel={`${partOfSpeech} meanings`}>
      <AppText
        variant="footnote"
        muted
        className="uppercase tracking-wide font-semibold px-1"
      >
        {partOfSpeech}
      </AppText>

      <View className="rounded-[12px] p-3" style={{ ...cardSurface(colors), gap: 10 }}>
        {meaning.definitions.map((definition, index) => (
          <DefinitionCard
            key={`${definition.definition}-${index}`}
            definition={definition}
            index={index}
            isLast={index === meaning.definitions.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
