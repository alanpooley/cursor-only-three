import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Flame, History, Settings2, Trophy, CircleCheckBig, Ban, Pencil, Check, Plus, Minus, Trash2, Brain, CheckCircle, PanelLeftOpen, PanelRightOpen } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { CelebrationBanner } from "@/components/CelebrationBanner";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { SidebarTriptychLayout } from "@/components/home/SidebarTriptychLayout";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { PlanningTaskRow } from "@/components/PlanningTaskRow";
import { TaskRow } from "@/components/TaskRow";
import { ThemeAmbientOrbs, ThemeBackground, ThemeChip } from "@/components/ThemeBackground";
import { ThemePalette } from "@/constants/onlyThreeTheme";
import { useOnlyThree } from "@/providers/OnlyThreeProvider";
import { loadMemoryTooltipSeen, saveMemoryTooltipSeen } from "@/services/storage";
import { formatTodayDate } from "@/utils/date";

type ActiveTab = "today" | "tomorrow" | "memory";

export default function TodayScreen() {
  const {
    availableTaskCount,
    isLoading,
    streak,
    todayPlan,
    tomorrowPlan,
    todayKey,
    tomorrowKey,
    deleteTask,
    updateTaskTitle,
    toggleTaskCompletion,
    getEffectiveLabelMode,
    updateDayTaskLabelMode,
    uncompletedTasks,
    currentPalette: p,
    showTutorial,
    completeTutorial,
    updateTheme,
    settings,
    memoryTasks,
    addMemoryTask,
    deleteMemoryTask,
    toggleMemoryTaskCompletion,
    pushMemoryTaskToTomorrow,
    tomorrowFilledCount: tomorrowFilledCountProvider,
    isTaskInTomorrow,
    removeTaskFromTomorrow,
    getTomorrowTaskOrigin,
    moveTodayTaskToMemory,
    moveTomorrowTaskToMemory,
    getTodayTaskOrigin,
    addTaskToToday,
    removeTaskFromToday,
    isTaskInToday,
    todayFilledCount: todayFilledCountProvider,
  } = useOnlyThree();

  const insets = useSafeAreaInsets();
  const uncompletedCount = uncompletedTasks.length;
  const isSidebarLayout = settings.homeLayout === "sidebar";
  const [memorySidebarOpen, setMemorySidebarOpen] = useState<boolean>(false);
  const [tomorrowSidebarOpen, setTomorrowSidebarOpen] = useState<boolean>(false);

  const toggleMemorySidebar = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMemorySidebarOpen((open) => {
      if (!open) {
        setTomorrowSidebarOpen(false);
      }
      return !open;
    });
  }, []);

  const toggleTomorrowSidebar = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTomorrowSidebarOpen((open) => {
      if (!open) {
        setMemorySidebarOpen(false);
      }
      return !open;
    });
  }, []);

  const openMemorySidebar = useCallback(() => {
    if (memorySidebarOpen) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTomorrowSidebarOpen(false);
    setMemorySidebarOpen(true);
  }, [memorySidebarOpen]);

  const openTomorrowSidebar = useCallback(() => {
    if (tomorrowSidebarOpen) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMemorySidebarOpen(false);
    setTomorrowSidebarOpen(true);
  }, [tomorrowSidebarOpen]);

  const dismissSidebars = useCallback(() => {
    setMemorySidebarOpen(false);
    setTomorrowSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!isSidebarLayout) {
      setMemorySidebarOpen(false);
      setTomorrowSidebarOpen(false);
    }
  }, [isSidebarLayout]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [isEditingToday, setIsEditingToday] = useState<boolean>(false);
  const [memoryInput, setMemoryInput] = useState<string>("");
  const [showMemoryCoachMark, setShowMemoryCoachMark] = useState<boolean>(false);
  const memoryCoachMarkOpacity = useRef(new Animated.Value(0)).current;
  const memoryCoachMarkSeen = useRef<boolean>(false);
  const rainbowGlow1 = useRef(new Animated.Value(1)).current;
  const rainbowGlow2 = useRef(new Animated.Value(0)).current;
  const rainbowGlow3 = useRef(new Animated.Value(0)).current;
  const hasVisitedTomorrow = useRef<boolean>(false);
  const tutorialResolvedRef = useRef<boolean>(!showTutorial && !isLoading);
  const [memorySelectMode, setMemorySelectMode] = useState<boolean>(false);
  const [memorySelectedIds, setMemorySelectedIds] = useState<Set<string>>(new Set());
  const [memoryBannerText, setMemoryBannerText] = useState<string | null>(null);
  const memoryBannerAnim = useRef(new Animated.Value(0)).current;
  const memoryInputRef = useRef<TextInput>(null);
  const memoryBannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoryPendingRemovals = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [todayMemoryBannerText, setTodayMemoryBannerText] = useState<string | null>(null);
  const todayMemoryBannerAnim = useRef(new Animated.Value(0)).current;
  const todayMemoryBannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tomorrowReturnBannerText, setTomorrowReturnBannerText] = useState<string | null>(null);
  const tomorrowReturnBannerAnim = useRef(new Animated.Value(0)).current;
  const tomorrowReturnBannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleFadeOut = useRef(new Animated.Value(1)).current;
  const titleFadeIn = useRef(new Animated.Value(1)).current;
  const titleSlideOut = useRef(new Animated.Value(0)).current;
  const titleSlideIn = useRef(new Animated.Value(0)).current;
  const [displayedTab, setDisplayedTab] = useState<ActiveTab>("today");
  const [partialSaved, setPartialSaved] = useState<boolean>(false);
  const [showSaveBanner, setShowSaveBanner] = useState<boolean>(false);
  const saveBannerOpacity = useRef(new Animated.Value(0)).current;
  const saveBannerTranslateY = useRef(new Animated.Value(-20)).current;
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const todayScrollRef = useRef<ScrollView>(null);
  const tomorrowScrollRef = useRef<ScrollView>(null);
  const memorySidebarScrollRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);
  const tabIndicator = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const dotPulse = useRef(new Animated.Value(1)).current;
  const progressBarGlow = useRef(new Animated.Value(0)).current;
  const progressBarScale = useRef(new Animated.Value(1)).current;
  const prevAllComplete = useRef<boolean>(false);
  const [progressBarY, setProgressBarY] = useState<number | undefined>(undefined);
  const [progressBarWidth, setProgressBarWidth] = useState<number>(0);
  const progressBarRef = useRef<View>(null);
  const [celebrationDismissed, setCelebrationDismissed] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const justCompletedRef = useRef<boolean>(false);
  const planBtnFade = useRef(new Animated.Value(0)).current;
  const _planBtnGlow = useRef(new Animated.Value(0)).current;
  const planRainbow1 = useRef(new Animated.Value(1)).current;
  const planRainbow2 = useRef(new Animated.Value(0)).current;
  const planRainbow3 = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerCollapseHeight = useRef(new Animated.Value(1)).current;
  const headerSlideX = useRef(new Animated.Value(0)).current;
  const memoryHeaderSlideX = useRef(new Animated.Value(screenWidth)).current;
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, () => {});
    const onHide = Keyboard.addListener(hideEvent, () => {
      todayScrollRef.current?.scrollTo({ y: 0, animated: true });
      tomorrowScrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useEffect(() => {
    void loadMemoryTooltipSeen().then((seen) => {
      memoryCoachMarkSeen.current = seen;
      console.log("[only-three] Memory tooltip seen:", seen);
    });
  }, []);

  useEffect(() => {
    if (!showTutorial && !isLoading) {
      tutorialResolvedRef.current = true;
    }
  }, [showTutorial, isLoading]);

  useEffect(() => {
    if (isSidebarLayout) return;
    if (activeTab === "tomorrow" && !hasVisitedTomorrow.current && !showTutorial && tutorialResolvedRef.current) {
      hasVisitedTomorrow.current = true;
      console.log("[only-three] First visit to Tomorrow tab, memoryCoachMarkSeen:", memoryCoachMarkSeen.current);
      if (!memoryCoachMarkSeen.current) {
        setTimeout(() => {
          setShowMemoryCoachMark(true);
          Animated.timing(memoryCoachMarkOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }, 200);
      }
    }
  }, [activeTab, memoryCoachMarkOpacity, showTutorial, isSidebarLayout]);

  useEffect(() => {
    if (!showMemoryCoachMark) return;
    const duration = 2000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rainbowGlow1, { toValue: 0, duration, useNativeDriver: false }),
          Animated.timing(rainbowGlow2, { toValue: 1, duration, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(rainbowGlow2, { toValue: 0, duration, useNativeDriver: false }),
          Animated.timing(rainbowGlow3, { toValue: 1, duration, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(rainbowGlow3, { toValue: 0, duration, useNativeDriver: false }),
          Animated.timing(rainbowGlow1, { toValue: 1, duration, useNativeDriver: false }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showMemoryCoachMark, rainbowGlow1, rainbowGlow2, rainbowGlow3]);

  const dismissMemoryCoachMark = useCallback(() => {
    Animated.timing(memoryCoachMarkOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setShowMemoryCoachMark(false);
    });
    memoryCoachMarkSeen.current = true;
    void saveMemoryTooltipSeen(true);
    console.log("[only-three] Memory coach mark dismissed");
  }, [memoryCoachMarkOpacity]);


  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [dotPulse]);

  const scrollToFocusedInput = useCallback((index: number) => {
    const inputEl = inputRefs.current[index];
    const scrollRef = activeTabRef.current === "today" ? todayScrollRef : tomorrowScrollRef;
    if (!inputEl || !scrollRef.current) return;
    setTimeout(() => {
      (inputEl as any).measureLayout?.(
        (scrollRef.current as any),
        (_x: number, y: number) => {
          const offset = Math.max(0, y - 80);
          scrollRef.current?.scrollTo({ y: offset, animated: true });
        },
        () => {
          if (index === 0) {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          } else {
            scrollRef.current?.scrollToEnd({ animated: true });
          }
        }
      );
    }, 400);
  }, []);

  const styles = useMemo(() => createStyles(p), [p]);

  const showTodayMemoryBanner = useCallback((text: string) => {
    if (todayMemoryBannerTimeout.current) clearTimeout(todayMemoryBannerTimeout.current);
    setTodayMemoryBannerText(text);
    todayMemoryBannerAnim.setValue(0);
    Animated.timing(todayMemoryBannerAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    todayMemoryBannerTimeout.current = setTimeout(() => {
      Animated.timing(todayMemoryBannerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setTodayMemoryBannerText(null));
    }, 1800);
  }, [todayMemoryBannerAnim]);

  const handleMoveToMemory = useCallback((taskType: import("@/types/only-three").TaskSize) => {
    Alert.alert(
      "Move to Memory?",
      "This task will be moved to Memory. If you currently have a streak, this will reset your streak count back to zero at midnight tonight. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            const success = moveTodayTaskToMemory(taskType);
            if (success) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showTodayMemoryBanner("Moved to Memory");
            }
          },
        },
      ]
    );
  }, [moveTodayTaskToMemory, showTodayMemoryBanner]);

  const showTomorrowReturnBanner = useCallback((text: string) => {
    if (tomorrowReturnBannerTimeout.current) clearTimeout(tomorrowReturnBannerTimeout.current);
    setTomorrowReturnBannerText(text);
    tomorrowReturnBannerAnim.setValue(0);
    Animated.timing(tomorrowReturnBannerAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    tomorrowReturnBannerTimeout.current = setTimeout(() => {
      Animated.timing(tomorrowReturnBannerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setTomorrowReturnBannerText(null));
    }, 1800);
  }, [tomorrowReturnBannerAnim]);

  const showMemoryBanner = useCallback((text: string) => {
    if (memoryBannerTimeout.current) clearTimeout(memoryBannerTimeout.current);
    setMemoryBannerText(text);
    memoryBannerAnim.setValue(0);
    Animated.timing(memoryBannerAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    memoryBannerTimeout.current = setTimeout(() => {
      Animated.timing(memoryBannerAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMemoryBannerText(null));
    }, 1800);
  }, [memoryBannerAnim]);

  const scheduleMemoryDeletion = useCallback((key: string, taskId: string) => {
    const existing = memoryPendingRemovals.current.get(key);
    if (existing) clearTimeout(existing);
    const id = setTimeout(() => {
      deleteMemoryTask(taskId);
      memoryPendingRemovals.current.delete(key);
    }, 10000);
    memoryPendingRemovals.current.set(key, id);
  }, [deleteMemoryTask]);

  const cancelMemoryDeletion = useCallback((key: string) => {
    const existing = memoryPendingRemovals.current.get(key);
    if (existing) {
      clearTimeout(existing);
      memoryPendingRemovals.current.delete(key);
    }
  }, []);

  const handleMemoryToggleDay = useCallback((task: { id: string; title: string }, day: "today" | "tomorrow") => {
    const key = `memory-${task.id}`;
    if (day === "today") {
      if (isTaskInToday(task.title)) {
        const success = removeTaskFromToday(task.title);
        if (success) {
          cancelMemoryDeletion(key);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showMemoryBanner("Removed from today");
        }
      } else {
        const success = addTaskToToday(task.title, 'memory');
        if (success) {
          scheduleMemoryDeletion(key, task.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showMemoryBanner("Added to today");
        }
      }
    } else {
      if (isTaskInTomorrow(task.title)) {
        const success = removeTaskFromTomorrow(task.title);
        if (success) {
          cancelMemoryDeletion(key);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showMemoryBanner("Removed from tomorrow");
        }
      } else {
        const success = pushMemoryTaskToTomorrow(task.id);
        if (success) {
          scheduleMemoryDeletion(key, task.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showMemoryBanner("Added to tomorrow");
        }
      }
    }
  }, [addTaskToToday, removeTaskFromToday, isTaskInToday, pushMemoryTaskToTomorrow, removeTaskFromTomorrow, isTaskInTomorrow, scheduleMemoryDeletion, cancelMemoryDeletion, showMemoryBanner]);

  const animateTitleTransition = useCallback((toTab: ActiveTab) => {
    titleFadeOut.setValue(1);
    titleSlideOut.setValue(0);
    titleFadeIn.setValue(0);
    titleSlideIn.setValue(toTab === "tomorrow" ? 4 : -4);

    Animated.parallel([
      Animated.timing(titleFadeOut, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(titleSlideOut, {
        toValue: toTab === "tomorrow" ? -5 : 5,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayedTab(toTab);
      Animated.parallel([
        Animated.timing(titleFadeIn, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlideIn, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        titleFadeOut.setValue(1);
        titleSlideOut.setValue(0);
      });
    });
  }, [titleFadeOut, titleFadeIn, titleSlideOut, titleSlideIn]);

  const switchTab = useCallback((tab: ActiveTab) => {
    Keyboard.dismiss();
    if (tab !== activeTabRef.current) {
      if (tab !== "today") {
        setShowCelebration(false);
        setCelebrationDismissed(true);
      }
      animateTitleTransition(tab);
    }
    setActiveTab(tab);
    const toValue = tab === "today" ? 0 : tab === "tomorrow" ? 1 : 1;
    Animated.spring(tabIndicator, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
    const scrollX = tab === "today" ? 0 : tab === "tomorrow" ? screenWidth : screenWidth * 2;
    horizontalScrollRef.current?.scrollTo({
      x: scrollX,
      animated: true,
    });
  }, [tabIndicator, screenWidth, animateTitleTransition]);

  const handleCoachMarkTap = useCallback(() => {
    dismissMemoryCoachMark();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchTab("memory");
    console.log("[only-three] Coach mark tapped — swiping to Memory");
  }, [dismissMemoryCoachMark, switchTab]);

  const activeTabRef = useRef<ActiveTab>(activeTab);
  activeTabRef.current = activeTab;

  const isEditingTodayRef = useRef<boolean>(isEditingToday);
  isEditingTodayRef.current = isEditingToday;

  const isScrollingProgrammatically = useRef(false);

  const onHorizontalTouchStart = useCallback((e: any) => {
    const touch = e.nativeEvent;
    touchStartXRef.current = touch.pageX ?? 0;
    touchStartYRef.current = touch.pageY ?? 0;
  }, []);

  const onHorizontalTouchMove = useCallback((e: any) => {
    const touch = e.nativeEvent;
    const dx = Math.abs((touch.pageX ?? 0) - touchStartXRef.current);
    const dy = Math.abs((touch.pageY ?? 0) - touchStartYRef.current);
    if (dx > 6 && dx > dy) {
      if (!isSwipingRef.current) {
        isSwipingRef.current = true;
        setIsSwiping(true);
        Keyboard.dismiss();
      }
    }
  }, []);

  const onHorizontalScrollBeginDrag = useCallback(() => {
    if (!isSwipingRef.current) {
      isSwipingRef.current = true;
      setIsSwiping(true);
    }
    Keyboard.dismiss();
    if (swipeTimeoutRef.current) {
      clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = null;
    }
  }, []);

  const screenWidthRef = useRef(screenWidth);
  screenWidthRef.current = screenWidth;

  const onHorizontalScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const sw = screenWidthRef.current;
    const progress = Math.min(1, Math.max(0, offsetX / sw));
    tabIndicator.setValue(progress);
    const rawProgress = Math.max(0, Math.min(1, (offsetX - sw) / sw));
    const slideX = -sw * rawProgress;
    headerSlideX.setValue(slideX);
    memoryHeaderSlideX.setValue(sw * (1 - rawProgress));
    const hOpacity = Math.max(0, 1 - rawProgress * 2);
    headerOpacity.setValue(hOpacity);
    headerTranslateY.setValue(0);
    headerCollapseHeight.setValue(1 - rawProgress);
  }, [tabIndicator, headerOpacity, headerTranslateY, headerCollapseHeight, headerSlideX, memoryHeaderSlideX]);

  const onHorizontalScrollEndDrag = useCallback(() => {
    swipeTimeoutRef.current = setTimeout(() => {
      isSwipingRef.current = false;
      setIsSwiping(false);
      swipeTimeoutRef.current = null;
    }, 350);
  }, []);

  const handleTutorialComplete = useCallback(() => {
    completeTutorial();
    switchTab("today");
  }, [completeTutorial, switchTab]);

  const todayLabelMode = useMemo(() => getEffectiveLabelMode(todayPlan), [getEffectiveLabelMode, todayPlan]);
  const tomorrowLabelMode = useMemo(() => getEffectiveLabelMode(tomorrowPlan), [getEffectiveLabelMode, tomorrowPlan]);

  const toggleTomorrowLabelMode = useCallback(() => {
    const next = tomorrowLabelMode === "sized" ? "numbered" : "sized";
    updateDayTaskLabelMode(tomorrowKey, next);
  }, [tomorrowLabelMode, updateDayTaskLabelMode, tomorrowKey]);

  const todayCompletedCount = useMemo(
    () => todayPlan.tasks.filter((t) => t.isCompleted && t.title.trim().length > 0).length,
    [todayPlan.tasks]
  );
  const todayAllComplete = availableTaskCount > 0 && todayCompletedCount === availableTaskCount;

  const tomorrowFilledCount = useMemo(
    () => tomorrowPlan.tasks.filter((t) => t.title.trim().length > 0).length,
    [tomorrowPlan.tasks]
  );

  const tomorrowFilledCountRef = useRef(tomorrowFilledCount);
  tomorrowFilledCountRef.current = tomorrowFilledCount;

  const partialSavedRef = useRef(partialSaved);
  partialSavedRef.current = partialSaved;

  const prevTomorrowFilledCount = useRef(tomorrowFilledCount);
  useEffect(() => {
    if (prevTomorrowFilledCount.current !== tomorrowFilledCount) {
      setPartialSaved(false);
    }
    prevTomorrowFilledCount.current = tomorrowFilledCount;
  }, [tomorrowFilledCount]);

  const showSaveBannerAnimation = useCallback(() => {
    saveBannerOpacity.setValue(0);
    saveBannerTranslateY.setValue(-20);
    setShowSaveBanner(true);
    Animated.parallel([
      Animated.timing(saveBannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(saveBannerTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(saveBannerOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(saveBannerTranslateY, { toValue: -20, duration: 400, useNativeDriver: true }),
        ]).start(() => setShowSaveBanner(false));
      }, 2500);
    });
  }, [saveBannerOpacity, saveBannerTranslateY]);

  const onHorizontalMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    let newTab: ActiveTab = "today";
    if (offsetX > screenWidth * 1.5) {
      newTab = "memory";
    } else if (offsetX > screenWidth * 0.5) {
      newTab = "tomorrow";
    }
    if (newTab !== activeTabRef.current) {
      if (activeTabRef.current === "tomorrow" && newTab !== "tomorrow") {
        const filled = tomorrowFilledCountRef.current;
        if (filled > 0 && filled < 3 && !partialSavedRef.current) {
          setPartialSaved(true);
          showSaveBannerAnimation();
          console.log("[only-three] Auto-saved partial tomorrow tasks on swipe away", { count: filled });
        }
      }
      if (newTab !== "today" && isEditingTodayRef.current) {
        setIsEditingToday(false);
        Keyboard.dismiss();
        console.log("[only-three] Auto-saved today tasks on swipe away");
      }
      if (newTab !== "today") {
        setShowCelebration(false);
        setCelebrationDismissed(true);
      }
      animateTitleTransition(newTab);
      setActiveTab(newTab);
    }
    isScrollingProgrammatically.current = false;
    if (swipeTimeoutRef.current) {
      clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = null;
    }
    setTimeout(() => {
      isSwipingRef.current = false;
      setIsSwiping(false);
    }, 100);
  }, [screenWidth, animateTitleTransition, showSaveBannerAnimation]);

  const handlePartialSave = useCallback(() => {
    if (partialSaved) return;
    setPartialSaved(true);
    showSaveBannerAnimation();
    console.log("[only-three] Partial tasks saved for tomorrow", { count: tomorrowFilledCount });
  }, [partialSaved, showSaveBannerAnimation, tomorrowFilledCount]);

  const progressWidth = useMemo(
    () => `${Math.max(0, Math.min(100, availableTaskCount > 0 ? (todayCompletedCount / availableTaskCount) * 100 : 0))}%` as const,
    [todayCompletedCount, availableTaskCount]
  );

  useEffect(() => {
    if (todayAllComplete && !prevAllComplete.current) {
      justCompletedRef.current = true;
      setShowCelebration(true);
      setCelebrationDismissed(false);
    } else if (!todayAllComplete) {
      justCompletedRef.current = false;
      setShowCelebration(false);
      setCelebrationDismissed(false);
    }
  }, [todayAllComplete]);

  useEffect(() => {
    if (todayAllComplete && celebrationDismissed && !isEditingToday) {
      planBtnFade.setValue(0);
      planRainbow1.setValue(1);
      planRainbow2.setValue(0);
      planRainbow3.setValue(0);
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(planBtnFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      const dur = 2000;
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(planRainbow1, { toValue: 0, duration: dur, useNativeDriver: false }),
            Animated.timing(planRainbow2, { toValue: 1, duration: dur, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(planRainbow2, { toValue: 0, duration: dur, useNativeDriver: false }),
            Animated.timing(planRainbow3, { toValue: 1, duration: dur, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(planRainbow3, { toValue: 0, duration: dur, useNativeDriver: false }),
            Animated.timing(planRainbow1, { toValue: 1, duration: dur, useNativeDriver: false }),
          ]),
        ])
      ).start();
    } else {
      planBtnFade.setValue(0);
    }
  }, [todayAllComplete, celebrationDismissed, isEditingToday, planBtnFade, planRainbow1, planRainbow2, planRainbow3]);

  useEffect(() => {
    if (todayAllComplete && !prevAllComplete.current) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(progressBarScale, {
            toValue: 1.04,
            useNativeDriver: true,
            bounciness: 14,
            speed: 10,
          }),
          Animated.timing(progressBarGlow, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(progressBarScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 8,
          speed: 14,
        }),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(progressBarGlow, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(progressBarGlow, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(progressBarGlow, {
            toValue: 0.35,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(progressBarGlow, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!todayAllComplete) {
      progressBarGlow.stopAnimation();
      Animated.parallel([
        Animated.timing(progressBarGlow, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progressBarScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevAllComplete.current = todayAllComplete;
  }, [todayAllComplete, progressBarGlow, progressBarScale]);

  const sectionTitleStyle = useCallback((compact: boolean) => (
    compact ? [styles.sectionTitle, styles.sectionTitleCompact] : styles.sectionTitle
  ), [styles.sectionTitle, styles.sectionTitleCompact]);

  const renderTodayPageContent = useCallback((compact: boolean) => (
    <>
      <View
        ref={compact ? undefined : progressBarRef}
        style={[styles.progressBarWrap, compact && styles.progressBarWrapSidebar]}
        onLayout={compact ? undefined : () => {
          progressBarRef.current?.measureInWindow((_x, y, w, h) => {
            if (y != null && h != null) {
              setProgressBarY(y + h / 2);
            }
            if (w != null) {
              setProgressBarWidth(w);
            }
          });
        }}
      >
        <Animated.View style={[styles.progressTrackOuter, { transform: [{ scaleX: progressBarScale }, { scaleY: progressBarScale }] }]}>
          {!compact && (
            <Animated.View
              style={[
                styles.progressGlowBar,
                {
                  opacity: progressBarGlow,
                  backgroundColor: p.success,
                },
              ]}
            />
          )}
          <View style={[styles.progressTrack, compact && styles.progressTrackSidebar]}>
            <Animated.View style={[styles.progressFill, todayAllComplete && styles.progressFillComplete, { width: progressWidth }]} />
          </View>
        </Animated.View>
        {!compact && (
          <Text style={styles.progressLabel}>
            {todayAllComplete ? "All done. Time to party." : ""}
          </Text>
        )}
      </View>
      {!compact && (
        <View style={styles.sectionHeader}>
          <Text style={sectionTitleStyle(compact)}>Today's three</Text>
          <Text style={styles.sectionCaption}>Small list. Full attention.</Text>
        </View>
      )}
      <View style={[styles.tasksWrap, compact && styles.tasksWrapSidebar]} pointerEvents={isSwiping ? "none" : "auto"}>
        {todayPlan.tasks.map((task, index) => {
          const hasTitle = task.title.trim().length > 0;
          const taskOrigin = getTodayTaskOrigin(task.type);
          return (
            <View key={`today-${task.id}`} style={[styles.todayTaskWrap, compact && styles.todayTaskWrapSidebar]}>
              <TaskRow
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                autoFocus={false}
                density={compact ? "sidebar" : "default"}
                editable={isEditingToday}
                isEditMode={isEditingToday}
                labelMode={todayLabelMode}
                onChangeTitle={(title) => updateTaskTitle(task.type, title)}
                onDelete={isEditingToday && !task.isCompleted ? () => deleteTask(task.type) : undefined}
                onFocus={() => {
                  if (isSwipingRef.current) {
                    inputRefs.current[index]?.blur();
                    return;
                  }
                  scrollToFocusedInput(index);
                }}
                onSubmitEditing={() => {}}
                onToggle={isEditingToday ? undefined : () => toggleTaskCompletion(task.type)}
                palette={p}
                task={task}
              />
              {hasTitle && !isEditingToday && (
                <Pressable
                  onPress={() => {
                    if (taskOrigin === 'uncompleted') {
                      const success = removeTaskFromToday(task.title);
                      if (success) {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showTodayMemoryBanner("Returned to Uncompleted");
                      }
                    } else {
                      handleMoveToMemory(task.type);
                    }
                  }}
                  disabled={task.isCompleted}
                  style={({ pressed }) => [
                    styles.todayMemoryBtn,
                    compact && styles.todayMemoryBtnSidebar,
                    task.isCompleted && styles.todayMemoryBtnDisabled,
                    pressed && !task.isCompleted && styles.todayMemoryBtnPressed,
                  ]}
                  testID={`today-origin-${task.type}`}
                >
                  {taskOrigin === 'uncompleted' ? (
                    <Ban color={task.isCompleted ? p.muted : p.accent} size={compact ? 12 : 13} strokeWidth={2.5} />
                  ) : (
                    <Brain color={task.isCompleted ? p.muted : p.accent} size={compact ? 12 : 13} strokeWidth={2.5} />
                  )}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {!compact && todayAllComplete && celebrationDismissed && !isEditingToday ? (
        <Animated.View style={[
          styles.planTomorrowOuter,
          {
            opacity: planBtnFade,
            transform: [{
              translateY: planBtnFade.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            }],
          },
        ]}>
          <Pressable
            onPress={() => switchTab("tomorrow")}
            style={({ pressed }) => [
              styles.coachMarkPressable,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            testID="plan-tomorrow-button"
          >
            <View style={styles.coachMarkOuter}>
              <Animated.View style={[styles.coachMarkGlowLayer, { opacity: planRainbow1 }]}>
                <LinearGradient colors={["#FF6B6B", "#FFD93D", "#6BCB77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
              </Animated.View>
              <Animated.View style={[styles.coachMarkGlowLayer, { opacity: planRainbow2 }]}>
                <LinearGradient colors={["#6BCB77", "#4D96FF", "#A78BFA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
              </Animated.View>
              <Animated.View style={[styles.coachMarkGlowLayer, { opacity: planRainbow3 }]}>
                <LinearGradient colors={["#A78BFA", "#FF6B9D", "#FFD93D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
              </Animated.View>
              <View style={styles.coachMarkBubble}>
                <Text style={styles.coachMarkText}>Plan Tomorrow →</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      ) : (
        <Pressable
          onPress={() => setIsEditingToday((prev) => !prev)}
          style={({ pressed }) => [
            styles.editButton,
            compact && styles.editButtonSidebar,
            isEditingToday && styles.editButtonActive,
            pressed && styles.editButtonPressed,
          ]}
          testID="edit-today-button"
        >
          {isEditingToday ? (
            <Check color={p.success} size={15} strokeWidth={2.5} />
          ) : (
            <Pencil color={p.accent} size={14} strokeWidth={2.2} />
          )}
          <Text style={[styles.editButtonText, isEditingToday && styles.editButtonTextActive]}>
            {isEditingToday ? "Save" : "Edit"}
          </Text>
        </Pressable>
      )}
    </>
  ), [
    p, styles, progressBarRef, progressBarScale, progressBarGlow, todayAllComplete, progressWidth,
    sectionTitleStyle, isSwiping, todayPlan.tasks, getTodayTaskOrigin, isEditingToday, todayLabelMode,
    updateTaskTitle, deleteTask, scrollToFocusedInput, toggleTaskCompletion, removeTaskFromToday,
    showTodayMemoryBanner, handleMoveToMemory, celebrationDismissed, planBtnFade, planRainbow1,
    planRainbow2, planRainbow3, switchTab,
  ]);

  const renderTomorrowPageContent = useCallback((compact: boolean) => (
    <>
      <View style={[styles.planningStatusWrap, compact && styles.planningStatusWrapSidebar]}>
        <Text style={[styles.planningStatusText, compact && styles.planningStatusTextCompact]}>
          {tomorrowFilledCount === 0
            ? "What matters most tomorrow?"
            : tomorrowFilledCount < 3
            ? `${tomorrowFilledCount} of 3 planned`
            : "All three planned. You're set."}
        </Text>
      </View>
      {!compact && (
        <View style={styles.sectionHeader}>
          <Text style={sectionTitleStyle(compact)}>Tomorrow's three</Text>
          <Pressable
            onPress={toggleTomorrowLabelMode}
            style={({ pressed }) => [styles.labelModeToggle, pressed && styles.labelModeTogglePressed]}
            testID="toggle-label-mode"
          >
            <Text style={[styles.labelModeToggleText, tomorrowLabelMode === "sized" && styles.labelModeActiveText]}>Size</Text>
            <View style={styles.miniTrack}>
              <View style={[
                styles.miniThumb,
                tomorrowLabelMode === "numbered" && styles.miniThumbRight,
              ]} />
            </View>
            <Text style={[styles.labelModeToggleText, tomorrowLabelMode === "numbered" && styles.labelModeActiveText]}>Order</Text>
          </Pressable>
        </View>
      )}
      {compact && (
        <Pressable
          onPress={toggleTomorrowLabelMode}
          style={({ pressed }) => [styles.labelModeToggleSidebar, pressed && styles.labelModeTogglePressed]}
          testID="toggle-label-mode"
        >
          <Text style={[styles.labelModeToggleText, tomorrowLabelMode === "sized" && styles.labelModeActiveText]}>Size</Text>
          <View style={styles.miniTrack}>
            <View style={[
              styles.miniThumb,
              tomorrowLabelMode === "numbered" && styles.miniThumbRight,
            ]} />
          </View>
          <Text style={[styles.labelModeToggleText, tomorrowLabelMode === "numbered" && styles.labelModeActiveText]}>Order</Text>
        </Pressable>
      )}
      <View style={[styles.tasksWrap, compact && styles.tasksWrapSidebar]} pointerEvents={isSwiping ? "none" : "auto"}>
        {tomorrowPlan.tasks.map((task, index) => {
          const taskOrigin = getTomorrowTaskOrigin(task.type);
          const hasTitle = task.title.trim().length > 0;
          return (
            <View key={`tomorrow-${task.id}`} style={[styles.tomorrowTaskWrap, compact && styles.tomorrowTaskWrapSidebar]}>
              <PlanningTaskRow
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                autoFocus={false}
                density={compact ? "sidebar" : "default"}
                labelMode={tomorrowLabelMode}
                onChangeTitle={(title) => updateTaskTitle(task.type, title, tomorrowKey)}
                onFocus={() => {
                  if (isSwipingRef.current) {
                    inputRefs.current[index]?.blur();
                    return;
                  }
                  scrollToFocusedInput(index);
                }}
                onSubmitEditing={() => {}}
                palette={p}
                task={task}
              />
              {hasTitle && (
                <Pressable
                  onPress={() => {
                    if (taskOrigin === 'memory') {
                      const success = removeTaskFromTomorrow(task.title);
                      if (success) {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showTomorrowReturnBanner('Returned to Memory');
                      }
                    } else if (taskOrigin === 'uncompleted') {
                      const success = removeTaskFromTomorrow(task.title);
                      if (success) {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showTomorrowReturnBanner('Returned to Uncompleted');
                      }
                    } else {
                      const success = moveTomorrowTaskToMemory(task.type);
                      if (success) {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showTomorrowReturnBanner('Moved to Memory');
                      }
                    }
                  }}
                  style={({ pressed }) => [
                    styles.returnOriginBtn,
                    compact && styles.returnOriginBtnSidebar,
                    pressed && styles.returnOriginBtnPressed,
                  ]}
                  testID={`return-origin-${task.type}`}
                >
                  {taskOrigin === 'uncompleted' ? (
                    <Ban color={p.accent} size={compact ? 12 : 13} strokeWidth={2.5} />
                  ) : (
                    <Brain color={p.accent} size={compact ? 12 : 13} strokeWidth={2.5} />
                  )}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {tomorrowFilledCount === 3 && (
        <View style={[styles.tomorrowHint, compact && styles.tomorrowHintSidebar]}>
          <CircleCheckBig size={13} color="#34C759" strokeWidth={2.5} />
          <Text style={styles.tomorrowHintSaved}>All three saved</Text>
          <View style={styles.tomorrowHintDot} />
          <Text style={styles.tomorrowHintText}>Ready for tomorrow</Text>
        </View>
      )}
      {tomorrowFilledCount > 0 && tomorrowFilledCount < 3 && (
        <Pressable
          onPress={handlePartialSave}
          style={({ pressed }) => [
            styles.savePartialButton,
            compact && styles.savePartialButtonSidebar,
            partialSaved && styles.savePartialButtonSaved,
            pressed && !partialSaved && styles.savePartialButtonPressed,
          ]}
          testID="save-partial-tasks"
        >
          <CircleCheckBig size={15} color={partialSaved ? "#34C759" : p.accent} strokeWidth={2.2} />
          <Text style={[styles.savePartialButtonText, partialSaved && styles.savePartialButtonTextSaved]}>
            {partialSaved ? "Saved" : `Save only ${tomorrowFilledCount} ${tomorrowFilledCount === 1 ? "task" : "tasks"}`}
          </Text>
        </Pressable>
      )}
      {showSaveBanner && (
        <Animated.View style={[styles.saveBanner, { opacity: saveBannerOpacity, transform: [{ translateY: saveBannerTranslateY }] }]}>
          <CircleCheckBig size={14} color="#34C759" strokeWidth={2.5} />
          <Text style={styles.saveBannerText}>Tasks saved for tomorrow</Text>
        </Animated.View>
      )}
      {!compact && showMemoryCoachMark && (
        <Pressable onPress={handleCoachMarkTap} style={styles.coachMarkPressable}>
          <Animated.View style={[styles.coachMarkOuter, { opacity: memoryCoachMarkOpacity, transform: [{ scale: memoryCoachMarkOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <Animated.View style={[styles.coachMarkGlowLayer, { opacity: rainbowGlow1 }]}>
              <LinearGradient colors={["#FF6B6B", "#FFD93D", "#6BCB77"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
            </Animated.View>
            <Animated.View style={[styles.coachMarkGlowLayer, { opacity: rainbowGlow2 }]}>
              <LinearGradient colors={["#6BCB77", "#4D96FF", "#A78BFA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
            </Animated.View>
            <Animated.View style={[styles.coachMarkGlowLayer, { opacity: rainbowGlow3 }]}>
              <LinearGradient colors={["#A78BFA", "#FF6B9D", "#FFD93D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coachMarkGradient} />
            </Animated.View>
            <View style={styles.coachMarkBubble}>
              <Text style={styles.coachMarkText}>Swipe again to explore Memory →</Text>
            </View>
          </Animated.View>
        </Pressable>
      )}
    </>
  ), [
    styles, sectionTitleStyle, tomorrowFilledCount, toggleTomorrowLabelMode, tomorrowLabelMode,
    isSwiping, tomorrowPlan.tasks, getTomorrowTaskOrigin, updateTaskTitle, tomorrowKey,
    scrollToFocusedInput, p, removeTaskFromTomorrow, showTomorrowReturnBanner, moveTomorrowTaskToMemory,
    handlePartialSave, partialSaved, showSaveBanner, saveBannerOpacity, saveBannerTranslateY,
    showMemoryCoachMark, handleCoachMarkTap, memoryCoachMarkOpacity, rainbowGlow1, rainbowGlow2, rainbowGlow3,
  ]);

  const renderMemoryListContent = useCallback(() => {
    const cardStyle = isSidebarLayout ? [styles.memoryCard, styles.memoryCardSidebar] : [styles.memoryCard];
    const checkStyle = isSidebarLayout ? [styles.memoryCheck, styles.memoryCheckSidebar] : [styles.memoryCheck];
    const checkDoneStyle = isSidebarLayout ? [styles.memoryCheckDone, styles.memoryCheckSidebar] : [styles.memoryCheckDone];
    const titleStyle = isSidebarLayout ? [styles.memoryCardTitle, styles.memoryCardTitleSidebar] : [styles.memoryCardTitle];

    return (
    <>
      {memoryTasks.length === 0 ? (
        <View style={[styles.memoryEmpty, isSidebarLayout && styles.memoryEmptySidebar]}>
          <View style={[styles.memoryEmptyIcon, isSidebarLayout && styles.memoryEmptyIconSidebar]}>
            <Brain color={p.accent} size={isSidebarLayout ? 22 : 28} strokeWidth={1.8} />
          </View>
          <Text style={[styles.memoryEmptyTitle, isSidebarLayout && styles.memoryEmptyTitleSidebar]}>Nothing here yet</Text>
          <Text style={styles.memoryEmptySubtitle}>Add tasks you want to remember for later.</Text>
        </View>
      ) : (
        <View style={[styles.memoryList, isSidebarLayout && styles.memoryListSidebar]}>
          {memoryTasks.map((task) => {
            const isSelected = memorySelectedIds.has(task.id);
            const tomorrowFull = tomorrowFilledCountProvider >= 3;
            const todayFull = todayFilledCountProvider >= 3;

            if (memorySelectMode) {
              return (
                <Pressable
                  key={task.id}
                  onPress={() => {
                    setMemorySelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(task.id)) next.delete(task.id);
                      else next.add(task.id);
                      return next;
                    });
                    void Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    ...cardStyle,
                    task.isCompleted && styles.memoryCardCompleted,
                    isSelected && styles.memoryCardSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                  testID={`memory-select-${task.id}`}
                >
                  <View style={[styles.memorySelectCircle, isSidebarLayout && styles.memorySelectCircleSidebar, isSelected && styles.memorySelectCircleActive]}>
                    {isSelected && <Check color="#fff" size={13} strokeWidth={3} />}
                  </View>
                  <Text
                    style={[...titleStyle, task.isCompleted && styles.memoryCardTitleDone]}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                </Pressable>
              );
            }

            return (
              <View
                key={task.id}
                style={[...cardStyle, task.isCompleted && styles.memoryCardCompleted]}
              >
                <Pressable
                  onPress={() => {
                    toggleMemoryTaskCompletion(task.id);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={({ pressed }) => [
                    ...(task.isCompleted ? checkDoneStyle : checkStyle),
                    pressed && { transform: [{ scale: 0.92 }] },
                  ]}
                  testID={`memory-check-${task.id}`}
                >
                  <Check
                    color={task.isCompleted ? p.muted : p.success}
                    size={13}
                    strokeWidth={2.8}
                  />
                </Pressable>
                <Text
                  style={[...Array.isArray(titleStyle) ? titleStyle : [titleStyle], task.isCompleted && styles.memoryCardTitleDone]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                {!task.isCompleted && (
                  <View style={[styles.memorySegmentPill, isSidebarLayout && styles.memorySegmentPillSidebar]}>
                    <Pressable
                      onPress={() => handleMemoryToggleDay(task, "today")}
                      disabled={todayFull && !isTaskInToday(task.title)}
                      style={({ pressed }) => [
                        styles.memorySegment,
                        styles.memorySegmentLeft,
                        isTaskInToday(task.title) && styles.memorySegmentActive,
                        todayFull && !isTaskInToday(task.title) && styles.memorySegmentDisabled,
                        pressed && { opacity: 0.7 },
                      ]}
                      testID={`memory-today-${task.id}`}
                    >
                      {isTaskInToday(task.title) ? (
                        <Minus color={p.backgroundTop} size={10} strokeWidth={2.8} />
                      ) : (
                        <Plus color={todayFull ? p.muted : p.accent} size={10} strokeWidth={2.8} />
                      )}
                      <Text style={[
                        styles.memorySegmentLabel,
                        isTaskInToday(task.title) && styles.memorySegmentLabelActive,
                        todayFull && !isTaskInToday(task.title) && styles.memorySegmentLabelDisabled,
                      ]}>
                        {todayFull && !isTaskInToday(task.title) ? "3/3" : `${todayFilledCountProvider}/3`}
                      </Text>
                    </Pressable>
                    <View style={styles.memorySegmentDivider} />
                    <Pressable
                      onPress={() => handleMemoryToggleDay(task, "tomorrow")}
                      disabled={tomorrowFull && !isTaskInTomorrow(task.title)}
                      style={({ pressed }) => [
                        styles.memorySegment,
                        styles.memorySegmentRight,
                        isTaskInTomorrow(task.title) && styles.memorySegmentActive,
                        tomorrowFull && !isTaskInTomorrow(task.title) && styles.memorySegmentDisabled,
                        pressed && { opacity: 0.7 },
                      ]}
                      testID={`memory-tomorrow-${task.id}`}
                    >
                      {isTaskInTomorrow(task.title) ? (
                        <Minus color={p.backgroundTop} size={10} strokeWidth={2.8} />
                      ) : (
                        <Plus color={tomorrowFull ? p.muted : p.accent} size={10} strokeWidth={2.8} />
                      )}
                      <Text style={[
                        styles.memorySegmentLabel,
                        isTaskInTomorrow(task.title) && styles.memorySegmentLabelActive,
                        tomorrowFull && !isTaskInTomorrow(task.title) && styles.memorySegmentLabelDisabled,
                      ]}>
                        {tomorrowFull && !isTaskInTomorrow(task.title) ? "3/3" : `${tomorrowFilledCountProvider}/3`}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      {memoryTasks.length > 0 && !isSidebarLayout && (
        <View style={styles.memoryTooltip}>
          <CheckCircle color={p.muted} size={13} strokeWidth={2.2} style={{ marginTop: 1 }} />
          <Text style={styles.memoryTooltipText}>
            Tasks completed in Memory don't count toward your streak, but do positively impact your Completion and Momentum scores.
          </Text>
        </View>
      )}
    </>
    );
  }, [
    styles, memoryTasks, p, memorySelectedIds, tomorrowFilledCountProvider, todayFilledCountProvider,
    memorySelectMode, toggleMemoryTaskCompletion, handleMemoryToggleDay, isTaskInToday, isTaskInTomorrow,
    isSidebarLayout,
  ]);

  const renderMemoryPageContent = useCallback((compact: boolean) => (
    <>
      {compact && (
        <View style={styles.memorySidebarToolbar}>
          {memorySelectMode ? (
            <View style={styles.memoryHeaderButtons}>
              <Pressable
                onPress={() => {
                  setMemorySelectMode(false);
                  setMemorySelectedIds(new Set());
                }}
                style={({ pressed }) => [styles.memoryHeaderBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.memoryHeaderBtnText, { color: p.subtext }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  for (const id of memorySelectedIds) {
                    deleteMemoryTask(id);
                  }
                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setMemorySelectedIds(new Set());
                  setMemorySelectMode(false);
                }}
                disabled={memorySelectedIds.size === 0}
                style={({ pressed }) => [
                  styles.memoryHeaderBtn,
                  styles.memoryHeaderDeleteBtn,
                  memorySelectedIds.size === 0 && styles.memoryHeaderDeleteBtnDisabled,
                  pressed && memorySelectedIds.size > 0 && { opacity: 0.7 },
                ]}
              >
                <Trash2 color={memorySelectedIds.size > 0 ? "#fff" : p.muted} size={14} strokeWidth={2.4} />
                <Text style={[
                  styles.memoryHeaderDeleteText,
                  memorySelectedIds.size === 0 && { color: p.muted },
                ]}>
                  {memorySelectedIds.size > 0 ? `Delete (${memorySelectedIds.size})` : "Delete"}
                </Text>
              </Pressable>
            </View>
          ) : memoryTasks.length > 0 ? (
            <Pressable
              onPress={() => setMemorySelectMode(true)}
              style={({ pressed }) => [styles.memoryHeaderBtn, styles.memorySidebarSelectBtn, pressed && { opacity: 0.6 }]}
              testID="memory-select-mode"
            >
              <Text style={[styles.memoryHeaderBtnText, { color: p.accent }]}>Select</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      {compact ? (
        <View style={styles.memoryInputRow}>
          <TextInput
            ref={memoryInputRef}
            value={memoryInput}
            onChangeText={setMemoryInput}
            placeholder="Add something to remember..."
            placeholderTextColor={p.muted}
            style={[styles.memoryInputField, styles.memoryInputFieldCompact]}
            onSubmitEditing={() => {
              const trimmed = memoryInput.trim();
              if (trimmed.length > 0) {
                addMemoryTask(trimmed);
                setMemoryInput("");
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setTimeout(() => memoryInputRef.current?.focus(), 50);
            }}
            returnKeyType="done"
            blurOnSubmit={false}
            testID="memory-input"
          />
          <Pressable
            onPress={() => {
              const trimmed = memoryInput.trim();
              if (trimmed.length > 0) {
                addMemoryTask(trimmed);
                setMemoryInput("");
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeout(() => memoryInputRef.current?.focus(), 50);
              }
            }}
            style={({ pressed }) => [
              styles.memoryAddBtn,
              styles.memoryAddBtnCompact,
              memoryInput.trim().length === 0 && styles.memoryAddBtnDisabled,
              pressed && memoryInput.trim().length > 0 && styles.memoryAddBtnPressed,
            ]}
            disabled={memoryInput.trim().length === 0}
            testID="memory-add-button"
          >
            {memoryInput.trim().length > 0 ? (
              <Check color="#fff" size={16} strokeWidth={2.5} />
            ) : (
              <Plus color={p.muted} size={16} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>
      ) : null}
      {renderMemoryListContent()}
    </>
  ), [
    styles, memorySelectMode, memorySelectedIds, memoryTasks.length, p, deleteMemoryTask,
    memoryInput, addMemoryTask, renderMemoryListContent,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Only Three</Text>
        <Text style={styles.loadingCopy}>Preparing today's focus...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ThemeBackground palette={p} />
      {!isSidebarLayout && (
        <ThemeAmbientOrbs palette={p} baseStyle={styles.ambientOrb} topStyle={styles.ambientOrbTop} bottomStyle={styles.ambientOrbBottom} />
      )}
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {(isSidebarLayout || activeTab === "today") && !isEditingToday && (
          <CelebrationBanner
            palette={p}
            visible={showCelebration && !celebrationDismissed}
            availableTaskCount={availableTaskCount}
            onDismiss={() => {
              setCelebrationDismissed(true);
              setShowCelebration(false);
            }}
          />
        )}
        <View style={styles.keyboardAvoid}>
        <View style={[styles.fixedHeader, isSidebarLayout && styles.fixedHeaderSidebar]}>
          <View style={styles.topRowWrapper}>
            {/* Today / Tomorrow header row — slides away with rest of page */}
            <Animated.View
              style={[styles.topRow, isSidebarLayout ? undefined : { transform: [{ translateX: headerSlideX }], opacity: headerOpacity }]}
              pointerEvents={!isSidebarLayout && activeTab === "memory" ? "none" : "auto"}
            >
              <View style={styles.headerCopy}>
                {isSidebarLayout ? (
                  <Text style={styles.title}>
                    {formatTodayDate(todayKey)}
                  </Text>
                ) : (
                  <>
                    <Animated.Text style={[styles.date, {
                      opacity: titleFadeIn.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                      transform: [{ translateY: titleSlideIn }],
                    }]}>
                      {formatTodayDate(displayedTab === "today" ? todayKey : tomorrowKey)}
                    </Animated.Text>
                    <Animated.Text style={[styles.title, {
                      opacity: titleFadeIn.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                      transform: [{ translateY: titleSlideIn }],
                    }]}>
                      {displayedTab === "today" ? "Today" : "Tomorrow"}
                    </Animated.Text>
                  </>
                )}
              </View>
              <View style={styles.actionsRow}>
                {isSidebarLayout && (
                  <>
                    <Pressable
                      onPress={toggleMemorySidebar}
                      style={({ pressed }) => [
                        styles.iconButton,
                        isSidebarLayout && styles.iconButtonSidebar,
                        memorySidebarOpen && styles.iconButtonActive,
                        pressed && styles.iconButtonPressed,
                      ]}
                      testID="toggle-memory-sidebar"
                    >
                      <PanelLeftOpen color={memorySidebarOpen ? p.accent : p.ink} size={18} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                      onPress={toggleTomorrowSidebar}
                      style={({ pressed }) => [
                        styles.iconButton,
                        isSidebarLayout && styles.iconButtonSidebar,
                        tomorrowSidebarOpen && styles.iconButtonActive,
                        pressed && styles.iconButtonPressed,
                      ]}
                      testID="toggle-tomorrow-sidebar"
                    >
                      <PanelRightOpen color={tomorrowSidebarOpen ? p.accent : p.ink} size={18} strokeWidth={2.2} />
                    </Pressable>
                  </>
                )}
                <Pressable
                  onPress={() => router.push("/uncompleted")}
                  style={({ pressed }) => [styles.iconButton, isSidebarLayout && styles.iconButtonSidebar, pressed && styles.iconButtonPressed]}
                  testID="uncompleted-button"
                >
                  <Ban color={uncompletedCount > 0 ? p.danger : p.ink} size={18} strokeWidth={2.2} />
                  {uncompletedCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {uncompletedCount > 9 ? "9+" : uncompletedCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => router.push("/history")}
                  style={({ pressed }) => [styles.iconButton, isSidebarLayout && styles.iconButtonSidebar, pressed && styles.iconButtonPressed]}
                  testID="history-button"
                >
                  <History color={p.ink} size={18} strokeWidth={2.2} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/settings")}
                  style={({ pressed }) => [styles.iconButton, isSidebarLayout && styles.iconButtonSidebar, pressed && styles.iconButtonPressed]}
                  testID="settings-button"
                >
                  <Settings2 color={p.ink} size={18} strokeWidth={2.2} />
                </Pressable>
              </View>
            </Animated.View>

            {!isSidebarLayout && (
            <Animated.View
              style={[styles.topRow, { position: "absolute" as const, top: 0, left: 0, right: 0, transform: [{ translateX: memoryHeaderSlideX }] }]}
              pointerEvents={activeTab === "memory" ? "auto" : "none"}
            >
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Memory</Text>
                {(() => {
                  const activeCount = memoryTasks.filter((t) => !t.isCompleted).length;
                  return activeCount > 0 ? (
                    <Text style={styles.memoryTitleCount}>
                      {activeCount} {activeCount === 1 ? "task" : "tasks"}
                    </Text>
                  ) : null;
                })()}
              </View>
              <View style={styles.memoryHeaderActions}>
                {memorySelectMode ? (
                  <View style={styles.memoryHeaderButtons}>
                    <Pressable
                      onPress={() => {
                        setMemorySelectMode(false);
                        setMemorySelectedIds(new Set());
                      }}
                      style={({ pressed }) => [styles.memoryHeaderBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={[styles.memoryHeaderBtnText, { color: p.subtext }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        for (const id of memorySelectedIds) {
                          deleteMemoryTask(id);
                        }
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setMemorySelectedIds(new Set());
                        setMemorySelectMode(false);
                      }}
                      disabled={memorySelectedIds.size === 0}
                      style={({ pressed }) => [
                        styles.memoryHeaderBtn,
                        styles.memoryHeaderDeleteBtn,
                        memorySelectedIds.size === 0 && styles.memoryHeaderDeleteBtnDisabled,
                        pressed && memorySelectedIds.size > 0 && { opacity: 0.7 },
                      ]}
                    >
                      <Trash2 color={memorySelectedIds.size > 0 ? "#fff" : p.muted} size={14} strokeWidth={2.4} />
                      <Text style={[
                        styles.memoryHeaderDeleteText,
                        memorySelectedIds.size === 0 && { color: p.muted },
                      ]}>
                        {memorySelectedIds.size > 0 ? `Delete (${memorySelectedIds.size})` : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                ) : memoryTasks.length > 0 ? (
                  <Pressable
                    onPress={() => setMemorySelectMode(true)}
                    style={({ pressed }) => [styles.memoryHeaderBtn, pressed && { opacity: 0.6 }]}
                    testID="memory-select-mode"
                  >
                    <Text style={[styles.memoryHeaderBtnText, { color: p.accent }]}>Select</Text>
                  </Pressable>
                ) : null}
              </View>
            </Animated.View>
            )}
          </View>

          <Animated.View style={[styles.statsRow, isSidebarLayout && styles.statsRowSidebar, isSidebarLayout ? undefined : { opacity: headerOpacity, transform: [{ translateX: headerSlideX }], maxHeight: headerCollapseHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }), overflow: 'hidden' as const }]} pointerEvents={!isSidebarLayout && activeTab === "memory" ? "none" : "auto"}>
            <Pressable onPress={() => router.push("/streak")} testID="streak-button">
              <ThemeChip
                palette={p}
                gradientColors={["rgba(255,140,50,0.14)", "rgba(255,80,80,0.08)"]}
                style={styles.streakChip}
              >
                <View style={styles.streakIconWrap}>
                  <Flame color={p.ui.variant === "obsidian" ? p.accent : "#FF9F43"} fill={p.ui.variant === "obsidian" ? p.accentSoft : "rgba(255,159,67,0.4)"} size={14} strokeWidth={2.5} />
                </View>
                <Text style={styles.streakCount}>{streak.current}</Text>
                <Text style={styles.streakUnit}>day streak</Text>
              </ThemeChip>
            </Pressable>

            <ThemeChip
              palette={p}
              gradientColors={["rgba(120,100,255,0.12)", "rgba(180,130,255,0.06)"]}
              style={styles.bestChip}
            >
              <Trophy color={p.ui.variant === "obsidian" ? p.accentStrong : "#A78BFA"} size={12} strokeWidth={2.5} />
              <Text style={styles.bestText}>Best {streak.best}</Text>
            </ThemeChip>

            <View style={[styles.progressChip, !isSidebarLayout && activeTab !== "today" && styles.progressChipGreyed]}>
              <Check
                color={!isSidebarLayout && activeTab !== "today" ? p.muted : todayAllComplete ? "#34D399" : p.accent}
                size={12}
                strokeWidth={2.5}
              />
              <Text style={[styles.progressChipText, !isSidebarLayout && activeTab !== "today" && styles.progressChipTextGreyed, (isSidebarLayout || activeTab === "today") && todayAllComplete && styles.progressChipDone]}>
                {todayCompletedCount}/{availableTaskCount}
              </Text>
            </View>
          </Animated.View>

          {!isSidebarLayout && (
          <Animated.View style={[styles.tabContainer, { opacity: headerOpacity, transform: [{ translateX: headerSlideX }], maxHeight: headerCollapseHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }), overflow: 'hidden' as const }]} pointerEvents={activeTab === "memory" ? "none" : "auto"}>
            <View style={styles.tabBar}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    transform: [
                      {
                        translateX: tabIndicator.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (screenWidth - 40 - 8) / 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Pressable
                onPress={() => switchTab("today")}
                style={styles.tab}
                testID="tab-today"
              >
                <Animated.View style={[styles.tabDot, activeTab === "today" ? styles.tabDotToday : styles.tabDotInactive, activeTab === "today" && { opacity: dotPulse }]} />
                <Text style={[styles.tabText, activeTab === "today" && styles.tabTextActive]}>
                  Today
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchTab("tomorrow")}
                style={styles.tab}
                testID="tab-tomorrow"
              >
                <Text style={{ fontSize: 14, color: activeTab === "tomorrow" ? p.accent : p.muted, opacity: activeTab === "tomorrow" ? 1 : 0.65, fontWeight: "600" as const }}>→</Text>
                <Text style={[styles.tabText, activeTab === "tomorrow" && styles.tabTextActive]}>
                  Tomorrow
                </Text>
              </Pressable>
            </View>
          </Animated.View>
          )}
        </View>

        {isSidebarLayout ? (
          <SidebarTriptychLayout
            palette={p}
            memoryOpen={memorySidebarOpen}
            tomorrowOpen={tomorrowSidebarOpen}
            onToggleMemory={toggleMemorySidebar}
            onToggleTomorrow={toggleTomorrowSidebar}
            onOpenMemory={openMemorySidebar}
            onOpenTomorrow={openTomorrowSidebar}
            onDismissOverlay={dismissSidebars}
            memory={
              <ScrollView
                ref={memorySidebarScrollRef}
                style={styles.sidebarScroll}
                contentContainerStyle={styles.sidebarPanelContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                {renderMemoryPageContent(true)}
              </ScrollView>
            }
            today={
              <ScrollView
                ref={todayScrollRef}
                style={styles.sidebarScroll}
                contentContainerStyle={styles.sidebarTodayContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                {renderTodayPageContent(true)}
              </ScrollView>
            }
            tomorrow={
              <ScrollView
                ref={tomorrowScrollRef}
                style={styles.sidebarScroll}
                contentContainerStyle={styles.sidebarPanelContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                {renderTomorrowPageContent(true)}
              </ScrollView>
            }
          />
        ) : (
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          scrollEventThrottle={1}
          onScroll={onHorizontalScroll}
          onScrollBeginDrag={onHorizontalScrollBeginDrag}
          onScrollEndDrag={onHorizontalScrollEndDrag}
          onMomentumScrollEnd={onHorizontalMomentumEnd}
          onTouchStart={onHorizontalTouchStart}
          onTouchMove={onHorizontalTouchMove}
          keyboardShouldPersistTaps="handled"
          style={styles.horizontalPager}
        >
          <ScrollView
            ref={todayScrollRef}
            style={{ width: screenWidth }}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
            scrollEnabled={false}
          >
            {renderTodayPageContent(false)}
          </ScrollView>

          <ScrollView
            ref={tomorrowScrollRef}
            style={{ width: screenWidth }}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
            scrollEnabled={false}
          >
            {renderTomorrowPageContent(false)}
          </ScrollView>

          <View style={{ width: screenWidth, flex: 1 }}>
            <View style={styles.memoryStaticHeader}>
              <View style={styles.memoryHeader}>
                <View style={styles.memoryEyebrowRow}>
                  <Text style={styles.memoryEyebrow}>SWIPE BACK TO RETURN</Text>
                </View>
                <Text style={styles.memorySubtitle}>A place for tasks that don't have a day yet.</Text>
              </View>

              <View style={styles.memoryInputRow}>
                <TextInput
                  ref={memoryInputRef}
                  value={memoryInput}
                  onChangeText={setMemoryInput}
                  placeholder="Add something to remember..."
                  placeholderTextColor={p.muted}
                  style={styles.memoryInputField}
                  onSubmitEditing={() => {
                    const trimmed = memoryInput.trim();
                    if (trimmed.length > 0) {
                      addMemoryTask(trimmed);
                      setMemoryInput("");
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setTimeout(() => memoryInputRef.current?.focus(), 50);
                  }}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  testID="memory-input"
                />
                <Pressable
                  onPress={() => {
                    const trimmed = memoryInput.trim();
                    if (trimmed.length > 0) {
                      addMemoryTask(trimmed);
                      setMemoryInput("");
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTimeout(() => memoryInputRef.current?.focus(), 50);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.memoryAddBtn,
                    memoryInput.trim().length === 0 && styles.memoryAddBtnDisabled,
                    pressed && memoryInput.trim().length > 0 && styles.memoryAddBtnPressed,
                  ]}
                  disabled={memoryInput.trim().length === 0}
                  testID="memory-add-button"
                >
                  {memoryInput.trim().length > 0 ? (
                    <Check color="#fff" size={18} strokeWidth={2.5} />
                  ) : (
                    <Plus color={p.muted} size={18} strokeWidth={2.5} />
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.memoryScrollList}
              contentContainerStyle={styles.memoryScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {renderMemoryPageContent(false)}
            </ScrollView>

          </View>
        </ScrollView>
        )}

        {todayMemoryBannerText !== null && (
          <Animated.View
            style={[styles.floatingBanner, { bottom: insets.bottom + 24, opacity: todayMemoryBannerAnim, transform: [{ translateY: todayMemoryBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
            pointerEvents="none"
          >
            {todayMemoryBannerText.includes("Uncompleted") ? (
              <Ban color={p.backgroundTop} size={13} strokeWidth={2.5} />
            ) : (
              <Brain color={p.backgroundTop} size={13} strokeWidth={2.5} />
            )}
            <Text style={styles.floatingBannerText}>{todayMemoryBannerText}</Text>
          </Animated.View>
        )}

        {tomorrowReturnBannerText !== null && (
          <Animated.View
            style={[styles.floatingBanner, { bottom: insets.bottom + 24, opacity: tomorrowReturnBannerAnim, transform: [{ translateY: tomorrowReturnBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
            pointerEvents="none"
          >
            {tomorrowReturnBannerText.includes("Uncompleted") ? (
              <Ban color={p.backgroundTop} size={13} strokeWidth={2.5} />
            ) : (
              <Brain color={p.backgroundTop} size={13} strokeWidth={2.5} />
            )}
            <Text style={styles.floatingBannerText}>{tomorrowReturnBannerText}</Text>
          </Animated.View>
        )}

        {memoryBannerText !== null && (
          <Animated.View
            style={[styles.floatingBanner, { bottom: insets.bottom + 24, opacity: memoryBannerAnim, transform: [{ translateY: memoryBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
            pointerEvents="none"
          >
            {memoryBannerText.includes("Removed") ? (
              <Minus color={p.backgroundTop} size={13} strokeWidth={2.5} />
            ) : (
              <Plus color={p.backgroundTop} size={13} strokeWidth={2.5} />
            )}
            <Text style={styles.floatingBannerText}>{memoryBannerText}</Text>
          </Animated.View>
        )}
        </View>
      </SafeAreaView>
      {showTutorial && (
        <OnboardingTutorial palette={p} onComplete={handleTutorialComplete} onThemeChange={updateTheme} currentTheme={settings.theme} />
      )}
      <ConfettiEffect active={showCelebration && !celebrationDismissed} palette={p} originY={progressBarY} originWidth={progressBarWidth} />
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
    keyboardAvoid: {
      flex: 1,
    },
    fixedHeader: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 16,
      paddingBottom: 12,
    },
    fixedHeaderSidebar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.line,
      backgroundColor: p.panel,
    },
    horizontalPager: {
      flex: 1,
    },
    pageContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 300,
      gap: 16,
    },
    sidebarPageContent: {
      paddingHorizontal: 8,
      gap: 8,
      paddingBottom: 120,
    },
    sidebarTodayContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 10,
      paddingBottom: 190,
    },
    sidebarPanelContent: {
      paddingHorizontal: 8,
      paddingTop: 4,
      gap: 6,
      paddingBottom: 120,
    },
    sidebarScroll: {
      flex: 1,
    },
    ambientOrb: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: p.accentGlow,
      opacity: 0.16,
    },
    ambientOrbTop: {
      width: 260,
      height: 260,
      top: -90,
      right: -60,
    },
    ambientOrbBottom: {
      width: 220,
      height: 220,
      bottom: 120,
      left: -70,
      backgroundColor: p.successGlow,
      opacity: 0.08,
    },
    loadingScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.backgroundBottom,
      gap: 10,
    },
    loadingTitle: {
      color: p.ink,
      fontSize: 28,
      fontWeight: "700" as const,
    },
    loadingCopy: {
      color: p.subtext,
      fontSize: 15,
    },
    topRowWrapper: {
      position: "relative" as const,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
    },
    headerCopy: {
      flex: 1,
      paddingRight: 10,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: ui.iconButtonRadius,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    iconButtonPressed: {
      transform: [{ scale: 0.97 }],
      backgroundColor: p.cardGlow,
    },
    iconButtonActive: {
      borderColor: p.accent,
      backgroundColor: p.accentSoft,
    },
    iconButtonSidebar: {
      width: 36,
      height: 36,
      borderRadius: ui.iconButtonRadius,
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: p.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: p.backgroundTop,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "800" as const,
      lineHeight: 13,
    },
    date: {
      color: p.subtext,
      fontSize: ui.variant === "obsidian" ? 13 : 14,
      marginBottom: ui.variant === "obsidian" ? 4 : 6,
      letterSpacing: ui.variant === "obsidian" ? 0.1 : 0.3,
    },
    title: {
      color: p.ink,
      fontSize: ui.titleSize,
      lineHeight: ui.titleSize + 4,
      fontWeight: ui.titleWeight,
      letterSpacing: ui.titleLetterSpacing,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    statsRowSidebar: {
      gap: 6,
    },
    streakChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: ui.variant === "obsidian" ? 7 : 8,
      borderRadius: ui.chipRadius,
      borderWidth: 1,
      borderColor: ui.variant === "obsidian" ? p.line : "rgba(255,159,67,0.2)",
    },
    streakIconWrap: {
      width: 22,
      height: 22,
      borderRadius: ui.variant === "obsidian" ? 6 : 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.variant === "obsidian" ? p.accentSoft : "rgba(255,159,67,0.15)",
    },
    streakCount: {
      color: ui.variant === "obsidian" ? p.accentStrong : "#FF9F43",
      fontSize: 16,
      fontWeight: "800" as const,
    },
    streakUnit: {
      color: ui.variant === "obsidian" ? p.subtext : "rgba(255,159,67,0.7)",
      fontSize: 12,
      fontWeight: "600" as const,
    },
    bestChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: ui.variant === "obsidian" ? 7 : 8,
      borderRadius: ui.chipRadius,
      borderWidth: 1,
      borderColor: ui.variant === "obsidian" ? p.line : "rgba(167,139,250,0.18)",
    },
    bestText: {
      color: ui.variant === "obsidian" ? p.accentStrong : "#A78BFA",
      fontSize: 12,
      fontWeight: "700" as const,
    },
    progressChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: ui.variant === "obsidian" ? 7 : 8,
      borderRadius: ui.chipRadius,
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    progressChipText: {
      color: p.accent,
      fontSize: 13,
      fontWeight: "700" as const,
    },
    progressChipDone: {
      color: "#34D399",
    },
    progressChipGreyed: {
      opacity: 0.45,
    },
    progressChipTextGreyed: {
      color: p.muted,
    },
    tabContainer: {
      marginTop: 2,
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: p.surfaceSoft,
      borderRadius: ui.tabRadius,
      padding: ui.variant === "obsidian" ? 3 : 4,
      position: "relative",
      borderWidth: 1,
      borderColor: p.line,
    },
    tabIndicator: {
      position: "absolute",
      top: ui.variant === "obsidian" ? 3 : 4,
      left: ui.variant === "obsidian" ? 3 : 4,
      right: ui.variant === "obsidian" ? 3 : 4,
      bottom: ui.variant === "obsidian" ? 3 : 4,
      width: "48%",
      borderRadius: ui.variant === "obsidian" ? 6 : 12,
      backgroundColor: p.surfaceElevated,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: ui.variant === "obsidian" ? 10 : 12,
      gap: 7,
      borderRadius: ui.variant === "obsidian" ? 6 : 12,
      zIndex: 1,
    },
    tabActive: {
    },
    tabText: {
      color: p.muted,
      fontSize: 15,
      fontWeight: "600" as const,
    },
    tabTextActive: {
      color: p.ink,
    },
    tabDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    tabDotToday: {
      backgroundColor: "#34D399",
    },
    tabDotTomorrow: {
      backgroundColor: p.accent,
    },
    tabDotInactive: {
      backgroundColor: p.muted,
      opacity: 0.4,
    },
    progressBarWrap: {
      gap: 8,
      overflow: "visible" as const,
      zIndex: 1,
    },
    progressBarWrapSidebar: {
      gap: 4,
      marginBottom: 2,
    },
    progressTrackOuter: {
      position: "relative" as const,
      borderRadius: 999,
    },
    progressGlowBar: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      top: -3,
      bottom: -3,
      borderRadius: 999,
      opacity: 0,
    },
    progressTrack: {
      width: "100%",
      height: 6,
      borderRadius: 999,
      backgroundColor: p.surfaceSoft,
      overflow: "hidden",
    },
    progressTrackSidebar: {
      height: 4,
      borderRadius: 2,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: p.accent,
    },
    progressFillComplete: {
      backgroundColor: "#34D399",
    },
    progressLabel: {
      color: p.subtext,
      fontSize: 13,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginTop: 2,
    },
    sectionTitle: {
      color: p.ink,
      fontSize: 16,
      fontWeight: "700" as const,
    },
    sectionTitleCompact: {
      fontSize: 14,
    },
    sectionCaption: {
      color: p.subtext,
      fontSize: 13,
    },
    tasksWrap: {
      gap: 14,
    },
    tasksWrapSidebar: {
      gap: 8,
    },
    tomorrowHint: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: 8,
      borderRadius: 20,
      backgroundColor: "rgba(52,199,89,0.08)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(52,199,89,0.2)",
      alignSelf: "center" as const,
    },
    tomorrowHintSidebar: {
      alignSelf: "stretch" as const,
      borderRadius: ui.iconButtonRadius,
      paddingVertical: 7,
      marginTop: 6,
    },
    tomorrowHintSaved: {
      color: "#34C759",
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    tomorrowHintDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: p.muted,
      opacity: 0.4,
    },
    editButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      alignSelf: "center" as const,
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
      marginTop: 4,
    },
    editButtonSidebar: {
      alignSelf: "stretch" as const,
      borderRadius: ui.iconButtonRadius,
      paddingVertical: 9,
      marginTop: 8,
      backgroundColor: p.surface,
    },
    editButtonActive: {
      backgroundColor: p.successSoft,
      borderColor: p.success + "40",
    },
    editButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    },
    editButtonText: {
      color: p.accent,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
    },
    editButtonTextActive: {
      color: p.success,
    },
    tomorrowHintText: {
      color: p.muted,
      fontSize: 12,
      fontWeight: "500" as const,
    },
    savePartialButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      alignSelf: "center" as const,
      gap: 7,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 22,
      backgroundColor: p.accentSoft,
      borderWidth: 1,
      borderColor: p.accent + "30",
      marginTop: 8,
    },
    savePartialButtonSidebar: {
      alignSelf: "stretch" as const,
      borderRadius: ui.iconButtonRadius,
      paddingVertical: 9,
    },
    savePartialButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    },
    savePartialButtonText: {
      color: p.accent,
      fontSize: 14,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    savePartialButtonSaved: {
      backgroundColor: "rgba(52,199,89,0.08)",
      borderColor: "rgba(52,199,89,0.2)",
      opacity: 0.7,
    },
    savePartialButtonTextSaved: {
      color: "#34C759",
    },
    saveBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      alignSelf: "center" as const,
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: "rgba(52,199,89,0.1)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(52,199,89,0.25)",
    },
    saveBannerText: {
      color: "#34C759",
      fontSize: 13,
      fontWeight: "600" as const,
    },
    todayTaskWrap: {
      position: "relative" as const,
    },
    todayTaskWrapSidebar: {
      marginBottom: 0,
    },
    todayMemoryBtn: {
      position: "absolute" as const,
      top: -5,
      right: -5,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.surface,
      borderWidth: 1.5,
      borderColor: p.accent + "40",
      shadowColor: p.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    todayMemoryBtnSidebar: {
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: ui.iconButtonRadius,
      borderWidth: 1,
      shadowOpacity: 0,
      elevation: 0,
    },
    todayMemoryBtnPressed: {
      transform: [{ scale: 0.88 }],
      opacity: 0.7,
    },
    todayMemoryBtnDisabled: {
      opacity: 0.35,
      borderColor: p.muted + '30',
    },
    floatingBanner: {
      position: "absolute" as const,
      alignSelf: "center" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: p.ink,
      zIndex: 200,
    },
    floatingBannerText: {
      color: p.backgroundTop,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    tomorrowTaskWrap: {
      position: "relative" as const,
    },
    tomorrowTaskWrapSidebar: {
      marginBottom: 0,
    },
    returnOriginBtn: {
      position: "absolute" as const,
      top: -5,
      right: -5,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.surface,
      borderWidth: 1.5,
      borderColor: p.accent + "40",
      shadowColor: p.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    returnOriginBtnSidebar: {
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: ui.iconButtonRadius,
      borderWidth: 1,
      shadowOpacity: 0,
      elevation: 0,
    },
    returnOriginBtnPressed: {
      transform: [{ scale: 0.88 }],
      opacity: 0.7,
    },
    planningStatusWrap: {
      paddingVertical: 4,
    },
    planningStatusWrapSidebar: {
      paddingVertical: 2,
      marginBottom: 2,
    },
    planningStatusText: {
      color: p.accent,
      fontSize: 14,
      fontWeight: "600" as const,
    },
    planningStatusTextCompact: {
      fontSize: 12,
    },
    labelModeToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: p.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.accent + "30",
    },
    labelModeToggleSidebar: {
      alignSelf: "flex-start" as const,
      marginBottom: 4,
      borderRadius: ui.iconButtonRadius,
      paddingVertical: 4,
    },
    labelModeTogglePressed: {
      opacity: 0.7,
    },
    labelModeToggleText: {
      color: p.accent + "60",
      fontSize: 10,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
    },
    labelModeActiveText: {
      color: p.accent,
    },
    miniTrack: {
      width: 24,
      height: 14,
      borderRadius: 7,
      backgroundColor: p.accent + "30",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    miniThumb: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: p.accent,
      alignSelf: "flex-start",
    },
    miniThumbRight: {
      alignSelf: "flex-end",
    },
    planTomorrowOuter: {
      alignSelf: "center" as const,
      marginTop: 14,
    },
    memoryStaticHeader: {
      paddingHorizontal: 20,
      paddingTop: 0,
      gap: 8,
      paddingBottom: 8,
    },
    memoryScrollList: {
      flex: 1,
    },
    memoryScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 8,
    },
    memoryHeader: {
      gap: 2,
      marginBottom: -2,
    },
    memoryEyebrowRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    memoryEyebrow: {
      color: p.muted,
      fontSize: 10,
      fontWeight: "700" as const,
      letterSpacing: 1.2,
      opacity: 0.6,
    },
    memoryCount: {
      color: p.muted,
      fontSize: 10,
      fontWeight: "600" as const,
      opacity: 0.45,
    },
    memoryTitleCount: {
      color: p.accent,
      fontSize: 15,
      fontWeight: "600" as const,
      opacity: 0.8,
      marginTop: 2,
    },
    memorySubtitle: {
      color: p.subtext,
      fontSize: 14,
      lineHeight: 20,
    },
    memoryInputRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
    },
    memoryInputField: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
      paddingHorizontal: 14,
      color: p.ink,
      fontSize: 14,
    },
    memoryInputFieldCompact: {
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 10,
      fontSize: 12,
    },
    memoryAddBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.accent,
    },
    memoryAddBtnCompact: {
      width: 38,
      height: 38,
      borderRadius: 10,
    },
    memoryAddBtnDisabled: {
      backgroundColor: p.surfaceSoft,
    },
    memoryAddBtnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.95 }],
    },
    memoryHeaderActions: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "flex-end" as const,
      position: "absolute" as const,
      right: 0,
      top: 0,
    },
    memorySidebarToolbar: {
      flexDirection: "row" as const,
      justifyContent: "flex-end" as const,
      alignItems: "center" as const,
      minHeight: 28,
    },
    memorySidebarSelectBtn: {
      paddingHorizontal: 0,
      paddingVertical: 2,
    },
    memoryHeaderButtons: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    memoryHeaderBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    memoryHeaderBtnText: {
      fontSize: 15,
      fontWeight: "600" as const,
    },
    memoryHeaderDeleteBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      backgroundColor: p.danger,
      borderRadius: 8,
    },
    memoryHeaderDeleteBtnDisabled: {
      backgroundColor: p.line,
    },
    memoryHeaderDeleteText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600" as const,
    },
    memoryEmpty: {
      alignItems: "center" as const,
      paddingVertical: 48,
      gap: 10,
    },
    memoryEmptySidebar: {
      paddingVertical: 28,
      gap: 8,
    },
    memoryEmptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.accentSoft,
      marginBottom: 4,
    },
    memoryEmptyIconSidebar: {
      width: 40,
      height: 40,
      borderRadius: ui.iconButtonRadius,
      marginBottom: 0,
    },
    memoryEmptyTitle: {
      color: p.ink,
      fontSize: 20,
      fontWeight: "700" as const,
    },
    memoryEmptyTitleSidebar: {
      fontSize: 16,
    },
    memoryEmptySubtitle: {
      color: p.subtext,
      fontSize: 14,
    },
    memoryList: {
      gap: 8,
    },
    memoryListSidebar: {
      gap: 4,
    },

    memoryCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      paddingVertical: 10,
      paddingLeft: 6,
      paddingRight: 8,
      borderRadius: 14,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.line,
    },
    memoryCardSidebar: {
      borderRadius: 4,
      paddingVertical: 8,
      paddingLeft: 8,
      paddingRight: 6,
      borderLeftWidth: 2,
      borderLeftColor: p.accentSoft,
      backgroundColor: p.surface,
    },
    memoryCardCompleted: {
      opacity: 0.5,
      backgroundColor: p.surface + "80",
    },
    memoryCardSelected: {
      borderColor: p.danger + "60",
      backgroundColor: p.danger + "08",
    },
    memorySelectCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 2,
      borderColor: p.line,
      backgroundColor: "transparent",
    },
    memorySelectCircleSidebar: {
      width: 26,
      height: 26,
      borderRadius: 4,
    },
    memorySelectCircleActive: {
      borderColor: p.danger,
      backgroundColor: p.danger,
    },
    memoryCheck: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.successSoft,
      borderWidth: 1,
      borderColor: p.success + "30",
    },
    memoryCheckSidebar: {
      width: 26,
      height: 26,
      borderRadius: 4,
    },
    memoryCheckDone: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.line,
      borderWidth: 1,
      borderColor: p.muted + "30",
    },
    memoryCardTitle: {
      flex: 1,
      color: p.ink,
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
    },
    memoryCardTitleSidebar: {
      fontSize: 13,
      lineHeight: 18,
    },
    memoryCardTitleDone: {
      textDecorationLine: "line-through" as const,
      color: p.muted,
    },
    memoryPushBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: p.accentSoft,
      borderWidth: 1,
      borderColor: p.accent + "25",
    },
    memoryPushBtnDisabled: {
      opacity: 0.4,
    },
    memoryPushBtnActive: {
      backgroundColor: p.accent,
      borderColor: p.accent,
    },
    memoryPushTextActive: {
      color: p.backgroundTop,
    },
    memoryPushText: {
      color: p.accent,
      fontSize: 11,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    memoryTooltip: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: p.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.line,
      marginTop: 8,
    },
    memoryTooltipText: {
      flex: 1,
      color: p.muted,
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 17,
    },
    coachMarkPressable: {
      alignSelf: "center" as const,
      marginTop: 18,
    },
    coachMarkOuter: {
      position: "relative" as const,
      borderRadius: 100,
      padding: 1.5,
    },
    coachMarkGlowLayer: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 100,
      overflow: "hidden" as const,
    },
    coachMarkGradient: {
      flex: 1,
      borderRadius: 100,
    },
    coachMarkBubble: {
      backgroundColor: p.surface,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 100,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    coachMarkText: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
    },
    memorySegmentPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.accent + "25",
      overflow: "hidden" as const,
    },
    memorySegmentPillSidebar: {
      borderRadius: ui.iconButtonRadius,
    },
    memorySegment: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 6,
      backgroundColor: p.accentSoft,
    },
    memorySegmentLeft: {},
    memorySegmentRight: {},
    memorySegmentActive: {
      backgroundColor: p.accent,
    },
    memorySegmentDisabled: {
      opacity: 0.4,
    },
    memorySegmentDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch" as const,
      backgroundColor: p.accent + "40",
    },
    memorySegmentLabel: {
      color: p.accent,
      fontSize: 10,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
    },
    memorySegmentLabelActive: {
      color: p.backgroundTop,
    },
    memorySegmentLabelDisabled: {
      color: p.muted,
    },
  });
}
