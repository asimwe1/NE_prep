import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { IOS_MIN_TOUCH_TARGET } from "@/utils/ios-design";
import { cardSurface, primarySurface } from "@/utils/themed-styles";
import { useThemeColors } from "@/utils/use-theme-colors";
import { Search } from "lucide-react-native";
import { ActivityIndicator, Platform, Pressable, TextInput, View } from "react-native";

type SearchBoxProps = {
  value: string;
  isLoading: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBox({
  value,
  isLoading,
  onChangeText,
  onSubmit,
}: SearchBoxProps) {
  const colors = useThemeColors();

  return (
    <View
      className="rounded-[18px] flex-row items-center overflow-hidden"
      style={{
        ...cardSurface(colors),
        minHeight: 56,
        paddingLeft: 14,
        paddingRight: 6,
      }}
      accessibilityRole="search"
    >
      {/* leading search icon */}
      <Search
        size={18}
        color={colors.mutedForeground}
        {...getDecorativeIconA11yProps()}
      />

      {/* text input grows to fill */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!isLoading}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType="none"
        returnKeyType="search"
        clearButtonMode={Platform.OS === "ios" ? "while-editing" : "never"}
        enablesReturnKeyAutomatically
        accessibilityLabel="Word search field"
        accessibilityHint="Enter an English word to look up"
        placeholder="Search an English word"
        placeholderTextColor={colors.mutedForeground}
        cursorColor={colors.primary}
        selectionColor={colors.primary}
        style={{
          flex: 1,
          minHeight: 56,
          paddingHorizontal: 10,
          paddingVertical: Platform.OS === "ios" ? 11 : 10,
          color: colors.foreground,
          fontSize: 17,
        }}
      />

      {/* trailing submit button — inside the bar */}
      <Pressable
        disabled={isLoading}
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel="Search word"
        accessibilityHint="Looks up the entered word in the dictionary"
        accessibilityState={{ disabled: isLoading, busy: isLoading }}
        className="rounded-[14px] items-center justify-center active:opacity-80 disabled:opacity-50"
        style={{
          ...primarySurface(colors),
          minWidth: 48,
          minHeight: IOS_MIN_TOUCH_TARGET,
          paddingHorizontal: 14,
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Search size={18} color={colors.primaryForeground} />
        )}
      </Pressable>
    </View>
  );
}
