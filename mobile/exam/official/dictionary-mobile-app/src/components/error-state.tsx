import { CircleAlert } from "lucide-react-native";
import { Text, View } from "react-native";

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <View className="rounded-2xl bg-secondary p-5 gap-3 border border-border border-continuous">
      <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
        <CircleAlert size={20} color="#b91c1c" />
      </View>
      <View className="gap-1">
        <Text className="text-[18px] font-semibold text-foreground">
          Search unavailable
        </Text>
        <Text selectable className="text-[15px] leading-6 text-muted-foreground">
          {message}
        </Text>
      </View>
    </View>
  );
}
