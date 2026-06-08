import type { DictionaryMeaning } from "@/types/dictionary";
import { DefinitionCard } from "@/components/definition-card";
import { AppText } from "@/components/app-text";
import { cardSurface, primarySoftSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { View } from "react-native";

type MeaningSectionProps = {
  meaning: DictionaryMeaning;
  definitionLimit?: number;
};

export function MeaningSection({
  meaning,
  definitionLimit,
}: MeaningSectionProps) {
  const colors = useThemeColors();
  const partOfSpeech = meaning.partOfSpeech || "meaning";
  const visibleDefinitions =
    typeof definitionLimit === "number"
      ? meaning.definitions.slice(0, definitionLimit)
      : meaning.definitions;
  const hiddenDefinitionCount =
    meaning.definitions.length - visibleDefinitions.length;

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
        {visibleDefinitions.map((definition, index) => (
          <DefinitionCard
            key={`${definition.definition}-${index}`}
            definition={definition}
            index={index}
            isLast={index === visibleDefinitions.length - 1}
          />
        ))}

        {hiddenDefinitionCount > 0 && (
          <AppText variant="footnote" muted className="pl-9">
            {hiddenDefinitionCount} more definition
            {hiddenDefinitionCount === 1 ? "" : "s"} available below
          </AppText>
        )}
      </View>
    </View>
  );
}
