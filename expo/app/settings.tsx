import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Bell, Layers, Moon, Palette, Target, Wind, Sparkles, CircleDot, BookOpen, Smartphone, Sun, RotateCcw, AlertTriangle, Construction, Columns3 } from "lucide-react-native";

import { router } from "expo-router";

import { ThemePalette, cardShadowStyle } from "@/constants/onlyThreeTheme";
import { ThemeBackground } from "@/components/ThemeBackground";
import { useOnlyThree } from "@/providers/OnlyThreeProvider";
import { BadgeMode, DailyReminderTime, HomeLayoutMode, TaskLabelMode, ThemeMode } from "@/types/only-three";

const reminderOptions = [
  { label: "6:00 PM", hour: 18, minute: 0 },
  { label: "7:30 PM", hour: 19, minute: 30 },
  { label: "9:00 PM", hour: 21, minute: 0 },
] as const;

const themeOptions: Array<{ mode: ThemeMode; label: string; description: string; previewColors: [string, string] }> = [
  {
    mode: "light",
    label: "Light",
    description: "Clean and Simple",
    previewColors: ["#FAFAF9", "#B45309"],
  },
  {
    mode: "night",
    label: "Night",
    description: "Warm & earthy",
    previewColors: ["#1A1916", "#E3B26B"],
  },
  {
    mode: "obsidian",
    label: "Obsidian",
    description: "Clean v2.0",
    previewColors: ["#1E1E1E", "#7F6DF2"],
  },
];

const labelModeOptions: Array<{ mode: TaskLabelMode; label: string; description: string; preview: string[]; iconHint: string }> = [
  {
    mode: "sized",
    label: "By size",
    description: "Big, Medium, Small",
    preview: ["Big task", "Medium task", "Small task"],
    iconHint: "Each icon reflects the weight of the task",
  },
  {
    mode: "numbered",
    label: "By order",
    description: "One, Two, Three",
    preview: ["Task one", "Task two", "Task three"],
    iconHint: "Simple sequential ordering",
  },
];

const dailyReminderOptions: Array<{ time: DailyReminderTime; label: string; description: string; icon: "sun" | "coffee" | "clock" }> = [
  { time: "early", label: "8:00 AM", description: "Early bird", icon: "sun" },
  { time: "midmorning", label: "10:30 AM", description: "Mid-morning", icon: "coffee" },
  { time: "midday", label: "12:30 PM", description: "Midday", icon: "clock" },
];

const homeLayoutOptions: Array<{ mode: HomeLayoutMode; label: string; description: string }> = [
  { mode: "tabs", label: "Classic tabs", description: "Swipe between Today and Tomorrow" },
  { mode: "sidebar", label: "Only Three 2.0 (Beta)", description: "Today center with overlay Memory and Tomorrow sidebars" },
];

const badgeModeOptions: Array<{ mode: BadgeMode; label: string; description: string }> = [
  { mode: "count", label: "Count", description: "Shows uncompleted task number" },
  { mode: "dot", label: "Dot", description: "Shows a red dot if any" },
  { mode: "none", label: "Off", description: "No badge shown" },
];

