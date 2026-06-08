import type { DictionaryMeaning } from "@/types/dictionary";
import { DefinitionCard } from "@/components/definition-card";
import { AppText } from "@/components/app-text";
import { cardSurface, primarySoftSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { View } from "react-native";

type MeaningSectionProps = {
  meaning: DictionaryMeaning;
};

export function MeaningSection({ meaning }: MeaningSectionProps) {
  const colors = useThemeColors();
  const partOfSpeech = meaning.partOfSpeech || "meaning";

  return (
    <View style={{ gap: 10 }} accessibilityLabel={`${partOfSpeech} meanings`}>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        <View className="rounded-full px-3 py-1" style={primarySoftSurface(colors)}>
          <AppText
            variant="footnote"
            tone="primary"
            className="uppercase tracking-wide font-semibold"
          >
            {partOfSpeech}
          </AppText>
        </View>
      </View>

      <View className="rounded-[18px] p-4" style={{ ...cardSurface(colors), gap: 12 }}>
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
