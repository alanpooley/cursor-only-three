import { TaskLabelMode, TaskSize, ThemeMode } from "@/types/only-three";

export interface ThemeUI {
  variant: "classic" | "obsidian";
  cardRadius: number;
  panelRadius: number;
  chipRadius: number;
  inputRadius: number;
  buttonRadius: number;
  tabRadius: number;
  iconButtonRadius: number;
  taskRadius: number;
  useGradientBackground: boolean;
  showAmbientOrbs: boolean;
  useCardShadow: boolean;
  useChipGradients: boolean;
  useTaskGradients: boolean;
  showTaskShine: boolean;
  titleSize: number;
  titleWeight: "700" | "600";
  titleLetterSpacing: number;
  eyebrowUppercase: boolean;
}

export interface ThemePalette {
  ink: string;
  subtext: string;
  muted: string;
  line: string;
  lineStrong: string;
  backgroundTop: string;
  backgroundMiddle: string;
  backgroundBottom: string;
  surface: string;
  surfaceRaised: string;
  surfaceElevated: string;
  surfaceSoft: string;
  panel: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentGlow: string;
  accentDeep: string;
  success: string;
  successSoft: string;
  successGlow: string;
  cardGlow: string;
  danger: string;
  shadow: string;
  overlay: string;
  ui: ThemeUI;
}

export const classicUI: ThemeUI = {
  variant: "classic",
  cardRadius: 28,
  panelRadius: 20,
  chipRadius: 20,
  inputRadius: 14,
  buttonRadius: 22,
  tabRadius: 20,
  iconButtonRadius: 22,
  taskRadius: 30,
  useGradientBackground: true,
  showAmbientOrbs: true,
  useCardShadow: true,
  useChipGradients: true,
  useTaskGradients: true,
  showTaskShine: true,
  titleSize: 42,
  titleWeight: "700",
  titleLetterSpacing: -1.2,
  eyebrowUppercase: true,
};

export const obsidianUI: ThemeUI = {
  variant: "obsidian",
  cardRadius: 10,
  panelRadius: 8,
  chipRadius: 6,
  inputRadius: 6,
  buttonRadius: 8,
  tabRadius: 8,
  iconButtonRadius: 8,
  taskRadius: 8,
  useGradientBackground: false,
  showAmbientOrbs: false,
  useCardShadow: false,
  useChipGradients: false,
  useTaskGradients: false,
  showTaskShine: false,
  titleSize: 34,
  titleWeight: "600",
  titleLetterSpacing: -0.5,
  eyebrowUppercase: false,
};

const nightPalette: ThemePalette = {
  ink: "#F8F4EC",
  subtext: "#B4AEA2",
  muted: "#8C867C",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.16)",
  backgroundTop: "#1A1916",
  backgroundMiddle: "#11110F",
  backgroundBottom: "#090909",
  surface: "#141311",
  surfaceRaised: "#1A1916",
  surfaceElevated: "#22201B",
  surfaceSoft: "rgba(255,255,255,0.045)",
  panel: "rgba(255,255,255,0.03)",
  accent: "#E3B26B",
  accentStrong: "#F0C98B",
  accentSoft: "rgba(227,178,107,0.18)",
  accentGlow: "rgba(227,178,107,0.28)",
  accentDeep: "#8B6A39",
  success: "#A8D5BA",
  successSoft: "rgba(168,213,186,0.18)",
  successGlow: "rgba(168,213,186,0.28)",
  cardGlow: "rgba(255,255,255,0.025)",
  danger: "#FF8F8F",
  shadow: "#000000",
  overlay: "rgba(7,7,6,0.72)",
  ui: classicUI,
};

const lightPalette: ThemePalette = {
  ink: "#1C1917",
  subtext: "#78716C",
  muted: "#A8A29E",
  line: "rgba(0,0,0,0.07)",
  lineStrong: "rgba(0,0,0,0.14)",
  backgroundTop: "#FAFAF9",
  backgroundMiddle: "#F5F5F4",
  backgroundBottom: "#EFEDEB",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceElevated: "#F5F5F4",
  surfaceSoft: "rgba(0,0,0,0.035)",
  panel: "rgba(0,0,0,0.02)",
  accent: "#B45309",
  accentStrong: "#92400E",
  accentSoft: "rgba(180,83,9,0.10)",
  accentGlow: "rgba(180,83,9,0.14)",
  accentDeep: "#D97706",
  success: "#059669",
  successSoft: "rgba(5,150,105,0.12)",
  successGlow: "rgba(5,150,105,0.18)",
  cardGlow: "rgba(0,0,0,0.02)",
  danger: "#DC2626",
  shadow: "rgba(0,0,0,0.08)",
  overlay: "rgba(250,250,249,0.85)",
  ui: classicUI,
};

