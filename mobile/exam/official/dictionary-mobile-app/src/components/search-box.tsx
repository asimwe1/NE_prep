import { AppText } from "@/components/app-text";
import { getDecorativeIconA11yProps } from "@/utils/decorative-icon-a11y";
import { IOS_MIN_TOUCH_TARGET } from "@/utils/ios-design";
import { useThemeColors } from "@/utils/use-theme-colors";
import { Search } from "lucide-react-native";
import { Platform, Pressable, TextInput, View } from "react-native";

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
    <View className="gap-3">
      <View
        className="rounded-[10px] bg-card border border-separator px-4 flex-row items-center gap-2.5 border-continuous"
        style={{ minHeight: IOS_MIN_TOUCH_TARGET }}
      >
        <Search
          size={18}
          color={colors.mutedForeground}
          {...getDecorativeIconA11yProps()}
        />
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
          className="flex-1 text-[17px] text-foreground"
          style={{
            flex: 1,
            minHeight: IOS_MIN_TOUCH_TARGET,
            paddingVertical: Platform.OS === "ios" ? 11 : 10,
            color: colors.foreground,
          }}
        />
      </View>

      <Pressable
        disabled={isLoading}
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel="Search word"
        accessibilityHint="Looks up the entered word in the dictionary"
        accessibilityState={{ disabled: isLoading, busy: isLoading }}
        className="w-full rounded-[10px] bg-primary items-center justify-center active:opacity-80 disabled:opacity-50 border-continuous"
        style={{ minHeight: IOS_MIN_TOUCH_TARGET, alignSelf: "stretch" }}
      >
        <AppText
          variant="headline"
          className="text-primary-foreground"
          allowFontScaling={false}
        >
          {isLoading ? "Searching..." : "Search"}
        </AppText>
      </Pressable>
    </View>
  );
}
