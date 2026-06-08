import type { DictionaryMeaning } from "@/types/dictionary";
import { DefinitionCard } from "@/components/definition-card";
import { AppText } from "@/components/app-text";
import { View } from "react-native";

type MeaningSectionProps = {
  meaning: DictionaryMeaning;
};

export function MeaningSection({ meaning }: MeaningSectionProps) {
  const partOfSpeech = meaning.partOfSpeech || "meaning";

  return (
    <View
      className="gap-2.5"
      accessibilityLabel={`${partOfSpeech} meanings`}
    >
      <View className="flex-row px-1">
        <View className="rounded-full bg-fill px-3 py-1.5">
          <AppText variant="footnote" className="text-primary capitalize font-semibold">
            {partOfSpeech}
          </AppText>
        </View>
      </View>

      <View className="gap-2.5">
        {meaning.definitions.map((definition, index) => (
          <DefinitionCard
            key={`${definition.definition}-${index}`}
            definition={definition}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}