const darkPalette: ThemePalette = {
  ink: "#EDF0F7",
  subtext: "#8E99B0",
  muted: "#5E6A82",
  line: "rgba(140,165,220,0.10)",
  lineStrong: "rgba(140,165,220,0.20)",
  backgroundTop: "#121827",
  backgroundMiddle: "#0C1220",
  backgroundBottom: "#070B15",
  surface: "#0F1525",
  surfaceRaised: "#141C30",
  surfaceElevated: "#1A2440",
  surfaceSoft: "rgba(140,165,220,0.06)",
  panel: "rgba(140,165,220,0.04)",
  accent: "#6B9FE3",
  accentStrong: "#8BB8F0",
  accentSoft: "rgba(107,159,227,0.18)",
  accentGlow: "rgba(107,159,227,0.28)",
  accentDeep: "#395F8B",
  success: "#7DD3A8",
  successSoft: "rgba(125,211,168,0.18)",
  successGlow: "rgba(125,211,168,0.28)",
  cardGlow: "rgba(140,165,220,0.03)",
  danger: "#FF8F8F",
  shadow: "#000000",
  overlay: "rgba(7,11,21,0.75)",
  ui: classicUI,
};

const obsidianPalette: ThemePalette = {
  ink: "#DCDDDE",
  subtext: "#999999",
  muted: "#727272",
  line: "rgba(255,255,255,0.06)",
  lineStrong: "rgba(255,255,255,0.11)",
  backgroundTop: "#1E1E1E",
  backgroundMiddle: "#1E1E1E",
  backgroundBottom: "#171717",
  surface: "#262626",
  surfaceRaised: "#2B2B2B",
  surfaceElevated: "#333333",
  surfaceSoft: "rgba(255,255,255,0.04)",
  panel: "rgba(255,255,255,0.02)",
  accent: "#7F6DF2",
  accentStrong: "#A48AF5",
  accentSoft: "rgba(127,109,242,0.14)",
  accentGlow: "rgba(127,109,242,0.10)",
  accentDeep: "#5B4DC7",
  success: "#45A557",
  successSoft: "rgba(69,165,87,0.14)",
  successGlow: "rgba(69,165,87,0.08)",
  cardGlow: "rgba(255,255,255,0.02)",
  danger: "#E06C75",
  shadow: "#000000",
  overlay: "rgba(23,23,23,0.92)",
  ui: obsidianUI,
};

export const themes: Record<ThemeMode, ThemePalette> = {
  night: nightPalette,
  dark: darkPalette,
  light: lightPalette,
  obsidian: obsidianPalette,
};

export let palette: ThemePalette = darkPalette;

export function setActivePalette(mode: ThemeMode): void {
  const selected = themes[mode] ?? themes.dark;
  const keys = Object.keys(palette) as Array<keyof ThemePalette>;
  for (const key of keys) {
    (palette as unknown as Record<string, unknown>)[key] = selected[key];
  }
}

export function cardShadowStyle(p: ThemePalette) {
  if (!p.ui.useCardShadow) {
    return {};
  }

  return {
    shadowColor: p.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  };
}

export const taskLabels: Record<TaskLabelMode, Record<TaskSize, string>> = {
  sized: {
    big: "Big task",
    medium: "Medium task",
    small: "Small task",
  },
  numbered: {
    big: "Task one",
    medium: "Task two",
    small: "Task three",
  },
};

export const taskPlaceholders: Record<TaskLabelMode, Record<TaskSize, string>> = {
  sized: {
    big: "Plan big task",
    medium: "Plan medium task",
    small: "Plan small task",
  },
  numbered: {
    big: "Plan task one",
    medium: "Plan task two",
    small: "Plan task three",
  },
};

export const taskTypeLabel: Record<TaskSize, string> = {
  big: "Big task",
  medium: "Medium task",
  small: "Small task",
};

export const taskTypeIcon: Record<TaskSize, string> = {
  big: "target",
  medium: "wind",
  small: "sparkles",
};

export const taskIcons: Record<TaskLabelMode, Record<TaskSize, string>> = {
  sized: {
    big: "target",
    medium: "wind",
    small: "sparkles",
  },
  numbered: {
    big: "circle-dot",
    medium: "circle-dot",
    small: "circle-dot",
  },
};
