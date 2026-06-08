import type { DictionaryDefinition } from "@/types/dictionary";
import { Text, View } from "react-native";

type DefinitionCardProps = {
  definition: DictionaryDefinition;
  index: number;
};

export function DefinitionCard({ definition, index }: DefinitionCardProps) {
  return (
    <View className="rounded-2xl bg-card border border-border p-4 gap-3 border-continuous">
      <View className="flex-row gap-3">
        <Text className="text-[15px] font-semibold text-muted-foreground">
          {index + 1}.
        </Text>
        <Text selectable className="flex-1 text-[16px] leading-6 text-foreground">
          {definition.definition}
        </Text>
      </View>

      {definition.example && (
        <View className="rounded-xl bg-secondary px-4 py-3 border-continuous">
          <Text selectable className="text-[15px] leading-6 text-muted-foreground">
            Example: {definition.example}
          </Text>
        </View>
      )}
    </View>
  );
}
