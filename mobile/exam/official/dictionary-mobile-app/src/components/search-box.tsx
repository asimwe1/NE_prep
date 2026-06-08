import { Search } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

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
  return (
    <View className="gap-3">
      <View className="rounded-2xl bg-card border border-border px-4 py-2.5 flex-row items-center gap-3 border-continuous">
        <Search size={20} color="#6b7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          editable={!isLoading}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          placeholder="Search an English word"
          placeholderTextColorClassName="accent-muted-foreground"
          cursorColorClassName="accent-primary"
          selectionColorClassName="accent-primary"
          className="flex-1 text-[17px] text-foreground py-2"
        />
      </View>

      <Pressable
        disabled={isLoading}
        onPress={onSubmit}
        className="h-12 rounded-2xl bg-primary items-center justify-center active:opacity-80 disabled:opacity-50 border-continuous"
      >
        <Text className="text-[16px] font-semibold text-primary-foreground">
          {isLoading ? "Searching..." : "Search word"}
        </Text>
      </Pressable>
    </View>
  );
}
