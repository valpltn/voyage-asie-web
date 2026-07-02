export const brandColors = {
  background: "#f2f7ef",
  panel: "#fbfff8",
  panelStrong: "#ffffff",
  ink: "#18352b",
  muted: "#5f7168",
  line: "#d7e4d2",
  accent: "#2f8f67",
  accentStrong: "#1f6f4f",
  accentSoft: "#dff2e4",
  leaf: "#83aa4f",
  sun: "#e7bd5b",
  danger: "#b96b52",
} as const;

export const travelColors = {
  route: brandColors.accent,
  mainlandChina: brandColors.accent,
  hongKong: "#117a65",
  taiwan: "#6c9f4a",
  futureIdea: "#2c7a52",
  weekend: "#4f8f5f",
  weekendPlace: brandColors.leaf,
} as const;

export type TravelColor = (typeof travelColors)[keyof typeof travelColors];
