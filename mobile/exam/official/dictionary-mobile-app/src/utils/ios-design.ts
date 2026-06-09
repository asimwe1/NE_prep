/** Apple HIG minimum tappable area (points). */
export const IOS_MIN_TOUCH_TARGET = 44;

/** iOS system corner radii (points). */
export const IOS_CORNER_RADIUS = {
  button: 10,
  card: 12,
  control: 10,
  pill: 999,
} as const;

/** iOS Dynamic Type text styles mapped to point sizes. */
export const IOS_TEXT_STYLE = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: "400" as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
} as const;

/** Caps Dynamic Type scaling to preserve layout while staying accessible. */
export const IOS_MAX_FONT_SCALE = 1.35;
