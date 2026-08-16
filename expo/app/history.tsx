import React, { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { BookOpen, CheckCircle2, Calendar, Search, X, Clock, Brain, Trash2 } from "lucide-react-native";

import { HistoryCard } from "@/components/HistoryCard";
import { ThemeBackground } from "@/components/ThemeBackground";
import { ThemePalette, taskTypeLabel } from "@/constants/onlyThreeTheme";
import { useOnlyThree } from "@/providers/OnlyThreeProvider";
import { MemoryCompletion, RetroCompletion } from "@/types/only-three";
import { formatDateKey, formatHistoryDate } from "@/utils/date";


export default function HistoryScreen() {
  const { historyPlans, retroCompletions, memoryCompletions, currentPalette: p, clearHistory } = useOnlyThree();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const styles = useMemo(() => createStyles(p), [p]);

  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      searchInputRef.current?.blur();
      Animated.timing(searchAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
        setSearchOpen(false);
        setSearchQuery("");
      });
    } else {
      setSearchOpen(true);
      requestAnimationFrame(() => {
        Animated.timing(searchAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start(() => {
          searchInputRef.current?.focus();
        });
      });
    }
  }, [searchOpen, searchAnim]);

  const isSearching = searchQuery.trim().length > 0;

  const timeline = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filteredPlans = q
      ? historyPlans.filter((plan) => plan.tasks.some((task) => task.title.toLowerCase().includes(q)))
      : historyPlans;

    const filteredRetro = q
      ? retroCompletions.filter((rc) => rc.taskTitle.toLowerCase().includes(q))
      : retroCompletions;

    const filteredMemory = q
      ? memoryCompletions.filter((mc) => mc.taskTitle.toLowerCase().includes(q))
      : memoryCompletions;

    const retroByDate = new Map<string, RetroCompletion[]>();
    for (const rc of filteredRetro) {
      const dateKey = formatDateKey(new Date(rc.completedAt));
      const existing = retroByDate.get(dateKey) ?? [];
      existing.push(rc);
      retroByDate.set(dateKey, existing);
    }

    const memoryByDate = new Map<string, MemoryCompletion[]>();
    for (const mc of filteredMemory) {
      const dateKey = formatDateKey(new Date(mc.completedAt));
      const existing = memoryByDate.get(dateKey) ?? [];
      existing.push(mc);
      memoryByDate.set(dateKey, existing);
    }

    const allDates = new Set<string>();
    for (const plan of filteredPlans) allDates.add(plan.date);
    for (const dateKey of retroByDate.keys()) allDates.add(dateKey);
    for (const dateKey of memoryByDate.keys()) allDates.add(dateKey);

    const entries: Array<{ date: string; plan?: typeof filteredPlans[number]; retroItems?: RetroCompletion[]; memoryItems?: MemoryCompletion[] }> = [];

    for (const date of allDates) {
      const plan = filteredPlans.find((pl) => pl.date === date);
      const retroItems = retroByDate.get(date);
      const memoryItems = memoryByDate.get(date);
      entries.push({ date, plan, retroItems, memoryItems });
    }

    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
  }, [historyPlans, retroCompletions, memoryCompletions, searchQuery]);

  const hasAnyContent = timeline.length > 0;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{
        title: "History",
        headerStyle: { backgroundColor: p.backgroundTop },
        headerTintColor: p.ink,
        headerRight: () => (
          <Pressable onPress={toggleSearch} hitSlop={10} style={styles.headerSearchBtn} testID="history-search-toggle">
            <Search color={searchOpen ? p.accent : p.subtext} size={20} strokeWidth={2} />
          </Pressable>
        ),
      }} />
      <ThemeBackground palette={p} />
      <View pointerEvents="none" style={styles.ambientOrb} />
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <Animated.View style={[
          styles.searchBarWrap,
          {
            opacity: searchAnim,
            height: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }),
            marginBottom: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }),
          },
        ]} pointerEvents={searchOpen ? "auto" : "none"}>
          <View style={styles.searchBar}>
            <Search color={p.muted} size={16} strokeWidth={2} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={p.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              testID="history-search-input"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <X color={p.muted} size={16} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </Animated.View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Past days</Text>
            <Text style={styles.title}>History</Text>
          </View>

          {!hasAnyContent ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <BookOpen color={p.accent} size={28} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>{isSearching ? "No results" : "No history yet"}</Text>
              <Text style={styles.emptySubtitle}>{isSearching ? "Try a different search term." : "Completed days will appear here."}</Text>
            </View>
          ) : (
          <View style={styles.list}>
            {timeline.map((entry) => {
              const { date, plan, retroItems, memoryItems } = entry;
              const isExpanded = expandedDate === date;
              return (
                <View key={`timeline-${date}`} style={styles.itemWrap}>
                  {plan && (
                    <>
                      <HistoryCard
                        onPress={() => setExpandedDate((current) => current === date ? null : date)}
                        palette={p}
                        plan={plan}
                        retroCompletions={retroCompletions}
                      />
                      {isExpanded ? (
                        <View style={styles.detailCard}>
                          {plan.tasks.map((task) => {
                            const isCompletedLater = (() => {
                              if (!task.isCompleted && retroCompletions.some((rc) => rc.taskTitle === task.title && rc.originalDate === plan.date)) return true;
                              if (task.isCompleted && task.completedAt && task.completedAt.slice(0, 10) !== plan.date) return true;
                              return false;
                            })();
                            const statusLabel = task.isCompleted && !isCompletedLater ? "Done" : isCompletedLater ? "Completed later" : "Uncompleted";
                            const statusStyle = task.isCompleted && !isCompletedLater ? styles.detailStateComplete : isCompletedLater ? styles.detailStateLater : null;
                            return (
                              <View key={task.id} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{taskTypeLabel[task.type]}</Text>
                                <Text style={styles.detailValue}>{task.title || "Left open"}</Text>
                                <View style={styles.detailStateRow}>
                                  {isCompletedLater && <Clock color={p.muted} size={12} strokeWidth={2.2} />}
                                  <Text style={[styles.detailState, statusStyle]}>{statusLabel}</Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ) : null}
                    </>
                  )}

                  {retroItems && retroItems.length > 0 && (
                    <View style={styles.retroSection}>
                      {!plan && !(memoryItems && memoryItems.length > 0) && (
                        <View style={styles.retroDateHeader}>
                          <Text style={styles.retroDateHeaderText}>
                            {formatHistoryDate(date)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.retroSectionHeader}>
                        <CheckCircle2 color={p.success} size={15} strokeWidth={2.2} />
                        <Text style={styles.retroSectionTitle}>Cleared from Uncompleted</Text>
                      </View>
                      {retroItems.map((rc) => (
                        <View key={rc.id} style={styles.retroCard}>
                          <View style={styles.retroIconWrap}>
                            <CheckCircle2 color={p.success} size={16} strokeWidth={2.4} />
                          </View>
                          <View style={styles.retroContent}>
                            <Text style={styles.retroTitle} numberOfLines={2}>{rc.taskTitle}</Text>
                            <View style={styles.retroMeta}>
                              <Text style={styles.retroType}>{taskTypeLabel[rc.taskType]}</Text>
                              <View style={styles.retroDot} />
                              <Calendar color={p.muted} size={11} strokeWidth={2} />
                              <Text style={styles.retroDate}>Originally {rc.originalDate}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {memoryItems && memoryItems.length > 0 && (
                    <View style={styles.memorySection}>
                      {!plan && !(retroItems && retroItems.length > 0) && (
                        <View style={styles.retroDateHeader}>
                          <Text style={styles.retroDateHeaderText}>
                            {formatHistoryDate(date)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.memorySectionHeader}>
                        <Brain color={p.accent} size={15} strokeWidth={2.2} />
                        <Text style={styles.memorySectionTitle}>Cleared from Memory</Text>
                      </View>
                      {memoryItems.map((mc) => (
                        <View key={mc.id} style={styles.memoryCard}>
                          <View style={styles.memoryIconWrap}>
                            <Brain color={p.accent} size={16} strokeWidth={2.4} />
                          </View>
                          <View style={styles.retroContent}>
                            <Text style={styles.retroTitle} numberOfLines={2}>{mc.taskTitle}</Text>
                            <View style={styles.retroMeta}>
                              <Text style={styles.retroType}>Memory</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          )}

          {hasAnyContent && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                Alert.alert(
                  "Clear History",
                  "This will permanently delete all your history. This can't be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", style: "destructive", onPress: clearHistory },
                  ]
                );
              }}
              testID="history-clear-btn"
            >
              <Trash2 color={p.danger ?? "#E05252"} size={16} strokeWidth={2} />
              <Text style={styles.clearBtnText}>Clear History</Text>
            </Pressable>
          )}
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
    keyboardAvoiding: {
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
      top: -70,
      right: -50,
      borderRadius: 999,
      backgroundColor: p.accentGlow,
      opacity: 0.12,
    },
    header: {
      gap: 8,
      marginBottom: 10,
    },
    eyebrow: {
      color: p.accentStrong,
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
      backgroundColor: p.accentGlow + "30",
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
      gap: 14,
    },
    itemWrap: {
      gap: 10,
    },
    detailCard: {
      gap: 12,
      borderRadius: 24,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
      padding: 16,
      shadowColor: p.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    detailRow: {
      gap: 4,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.line,
    },
    detailLabel: {
      color: p.subtext,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    detailValue: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "600" as const,
    },
    detailState: {
      color: p.subtext,
      fontSize: 13,
    },
    detailStateComplete: {
      color: p.success,
    },
    retroSection: {
      gap: 10,
    },
    retroDateHeader: {
      marginBottom: 2,
    },
    retroDateHeaderText: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "600" as const,
      letterSpacing: -0.2,
    },
    retroSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 2,
    },
    retroSectionTitle: {
      color: p.success,
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    retroCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 20,
      backgroundColor: p.successSoft,
      borderWidth: 1,
      borderColor: p.successGlow,
    },
    retroIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.success + "20",
    },
    retroContent: {
      flex: 1,
      gap: 4,
    },
    retroTitle: {
      color: p.ink,
      fontSize: 15,
      fontWeight: "600" as const,
      lineHeight: 20,
    },
    retroMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    retroType: {
      color: p.subtext,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    retroDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: p.muted,
    },
    retroDate: {
      color: p.muted,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    headerSearchBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBarWrap: {
      paddingHorizontal: 20,
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: p.line,
      backgroundColor: p.backgroundTop,
      overflow: "hidden",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: p.backgroundMiddle,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: p.line,
    },
    searchInput: {
      flex: 1,
      color: p.ink,
      fontSize: 15,
      padding: 0,
    },
    detailStateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    detailStateLater: {
      color: p.muted,
      fontStyle: "italic",
    },
    memorySection: {
      gap: 10,
    },
    memorySectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 2,
    },
    memorySectionTitle: {
      color: p.accent,
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    memoryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 20,
      backgroundColor: p.accentSoft,
      borderWidth: 1,
      borderColor: p.accentGlow,
    },
    memoryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.accent + "20",
    },
    clearBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      paddingVertical: 14,
      marginTop: 12,
      marginBottom: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: (p.danger ?? "#E05252") + "30",
      backgroundColor: (p.danger ?? "#E05252") + "0A",
    },
    clearBtnText: {
      color: p.danger ?? "#E05252",
      fontSize: 15,
      fontWeight: "600" as const,
    },
  });
}
