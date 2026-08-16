import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { CircleOff, Calendar, Check, Plus, Minus, CircleCheck, RotateCcw, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { ThemeBackground } from "@/components/ThemeBackground";
import { ThemePalette, taskTypeLabel } from "@/constants/onlyThreeTheme";
import { useOnlyThree } from "@/providers/OnlyThreeProvider";
import { formatHistoryDate } from "@/utils/date";
import { DailyTask } from "@/types/only-three";

interface GroupedTasks {
  date: string;
  formattedDate: string;
  tasks: Array<{ id: string; title: string; type: "big" | "medium" | "small"; isCompleted: boolean; completedAt?: string }>;
}

function groupTasks(items: Array<{ task: DailyTask; date: string }>): GroupedTasks[] {
  const map = new Map<string, GroupedTasks>();
  for (const item of items) {
    let group = map.get(item.date);
    if (!group) {
      group = {
        date: item.date,
        formattedDate: formatHistoryDate(item.date),
        tasks: [],
      };
      map.set(item.date, group);
    }
    group.tasks.push({
      id: item.task.id,
      title: item.task.title,
      type: item.task.type,
      isCompleted: item.task.isCompleted,
      completedAt: item.task.completedAt,
    });
  }
  return Array.from(map.values());
}

export default function UncompletedScreen() {
  const {
    uncompletedTasks,
    retroCompletedTasks,
    olderCompletedTasks,
    currentPalette: p,
    toggleTaskCompletion,
    recordRetroCompletion,
    removeRetroCompletion,
    deleteUncompletedTasks,
    addTaskToTomorrow,
    removeTaskFromTomorrow,
    isTaskInTomorrow,
    tomorrowFilledCount,
    addTaskToToday,
    removeTaskFromToday,
    isTaskInToday,
    todayFilledCount,
  } = useOnlyThree();
  const styles = useMemo(() => createStyles(p), [p]);
  const insets = useSafeAreaInsets();

  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [bannerText, setBannerText] = useState<string | null>(null);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovals = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showBanner = useCallback((text: string) => {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    setBannerText(text);
    bannerAnim.setValue(0);
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    bannerTimeout.current = setTimeout(() => {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setBannerText(null));
    }, 1800);
  }, [bannerAnim]);

  const activeItems = useMemo(() => {
    const combined = [...uncompletedTasks, ...retroCompletedTasks];
    combined.sort((a, b) => b.date.localeCompare(a.date));
    const grouped = groupTasks(combined);
    for (const group of grouped) {
      group.tasks.sort((a, b) => {
        const typeOrder = { big: 0, medium: 1, small: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });
    }
    return grouped;
  }, [uncompletedTasks, retroCompletedTasks]);

  const completedItems = useMemo(() => {
    return groupTasks(olderCompletedTasks);
  }, [olderCompletedTasks]);

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
    void Haptics.selectionAsync();
  }, []);

  const handleDelete = useCallback(() => {
    const allTasks = [...uncompletedTasks, ...retroCompletedTasks, ...olderCompletedTasks];
    const toDelete = allTasks
      .filter((item) => selectedIds.has(item.task.id))
      .map((item) => ({ date: item.date, type: item.task.type, title: item.task.title }));
    if (toDelete.length === 0) return;

    Alert.alert(
      "Are you sure?",
      "Deleting these tasks will also remove any record of them from the History page.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteUncompletedTasks(toDelete);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            console.log("[uncompleted] Deleted selected tasks", { count: toDelete.length });
            setSelectedIds(new Set());
            setSelectMode(false);
          },
        },
      ]
    );
  }, [selectedIds, uncompletedTasks, retroCompletedTasks, olderCompletedTasks, deleteUncompletedTasks]);

  const handleCancelSelect = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const handleCheckOff = useCallback((date: string, type: "big" | "medium" | "small", title: string, wasCompleted: boolean) => {
    toggleTaskCompletion(type, date);
    if (!wasCompleted) {
      recordRetroCompletion(title, type, date);
    } else {
      removeRetroCompletion(title, date);
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("[uncompleted] Toggled task completion", { date, type, title, wasCompleted });
  }, [toggleTaskCompletion, recordRetroCompletion, removeRetroCompletion]);

  const scheduleDeletion = useCallback((key: string, date: string, type: "big" | "medium" | "small", title: string) => {
    const existing = pendingRemovals.current.get(key);
    if (existing) clearTimeout(existing);
    const id = setTimeout(() => {
      deleteUncompletedTasks([{ date, type, title }]);
      pendingRemovals.current.delete(key);
    }, 10000);
    pendingRemovals.current.set(key, id);
  }, [deleteUncompletedTasks]);

  const cancelDeletion = useCallback((key: string) => {
    const existing = pendingRemovals.current.get(key);
    if (existing) {
      clearTimeout(existing);
      pendingRemovals.current.delete(key);
    }
  }, []);

  const handleToggleDay = useCallback((title: string, type: "big" | "medium" | "small", date: string, day: "today" | "tomorrow") => {
    const key = `${title}-${date}`;
    if (day === "today") {
      if (isTaskInToday(title)) {
        const success = removeTaskFromToday(title);
        if (success) {
          cancelDeletion(key);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showBanner("Removed from today");
        }
      } else {
        const success = addTaskToToday(title, 'uncompleted');
        if (success) {
          scheduleDeletion(key, date, type, title);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showBanner("Added to today");
        }
      }
    } else {
      if (isTaskInTomorrow(title)) {
        const success = removeTaskFromTomorrow(title);
        if (success) {
          cancelDeletion(key);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showBanner("Removed from tomorrow");
        }
      } else {
        const success = addTaskToTomorrow(title, 'uncompleted');
        if (success) {
          scheduleDeletion(key, date, type, title);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showBanner("Added to tomorrow");
        }
      }
    }
  }, [addTaskToToday, removeTaskFromToday, isTaskInToday, addTaskToTomorrow, removeTaskFromTomorrow, isTaskInTomorrow, scheduleDeletion, cancelDeletion, showBanner]);

  const todayFull = todayFilledCount >= 3;
  const tomorrowFull = tomorrowFilledCount >= 3;

  const totalCount = uncompletedTasks.length + retroCompletedTasks.length + olderCompletedTasks.length;

  const renderTask = useCallback((task: { id: string; title: string; type: "big" | "medium" | "small"; isCompleted: boolean }, date: string) => {
    const completed = task.isCompleted;
    const isSelected = selectedIds.has(task.id);

    if (selectMode) {
      return (
        <Pressable
          key={task.id}
          onPress={() => toggleSelect(task.id)}
          style={({ pressed }) => [
            styles.taskCard,
            completed && styles.taskCardCompleted,
            isSelected && styles.taskCardSelected,
            pressed && styles.taskCardSelectPressed,
          ]}
          testID={`select-${task.id}`}
        >
          <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
            {isSelected && <Check color="#fff" size={13} strokeWidth={3} />}
          </View>
          <View style={styles.taskContent}>
            <Text
              style={[styles.taskTitle, completed && styles.taskTitleCompleted]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Text style={[styles.taskType, completed && styles.taskTypeCompleted]}>
              {taskTypeLabel[task.type]}
            </Text>
          </View>
        </Pressable>
      );
    }

    return (
      <View key={task.id} style={[styles.taskCard, completed && styles.taskCardCompleted]}>
        <Pressable
          onPress={() => handleCheckOff(date, task.type, task.title, task.isCompleted)}
          style={({ pressed }) => [
            completed ? styles.checkButtonDone : styles.checkButton,
            pressed && styles.checkButtonPressed,
          ]}
          testID={`check-${task.id}`}
        >
          {completed ? (
            <RotateCcw color={p.muted} size={13} strokeWidth={2.5} />
          ) : (
            <Check color={p.success} size={14} strokeWidth={2.8} />
          )}
        </Pressable>
        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, completed && styles.taskTitleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <Text style={[styles.taskType, completed && styles.taskTypeCompleted]}>
            {taskTypeLabel[task.type]}
          </Text>
        </View>
        {!completed && (
          <View style={styles.segmentPill}>
            <Pressable
              onPress={() => handleToggleDay(task.title, task.type, date, "today")}
              disabled={todayFull && !isTaskInToday(task.title)}
              style={({ pressed }) => [
                styles.segment,
                styles.segmentLeft,
                isTaskInToday(task.title) && styles.segmentActive,
                todayFull && !isTaskInToday(task.title) && styles.segmentDisabled,
                pressed && styles.segmentPressed,
              ]}
              testID={`add-today-${task.id}`}
            >
              {isTaskInToday(task.title) ? (
                <Minus color={p.backgroundTop} size={10} strokeWidth={2.8} />
              ) : (
                <Plus color={todayFull ? p.muted : p.accent} size={10} strokeWidth={2.8} />
              )}
              <Text style={[
                styles.segmentLabel,
                isTaskInToday(task.title) && styles.segmentLabelActive,
                todayFull && !isTaskInToday(task.title) && styles.segmentLabelDisabled,
              ]}>
                {todayFull && !isTaskInToday(task.title) ? "3/3" : `${todayFilledCount}/3`}
              </Text>
            </Pressable>
            <View style={styles.segmentDivider} />
            <Pressable
              onPress={() => handleToggleDay(task.title, task.type, date, "tomorrow")}
              disabled={tomorrowFull && !isTaskInTomorrow(task.title)}
              style={({ pressed }) => [
                styles.segment,
                styles.segmentRight,
                isTaskInTomorrow(task.title) && styles.segmentActive,
                tomorrowFull && !isTaskInTomorrow(task.title) && styles.segmentDisabled,
                pressed && styles.segmentPressed,
              ]}
              testID={`add-tomorrow-${task.id}`}
            >
              {isTaskInTomorrow(task.title) ? (
                <Minus color={p.backgroundTop} size={10} strokeWidth={2.8} />
              ) : (
                <Plus color={tomorrowFull ? p.muted : p.accent} size={10} strokeWidth={2.8} />
              )}
              <Text style={[
                styles.segmentLabel,
                isTaskInTomorrow(task.title) && styles.segmentLabelActive,
                tomorrowFull && !isTaskInTomorrow(task.title) && styles.segmentLabelDisabled,
              ]}>
                {tomorrowFull && !isTaskInTomorrow(task.title) ? "3/3" : `${tomorrowFilledCount}/3`}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }, [handleCheckOff, handleToggleDay, isTaskInToday, isTaskInTomorrow, p, styles, todayFilledCount, todayFull, tomorrowFilledCount, tomorrowFull, selectMode, selectedIds, toggleSelect]);

  const headerRight = useCallback(() => {
    if (totalCount === 0) return null;
    if (selectMode) {
      return (
        <View style={styles.headerButtons}>
          <Pressable
            onPress={handleCancelSelect}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            testID="cancel-select"
          >
            <Text style={[styles.headerBtnText, { color: p.subtext }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={selectedIds.size === 0}
            style={({ pressed }) => [
              styles.headerBtn,
              styles.headerDeleteBtn,
              selectedIds.size === 0 && styles.headerDeleteBtnDisabled,
              pressed && selectedIds.size > 0 && styles.headerBtnPressed,
            ]}
            testID="delete-selected"
          >
            <Trash2 color={selectedIds.size > 0 ? "#fff" : p.muted} size={14} strokeWidth={2.4} />
            <Text style={[
              styles.headerDeleteText,
              selectedIds.size === 0 && { color: p.muted },
            ]}>
              {selectedIds.size > 0 ? `Delete (${selectedIds.size})` : "Delete"}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <Pressable
        onPress={() => setSelectMode(true)}
        style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
        testID="select-mode"
      >
        <Text style={[styles.headerBtnText, { color: p.accent }]}>Select</Text>
      </Pressable>
    );
  }, [selectMode, selectedIds, totalCount, handleCancelSelect, handleDelete, p, styles]);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Uncompleted",
          headerStyle: { backgroundColor: p.backgroundTop },
          headerTintColor: p.ink,
          headerRight,
        }}
      />
      <ThemeBackground palette={p} />
      {p.ui.showAmbientOrbs ? <View pointerEvents="none" style={styles.ambientOrb} /> : null}
      {bannerText !== null && (
        <Animated.View
          style={[
            styles.banner,
            {
              bottom: insets.bottom + 24,
              opacity: bannerAnim,
              transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
          pointerEvents="none"
        >
          {bannerText?.includes("Removed") ? (
            <Minus color={p.backgroundTop} size={13} strokeWidth={2.5} />
          ) : (
            <Plus color={p.backgroundTop} size={13} strokeWidth={2.5} />
          )}
          <Text style={styles.bannerText}>{bannerText}</Text>
        </Animated.View>
      )}
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Left behind</Text>
            <Text style={styles.title}>Uncompleted</Text>
            <Text style={styles.subtitle}>Tasks that slipped through the day.</Text>
          </View>

          {totalCount === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <CircleOff color={p.success} size={28} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySubtitle}>No uncompleted tasks. Nice work.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {activeItems.map((group) => (
                <View key={group.date} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Calendar color={p.accent} size={13} strokeWidth={2.2} />
                    <Text style={styles.dayDate}>{group.formattedDate}</Text>
                  </View>
                  <View style={styles.tasksList}>
                    {group.tasks.map((task) => renderTask(task, group.date))}
                  </View>
                </View>
              ))}

              {completedItems.length > 0 && (
                <>
                  <View style={styles.completedSectionHeader}>
                    <View style={styles.completedDivider} />
                    <View style={styles.completedLabelWrap}>
                      <CircleCheck color={p.muted} size={14} strokeWidth={2} />
                      <Text style={styles.completedLabel}>Since Completed</Text>
                    </View>
                    <View style={styles.completedDivider} />
                  </View>
                  {completedItems.map((group) => (
                    <View key={`completed-${group.date}`} style={styles.dayGroup}>
                      <View style={styles.dayHeader}>
                        <Calendar color={p.muted} size={13} strokeWidth={2.2} />
                        <Text style={[styles.dayDate, styles.dayDateCompleted]}>{group.formattedDate}</Text>
                      </View>
                      <View style={styles.tasksList}>
                        {group.tasks.map((task) => renderTask(task, group.date))}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <Text style={styles.footerNote}>
            Since Completed tasks are removed from Uncompleted after 7 days. You can find a record of all completed tasks in History.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(p: ThemePalette) {
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
      paddingBottom: 60,
    },
    ambientOrb: {
      position: "absolute",
      width: 200,
      height: 200,
      top: -60,
      left: -50,
      borderRadius: 999,
      backgroundColor: p.danger + "30",
      opacity: 0.15,
    },
    header: {
      gap: 8,
      marginBottom: 10,
    },
    eyebrow: {
      color: p.danger,
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    title: {
      color: p.ink,
      fontSize: 34,
      fontWeight: "700" as const,
      letterSpacing: -0.8,
    },
    subtitle: {
      color: p.subtext,
      fontSize: 15,
      lineHeight: 22,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 48,
      gap: 10,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.successSoft,
      marginBottom: 4,
    },
    emptyTitle: {
      color: p.ink,
      fontSize: 20,
      fontWeight: "700" as const,
    },
    emptySubtitle: {
      color: p.subtext,
      fontSize: 14,
    },
    list: {
      gap: 20,
    },
    dayGroup: {
      gap: 10,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingBottom: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.line,
    },
    dayDate: {
      color: p.accent,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    dayDateCompleted: {
      color: p.muted,
    },
    tasksList: {
      gap: 8,
    },
    taskCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingLeft: 6,
      paddingRight: 8,
      borderRadius: 16,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
    },
    taskCardCompleted: {
      opacity: 0.55,
      backgroundColor: p.surface + "80",
    },
    checkButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.successSoft,
      borderWidth: 1,
      borderColor: p.success + "30",
    },
    checkButtonDone: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.line,
      borderWidth: 1,
      borderColor: p.muted + "30",
    },
    checkButtonPressed: {
      transform: [{ scale: 0.92 }],
    },
    taskContent: {
      flex: 1,
      gap: 3,
    },
    taskTitle: {
      color: p.ink,
      fontSize: 15,
      fontWeight: "600" as const,
      lineHeight: 21,
    },
    taskTitleCompleted: {
      textDecorationLine: "line-through",
      color: p.muted,
    },
    taskType: {
      color: p.muted,
      fontSize: 12,
      letterSpacing: 0.3,
    },
    taskTypeCompleted: {
      color: p.muted + "80",
    },
    segmentPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.accent + "25",
      overflow: "hidden" as const,
    },
    segment: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 7,
      backgroundColor: p.accentSoft,
    },
    segmentLeft: {},
    segmentRight: {},
    segmentActive: {
      backgroundColor: p.accent,
    },
    segmentDisabled: {
      opacity: 0.4,
    },
    segmentPressed: {
      opacity: 0.7,
    },
    segmentDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch" as const,
      backgroundColor: p.accent + "40",
    },
    segmentLabel: {
      color: p.accent,
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    segmentLabelActive: {
      color: p.backgroundTop,
    },
    segmentLabelDisabled: {
      color: p.muted,
    },
    completedSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
      marginBottom: 2,
    },
    completedDivider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.muted + "40",
    },
    completedLabelWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    completedLabel: {
      color: p.muted,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
    },
    banner: {
      position: "absolute",
      alignSelf: "center",
      zIndex: 100,
      flexDirection: "row" as const,
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: p.ink,
    },
    bannerText: {
      color: p.backgroundTop,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    footerNote: {
      color: p.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingHorizontal: 16,
      marginTop: 8,
    },
    taskCardSelected: {
      borderColor: p.danger + "60",
      backgroundColor: p.danger + "08",
    },
    taskCardSelectPressed: {
      opacity: 0.7,
    },
    selectCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 2,
      borderColor: p.line,
      backgroundColor: "transparent",
    },
    selectCircleActive: {
      borderColor: p.danger,
      backgroundColor: p.danger,
    },
    headerButtons: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    headerBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    headerBtnPressed: {
      opacity: 0.6,
    },
    headerBtnText: {
      fontSize: 15,
      fontWeight: "600" as const,
    },
    headerDeleteBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: p.danger,
      borderRadius: 8,
    },
    headerDeleteBtnDisabled: {
      backgroundColor: p.line,
    },
    headerDeleteText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600" as const,
    },
  });
}
