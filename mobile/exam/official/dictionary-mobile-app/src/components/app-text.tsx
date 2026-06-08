import {
  IOS_MAX_FONT_SCALE,
  IOS_TEXT_STYLE,
} from "@/utils/ios-design";
import { useThemeColors } from "@/utils/use-theme-colors";
import * as React from "react";
import {
  Platform,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

export type AppTextVariant = keyof typeof IOS_TEXT_STYLE;

type AppTextProps = RNTextProps & {
  variant?: AppTextVariant;
  muted?: boolean;
  className?: string;
  tone?: "default" | "primary" | "onPrimary";
};

const VARIANT_CLASS: Record<AppTextVariant, string> = {
  largeTitle: "text-[34px] leading-[41px] font-bold",
  title1: "text-[28px] leading-[34px] font-bold",
  title2: "text-[22px] leading-[28px] font-bold",
  headline: "text-[17px] leading-[22px] font-semibold",
  body: "text-[17px] leading-[22px]",
  callout: "text-[16px] leading-[21px]",
  subhead: "text-[15px] leading-[20px]",
  footnote: "text-[13px] leading-[18px]",
  caption: "text-[12px] leading-[16px]",
};

export function AppText({
  variant = "body",
  muted = false,
  tone = "default",
  className = "",
  style,
  allowFontScaling = true,
  maxFontSizeMultiplier = IOS_MAX_FONT_SCALE,
  ...props
}: AppTextProps) {
  const colors = useThemeColors();
  const textColor =
    tone === "onPrimary"
      ? colors.primaryForeground
      : tone === "primary"
        ? colors.primary
        : muted
          ? colors.mutedForeground
          : colors.foreground;
  const iosFont: TextStyle =
    Platform.OS === "ios" ? { fontFamily: undefined } : {};

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      className={VARIANT_CLASS[variant] + (className ? ` ${className}` : "")}
      style={[{ color: textColor }, iosFont, style]}
      {...props}
    />
  );
}
