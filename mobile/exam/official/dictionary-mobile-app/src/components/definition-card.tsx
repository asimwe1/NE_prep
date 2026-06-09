import { AppText } from "@/components/app-text";
import type { DictionaryDefinition } from "@/types/dictionary";
import { quoteSurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { StyleSheet, View } from "react-native";

type DefinitionCardProps = {
  definition: DictionaryDefinition;
  index: number;
  isLast?: boolean;
};

export function DefinitionCard({
  definition,
  index,
  isLast = false,
}: DefinitionCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        gap: 10,
        paddingBottom: isLast ? 0 : 12,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
      }}
    >
      <View className="flex-row" style={{ gap: 10 }}>
        <AppText
          variant="callout"
          tone="primary"
          className="w-6 font-semibold"
        >
          {index + 1}.
        </AppText>
        <AppText variant="body" selectable className="flex-1">
          {definition.definition}
        </AppText>
      </View>

      {definition.example && (
        <View
          className="ml-8 rounded-[10px] px-3.5 py-2.5"
          style={quoteSurface(colors)}
        >
          <AppText variant="subhead" muted selectable className="italic">
            {`"${definition.example}"`}
          </AppText>
        </View>
      )}
    </View>
  );
}
