import { SearchBox } from "@/components/search-box";
import { useThemeColors } from "@/utils/use-theme-colors";
import { StyleSheet, View } from "react-native";

type SearchSectionProps = {
  horizontalPadding: number;
  value: string;
  isLoading: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

/** Pinned search zone directly under the app header (LookUp layout). */
export function SearchSection({
  horizontalPadding,
  value,
  isLoading,
  onChangeText,
  onSubmit,
}: SearchSectionProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "stretch",
        paddingHorizontal: horizontalPadding,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
      }}
    >
      <SearchBox
        value={value}
        isLoading={isLoading}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
      />
    </View>
  );
}
