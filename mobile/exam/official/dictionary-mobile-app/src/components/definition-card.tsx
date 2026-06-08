import { AppText } from "@/components/app-text";
import type { DictionaryDefinition } from "@/types/dictionary";
import { View } from "react-native";

type DefinitionCardProps = {
  definition: DictionaryDefinition;
  index: number;
};

export function DefinitionCard({ definition, index }: DefinitionCardProps) {
  return (
    <View className="rounded-[12px] bg-card border border-separator p-4 gap-3 border-continuous">
      <View className="flex-row gap-3">
        <AppText variant="callout" muted className="w-6">
          {index + 1}.
        </AppText>
        <AppText variant="callout" selectable className="flex-1">
          {definition.definition}
        </AppText>
      </View>

      {definition.example && (
        <View className="ml-9 rounded-[10px] bg-secondary px-3.5 py-2.5 border-continuous">
          <AppText variant="subhead" muted selectable className="italic">
            “{definition.example}”
          </AppText>
        </View>
      )}
    </View>
  );
}
