import type { DictionaryMeaning } from "@/types/dictionary";
import { DefinitionCard } from "@/components/definition-card";
import { Text, View } from "react-native";

type MeaningSectionProps = {
  meaning: DictionaryMeaning;
};

export function MeaningSection({ meaning }: MeaningSectionProps) {
  return (
    <View className="gap-3">
      <View className="flex-row">
        <View className="rounded-full bg-muted px-3 py-1">
          <Text className="text-[13px] font-semibold text-foreground">
            {meaning.partOfSpeech || "meaning"}
          </Text>
        </View>
      </View>

      <View className="gap-3">
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
