import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Check, CircleDot, Target, Wind, Sparkles, Trash2 } from "lucide-react-native";

import { ThemePalette, taskLabels, taskIcons } from "@/constants/onlyThreeTheme";
import { DailyTask, TaskLabelMode } from "@/types/only-three";

export const TASK_TITLE_MAX_LENGTH = 40;

export type TaskRowDensity = "default" | "sidebar";

interface TaskRowProps {
  task: DailyTask;
  palette: ThemePalette;
  labelMode: TaskLabelMode;
  onChangeTitle: (title: string) => void;
  onToggle?: () => void;
  onDelete?: () => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  editable?: boolean;
  isEditMode?: boolean;
  density?: TaskRowDensity;
}

const taskOrder: Record<DailyTask["type"], string> = {
  big: "01",
  medium: "02",
  small: "03",
};

const TaskRowComponent = memo(forwardRef<TextInput, TaskRowProps>(function TaskRowComponent({ task, palette, labelMode, onChangeTitle, onToggle, onDelete, onSubmitEditing, onFocus, autoFocus = false, editable = true, isEditMode = false, density = "default" }, ref) {
  const hasTitle = task.title.trim().length > 0;
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const charCountOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(charCountOpacity, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFocused, charCountOpacity]);
  const scale = useRef(new Animated.Value(task.isCompleted ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(task.isCompleted ? 1 : 0)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;
  const deleteOpacity = useRef(new Animated.Value(1)).current;
  const deleteRotate = useRef(new Animated.Value(0)).current;
  const trashWiggle = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(palette, density), [palette, density]);

  const runDeleteAnimation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(deleteScale, {
        toValue: 0.01,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(deleteRotate, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete?.();
      setTimeout(() => {
        deleteScale.setValue(0.85);
        deleteOpacity.setValue(0);
        deleteRotate.setValue(0);
        Animated.parallel([
          Animated.spring(deleteScale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 12,
            speed: 14,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
    });
  }, [onDelete, deleteScale, deleteOpacity, deleteRotate]);

  const handleDelete = useCallback(() => {
    if (!onDelete || !hasTitle) return;
    Alert.alert(
      "Delete Task?",
      "Removing this task will also affect your streak progress. Are you sure you want to delete it?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: runDeleteAnimation,
        },
      ]
    );
  }, [onDelete, hasTitle, runDeleteAnimation]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: task.isCompleted ? 1 : 0,
        useNativeDriver: true,
        bounciness: 10,
        speed: 18,
      }),
      Animated.timing(shine, {
        toValue: task.isCompleted ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.986,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
        speed: 16,
      }),
    ]).start();

    if (task.isCompleted) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [pulse, scale, shine, task.isCompleted]);

  useEffect(() => {
    if (isEditMode && hasTitle) {
      const wiggle = Animated.loop(
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(trashWiggle, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.timing(trashWiggle, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(trashWiggle, { toValue: 0.5, duration: 80, useNativeDriver: true }),
          Animated.timing(trashWiggle, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.delay(4000),
        ])
      );
      wiggle.start();
      return () => wiggle.stop();
    } else {
      trashWiggle.setValue(0);
    }
  }, [isEditMode, hasTitle, trashWiggle]);

  const deleteRotateInterpolate = deleteRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-6deg"],
  });

  const trashWiggleInterpolate = trashWiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  const taskAccentColor =
    task.type === "big" ? palette.accentStrong : task.type === "medium" ? palette.accent : palette.accentSoft;

  const containerStyle = [
    styles.container,
    density === "sidebar" && styles.containerSidebar,
    density === "sidebar" && { borderLeftColor: taskAccentColor },
    isEditMode && styles.editContainer,
    task.isCompleted ? styles.completedContainer : null,
  ];

  const rowContent = (
    <>
      <View style={[styles.orderBadge, task.isCompleted ? styles.orderBadgeComplete : null]}>
        <Text style={[styles.orderLabel, task.isCompleted ? styles.orderLabelComplete : null]}>{taskOrder[task.type]}</Text>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isCompleted }}
        accessibilityLabel={`${taskLabels[labelMode][task.type]}, ${task.isCompleted ? "completed" : "not completed"}`}
        hitSlop={10}
        onPress={hasTitle && onToggle ? onToggle : undefined}
        disabled={!hasTitle || !onToggle}
        style={[styles.checkbox, task.isCompleted ? styles.checkboxComplete : null, (!hasTitle || !onToggle) && styles.checkboxDisabled]}
        testID={`task-checkbox-${task.type}`}
      >
        <Animated.View style={{ opacity: scale, transform: [{ scale }] }}>
          <Check color={palette.surface} size={18} strokeWidth={3} />
        </Animated.View>
      </Pressable>

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
        {editable ? (
          <View>
            <TextInput
              ref={ref}
              autoFocus={autoFocus}
              editable={editable}
              focusable={editable}
              maxLength={TASK_TITLE_MAX_LENGTH}
              onChangeText={onChangeTitle}
              onFocus={() => {
                setIsFocused(true);
                onFocus?.();
              }}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={onSubmitEditing}
              placeholder={taskLabels[labelMode][task.type]}
              placeholderTextColor={palette.muted}
              returnKeyType="done"
              blurOnSubmit
              selectionColor={palette.accentStrong}
              showSoftInputOnFocus={editable}
              style={[styles.input, task.isCompleted && task.title.trim() ? styles.completedInput : null]}
              testID={`task-input-${task.type}`}
              value={task.title}
            />
            <Animated.View style={[styles.charCount, { opacity: charCountOpacity }]} pointerEvents="none">
              <Text style={[styles.charCountText, task.title.length >= TASK_TITLE_MAX_LENGTH && styles.charCountLimit]}>
                {task.title.length}/{TASK_TITLE_MAX_LENGTH}
              </Text>
            </Animated.View>
          </View>
        ) : (
          <Text
            numberOfLines={2}
            style={[
              styles.input,
              task.isCompleted && task.title.trim() ? styles.completedInput : null,
              !hasTitle && { color: palette.muted },
              styles.lockedInput,
            ]}
            testID={`task-input-${task.type}`}
          >
            {hasTitle ? task.title : "No task set"}
          </Text>
        )}
      </View>

      {isEditMode && hasTitle && onDelete && (
        <Pressable
          onPress={handleDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.trashButton, pressed && styles.trashButtonPressed]}
          testID={`task-delete-${task.type}`}
        >
          <Animated.View style={{ transform: [{ rotate: trashWiggleInterpolate }] }}>
            <Trash2 color="#EF4444" size={16} strokeWidth={2.2} />
          </Animated.View>
        </Pressable>
      )}
    </>
  );

  const useFlatContainer = density === "sidebar" || !palette.ui.useTaskGradients;

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale: pulse }, { scale: deleteScale }, { rotate: deleteRotateInterpolate }], opacity: deleteOpacity }]}>
      {palette.ui.showTaskShine && density !== "sidebar" ? <Animated.View style={[styles.shine, { opacity: shine }]} /> : null}
      {useFlatContainer ? (
        <View style={containerStyle}>{rowContent}</View>
      ) : (
        <LinearGradient
          colors={[palette.cardGlow, "transparent"]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={containerStyle}
        >
          {rowContent}
        </LinearGradient>
      )}
    </Animated.View>
  );
}));

