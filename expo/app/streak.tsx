import React, { useMemo, useState, useRef, useCallback } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Stack } from "expo-router";
import { Flame, Trophy, TrendingUp, Medal, Zap, Info, X, CheckCircle, Clock, ArrowDown, Minus, ArrowUp, Rocket } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemeBackground, ThemeChip } from "@/components/ThemeBackground";
import { useOnlyThree } from "@/providers/OnlyThreeProvider";
import { ThemePalette } from "@/constants/onlyThreeTheme";
import { DayPlan, RetroCompletion } from "@/types/only-three";

type TimeRange = "week" | "month" | "year";

const MOMENTUM_FACTORS = [
  { icon: CheckCircle, label: "Task completion", desc: "Tasks finished vs available" },
  { icon: Medal, label: "Perfect days", desc: "Days with all tasks done" },
  { icon: Clock, label: "Recent activity", desc: "Last 5 days performance" },
  { icon: Flame, label: "Streak bonus", desc: "Consistent streaks boost score" },
];

const MOMENTUM_RANGES = [
  { days: "7 days", desc: "Weighted toward recent days" },
  { days: "30 days", desc: "Balance of effort & consistency" },
  { days: "90 days", desc: "Long-term habits & sustained effort" },
];

const MOMENTUM_STATUSES = [
  { label: "Falling", color: "#FF6B35", range: "< 35%", icon: ArrowDown, desc: "Time to refocus" },
  { label: "Holding", color: "#4A9EF5", range: "35–59%", icon: Minus, desc: "Steady, push harder" },
  { label: "Building", color: "#34C759", range: "60–94%", icon: ArrowUp, desc: "Gaining traction" },
  { label: "Flying", color: "#FFD700", range: "95%+", icon: Rocket, desc: "Unstoppable!" },
];

function getDaysInRange(range: TimeRange): Date[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days: Date[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
  } else if (range === "month") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
  } else {
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
  }

  return days;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getShortDay(date: Date): string {
  return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
}

function getPlanCompletionInfo(plans: DayPlan[], dateKey: string, _retroCompletions: RetroCompletion[]): { completed: number; total: number } {
  const plan = plans.find((p) => p.date === dateKey);
  if (!plan) return { completed: 0, total: 0 };
  const availableTasks = plan.tasks.filter((t) => t.title.trim().length > 0);
  const completed = availableTasks.filter((t) => {
    if (!t.isCompleted) return false;
    if (t.completedAt) {
      const completedDate = t.completedAt.slice(0, 10);
      if (completedDate !== dateKey) return false;
    }
    return true;
  }).length;
  return { completed, total: availableTasks.length };
}