export default function SettingsScreen() {
  const { settings, currentPalette: p, updateNotifications, updateReminderTime, updateTheme, updateHomeLayout, updateDefaultTaskLabelMode, updateBadgeMode, updateDailyReminderEnabled, updateDailyReminderTime, resetTutorial, resetToFirstTime, uncompletedTasks, loadExampleData } = useOnlyThree();
  const styles = useMemo(() => createStyles(p), [p]);
  const handlePresetSelect = useCallback((hour: number, minute: number) => {
    updateReminderTime(hour, minute);
  }, [updateReminderTime]);

  const [devToolsUnlocked, setDevToolsUnlocked] = useState<boolean>(false);
  const [devToolsVisible, setDevToolsVisible] = useState<boolean>(false);
  const tapCountRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleAboutTitleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current > 1500) {
      tapCountRef.current = 0;
    }
    lastTapRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= 7 && !devToolsUnlocked) {
      tapCountRef.current = 0;
      setDevToolsUnlocked(true);
    }
  }, [devToolsUnlocked]);

  const handleDevToolsOpen = useCallback(() => {
    Alert.alert(
      "\u26A0\uFE0F  Enter Developer Tools?",
      "Warning: Actions in Developer Tools can permanently erase all your tasks, streaks, and app data. This cannot be undone.\n\nAre you absolutely sure?",
      [
        { text: "Go back", style: "cancel" },
        {
          text: "I understand, enter",
          style: "destructive",
          onPress: () => {
            setDevToolsVisible(true);
            Animated.sequence([
              Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
              Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start();
          },
        },
      ]
    );
  }, [shakeAnim]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "Settings", headerStyle: { backgroundColor: p.backgroundTop }, headerTintColor: p.ink }} />
      <ThemeBackground palette={p} />
      {p.ui.showAmbientOrbs ? <View pointerEvents="none" style={styles.ambientOrb} /> : null}
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Make some tweaks</Text>
            <Text style={styles.title}>Settings</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.iconBadge}>
                <Bell color={p.accent} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>Reminders</Text>
                <Text style={styles.cardSubtitle}>Stay on track, your way.</Text>
              </View>
            </View>

            <View style={styles.reminderSection}>
              <View style={styles.reminderSectionHeader}>
                <Moon color={p.muted} size={13} strokeWidth={2.2} />
                <Text style={styles.reminderSectionLabel}>Evening</Text>
                <Text style={styles.reminderSectionHint}>Set your 3 for tomorrow</Text>
                <Switch
                  onValueChange={updateNotifications}
                  testID="notifications-switch"
                  thumbColor={Platform.OS === "android" ? p.ink : undefined}
                  trackColor={{ false: p.surfaceElevated, true: p.accentDeep }}
                  value={settings.notificationsEnabled}
                />
              </View>
              <View style={styles.optionList}>
                {reminderOptions.map((option) => {
                  const isSelected = settings.reminderHour === option.hour && settings.reminderMinute === option.minute;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => handlePresetSelect(option.hour, option.minute)}
                      style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
                      testID={`reminder-option-${option.hour}-${option.minute}`}
                    >
                      <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.reminderDivider} />

            <View style={styles.reminderSection}>
              <View style={styles.reminderSectionHeader}>
                <Sun color={p.muted} size={13} strokeWidth={2.2} />
                <Text style={styles.reminderSectionLabel}>Daily</Text>
                <Text style={styles.reminderSectionHint}>Check today's tasks</Text>
                <Switch
                  onValueChange={updateDailyReminderEnabled}
                  testID="daily-reminder-switch"
                  thumbColor={Platform.OS === "android" ? p.ink : undefined}
                  trackColor={{ false: p.surfaceElevated, true: p.accentDeep }}
                  value={settings.dailyReminderEnabled}
                />
              </View>
              <View style={styles.optionList}>
                {dailyReminderOptions.map((option) => {
                  const isSelected = settings.dailyReminderTime === option.time;
                  return (
                    <Pressable
                      key={option.time}
                      onPress={() => updateDailyReminderTime(option.time)}
                      style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
                      testID={`daily-reminder-${option.time}`}
                    >
                      <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.iconBadge}>
                <Palette color={p.accent} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>Theme</Text>
                <Text style={styles.cardSubtitle}>Classic styles or the new Obsidian v2.0 look.</Text>
              </View>
            </View>

            <View style={styles.themeGrid}>
              {themeOptions.map((option) => {
                const isSelected = settings.theme === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => updateTheme(option.mode)}
                    style={[styles.themeCard, isSelected && styles.themeCardSelected]}
                    testID={`theme-option-${option.mode}`}
                  >
                    <View style={styles.themePreviewRow}>
                      <View style={[styles.themePreviewSwatch, { backgroundColor: option.previewColors[0] }]}>
                        <View style={[styles.themePreviewAccent, { backgroundColor: option.previewColors[1] }]} />
                      </View>
                      {isSelected && (
                        <View style={styles.themeSelectedDot} />
                      )}
                    </View>
                    <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>{option.label}</Text>
                    <Text style={styles.themeDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.iconBadge}>
                <Columns3 color={p.accent} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>Home layout</Text>
                <Text style={styles.cardSubtitle}>Classic swipe tabs or the new Only Three 2.0 layout.</Text>
              </View>
            </View>

            <View style={styles.labelModeGrid}>
              {homeLayoutOptions.map((option) => {
                const isSelected = settings.homeLayout === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => updateHomeLayout(option.mode)}
                    style={[styles.labelModeCard, isSelected && styles.labelModeCardSelected]}
                    testID={`home-layout-${option.mode}`}
                  >
                    <View style={styles.labelModePreview}>
                      {isSelected && <View style={styles.labelModeSelectedDot} />}
                    </View>
                    <Text style={[styles.labelModeLabel, isSelected && styles.labelModeLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.labelModeDescription}>{option.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.iconBadge}>
                <Layers color={p.accent} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>Task labels</Text>
                <Text style={styles.cardSubtitle}>How your three tasks are named.</Text>
              </View>
            </View>

            <Text style={styles.labelModeHint}>
              This sets the default for new days. You can override it per-day in the Tomorrow tab.
            </Text>

            <View style={styles.labelModeGrid}>
              {labelModeOptions.map((option) => {
                const isSelected = settings.defaultTaskLabelMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => updateDefaultTaskLabelMode(option.mode)}
                    style={[styles.labelModeCard, isSelected && styles.labelModeCardSelected]}
                    testID={`label-mode-${option.mode}`}
                  >
                    <View style={styles.labelModePreview}>
                      {option.mode === "sized" ? (
                        <View style={styles.labelModeIconRow}>
                          <Target color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                          <Wind color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                          <Sparkles color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                        </View>
                      ) : (
                        <View style={styles.labelModeIconRow}>
                          <CircleDot color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                          <CircleDot color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                          <CircleDot color={isSelected ? p.accent : p.muted} size={14} strokeWidth={2} />
                        </View>
                      )}
                      {isSelected && <View style={styles.labelModeSelectedDot} />}
                    </View>
                    <Text style={[styles.labelModeLabel, isSelected && styles.labelModeLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.labelModeDescription}>{option.description}</Text>
                    <View style={styles.labelModePreviewList}>
                      {option.preview.map((item, i) => (
                        <Text key={i} style={[styles.labelModePreviewItem, isSelected && styles.labelModePreviewItemSelected]}>
                          {item}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.labelModeIconHint}>{option.iconHint}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.rowHeader}>
              <View style={styles.iconBadge}>
                <Smartphone color={p.accent} size={16} strokeWidth={2.2} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.cardTitle}>App icon badge</Text>
                <Text style={styles.cardSubtitle}>Show uncompleted tasks on the icon.</Text>
              </View>
            </View>

            <View style={styles.badgePreviewRow}>
              <View style={styles.badgePreviewIcon}>
                <Image source={require('@/assets/images/icon.png')} style={styles.badgePreviewApp} />
                {settings.badgeMode === "count" && (
                  <View style={styles.badgePreviewCount}>
                    <Text style={styles.badgePreviewCountText}>{uncompletedTasks.length > 0 ? uncompletedTasks.length : 2}</Text>
                  </View>
                )}
                {settings.badgeMode === "dot" && (
                  <View style={styles.badgePreviewDot} />
                )}
              </View>
              <Text style={styles.badgePreviewLabel}>
                {settings.badgeMode === "none"
                  ? "Badge hidden"
                  : settings.badgeMode === "dot"
                    ? "Dot when tasks remain"
                    : uncompletedTasks.length > 0
                      ? `${uncompletedTasks.length} uncompleted`
                      : "Shows task count"}
              </Text>
            </View>

            <View style={styles.optionList}>
              {badgeModeOptions.map((option) => {
                const isSelected = settings.badgeMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => updateBadgeMode(option.mode)}
                    style={[styles.optionButton, isSelected ? styles.optionButtonSelected : null]}
                    testID={`badge-mode-${option.mode}`}
                  >
                    <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable onPress={handleAboutTitleTap}>
            <View style={styles.card}>
              <View style={styles.rowHeader}>
                <View style={styles.iconBadge}>
                  <Moon color={p.ink} size={16} strokeWidth={2.2} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.cardTitle}>About Only Three</Text>
                </View>
              </View>
              <Text style={styles.aboutText}>Your most productive days don't come from doing everything — they come from doing the right things. By choosing just three tasks each day, you train your mind to prioritise what truly matters. Small, focused effort compounds over time into real momentum. Only Three is built on the belief that clarity beats clutter, and that daily intentional focus is the most powerful habit you can build.</Text>
            </View>
          </Pressable>

          {devToolsUnlocked && !devToolsVisible && (
            <Pressable
              onPress={handleDevToolsOpen}
              style={({ pressed }) => [styles.devToolsUnlockedButton, pressed && styles.tutorialButtonPressed]}
              testID="open-dev-tools"
            >
              <Construction color={p.muted} size={15} strokeWidth={2} />
              <Text style={styles.devToolsUnlockedText}>Developer Tools</Text>
            </Pressable>
          )}

          {devToolsVisible && (
            <Animated.View style={[styles.devToolsCard, { transform: [{ translateX: Animated.multiply(shakeAnim, 4) }] }]}>
              <View style={styles.devToolsHeader}>
                <View style={styles.devToolsIconBadge}>
                  <AlertTriangle color="#F59E0B" size={16} strokeWidth={2.2} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.devToolsTitle}>Developer Tools</Text>
                  <Text style={styles.devToolsSubtitle}>Handle with care. Data loss is permanent.</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  loadExampleData();
                  router.back();
                }}
                style={({ pressed }) => [styles.devToolAction, pressed && styles.devToolActionPressed]}
                testID="load-example-data"
              >
                <Sparkles color={p.muted} size={15} strokeWidth={2} />
                <Text style={styles.devToolActionText}>Load example data</Text>
              </Pressable>

              <View style={styles.devToolDivider} />

              <Pressable
                onPress={() => {
                  resetTutorial();
                  router.back();
                }}
                style={({ pressed }) => [styles.devToolAction, pressed && styles.devToolActionPressed]}
                testID="replay-tutorial"
              >
                <BookOpen color={p.muted} size={15} strokeWidth={2} />
                <Text style={styles.devToolActionText}>Replay tutorial</Text>
              </Pressable>

              <View style={styles.devToolDivider} />

              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Reset Everything?",
                    "This will permanently delete all your tasks, streaks, stats, and settings. You'll start fresh as a brand new user.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Reset everything",
                        style: "destructive",
                        onPress: () => {
                          void resetToFirstTime();
                          router.back();
                        },
                      },
                    ]
                  );
                }}
                style={({ pressed }) => [styles.devToolAction, pressed && styles.devToolActionPressed]}
                testID="reset-first-time"
              >
                <RotateCcw color="#EF4444" size={15} strokeWidth={2} />
                <Text style={styles.devToolActionTextDanger}>Reset to new user</Text>
              </Pressable>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(p: ThemePalette) {
  const ui = p.ui;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.backgroundBottom,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      padding: 20,
      gap: 16,
    },
    ambientOrb: {
      position: "absolute",
      width: 220,
      height: 220,
      top: -60,
      left: -50,
      borderRadius: 999,
      backgroundColor: p.accentGlow,
      opacity: 0.1,
    },
    header: {
      gap: 8,
      marginBottom: 10,
    },
    eyebrow: {
      color: p.accentStrong,
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: ui.eyebrowUppercase ? 1 : 0.2,
      textTransform: ui.eyebrowUppercase ? "uppercase" : "none",
    },
    title: {
      color: p.ink,
      fontSize: ui.titleSize,
      fontWeight: ui.titleWeight,
      letterSpacing: ui.titleLetterSpacing,
    },
    subtitle: {
      color: p.subtext,
      fontSize: 15,
      lineHeight: 22,
    },
    card: {
      gap: 18,
      borderRadius: ui.cardRadius,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
      padding: 18,
      ...cardShadowStyle(p),
    },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      color: p.ink,
      fontSize: 17,
      fontWeight: "700" as const,
    },
    cardSubtitle: {
      color: p.subtext,
      fontSize: 14,
      lineHeight: 20,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    themeCard: {
      width: "47%",
      gap: 10,
      padding: 14,
      borderRadius: ui.panelRadius,
      backgroundColor: p.surfaceRaised,
      borderWidth: 1.5,
      borderColor: p.line,
    },
    themeCardSelected: {
      borderColor: p.accent,
      backgroundColor: p.accentSoft,
    },
    themePreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    themePreviewSwatch: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    themePreviewAccent: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    themeSelectedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.accent,
    },
    themeLabel: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "700" as const,
    },
    themeLabelSelected: {
      color: p.accent,
    },
    themeDescription: {
      color: p.subtext,
      fontSize: 12,
    },
    optionList: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
    },
    optionButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: ui.variant === "obsidian" ? ui.chipRadius : 999,
      backgroundColor: p.surfaceRaised,
      borderWidth: 1,
      borderColor: p.line,
    },
    optionButtonSelected: {
      borderColor: p.accent,
      backgroundColor: p.accentSoft,
    },
    optionLabel: {
      color: p.ink,
      fontSize: 14,
      fontWeight: "600" as const,
    },
    optionLabelSelected: {
      color: p.accent,
    },

    aboutText: {
      color: p.subtext,
      fontSize: 15,
      lineHeight: 23,
    },
    labelModeHint: {
      color: p.muted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: -6,
    },
    labelModeGrid: {
      flexDirection: "row",
      gap: 12,
    },
    labelModeCard: {
      flex: 1,
      gap: 8,
      padding: 14,
      borderRadius: ui.panelRadius,
      backgroundColor: p.surfaceRaised,
      borderWidth: 1.5,
      borderColor: p.line,
    },
    labelModeCardSelected: {
      borderColor: p.accent,
      backgroundColor: p.accentSoft,
    },
    labelModePreview: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    labelModeIconRow: {
      flexDirection: "row",
      gap: 6,
    },
    labelModeSelectedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.accent,
    },
    labelModeLabel: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "700" as const,
    },
    labelModeLabelSelected: {
      color: p.accent,
    },
    labelModeDescription: {
      color: p.subtext,
      fontSize: 12,
    },
    labelModePreviewList: {
      gap: 3,
      marginTop: 4,
    },
    labelModePreviewItem: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "500" as const,
    },
    labelModePreviewItemSelected: {
      color: p.accentStrong,
    },
    labelModeIconHint: {
      color: p.muted,
      fontSize: 10,
      fontStyle: "italic" as const,
      marginTop: 2,
    },
    tutorialButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 14,
      marginTop: 4,
      marginBottom: 20,
    },
    tutorialButtonPressed: {
      opacity: 0.5,
    },
    tutorialButtonText: {
      color: p.muted,
      fontSize: 14,
      fontWeight: "500" as const,
    },
    resetButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 14,
      marginBottom: 20,
    },
    resetButtonText: {
      color: "#EF4444",
      fontSize: 14,
      fontWeight: "500" as const,
    },
    badgePreviewRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      paddingVertical: 4,
    },
    badgePreviewIcon: {
      width: 48,
      height: 48,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    badgePreviewApp: {
      width: 42,
      height: 42,
      borderRadius: 10,
      overflow: "hidden" as const,
    },
    badgePreviewCount: {
      position: "absolute" as const,
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#EF4444",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: 4,
    },
    badgePreviewCountText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700" as const,
    },
    badgePreviewDot: {
      position: "absolute" as const,
      top: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#EF4444",
    },
    badgePreviewLabel: {
      color: p.subtext,
      fontSize: 13,
      flex: 1,
    },
    reminderSection: {
      gap: 10,
    },
    reminderSectionHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    reminderSectionLabel: {
      color: p.ink,
      fontSize: 14,
      fontWeight: "600" as const,
    },
    reminderSectionHint: {
      flex: 1,
      color: p.muted,
      fontSize: 12,
    },
    reminderDivider: {
      height: 1,
      backgroundColor: p.line,
      marginVertical: 2,
    },
    devToolsUnlockedButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 14,
      marginTop: 4,
      marginBottom: 8,
    },
    devToolsUnlockedText: {
      color: p.muted,
      fontSize: 14,
      fontWeight: "500" as const,
    },
    devToolsCard: {
      gap: 14,
      borderRadius: ui.cardRadius,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: "#F59E0B40",
      padding: 18,
      shadowColor: "#F59E0B",
      shadowOpacity: p.ui.useCardShadow ? 0.08 : 0,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: p.ui.useCardShadow ? 6 : 0,
      marginBottom: 20,
    },
    devToolsHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
    },
    devToolsIconBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "#F59E0B18",
      borderWidth: 1,
      borderColor: "#F59E0B30",
    },
    devToolsTitle: {
      color: "#F59E0B",
      fontSize: 17,
      fontWeight: "700" as const,
    },
    devToolsSubtitle: {
      color: p.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    devToolAction: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    devToolActionPressed: {
      opacity: 0.5,
    },
    devToolActionText: {
      color: p.muted,
      fontSize: 14,
      fontWeight: "500" as const,
    },
    devToolActionTextDanger: {
      color: "#EF4444",
      fontSize: 14,
      fontWeight: "500" as const,
    },
    devToolDivider: {
      height: 1,
      backgroundColor: p.line,
    },
  });
}
