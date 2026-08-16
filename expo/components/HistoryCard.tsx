import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Clock, CircleAlert, Medal } from "lucide-react-native";

import { ThemePalette, taskTypeLabel } from "@/constants/onlyThreeTheme";
import { DailyTask, DayPlan, RetroCompletion } from "@/types/only-three";
import { formatHistoryDate } from "@/utils/date";

type TaskHistoryStatus = "completed" | "uncompleted" | "completed_later";

function getTaskHistoryStatus(task: DailyTask, planDate: string, retroCompletions: RetroCompletion[]): TaskHistoryStatus {
  if (!task.isCompleted) {
    const hasRetro = retroCompletions.some(
      (rc) => rc.taskTitle === task.title && rc.originalDate === planDate
    );
    if (hasRetro) return "completed_later";
    return "uncompleted";
  }
  if (task.completedAt) {
    const completedDate = task.completedAt.slice(0, 10);
    if (completedDate !== planDate) return "completed_later";
  }
  return "completed";
}

interface HistoryCardProps {
  plan: DayPlan;
  palette: ThemePalette;
  retroCompletions: RetroCompletion[];
  onPress: () => void;
}

function HistoryCardComponent({ plan, palette, retroCompletions, onPress }: HistoryCardProps) {
  const taskStatuses = useMemo(() => {
    return plan.tasks.map((task) => ({
      task,
      status: getTaskHistoryStatus(task, plan.date, retroCompletions),
    }));
  }, [plan.tasks, plan.date, retroCompletions]);

  const filledTasks = taskStatuses.filter(({ task }) => task.title.trim().length > 0);
  const filledTaskCount = filledTasks.length;
  const uncompletedCount = filledTasks.filter((t) => t.status === "uncompleted").length;
  const allResolved = filledTaskCount > 0 && uncompletedCount === 0;
  const onTimeCount = taskStatuses.filter((t) => t.status === "completed").length;
  const isPerfectDay = filledTaskCount > 0 && onTimeCount === filledTaskCount;
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed ? styles.containerPressed : null]} testID={`history-card-${plan.date}`}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.date}>{formatHistoryDate(plan.date)}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusPill, allResolved ? styles.statusPillComplete : null]}>
              <Text style={[styles.statusText, allResolved ? styles.statusTextComplete : null]}>{onTimeCount} of {filledTaskCount} complete</Text>
            </View>
            <View style={[styles.dayBadge, allResolved ? styles.dayBadgeComplete : null]}>
              <Text style={[styles.dayBadgeLabel, allResolved ? styles.dayBadgeLabelComplete : null]}>{allResolved ? "Complete" : "In progress"}</Text>
            </View>
            {isPerfectDay && (
              <View style={styles.perfectDayPill}>
                <Medal color="#FF9F43" size={12} strokeWidth={2.4} />
              </View>
            )}
          </View>
        </View>
        <View style={styles.chevronWrap}>
          <ChevronRight color={palette.subtext} size={18} strokeWidth={2.4} />
        </View>
      </View>

      <View style={styles.taskList}>
        {taskStatuses.map(({ task, status }, index) => (
          <View key={task.id} style={[styles.taskRow, index === taskStatuses.length - 1 ? styles.taskRowLast : null]}>
            <View style={[styles.dot, status === "completed" ? styles.dotComplete : null]} />
            <Text numberOfLines={1} style={[styles.taskText, !task.title ? styles.placeholderText : null, status === "completed" ? styles.completedTaskText : null]}>
              {task.title || taskTypeLabel[task.type]}
            </Text>
            {status === "completed_later" && task.title.trim().length > 0 && (
              <View style={styles.completedLaterBadge}>
                <Clock color={palette.muted} size={10} strokeWidth={2.2} />
                <Text style={styles.completedLaterText}>Completed later</Text>
              </View>
            )}
            {status === "uncompleted" && task.title.trim().length > 0 && (
              <View style={styles.uncompletedBadge}>
                <CircleAlert color={palette.danger} size={10} strokeWidth={2.2} />
                <Text style={styles.uncompletedText}>Uncompleted</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export const HistoryCard = memo(HistoryCardComponent);

function createStyles(p: ThemePalette) {
  return StyleSheet.create({
    container: {
      gap: 18,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: p.line,
      backgroundColor: p.surfaceRaised,
      padding: 18,
      shadowColor: p.shadow,
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 8,
    },
    containerPressed: {
      transform: [{ scale: 0.99 }],
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    headerCopy: {
      flex: 1,
      gap: 8,
    },
    date: {
      color: p.ink,
      fontSize: 19,
      fontWeight: "700" as const,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    dayBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: p.cardGlow,
      borderWidth: 1,
      borderColor: p.line,
    },
    dayBadgeLabel: {
      color: p.subtext,
      fontSize: 12,
      fontWeight: "600" as const,
    },
    statusPillComplete: {
      backgroundColor: p.successSoft,
      borderColor: p.successGlow,
    },
    statusText: {
      color: p.subtext,
      fontSize: 12,
      fontWeight: "600" as const,
    },
    statusTextComplete: {
      color: p.success,
    },
    chevronWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    taskList: {
      gap: 0,
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: p.line,
    },
    taskRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: p.lineStrong,
    },
    dotComplete: {
      borderColor: p.success,
      backgroundColor: p.success,
    },
    taskText: {
      flex: 1,
      color: p.ink,
      fontSize: 15,
    },
    completedTaskText: {
      color: p.subtext,
    },
    placeholderText: {
      color: p.muted,
    },
    completedLaterBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: p.surfaceSoft,
    },
    completedLaterText: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    uncompletedBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: `${p.danger}18`,
    },
    uncompletedText: {
      color: p.danger,
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    dayBadgeComplete: {
      backgroundColor: p.successSoft,
      borderColor: p.successGlow,
    },
    dayBadgeLabelComplete: {
      color: p.success,
    },
    perfectDayPill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: "#FF9F4318",
      borderWidth: 1,
      borderColor: "#FF9F43",
    },
  });
}