export default function StreakScreen() {
  const { streak, dayPlans, retroCompletions, memoryTasks, currentPalette: p } = useOnlyThree();
  const [activeRange, setActiveRange] = useState<TimeRange>("week");
  const [showMomentumInfo, setShowMomentumInfo] = useState<boolean>(false);
  const [showStreakInfo, setShowStreakInfo] = useState<boolean>(false);
  const [showPerfectDayTip, setShowPerfectDayTip] = useState<boolean>(false);
  const [showCompletionTip, setShowCompletionTip] = useState<boolean>(false);
  const completionTipOpacity = useRef(new Animated.Value(0)).current;
  const completionTipScale = useRef(new Animated.Value(0.92)).current;
  const perfectTipOpacity = useRef(new Animated.Value(0)).current;
  const perfectTipScale = useRef(new Animated.Value(0.92)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(() => createStyles(p), [p]);

  const toggleCompletionTip = useCallback(() => {
    if (showCompletionTip) {
      Animated.parallel([
        Animated.timing(completionTipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(completionTipScale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start(() => setShowCompletionTip(false));
    } else {
      setShowCompletionTip(true);
      Animated.parallel([
        Animated.timing(completionTipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(completionTipScale, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 16 }),
      ]).start();
    }
  }, [showCompletionTip, completionTipOpacity, completionTipScale]);

  const togglePerfectDayTip = useCallback(() => {
    if (showPerfectDayTip) {
      Animated.parallel([
        Animated.timing(perfectTipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(perfectTipScale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start(() => setShowPerfectDayTip(false));
    } else {
      setShowPerfectDayTip(true);
      Animated.parallel([
        Animated.timing(perfectTipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(perfectTipScale, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 16 }),
      ]).start();
    }
  }, [showPerfectDayTip, perfectTipOpacity, perfectTipScale]);

  const switchRange = useCallback((range: TimeRange) => {
    const toValue = range === "week" ? 0 : range === "month" ? 1 : 2;
    setActiveRange(range);
    Animated.spring(tabAnim, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
      speed: 18,
    }).start();
  }, [tabAnim]);

  const days = useMemo(() => getDaysInRange(activeRange), [activeRange]);

  const completionMap = useMemo(() => {
    const map: Record<string, { completed: number; total: number }> = {};
    for (const day of days) {
      const key = formatDateKey(day);
      map[key] = getPlanCompletionInfo(dayPlans, key, retroCompletions);
    }
    return map;
  }, [days, dayPlans, retroCompletions]);

  const memoryCompletedCount = useMemo(() => {
    return memoryTasks.filter((t) => t.isCompleted).length;
  }, [memoryTasks]);

  const memoryTotalCount = useMemo(() => {
    return memoryTasks.length;
  }, [memoryTasks]);

  const rangeStats = useMemo(() => {
    let perfectDays = 0;
    let totalCompleted = 0;
    let totalPossible = 0;
    for (const day of days) {
      const key = formatDateKey(day);
      const info = completionMap[key] ?? { completed: 0, total: 0 };
      totalCompleted += info.completed;
      totalPossible += info.total > 0 ? info.total : 0;
      if (info.total > 0 && info.completed === info.total) perfectDays++;
    }
    totalCompleted += memoryCompletedCount;
    totalPossible += memoryTotalCount;
    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    return { perfectDays, totalCompleted, totalPossible, rate };
  }, [days, completionMap, memoryCompletedCount, memoryTotalCount]);

  const currentStreak = streak.current;
  const momentum = useMemo(() => {
    const daysInRange = days.length;
    const completionRate = rangeStats.totalPossible > 0
      ? rangeStats.totalCompleted / rangeStats.totalPossible
      : 0;
    const perfectRate = daysInRange > 0 ? rangeStats.perfectDays / daysInRange : 0;

    const recentDays = days.slice(-5);
    let recentCompleted = 0;
    let recentTotal = 0;
    for (const day of recentDays) {
      const key = formatDateKey(day);
      const info = completionMap[key] ?? { completed: 0, total: 0 };
      recentCompleted += info.completed;
      recentTotal += info.total > 0 ? info.total : 0;
    }
    const recentRate = recentTotal > 0 ? recentCompleted / recentTotal : 0;

    const streakBonus = Math.min(currentStreak / 10, 1);

    let score: number;
    if (activeRange === "week") {
      score = Math.round(
        recentRate * 50 + completionRate * 20 + perfectRate * 15 + streakBonus * 15
      );
    } else if (activeRange === "month") {
      score = Math.round(
        recentRate * 30 + completionRate * 35 + perfectRate * 20 + streakBonus * 15
      );
    } else {
      score = Math.round(
        recentRate * 20 + completionRate * 40 + perfectRate * 25 + streakBonus * 15
      );
    }
    score = Math.max(0, Math.min(100, score));

    let label: string;
    let color: string;
    if (score >= 95) {
      label = "Flying";
      color = "#FFB800";
    } else if (score >= 60) {
      label = "Building";
      color = "#34D399";
    } else if (score >= 35) {
      label = "Holding";
      color = "#60A5FA";
    } else if (score > 0) {
      label = "Falling";
      color = "#FF9F43";
    } else {
      label = "At rest";
      color = p.muted;
    }

    return { score, label, color };
  }, [days, rangeStats, completionMap, currentStreak, activeRange, p.muted]);

  const renderWeekView = () => (
    <View style={styles.weekGrid}>
      {days.map((day) => {
        const key = formatDateKey(day);
        const info = completionMap[key] ?? { completed: 0, total: 0 };
        const level = info.completed;
        const isPerfect = info.total > 0 && info.completed === info.total;
        const isToday = key === formatDateKey(new Date());
        return (
          <View key={key} style={styles.weekDay}>
            <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>
              {getShortDay(day)}
            </Text>
            <View style={[
              styles.weekDayCircle,
              level === 0 && styles.dayEmpty,
              !isPerfect && level === 1 && styles.dayLow,
              !isPerfect && level >= 2 && styles.dayMed,
              isPerfect && styles.dayFull,
              isToday && styles.dayToday,
            ]}>
              <Text style={[
                styles.weekDayCount,
                isPerfect && styles.weekDayCountFull,
                level === 0 && styles.weekDayCountEmpty,
              ]}>
                {level}
              </Text>
            </View>
            <Text style={[styles.weekDateNum, isToday && styles.weekDateNumToday]}>
              {day.getDate()}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderMonthView = () => {
    const cols = 10;
    const rows: Date[][] = [];
    for (let r = 0; r < 3; r++) {
      rows.push(days.slice(r * cols, r * cols + cols));
    }
    return (
      <View style={styles.monthGrid}>
        {rows.map((row, ri) => (
          <View key={`mr-${ri}`} style={styles.monthRow}>
            {row.map((day) => {
              const key = formatDateKey(day);
              const info = completionMap[key] ?? { completed: 0, total: 0 };
              const level = info.completed;
              const isPerfect = info.total > 0 && info.completed === info.total;
              const isToday = key === formatDateKey(new Date());
              return (
                <View key={key} style={styles.monthCell}>
                  <View style={[
                    styles.monthDot,
                    level === 0 && styles.dotEmpty,
                    !isPerfect && level === 1 && styles.dotLow,
                    !isPerfect && level >= 2 && styles.dotMed,
                    isPerfect && styles.dotFull,
                    isToday && styles.dotToday,
                  ]} />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderYearView = () => {
    const cols = 15;
    const rows: Date[][] = [];
    for (let r = 0; r < 6; r++) {
      rows.push(days.slice(r * cols, r * cols + cols));
    }
    return (
      <View style={styles.yearGrid}>
        {rows.map((row, ri) => (
          <View key={`yr-${ri}`} style={styles.yearRow}>
            {row.map((day) => {
              const key = formatDateKey(day);
              const info = completionMap[key] ?? { completed: 0, total: 0 };
              const level = info.completed;
              const isPerfect = info.total > 0 && info.completed === info.total;
              return (
                <View
                  key={key}
                  style={[
                    styles.yearCell,
                    level === 0 && styles.yCellEmpty,
                    !isPerfect && level === 1 && styles.yCellLow,
                    !isPerfect && level >= 2 && styles.yCellMed,
                    isPerfect && styles.yCellFull,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />
      <ThemeBackground palette={p} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.handle} />

          <View style={styles.heroSection}>
            <ThemeChip
              palette={p}
              gradientColors={["rgba(255,140,50,0.18)", "rgba(255,80,80,0.06)"]}
              style={styles.heroGradient}
            >
              <Pressable
                onPress={() => setShowStreakInfo(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.heroInfoBtn}
              >
                <Info color="rgba(255,159,67,0.5)" size={14} strokeWidth={2.5} />
              </Pressable>
              <View style={styles.heroFlameWrap}>
                <Flame color="#FF9F43" fill="rgba(255,159,67,0.5)" size={32} strokeWidth={2} />
              </View>
              <Text style={styles.heroNumber}>{streak.current}</Text>
              <Text style={styles.heroLabel}>Current Streak</Text>
              <View style={styles.heroBestRow}>
                <Trophy color="rgba(255,159,67,0.5)" size={13} strokeWidth={2.2} />
                <Text style={styles.heroBestText}>Best: {streak.best}</Text>
              </View>
            </ThemeChip>
          </View>

          <View style={styles.rangeSelector}>
            {(["week", "month", "year"] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => switchRange(range)}
                style={[styles.rangeTab, activeRange === range && styles.rangeTabActive]}
              >
                <Text style={[styles.rangeTabText, activeRange === range && styles.rangeTabTextActive]}>
                  {range === "week" ? "7 Days" : range === "month" ? "30 Days" : "90 Days"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.miniStats}>
            <View style={[styles.miniStatCard, { overflow: "visible" as const, zIndex: 9 }]}>
              <TrendingUp color="#34D399" size={16} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <View style={styles.completionValueRow}>
                  <Text style={styles.miniStatValue}>{rangeStats.rate}%</Text>
                  <Pressable
                    onPress={toggleCompletionTip}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    style={styles.completionInfoBtn}
                  >
                    <Info color={p.muted} size={12} strokeWidth={2.5} />
                  </Pressable>
                </View>
                <Text style={styles.miniStatLabel}>Completion</Text>
              </View>
              {showCompletionTip && (
                <Animated.View
                  style={[
                    styles.completionTip,
                    { opacity: completionTipOpacity, transform: [{ scale: completionTipScale }] },
                  ]}
                >
                  <View style={styles.completionTipArrow} />
                  <View style={styles.perfectTipHeader}>
                    <View style={[styles.perfectTipIconWrap, { backgroundColor: "rgba(52,211,153,0.12)" }]}>
                      <TrendingUp color="#34D399" size={14} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.perfectTipTitle, { color: "#34D399" }]}>Completion Rate</Text>
                  </View>
                  <View style={[styles.perfectTipDivider, { backgroundColor: "rgba(52,211,153,0.12)" }]} />
                  <Text style={styles.perfectTipText}>
                    The percentage of tasks you've completed out of all available tasks — including both daily tasks and Memory tasks — within the selected time range.
                  </Text>
                  <Pressable onPress={toggleCompletionTip} hitSlop={8} style={[styles.perfectTipDismiss, { backgroundColor: "rgba(52,211,153,0.14)" }]}>
                    <Text style={[styles.perfectTipDismissText, { color: "#34D399" }]}>Got it</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
            <View style={[styles.miniStatCard, { overflow: "visible" as const, zIndex: 10 }]}>
              <Medal color="#FF9F43" size={16} strokeWidth={2.2} />
              <View style={{ flex: 1 }}>
                <View style={styles.perfectValueRow}>
                  <Text style={styles.miniStatValue}>{rangeStats.perfectDays}</Text>
                  <Pressable
                    onPress={togglePerfectDayTip}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    style={styles.perfectInfoBtn}
                  >
                    <Info color={p.muted} size={12} strokeWidth={2.5} />
                  </Pressable>
                </View>
                <Text style={styles.miniStatLabel}>Perfect days</Text>
              </View>
              {showPerfectDayTip && (
                <Animated.View
                  style={[
                    styles.perfectTip,
                    { opacity: perfectTipOpacity, transform: [{ scale: perfectTipScale }] },
                  ]}
                >
                  <View style={styles.perfectTipArrow} />
                  <View style={styles.perfectTipHeader}>
                    <View style={styles.perfectTipIconWrap}>
                      <Medal color="#FF9F43" size={14} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.perfectTipTitle}>Perfect Day</Text>
                  </View>
                  <View style={styles.perfectTipDivider} />
                  <Text style={styles.perfectTipText}>
                    A perfect day is when you complete all available tasks — whether that's 1, 2, or 3 — on the day that they were set to be completed.
                  </Text>
                  <Pressable onPress={togglePerfectDayTip} hitSlop={8} style={styles.perfectTipDismiss}>
                    <Text style={styles.perfectTipDismissText}>Got it</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.gridFixedArea}>
              {activeRange === "week" && renderWeekView()}
              {activeRange === "month" && renderMonthView()}
              {activeRange === "year" && renderYearView()}
            </View>

            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Less</Text>
              <View style={[styles.legendDot, styles.dotEmpty]} />
              <View style={[styles.legendDot, styles.dotLow]} />
              <View style={[styles.legendDot, styles.dotMed]} />
              <View style={[styles.legendDot, styles.dotFull]} />
              <Text style={styles.legendLabel}>More</Text>
            </View>
          </View>

          <View style={styles.momentumCard}>
            <View style={styles.momentumRow}>
              <View style={styles.momentumCircleWrap}>
                {(() => {
                  const size = 88;
                  const strokeWidth = 7;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const progress = circumference - (momentum.score / 100) * circumference;
                  return (
                    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
                      <Svg width={size} height={size} style={{ position: "absolute" }}>
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={momentum.color + "1A"}
                          strokeWidth={strokeWidth}
                          fill="none"
                        />
                        <Circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={momentum.color}
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeDasharray={`${circumference}`}
                          strokeDashoffset={progress}
                          strokeLinecap="round"
                          rotation="-90"
                          origin={`${size / 2}, ${size / 2}`}
                        />
                      </Svg>
                      <Text style={[styles.momentumPercent, { color: momentum.color }]}>{momentum.score}%</Text>
                    </View>
                  );
                })()}
              </View>
              <View style={styles.momentumInfo}>
                <View style={styles.momentumLabelRow}>
                  <Zap color={momentum.color} fill={momentum.color + "66"} size={16} strokeWidth={2.2} />
                  <Text style={styles.momentumTitle}>Momentum</Text>
                  <Pressable
                    onPress={() => setShowMomentumInfo(true)}
                    hitSlop={12}
                    style={styles.infoButton}
                  >
                    <Info color={p.muted} size={14} strokeWidth={2.2} />
                  </Pressable>
                </View>
                <Text style={[styles.momentumLabel, { color: momentum.color }]}>{momentum.label}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showStreakInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStreakInfo(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Flame color="#FF9F43" fill="rgba(255,159,67,0.5)" size={20} strokeWidth={2.2} />
              <Text style={styles.modalTitle}>How Streaks Work</Text>
              <Pressable onPress={() => setShowStreakInfo(false)} hitSlop={12}>
                <X color={p.muted} size={18} strokeWidth={2.2} />
              </Pressable>
            </View>

            <Text style={styles.modalSubhead}>Building your streak</Text>
            <View style={styles.factorsGrid}>
              <View style={styles.factorItem}>
                <View style={[styles.factorIcon, { backgroundColor: "rgba(255,159,67,0.18)" }]}>
                  <Flame color="#FF9F43" size={14} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorLabel}>Daily completion</Text>
                  <Text style={styles.factorDesc}>Complete all available tasks (i.e. 1, 2 or 3) each day from Today to keep your streak alive</Text>
                </View>
              </View>
              <View style={styles.factorItem}>
                <View style={[styles.factorIcon, { backgroundColor: "rgba(255,159,67,0.18)" }]}>
                  <Trophy color="#FF9F43" size={14} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorLabel}>Consecutive days</Text>
                  <Text style={styles.factorDesc}>Your streak counts the number of consecutive days you've completed all available tasks from Today</Text>
                </View>
              </View>
              <View style={styles.factorItem}>
                <View style={[styles.factorIcon, { backgroundColor: "rgba(255,159,67,0.18)" }]}>
                  <Clock color="#FF9F43" size={14} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.factorLabel}>Resets at midnight</Text>
                  <Text style={styles.factorDesc}>If any tasks in Today remain uncompleted, moved to Memory or deleted by midnight, your streak will reset to zero</Text>
                </View>
              </View>
            </View>

            <Text style={styles.modalSubhead}>Keep in mind</Text>
            <View style={styles.streakTipBox}>
              <Text style={styles.streakTipText}>Tasks completed directly from Memory don't count toward your streak — only tasks cleared from your daily plan contribute. Keep planning daily to maintain your streak!</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showMomentumInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMomentumInfo(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMomentumInfo(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Zap color={p.accent} fill={p.accent + "66"} size={20} strokeWidth={2.2} />
              <Text style={styles.modalTitle}>How Momentum Works</Text>
              <Pressable onPress={() => setShowMomentumInfo(false)} hitSlop={12}>
                <X color={p.muted} size={18} strokeWidth={2.2} />
              </Pressable>
            </View>

            <Text style={styles.modalSubhead}>What feeds your score</Text>
            <View style={styles.factorsGrid}>
              {MOMENTUM_FACTORS.map((f, i) => (
                <View key={i} style={styles.factorItem}>
                  <View style={[styles.factorIcon, { backgroundColor: p.accent + "18" }]}>
                    <f.icon color={p.accent} size={14} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factorLabel}>{f.label}</Text>
                    <Text style={styles.factorDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.modalSubhead}>Time ranges</Text>
            <View style={styles.rangesRow}>
              {MOMENTUM_RANGES.map((r, i) => (
                <View key={i} style={styles.rangeChip}>
                  <Text style={styles.rangeChipDays}>{r.days}</Text>
                  <Text style={styles.rangeChipDesc}>{r.desc}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.modalSubhead}>Statuses</Text>
            <View style={styles.statusesGrid}>
              {MOMENTUM_STATUSES.map((s, i) => (
                <View key={i} style={[styles.statusRow, { borderLeftColor: s.color }]}>
                  <View style={[styles.statusIconWrap, { backgroundColor: s.color + "1A" }]}>
                    <s.icon color={s.color} size={14} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 6 }}>
                      <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                      <Text style={styles.statusRange}>{s.range}</Text>
                    </View>
                    <Text style={styles.statusDesc}>{s.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 60,
      gap: 20,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.muted,
      opacity: 0.4,
      alignSelf: "center",
      marginBottom: 4,
    },
    heroSection: {
      alignItems: "center",
    },
    heroGradient: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 40,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.2)",
      width: "100%",
    },
    heroInfoBtn: {
      position: "absolute" as const,
      top: 14,
      right: 14,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "rgba(255,159,67,0.12)",
      zIndex: 5,
    },
    heroFlameWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,159,67,0.12)",
      marginBottom: 12,
    },
    heroNumber: {
      color: "#FF9F43",
      fontSize: 52,
      fontWeight: "800" as const,
      lineHeight: 56,
      letterSpacing: -2,
    },
    heroLabel: {
      color: "rgba(255,159,67,0.7)",
      fontSize: 15,
      fontWeight: "600" as const,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    heroBestRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      marginTop: 10,
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: "rgba(255,159,67,0.1)",
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.15)",
    },
    heroBestText: {
      color: "rgba(255,159,67,0.6)",
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
    },
    miniStats: {
      flexDirection: "row",
      gap: 10,
    },
    miniStatCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: p.surfaceSoft,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: p.line,
    },
    completionValueRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    completionInfoBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.muted + "22",
    },
    completionTip: {
      position: "absolute" as const,
      top: "100%" as const,
      left: -4,
      marginTop: 8,
      backgroundColor: p.surfaceElevated,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 18,
      width: 270,
      shadowColor: "#34D399",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(52,211,153,0.18)",
      zIndex: 100,
    },
    completionTipArrow: {
      position: "absolute" as const,
      top: -6,
      left: 18,
      width: 12,
      height: 12,
      backgroundColor: p.surfaceElevated,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderColor: "rgba(52,211,153,0.18)",
      transform: [{ rotate: "45deg" }],
      borderRadius: 2,
    },
    miniStatValue: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "700" as const,
      lineHeight: 19,
    },
    miniStatLabel: {
      color: p.muted,
      fontSize: 10,
      fontWeight: "500" as const,
      lineHeight: 13,
    },
    perfectValueRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    perfectInfoBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.muted + "22",
      marginTop: 0,
    },
    perfectTip: {
      position: "absolute" as const,
      top: "100%" as const,
      right: -4,
      marginTop: 8,
      backgroundColor: p.surfaceElevated,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 18,
      width: 270,
      shadowColor: "#FF9F43",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.18)",
      zIndex: 100,
    },
    perfectTipArrow: {
      position: "absolute" as const,
      top: -6,
      right: 18,
      width: 12,
      height: 12,
      backgroundColor: p.surfaceElevated,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderColor: "rgba(255,159,67,0.18)",
      transform: [{ rotate: "45deg" }],
      borderRadius: 2,
    },
    perfectTipHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 8,
    },
    perfectTipIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "rgba(255,159,67,0.12)",
    },
    perfectTipTitle: {
      color: "#FF9F43",
      fontSize: 14,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    perfectTipDivider: {
      height: 1,
      backgroundColor: "rgba(255,159,67,0.12)",
      marginBottom: 10,
    },
    perfectTipText: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "500" as const,
      lineHeight: 20,
      opacity: 0.85,
    },
    perfectTipDismiss: {
      alignSelf: "flex-end" as const,
      marginTop: 12,
      paddingVertical: 7,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: "rgba(255,159,67,0.14)",
    },
    perfectTipDismissText: {
      color: "#FF9F43",
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    rangeSelector: {
      flexDirection: "row",
      backgroundColor: p.surfaceSoft,
      borderRadius: 14,
      padding: 3,
      borderWidth: 1,
      borderColor: p.line,
    },
    rangeTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 11,
    },
    rangeTabActive: {
      backgroundColor: p.surfaceElevated,
    },
    rangeTabText: {
      color: p.muted,
      fontSize: 13,
      fontWeight: "600" as const,
    },
    rangeTabTextActive: {
      color: p.ink,
    },
    chartCard: {
      backgroundColor: p.surfaceSoft,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: p.line,
      gap: 16,
    },
    gridFixedArea: {
      height: 90,
      justifyContent: "center",
    },
    weekGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    weekDay: {
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    weekDayLabel: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "600" as const,
    },
    weekDayLabelToday: {
      color: "#FF9F43",
    },
    weekDayCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    weekDayCount: {
      fontSize: 15,
      fontWeight: "700" as const,
      color: p.ink,
    },
    weekDayCountFull: {
      color: "#fff",
    },
    weekDayCountEmpty: {
      color: p.muted,
    },
    weekDateNum: {
      color: p.muted,
      fontSize: 10,
      fontWeight: "500" as const,
    },
    weekDateNumToday: {
      color: "#FF9F43",
      fontWeight: "700" as const,
    },
    dayEmpty: {
      backgroundColor: p.panel,
      borderWidth: 1,
      borderColor: p.line,
    },
    dayLow: {
      backgroundColor: "rgba(255,159,67,0.15)",
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.2)",
    },
    dayMed: {
      backgroundColor: "rgba(255,159,67,0.35)",
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.4)",
    },
    dayFull: {
      backgroundColor: "#FF9F43",
    },
    dayToday: {
      borderWidth: 2,
      borderColor: "#FF9F43",
    },
    monthGrid: {
      gap: 6,
    },
    monthRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6,
    },
    monthCell: {
      flex: 1,
      alignItems: "center",
    },
    monthDot: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 6,
    },
    monthLabel: {
      color: p.muted,
      fontSize: 8,
      marginTop: 2,
      fontWeight: "600" as const,
    },
    dotEmpty: {
      backgroundColor: p.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.line,
    },
    dotLow: {
      backgroundColor: "rgba(255,159,67,0.2)",
    },
    dotMed: {
      backgroundColor: "rgba(255,159,67,0.45)",
    },
    dotFull: {
      backgroundColor: "#FF9F43",
    },
    dotToday: {
      borderWidth: 2,
      borderColor: "#FF9F43",
    },
    yearGrid: {
      gap: 4,
    },
    yearRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
    },
    yearCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 3,
    },
    yCellInvisible: {
      backgroundColor: "transparent",
    },
    yCellEmpty: {
      backgroundColor: p.panel,
    },
    yCellLow: {
      backgroundColor: "rgba(255,159,67,0.2)",
    },
    yCellMed: {
      backgroundColor: "rgba(255,159,67,0.45)",
    },
    yCellFull: {
      backgroundColor: "#FF9F43",
    },

    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      marginTop: 4,
    },
    legendLabel: {
      color: p.muted,
      fontSize: 9,
      fontWeight: "500" as const,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    momentumCard: {
      backgroundColor: p.surfaceSoft,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: p.line,
    },
    momentumRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 18,
    },
    momentumCircleWrap: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    momentumPercent: {
      fontSize: 20,
      fontWeight: "800" as const,
      letterSpacing: -0.5,
    },
    momentumInfo: {
      flex: 1,
      gap: 3,
    },
    momentumLabelRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    momentumTitle: {
      color: p.ink,
      fontSize: 15,
      fontWeight: "700" as const,
    },
    momentumLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
    },
    momentumHint: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "500" as const,
      marginTop: 2,
    },
    infoButton: {
      marginLeft: 2,
      padding: 2,
      borderRadius: 10,
      backgroundColor: p.muted + "15",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: 24,
    },
    modalCard: {
      backgroundColor: p.surface,
      borderRadius: 20,
      padding: 22,
      width: "100%" as const,
      maxWidth: 380,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    modalHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 16,
    },
    modalTitle: {
      flex: 1,
      color: p.ink,
      fontSize: 17,
      fontWeight: "700" as const,
    },
    modalSubhead: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
      marginTop: 14,
      marginBottom: 8,
    },
    factorsGrid: {
      gap: 8,
    },
    factorItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
    },
    factorIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    factorLabel: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "600" as const,
      lineHeight: 17,
    },
    factorDesc: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "500" as const,
      lineHeight: 15,
    },
    rangesRow: {
      flexDirection: "row" as const,
      gap: 6,
    },
    rangeChip: {
      flex: 1,
      backgroundColor: p.surfaceSoft,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 8,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: p.line,
    },
    rangeChipDays: {
      color: p.ink,
      fontSize: 12,
      fontWeight: "700" as const,
      marginBottom: 2,
    },
    rangeChipDesc: {
      color: p.muted,
      fontSize: 9.5,
      fontWeight: "500" as const,
      textAlign: "center" as const,
      lineHeight: 13,
    },
    statusesGrid: {
      gap: 6,
    },
    statusRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      backgroundColor: p.surfaceSoft,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderLeftWidth: 3,
    },
    statusIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: "700" as const,
    },
    statusRange: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "500" as const,
    },
    statusDesc: {
      color: p.muted,
      fontSize: 11,
      fontWeight: "500" as const,
      lineHeight: 14,
    },
    streakTipBox: {
      backgroundColor: p.surfaceSoft,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "rgba(255,159,67,0.15)",
    },
    streakTipText: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "500" as const,
      lineHeight: 20,
      opacity: 0.8,
    },
  });
}
