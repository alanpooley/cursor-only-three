import React, { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { Circle, CircleDot, Target, Wind, Sparkles } from "lucide-react-native";

import { ThemePalette, taskLabels, taskPlaceholders, taskIcons } from "@/constants/onlyThreeTheme";
import { DailyTask, TaskLabelMode } from "@/types/only-three";
import { TASK_TITLE_MAX_LENGTH, TaskRowDensity } from "@/components/TaskRow";

interface PlanningTaskRowProps {
  task: DailyTask;
  palette: ThemePalette;
  labelMode: TaskLabelMode;
  onChangeTitle: (title: string) => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  density?: TaskRowDensity;
}

const taskOrder: Record<DailyTask["type"], string> = {
  big: "01",
  medium: "02",
  small: "03",
};

const DashedBorder = memo(function DashedBorder({ color, radius }: { color: string; radius: number }) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.w > 0 && size.h > 0 && (
        <Svg width={size.w} height={size.h}>
          <Rect
            x={0.5}
            y={0.5}
            width={size.w - 1}
            height={size.h - 1}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="12 6"
          />
        </Svg>
      )}
    </View>
  );
});

const PlanningTaskRowComponent = memo(
  forwardRef<TextInput, PlanningTaskRowProps>(function PlanningTaskRowComponent(
    { task, palette, labelMode, onChangeTitle, onSubmitEditing, onFocus, autoFocus = false, density = "default" },
    ref
  ) {
    const hasText = task.title.trim().length > 0;
    const styles = useMemo(() => createStyles(palette, density), [palette, density]);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const charCountOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(charCountOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, [isFocused, charCountOpacity]);

    const rowInner = (
      <>
        <View style={styles.orderBadge}>
          <Text style={styles.orderLabel}>{taskOrder[task.type]}</Text>
        </View>

        <View style={styles.statusDot}>
          {hasText ? (
            <View style={styles.filledDot} />
          ) : (
            <Circle color={palette.muted} size={16} strokeWidth={1.5} />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>{taskLabels[labelMode][task.type]}</Text>
            <View style={styles.hintIcon}>
              {taskIcons[labelMode][task.type] === "target" && <Target color={palette.muted} size={13} strokeWidth={2} />}
              {taskIcons[labelMode][task.type] === "wind" && <Wind color={palette.muted} size={13} strokeWidth={2} />}
              {taskIcons[labelMode][task.type] === "sparkles" && <Sparkles color={palette.muted} size={13} strokeWidth={2} />}
              {taskIcons[labelMode][task.type] === "circle-dot" && <CircleDot color={palette.muted} size={13} strokeWidth={2} />}
            </View>
          </View>
          <View style={styles.inputWrap}>
            {!hasText && (
              <Text style={[styles.placeholderText, { color: palette.muted }]} pointerEvents="none">
                {taskPlaceholders[labelMode][task.type]}
              </Text>
            )}
            <TextInput
              ref={ref}
              autoFocus={autoFocus}
              multiline
              scrollEnabled={false}
              blurOnSubmit
              maxLength={TASK_TITLE_MAX_LENGTH}
              onChangeText={onChangeTitle}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={onSubmitEditing}
              returnKeyType="done"
              selectionColor={palette.accentStrong}
              style={styles.input}
              testID={`planning-input-${task.type}`}
              value={task.title}
            />
            <Animated.View style={[styles.charCount, { opacity: charCountOpacity }]} pointerEvents="none">
              <Text style={[styles.charCountText, task.title.length >= TASK_TITLE_MAX_LENGTH && styles.charCountLimit]}>
                {task.title.length}/{TASK_TITLE_MAX_LENGTH}
              </Text>
            </Animated.View>
          </View>
        </View>
      </>
    );

    const taskAccentColor =
      task.type === "big" ? palette.accentStrong : task.type === "medium" ? palette.accent : palette.accentSoft;
    const useFlatContainer = density === "sidebar" || !palette.ui.useTaskGradients;

    return (
      <View style={styles.outer}>
        {useFlatContainer ? (
          <View style={[styles.container, density === "sidebar" && styles.containerSidebar, density === "sidebar" && { borderLeftColor: taskAccentColor }]}>
            {density !== "sidebar" ? <DashedBorder color={palette.lineStrong} radius={palette.ui.taskRadius} /> : null}
            {rowInner}
          </View>
        ) : (
          <LinearGradient
            colors={[`${palette.accent}10`, `${palette.accent}05`]}
            locations={[0, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
          >
            <DashedBorder color={palette.accentSoft} radius={palette.ui.taskRadius} />
            {rowInner}
          </LinearGradient>
        )}
      </View>
    );
  })
);

export const PlanningTaskRow = PlanningTaskRowComponent;

function createStyles(p: ThemePalette, density: TaskRowDensity = "default") {
  const ui = p.ui;
  const isSidebar = density === "sidebar";
  const containerShadow = ui.useCardShadow && !isSidebar
    ? {
        shadowColor: p.shadow,
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }
    : {};

  return StyleSheet.create({
    outer: {
      position: "relative",
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: isSidebar ? 10 : 16,
      borderRadius: isSidebar ? 4 : ui.taskRadius,
      borderWidth: ui.variant === "obsidian" || isSidebar ? 1 : 0,
      borderColor: p.line,
      backgroundColor: isSidebar ? p.surface : p.surfaceRaised,
      paddingHorizontal: isSidebar ? 10 : 18,
      paddingVertical: isSidebar ? 10 : ui.variant === "obsidian" ? 14 : 18,
      overflow: "hidden",
      ...containerShadow,
    },
    containerSidebar: {
      borderLeftWidth: 2,
    },
    orderBadge: {
      width: isSidebar ? 28 : 34,
      height: isSidebar ? 28 : 34,
      borderRadius: isSidebar ? 4 : 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.accentSoft,
      borderWidth: 1,
      borderColor: p.accentGlow,
    },
    orderLabel: {
      color: p.accent,
      fontSize: isSidebar ? 10 : 11,
      fontWeight: "700" as const,
      letterSpacing: 1,
    },
    statusDot: {
      width: isSidebar ? 20 : 24,
      height: isSidebar ? 20 : 24,
      alignItems: "center",
      justifyContent: "center",
    },
    filledDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.accent,
    },
    content: {
      flex: 1,
      gap: 10,
      paddingRight: 2,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    eyebrow: {
      color: p.accentStrong,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    hintIcon: {
      opacity: 0.6,
    },
    inputWrap: {
      position: "relative" as const,
      justifyContent: "center" as const,
    },
    placeholderText: {
      position: "absolute" as const,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "600" as const,
      textDecorationLine: "none" as const,
    },
    input: {
      color: p.ink,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "600" as const,
      minHeight: 38,
      paddingVertical: 0,
      textDecorationLine: "none" as const,
    },
    charCount: {
      position: "absolute" as const,
      right: 0,
      bottom: -14,
    },
    charCountText: {
      color: p.muted,
      fontSize: 10,
      fontWeight: "500" as const,
      opacity: 0.6,
    },
    charCountLimit: {
      color: "#EF4444",
      opacity: 1,
    },
  });
}