export const TaskRow = TaskRowComponent;

function createStyles(p: ThemePalette, density: TaskRowDensity = "default") {
  const ui = p.ui;
  const isSidebar = density === "sidebar";
  const taskShadow = ui.useCardShadow && !isSidebar
    ? {
        shadowColor: p.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }
    : {};

  return StyleSheet.create({
    outer: {
      position: "relative",
    },
    shine: {
      position: "absolute",
      top: 6,
      left: 20,
      right: 20,
      bottom: -2,
      borderRadius: ui.taskRadius,
      backgroundColor: p.accentGlow,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: isSidebar ? 10 : 16,
      borderRadius: isSidebar ? 4 : ui.taskRadius,
      borderWidth: 1,
      borderColor: p.line,
      backgroundColor: isSidebar ? p.surface : p.surfaceRaised,
      paddingHorizontal: isSidebar ? 10 : 18,
      paddingVertical: isSidebar ? 10 : ui.variant === "obsidian" ? 14 : 18,
      overflow: "hidden",
      ...taskShadow,
    },
    containerSidebar: {
      borderLeftWidth: 2,
    },
    editContainer: {
      borderColor: p.accent + '40',
      backgroundColor: p.surfaceRaised,
    },
    completedContainer: {
      borderColor: p.successSoft,
      ...(ui.useCardShadow
        ? {
            shadowColor: p.success,
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2,
          }
        : {}),
    },
    orderBadge: {
      width: isSidebar ? 28 : 34,
      height: isSidebar ? 28 : 34,
      borderRadius: isSidebar ? 4 : 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    orderBadgeComplete: {
      borderColor: p.successSoft,
    },
    orderLabel: {
      color: p.subtext,
      fontSize: isSidebar ? 10 : 11,
      fontWeight: "700" as const,
      letterSpacing: 1,
    },
    orderLabelComplete: {
      color: p.success,
    },
    checkbox: {
      width: isSidebar ? 32 : 38,
      height: isSidebar ? 32 : 38,
      borderRadius: isSidebar ? 4 : 19,
      borderWidth: 1.5,
      borderColor: p.lineStrong,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
    },
    checkboxComplete: {
      borderColor: p.success,
      backgroundColor: p.success,
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
      color: p.ink,
      fontSize: ui.variant === "obsidian" ? 11 : 12,
      fontWeight: "700" as const,
      letterSpacing: ui.eyebrowUppercase ? 0.9 : 0.2,
      textTransform: ui.eyebrowUppercase ? "uppercase" : "none",
    },
    hintIcon: {
      opacity: 0.6,
    },
    input: {
      color: p.ink,
      fontSize: ui.variant === "obsidian" ? 18 : 22,
      lineHeight: ui.variant === "obsidian" ? 24 : 28,
      fontWeight: ui.titleWeight,
      minHeight: 38,
      paddingVertical: 0,
    },
    completedInput: {
      color: p.subtext,
      textDecorationLine: "line-through",
    },
    lockedInput: {
      opacity: 0.85,
    },
    checkboxDisabled: {
      opacity: 0.35,
    },
    trashButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239,68,68,0.1)",
      borderWidth: 1,
      borderColor: "rgba(239,68,68,0.2)",
    },
    trashButtonPressed: {
      backgroundColor: "rgba(239,68,68,0.2)",
      transform: [{ scale: 0.9 }],
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
      color: p.danger,
      opacity: 1,
    },
  });
}
