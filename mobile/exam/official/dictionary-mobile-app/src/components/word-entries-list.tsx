import { AppText } from "@/components/app-text";
import { MeaningSection } from "@/components/meaning-section";
import type { DictionaryEntry, DictionaryMeaning } from "@/types/dictionary";
import { LAYOUT } from "@/utils/layout";
import {
  hairlineBorder,
  primarySoftSurface,
  primarySurface,
} from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { minTouchTargetStyle } from "@/utils/touch-target";
import * as React from "react";
import { Pressable, View } from "react-native";

const PREVIEW_MEANING_GROUPS = 2;
const PREVIEW_DEFINITIONS_PER_GROUP = 2;

type WordEntriesListProps = {
  entries: DictionaryEntry[];
};

type MeaningGroup = {
  id: string;
  meaning: DictionaryMeaning;
};

export function WordEntriesList({ entries }: WordEntriesListProps) {
  const colors = useThemeColors();
  const groups = React.useMemo(() => getMeaningGroups(entries), [entries]);
  const resultKey = React.useMemo(
    () => groups.map((group) => group.id).join("|"),
    [groups],
  );
  const [expandedResultKey, setExpandedResultKey] = React.useState<string | null>(
    null,
  );
  const isExpanded = expandedResultKey === resultKey;
  const visibleGroups = isExpanded
    ? groups
    : groups.slice(0, PREVIEW_MEANING_GROUPS);
  const hasHiddenGroups = groups.length > visibleGroups.length;
  const hiddenDefinitionCount = getHiddenDefinitionCount(groups, visibleGroups);
  const hasCollapsedContent = hasHiddenGroups || hiddenDefinitionCount > 0;

  if (groups.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: LAYOUT.meaningSectionGap }}>
      <View style={{ gap: LAYOUT.meaningSectionGap }}>
        {visibleGroups.map((group) => (
          <MeaningSection
            key={group.id}
            meaning={group.meaning}
            definitionLimit={
              isExpanded ? undefined : PREVIEW_DEFINITIONS_PER_GROUP
            }
          />
        ))}
      </View>

      {hasCollapsedContent && (
        <Pressable
          onPress={() =>
            setExpandedResultKey((currentKey) =>
              currentKey === resultKey ? null : resultKey,
            )
          }
          accessibilityRole="button"
          accessibilityLabel={
            isExpanded
              ? "Show fewer definitions"
              : "Show all available definitions"
          }
          className="rounded-[16px] px-4 active:opacity-80"
          style={{
            ...minTouchTargetStyle(0, 52),
            ...(isExpanded ? primarySoftSurface(colors) : primarySurface(colors)),
            ...hairlineBorder(isExpanded ? colors.separator : colors.primary),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText
            variant="headline"
            tone={isExpanded ? "primary" : "onPrimary"}
            allowFontScaling={false}
          >
            {isExpanded
              ? "Show less"
              : `Show all meanings (${getHiddenLabel(
                  hasHiddenGroups,
                  hiddenDefinitionCount,
                )})`}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

function getMeaningGroups(entries: DictionaryEntry[]): MeaningGroup[] {
  return entries.flatMap((entry, entryIndex) =>
    entry.meanings.map((meaning, meaningIndex) => ({
      id: `${entry.word}-${entryIndex}-${meaning.partOfSpeech}-${meaningIndex}`,
      meaning,
    })),
  );
}

function getHiddenDefinitionCount(
  groups: MeaningGroup[],
  visibleGroups: MeaningGroup[],
) {
  return groups.reduce((total, group, index) => {
    if (index >= visibleGroups.length) {
      return total + group.meaning.definitions.length;
    }

    return (
      total +
      Math.max(0, group.meaning.definitions.length - PREVIEW_DEFINITIONS_PER_GROUP)
    );
  }, 0);
}

function getHiddenLabel(hasHiddenGroups: boolean, hiddenDefinitionCount: number) {
  if (hiddenDefinitionCount > 0) {
    return `${hiddenDefinitionCount} more`;
  }

  return hasHiddenGroups ? "more" : "details";
}
