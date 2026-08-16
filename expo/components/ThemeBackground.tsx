import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { ThemePalette } from "@/constants/onlyThreeTheme";

interface ThemeBackgroundProps {
  palette: ThemePalette;
}

export function ThemeBackground({ palette }: ThemeBackgroundProps) {
  if (palette.ui.useGradientBackground) {
    return (
      <LinearGradient
        colors={[palette.backgroundTop, palette.backgroundMiddle, palette.backgroundBottom]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.backgroundBottom }]} />;
}

interface ThemeAmbientOrbsProps {
  palette: ThemePalette;
  topStyle: StyleProp<ViewStyle>;
  bottomStyle: StyleProp<ViewStyle>;
  baseStyle: StyleProp<ViewStyle>;
}

export function ThemeAmbientOrbs({ palette, topStyle, bottomStyle, baseStyle }: ThemeAmbientOrbsProps) {
  if (!palette.ui.showAmbientOrbs) {
    return null;
  }

  return (
    <>
      <View pointerEvents="none" style={[baseStyle, topStyle]} />
      <View pointerEvents="none" style={[baseStyle, bottomStyle]} />
    </>
  );
}

interface ThemeChipProps {
  palette: ThemePalette;
  style: StyleProp<ViewStyle>;
  gradientColors: [string, string];
  children: React.ReactNode;
}

export function ThemeChip({ palette, style, gradientColors, children }: ThemeChipProps) {
  if (palette.ui.useChipGradients) {
    return (
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: palette.surfaceElevated,
          borderWidth: 1,
          borderColor: palette.line,
        },
      ]}
    >
      {children}
    </View>
  );
}
