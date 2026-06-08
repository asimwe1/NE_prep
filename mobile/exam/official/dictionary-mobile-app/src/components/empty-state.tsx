import { BookMarked } from "lucide-react-native";
import { Text, View } from "react-native";

export function EmptyState() {
  return (
    <View className="rounded-2xl bg-secondary p-5 gap-3 border-continuous">
      <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
        <BookMarked size={20} color="#6b7280" />
      </View>
      <View className="gap-1">
        <Text className="text-[18px] font-semibold text-foreground">
          Ready to explore
        </Text>
        <Text className="text-[15px] leading-6 text-muted-foreground">
          Enter a word to see definitions, examples, meanings, and available
          pronunciation.
        </Text>
      </View>
    </View>
  );
}
