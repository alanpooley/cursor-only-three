import createContextHook from "@nkzw/create-context-hook";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { cancelDailyReminderNotification, cancelReminderNotification, scheduleDailyReminderNotification, scheduleReminderNotification, setBadgeCount } from "@/services/notifications";
import { createEmptyDayPlan, createSeedPlans, createSeedRetroCompletions, defaultSettings, defaultAppState, loadAppState, saveAppState, loadTutorialSeen, saveTutorialSeen, clearAllAppData } from "@/services/storage";
import { AppSettings, BadgeMode, DailyReminderTime, DayPlan, DailyTask, MemoryCompletion, MemoryTask, RetroCompletion, TaskLabelMode, TaskOrigin, TaskSize, ThemeMode, HomeLayoutMode } from "@/types/only-three";
import { formatDateKey, getTomorrowDateKey } from "@/utils/date";
import { calculateStreakState } from "@/utils/streak";
import { themes, ThemePalette } from "@/constants/onlyThreeTheme";

function sortPlans(plans: DayPlan[]): DayPlan[] {
  return [...plans].sort((left, right) => left.date.localeCompare(right.date));
}

function ensurePlanForDate(plans: DayPlan[], dateKey: string): DayPlan[] {
  const has = plans.some((plan) => plan.date === dateKey);
  if (has) return plans;
  return [...plans, createEmptyDayPlan(new Date(`${dateKey}T12:00:00`))];
}

function ensureRequiredPlans(plans: DayPlan[], todayKey: string, tomorrowKey: string): DayPlan[] {
  let result = ensurePlanForDate(plans, todayKey);
  result = ensurePlanForDate(result, tomorrowKey);
  return sortPlans(result);
}

function useCurrentDateKeys() {
  const [keys, setKeys] = useState(() => ({
    todayKey: formatDateKey(new Date()),
    tomorrowKey: getTomorrowDateKey(),
  }));

  useEffect(() => {
    const checkDayChange = () => {
      const newToday = formatDateKey(new Date());
      setKeys((prev) => {
        if (prev.todayKey !== newToday) {
          const newTomorrow = getTomorrowDateKey();
          console.log("[only-three] Day changed", { from: prev.todayKey, to: newToday });
          return { todayKey: newToday, tomorrowKey: newTomorrow };
        }
        return prev;
      });
    };

    const interval = setInterval(checkDayChange, 30_000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        console.log("[only-three] App became active, checking day change");
        checkDayChange();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return keys;
}

export const [OnlyThreeProvider, useOnlyThree] = createContextHook(() => {
  const { todayKey, tomorrowKey } = useCurrentDateKeys();
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [retroCompletions, setRetroCompletions] = useState<RetroCompletion[]>([]);
  const [memoryTasks, setMemoryTasks] = useState<MemoryTask[]>([]);
  const [memoryCompletions, setMemoryCompletions] = useState<MemoryCompletion[]>([]);
  const [tomorrowTaskOrigins, setTomorrowTaskOrigins] = useState<Partial<Record<TaskSize, TaskOrigin>>>({});
  const [todayTaskOrigins, setTodayTaskOrigins] = useState<Partial<Record<TaskSize, TaskOrigin>>>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialChecked, setTutorialChecked] = useState<boolean>(false);
  const lastReminderSignature = useRef<string>("");
  const lastDailyReminderSignature = useRef<string>("");

  const stateQuery = useQuery({
    queryKey: ["only-three-state"],
    queryFn: loadAppState,
  });

  const tutorialQuery = useQuery({
    queryKey: ["only-three-tutorial"],
    queryFn: loadTutorialSeen,
  });

  useEffect(() => {
    if (tutorialQuery.data !== undefined && !tutorialChecked) {
      setShowTutorial(!tutorialQuery.data);
      setTutorialChecked(true);
      console.log("[only-three] Tutorial seen:", tutorialQuery.data);
    }
  }, [tutorialQuery.data, tutorialChecked]);

  const completeTutorial = useCallback(() => {
    setShowTutorial(false);
    void saveTutorialSeen(true);
    console.log("[only-three] Tutorial completed");
  }, []);

  const resetTutorial = useCallback(() => {
    setShowTutorial(true);
    console.log("[only-three] Tutorial reset");
  }, []);

  const resetToFirstTime = useCallback(async () => {
    await clearAllAppData();
    const freshPlans = ensureRequiredPlans(defaultAppState.dayPlans, todayKey, tomorrowKey);
    setDayPlans(freshPlans);
    setRetroCompletions(defaultAppState.retroCompletions ?? []);
    setMemoryTasks(defaultAppState.memoryTasks ?? []);
    setMemoryCompletions([]);
    setTomorrowTaskOrigins({});
    setTodayTaskOrigins({});
    setSettings(defaultSettings);
    setShowTutorial(true);
    setTutorialChecked(true);
    await saveTutorialSeen(false);
    console.log("[only-three] Reset to first-time user state");
  }, [todayKey, tomorrowKey]);

  const saveStateMutation = useMutation({
    mutationFn: saveAppState,
  });

  useEffect(() => {
    if (!stateQuery.data) {
      return;
    }

    const nextPlans = ensureRequiredPlans(stateQuery.data.dayPlans, todayKey, tomorrowKey);
    setDayPlans(nextPlans);
    setRetroCompletions(stateQuery.data.retroCompletions ?? []);
    setMemoryTasks(stateQuery.data.memoryTasks ?? []);
    setMemoryCompletions(stateQuery.data.memoryCompletions ?? []);
    setTomorrowTaskOrigins(stateQuery.data.tomorrowTaskOrigins ?? {});
    setTodayTaskOrigins(stateQuery.data.todayTaskOrigins ?? {});
    setSettings(stateQuery.data.settings);
    setHydrated(true);
    console.log("[only-three] Hydrated state", {
      plans: nextPlans.length,
      notificationsEnabled: stateQuery.data.settings.notificationsEnabled,
      theme: stateQuery.data.settings.theme,
    });
  }, [stateQuery.data, todayKey, tomorrowKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const state = {
      dayPlans,
      settings,
      retroCompletions,
      memoryTasks,
      memoryCompletions,
      tomorrowTaskOrigins,
      todayTaskOrigins,
    };

    saveStateMutation.mutate(state);
    console.log("[only-three] Persisted state", {
      plans: dayPlans.length,
      reminderHour: settings.reminderHour,
      reminderMinute: settings.reminderMinute,
      theme: settings.theme,
    });
    // NOTE: saveStateMutation is intentionally omitted from the dependency
    // array. useMutation() returns a new result object on every pending/
    // success/error transition, so including it here — while this effect
    // itself calls .mutate() — created an infinite save loop: mutate →
    // status transition → new mutation object → effect re-fires → mutate
    // again, forever. Depend only on the data that should trigger a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayPlans, hydrated, memoryCompletions, memoryTasks, retroCompletions, settings, todayTaskOrigins, tomorrowTaskOrigins]);

  const currentPalette = useMemo<ThemePalette>(() => {
    return themes[settings.theme] ?? themes.night;
  }, [settings.theme]);

  const todayPlan = useMemo(() => {
    const existing = dayPlans.find((plan) => plan.date === todayKey);
    return existing ?? createEmptyDayPlan();
  }, [dayPlans, todayKey]);

  const tomorrowPlan = useMemo(() => {
    const existing = dayPlans.find((plan) => plan.date === tomorrowKey);
    return existing ?? createEmptyDayPlan(new Date(`${tomorrowKey}T12:00:00`));
  }, [dayPlans, tomorrowKey]);

  const updatePlanTasks = useCallback((dateKey: string, updater: (tasks: DailyTask[]) => DailyTask[]) => {
    setDayPlans((current) => {
      const ensured = ensureRequiredPlans(current, todayKey, tomorrowKey);
      return ensured.map((plan) => {
        if (plan.date !== dateKey) return plan;
        return { ...plan, tasks: updater(plan.tasks), updatedAt: new Date().toISOString() };
      });
    });
  }, [todayKey, tomorrowKey]);

  const updateTaskTitle = useCallback((type: TaskSize, title: string, dateKey?: string) => {
    const effectiveDateKey = dateKey ?? todayKey;
    updatePlanTasks(effectiveDateKey, (tasks) => tasks.map((task) => task.type === type ? { ...task, title } : task));

    // A direct manual edit invalidates any "pushed from memory/uncompleted"
    // provenance tag on this slot — otherwise the origin badge keeps
    // pointing at content that's no longer there. Clear it here rather than
    // only when the slot goes empty.
    if (effectiveDateKey === tomorrowKey) {
      setTomorrowTaskOrigins((prev) => {
        if (!prev[type]) return prev;
        const next = { ...prev };
        delete next[type];
        return next;
      });
    } else if (effectiveDateKey === todayKey) {
      setTodayTaskOrigins((prev) => {
        if (!prev[type]) return prev;
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }
  }, [updatePlanTasks, todayKey, tomorrowKey]);

  const addTaskToTomorrow = useCallback((title: string, origin?: TaskOrigin): boolean => {
    const plan = dayPlans.find((p) => p.date === tomorrowKey);
    if (!plan) return false;
    const emptySlot = plan.tasks.find((t) => t.title.trim().length === 0);
    if (!emptySlot) return false;
    updatePlanTasks(tomorrowKey, (tasks) =>
      tasks.map((t) => t.id === emptySlot.id ? { ...t, title } : t)
    );
    if (origin) {
      setTomorrowTaskOrigins((prev) => ({ ...prev, [emptySlot.type]: origin }));
    }
    console.log("[only-three] Added task to tomorrow", { title, slot: emptySlot.type, origin });
    return true;
  }, [dayPlans, tomorrowKey, updatePlanTasks]);

  const removeTaskFromTomorrow = useCallback((title: string): boolean => {
    const plan = dayPlans.find((p) => p.date === tomorrowKey);
    if (!plan) return false;
    const match = plan.tasks.find((t) => t.title.trim() === title.trim());
    if (!match) return false;
    updatePlanTasks(tomorrowKey, (tasks) =>
      tasks.map((t) => t.id === match.id ? { ...t, title: "" } : t)
    );
    setTomorrowTaskOrigins((prev) => {
      const next = { ...prev };
      delete next[match.type];
      return next;
    });
    console.log("[only-three] Removed task from tomorrow", { title });
    return true;
  }, [dayPlans, tomorrowKey, updatePlanTasks]);

  const isTaskInTomorrow = useCallback((title: string): boolean => {
    const plan = dayPlans.find((p) => p.date === tomorrowKey);
    if (!plan) return false;
    return plan.tasks.some((t) => t.title.trim() === title.trim() && t.title.trim().length > 0);
  }, [dayPlans, tomorrowKey]);

  const addTaskToToday = useCallback((title: string, origin?: TaskOrigin): boolean => {
    const plan = dayPlans.find((p) => p.date === todayKey);
    if (!plan) return false;
    const emptySlot = plan.tasks.find((t) => t.title.trim().length === 0);
    if (!emptySlot) return false;
    updatePlanTasks(todayKey, (tasks) =>
      tasks.map((t) => t.id === emptySlot.id ? { ...t, title } : t)
    );
    if (origin) {
      setTodayTaskOrigins((prev) => ({ ...prev, [emptySlot.type]: origin }));
    }
    console.log("[only-three] Added task to today", { title, slot: emptySlot.type, origin });
    return true;
  }, [dayPlans, todayKey, updatePlanTasks]);

  const removeTaskFromToday = useCallback((title: string): boolean => {
    const plan = dayPlans.find((p) => p.date === todayKey);
    if (!plan) return false;
    const match = plan.tasks.find((t) => t.title.trim() === title.trim());
    if (!match) return false;
    updatePlanTasks(todayKey, (tasks) =>
      tasks.map((t) => t.id === match.id ? { ...t, title: "" } : t)
    );
    setTodayTaskOrigins((prev) => {
      const next = { ...prev };
      delete next[match.type];
      return next;
    });
    console.log("[only-three] Removed task from today", { title });
    return true;
  }, [dayPlans, todayKey, updatePlanTasks]);

  const isTaskInToday = useCallback((title: string): boolean => {
    const plan = dayPlans.find((p) => p.date === todayKey);
    if (!plan) return false;
    return plan.tasks.some((t) => t.title.trim() === title.trim() && t.title.trim().length > 0);
  }, [dayPlans, todayKey]);

  const deleteTask = useCallback((type: TaskSize, dateKey?: string) => {
    updatePlanTasks(dateKey ?? todayKey, (tasks) => tasks.map((task) => {
      if (task.type !== type) return task;
      return {
        ...task,
        title: "",
        isCompleted: false,
        completedAt: undefined,
      };
    }));
    console.log("[only-three] Deleted task", { type, dateKey: dateKey ?? todayKey });
  }, [updatePlanTasks, todayKey]);

  const deleteUncompletedTasks = useCallback((taskKeys: Array<{ date: string; type: TaskSize; title: string }>) => {
    setDayPlans((current) => {
      const ensured = ensureRequiredPlans(current, todayKey, tomorrowKey);
      return ensured.map((plan) => {
        const matching = taskKeys.filter((k) => k.date === plan.date);
        if (matching.length === 0) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((task) => {
            const found = matching.find((m) => m.type === task.type && m.title === task.title);
            if (!found) return task;
            return { ...task, title: "", isCompleted: false, completedAt: undefined };
          }),
          updatedAt: new Date().toISOString(),
        };
      });
    });
    setRetroCompletions((current) =>
      current.filter((rc) => !taskKeys.some((k) => k.title === rc.taskTitle && k.date === rc.originalDate))
    );
    console.log("[only-three] Bulk deleted uncompleted tasks", { count: taskKeys.length });
  }, [todayKey, tomorrowKey]);

  const toggleTaskCompletion = useCallback((type: TaskSize, dateKey?: string) => {
    updatePlanTasks(dateKey ?? todayKey, (tasks) => tasks.map((task) => {
      if (task.type !== type) return task;
      const nowCompleted = !task.isCompleted;
      return {
        ...task,
        isCompleted: nowCompleted,
        completedAt: nowCompleted ? new Date().toISOString() : undefined,
      };
    }));
  }, [updatePlanTasks, todayKey]);

  const recordRetroCompletion = useCallback((taskTitle: string, taskType: TaskSize, originalDate: string) => {
    const now = new Date().toISOString();
    const entry: RetroCompletion = {
      id: `retro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskTitle,
      taskType,
      originalDate,
      completedAt: now,
    };
    setRetroCompletions((current) => [entry, ...current]);
    console.log("[only-three] Recorded retro completion", { taskTitle, taskType, originalDate });
  }, []);

  const removeRetroCompletion = useCallback((taskTitle: string, originalDate: string) => {
    setRetroCompletions((current) =>
      current.filter((rc) => !(rc.taskTitle === taskTitle && rc.originalDate === originalDate))
    );
    console.log("[only-three] Removed retro completion", { taskTitle, originalDate });
  }, []);

  const updateNotifications = useCallback((enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      notificationsEnabled: enabled,
    }));
  }, []);

  const updateReminderTime = useCallback((hour: number, minute: number) => {
    setSettings((current) => ({
      ...current,
      reminderHour: hour,
      reminderMinute: minute,
    }));
  }, []);

  const updateTheme = useCallback((theme: ThemeMode) => {
    console.log("[only-three] Theme changed to", theme);
    setSettings((current) => ({
      ...current,
      theme,
    }));
  }, []);

  const updateHomeLayout = useCallback((homeLayout: HomeLayoutMode) => {
    console.log("[only-three] Home layout changed to", homeLayout);
    setSettings((current) => ({
      ...current,
      homeLayout,
    }));
  }, []);

  const updateDefaultTaskLabelMode = useCallback((mode: TaskLabelMode) => {
    console.log("[only-three] Default task label mode changed to", mode);
    setSettings((current) => ({
      ...current,
      defaultTaskLabelMode: mode,
    }));
    setDayPlans((current) => {
      const ensured = ensureRequiredPlans(current, todayKey, tomorrowKey);
      return ensured.map((plan) => {
        if (plan.date !== tomorrowKey) return plan;
        return { ...plan, taskLabelMode: mode, updatedAt: new Date().toISOString() };
      });
    });
    console.log("[only-three] Tomorrow label mode synced to", mode);
  }, [todayKey, tomorrowKey]);

  const addMemoryTask = useCallback((title: string) => {
    const task: MemoryTask = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setMemoryTasks((current) => [task, ...current]);
    console.log("[only-three] Added memory task", { title });
  }, []);

  const deleteMemoryTask = useCallback((id: string) => {
    setMemoryTasks((current) => current.filter((t) => t.id !== id));
    console.log("[only-three] Deleted memory task", { id });
  }, []);

  const toggleMemoryTaskCompletion = useCallback((id: string) => {
    const task = memoryTasks.find((t) => t.id === id);
    const willComplete = task ? !task.isCompleted : false;

    setMemoryTasks((current) =>
      current.map((t) => {
        if (t.id !== id) return t;
        const nowCompleted = !t.isCompleted;
        return {
          ...t,
          isCompleted: nowCompleted,
          completedAt: nowCompleted ? new Date().toISOString() : undefined,
        };
      })
    );

    if (task && willComplete) {
      const entry: MemoryCompletion = {
        id: `memcomp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        taskTitle: task.title,
        completedAt: new Date().toISOString(),
      };
      setMemoryCompletions((current) => [entry, ...current]);
      console.log("[only-three] Recorded memory completion", { title: task.title });
    } else if (task && !willComplete) {
      setMemoryCompletions((current) =>
        current.filter((mc) => !(mc.taskTitle === task.title))
      );
      console.log("[only-three] Removed memory completion", { title: task.title });
    }

    console.log("[only-three] Toggled memory task", { id });
  }, [memoryTasks]);

  const pushMemoryTaskToTomorrow = useCallback((id: string): boolean => {
    const task = memoryTasks.find((t) => t.id === id);
    if (!task || task.title.trim().length === 0) return false;
    const success = addTaskToTomorrow(task.title, 'memory');
    if (success) {
      console.log("[only-three] Pushed memory task to tomorrow (kept in memory)", { title: task.title });
    }
    return success;
  }, [memoryTasks, addTaskToTomorrow]);

  const moveTomorrowTaskToMemory = useCallback((type: TaskSize): boolean => {
    const plan = dayPlans.find((p) => p.date === tomorrowKey);
    if (!plan) return false;
    const task = plan.tasks.find((t) => t.type === type);
    if (!task || task.title.trim().length === 0) return false;
    addMemoryTask(task.title);
    updatePlanTasks(tomorrowKey, (tasks) =>
      tasks.map((t) => t.type === type ? { ...t, title: "", isCompleted: false, completedAt: undefined } : t)
    );
    setTomorrowTaskOrigins((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    console.log("[only-three] Moved tomorrow task to memory", { title: task.title, type });
    return true;
  }, [dayPlans, tomorrowKey, addMemoryTask, updatePlanTasks]);

  const moveTodayTaskToMemory = useCallback((type: TaskSize): boolean => {
    const plan = dayPlans.find((p) => p.date === todayKey);
    if (!plan) return false;
    const task = plan.tasks.find((t) => t.type === type);
    if (!task || task.title.trim().length === 0) return false;
    addMemoryTask(task.title);
    updatePlanTasks(todayKey, (tasks) =>
      tasks.map((t) => t.type === type ? { ...t, title: "", isCompleted: false, completedAt: undefined } : t)
    );
    setTodayTaskOrigins((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    console.log("[only-three] Moved today task to memory", { title: task.title, type });
    return true;
  }, [dayPlans, todayKey, addMemoryTask, updatePlanTasks]);

  const updateDailyReminderEnabled = useCallback((enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      dailyReminderEnabled: enabled,
    }));
  }, []);

  const updateDailyReminderTime = useCallback((time: DailyReminderTime) => {
    setSettings((current) => ({
      ...current,
      dailyReminderTime: time,
    }));
  }, []);

  const updateBadgeMode = useCallback((mode: BadgeMode) => {
    console.log("[only-three] Badge mode changed to", mode);
    setSettings((current) => ({
      ...current,
      badgeMode: mode,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setDayPlans((current) => {
      const kept = current.filter((plan) => plan.date >= todayKey);
      return ensureRequiredPlans(kept, todayKey, tomorrowKey);
    });
    setRetroCompletions([]);
    setMemoryCompletions([]);
    console.log("[only-three] Cleared history");
  }, [todayKey, tomorrowKey]);

  const loadExampleData = useCallback(() => {
    const seedPlans = createSeedPlans();
    const seedRetro = createSeedRetroCompletions();
    setDayPlans((current) => {
      const ensured = ensureRequiredPlans(current, todayKey, tomorrowKey);
      const todayPlan = ensured.find((p) => p.date === todayKey)!;
      const tomorrowPlan = ensured.find((p) => p.date === tomorrowKey)!;
      const now = new Date().toISOString();
      const seededToday: DayPlan = {
        ...todayPlan,
        tasks: todayPlan.tasks.map((t, i) => {
          const examples = [
            { title: "Finish the proposal draft", type: "big" as const },
            { title: "Call back the accountant", type: "medium" as const },
            { title: "Pick up coffee on the way home", type: "small" as const },
          ];
          return { ...t, title: examples[i]?.title ?? t.title, type: examples[i]?.type ?? t.type, isCompleted: false };
        }),
        updatedAt: now,
      };
      const seededTomorrow: DayPlan = {
        ...tomorrowPlan,
        tasks: tomorrowPlan.tasks.map((t, i) => {
          const examples = [
            { title: "Review the design handoff", type: "big" as const },
            { title: "Book flights for conference", type: "medium" as const },
            { title: "Reply to Slack threads", type: "small" as const },
          ];
          return { ...t, title: examples[i]?.title ?? t.title, type: examples[i]?.type ?? t.type, isCompleted: false };
        }),
        updatedAt: now,
      };
      const merged = [seededToday, seededTomorrow, ...seedPlans.filter((sp) => sp.date !== todayKey && sp.date !== tomorrowKey)];
      return sortPlans(merged);
    });
    setRetroCompletions(seedRetro);
    console.log("[only-three] Loaded example data", { plans: seedPlans.length, retroCompletions: seedRetro.length });
  }, [todayKey, tomorrowKey]);

  const updateDayTaskLabelMode = useCallback((dateKey: string, mode: TaskLabelMode) => {
    console.log("[only-three] Day task label mode changed", { dateKey, mode });
    setDayPlans((current) => {
      const ensured = ensureRequiredPlans(current, todayKey, tomorrowKey);
      return ensured.map((plan) => {
        if (plan.date !== dateKey) return plan;
        return { ...plan, taskLabelMode: mode, updatedAt: new Date().toISOString() };
      });
    });
  }, [todayKey, tomorrowKey]);

  const getEffectiveLabelMode = useCallback((plan: DayPlan): TaskLabelMode => {
    return plan.taskLabelMode ?? settings.defaultTaskLabelMode;
  }, [settings.defaultTaskLabelMode]);

  const historyPlans = useMemo(() => {
    return dayPlans.filter((plan) => {
      if (plan.date < todayKey) return true;
      if (plan.date === todayKey) {
        const hasCompletedTask = plan.tasks.some((t) => t.isCompleted && t.title.trim().length > 0);
        return hasCompletedTask;
      }
      return false;
    }).sort((left, right) => right.date.localeCompare(left.date));
  }, [dayPlans, todayKey]);

  const uncompletedTasks = useMemo(() => {
    const pastPlans = dayPlans.filter((plan) => plan.date < todayKey);
    const items: Array<{ task: DailyTask; date: string }> = [];
    for (const plan of pastPlans) {
      for (const task of plan.tasks) {
        if (!task.isCompleted && task.title.trim().length > 0) {
          items.push({ task, date: plan.date });
        }
      }
    }
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [dayPlans, todayKey]);

  const retroCompletedTasks = useMemo((): Array<{ task: DailyTask; date: string }> => {
    const pastPlans = dayPlans.filter((plan) => plan.date < todayKey);
    const items: Array<{ task: DailyTask; date: string }> = [];
    const now = new Date();
    for (const plan of pastPlans) {
      for (const task of plan.tasks) {
        if (task.isCompleted && task.completedAt && task.title.trim().length > 0) {
          const hasRetroRecord = retroCompletions.some(
            (rc) => rc.taskTitle === task.title && rc.originalDate === plan.date
          );
          if (!hasRetroRecord) continue;
          const completedDate = new Date(task.completedAt);
          const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCompleted < 24) {
            items.push({ task, date: plan.date });
          }
        }
      }
    }
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [dayPlans, todayKey, retroCompletions]);

  const olderCompletedTasks = useMemo(() => {
    const pastPlans = dayPlans.filter((plan) => plan.date < todayKey);
    const items: Array<{ task: DailyTask; date: string }> = [];
    const now = new Date();
    for (const plan of pastPlans) {
      for (const task of plan.tasks) {
        if (task.isCompleted && task.completedAt && task.title.trim().length > 0) {
          const hasRetroRecord = retroCompletions.some(
            (rc) => rc.taskTitle === task.title && rc.originalDate === plan.date
          );
          if (!hasRetroRecord) continue;
          const completedDate = new Date(task.completedAt);
          const hoursSinceCompleted = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
          const daysSinceCompleted = hoursSinceCompleted / 24;
          if (hoursSinceCompleted >= 24 && daysSinceCompleted < 7) {
            items.push({ task, date: plan.date });
          }
        }
      }
    }
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [dayPlans, todayKey, retroCompletions]);
  const streak = useMemo(() => calculateStreakState(dayPlans), [dayPlans]);
  const availableTaskCount = useMemo(() => todayPlan.tasks.filter((task) => task.title.trim().length > 0).length, [todayPlan.tasks]);
  const completedCount = useMemo(() => todayPlan.tasks.filter((task) => task.isCompleted && task.title.trim().length > 0).length, [todayPlan.tasks]);
  const allComplete = availableTaskCount > 0 && completedCount === availableTaskCount;
  const tomorrowFilledCount = useMemo(() => tomorrowPlan.tasks.filter((t) => t.title.trim().length > 0).length, [tomorrowPlan.tasks]);
  const todayFilledCount = useMemo(() => todayPlan.tasks.filter((t) => t.title.trim().length > 0).length, [todayPlan.tasks]);

  const getTomorrowTaskOrigin = useCallback((taskType: TaskSize): TaskOrigin | undefined => {
    return tomorrowTaskOrigins[taskType];
  }, [tomorrowTaskOrigins]);

  const getTodayTaskOrigin = useCallback((taskType: TaskSize): TaskOrigin | undefined => {
    return todayTaskOrigins[taskType];
  }, [todayTaskOrigins]);

  useEffect(() => {
    if (!hydrated) return;
    const plan = dayPlans.find((dp) => dp.date === tomorrowKey);
    if (!plan) return;
    setTomorrowTaskOrigins((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const taskType of ['big', 'medium', 'small'] as const) {
        const task = plan.tasks.find((t) => t.type === taskType);
        if ((!task || task.title.trim().length === 0) && next[taskType]) {
          delete next[taskType];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [hydrated, dayPlans, tomorrowKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const tomorrowIsFilled = tomorrowFilledCount >= 3;
    const signature = `${settings.notificationsEnabled}-${settings.reminderHour}-${settings.reminderMinute}-${tomorrowIsFilled}`;
    if (signature === lastReminderSignature.current) {
      return;
    }

    lastReminderSignature.current = signature;

    const syncReminder = async (): Promise<void> => {
      if (settings.notificationsEnabled && !tomorrowIsFilled) {
        const success = await scheduleReminderNotification(settings.reminderHour, settings.reminderMinute);
        console.log("[only-three] Reminder scheduled", { success, tomorrowIsFilled });
        if (!success) {
          setSettings((current) => ({
            ...current,
            notificationsEnabled: false,
          }));
        }
        return;
      }

      if (tomorrowIsFilled && settings.notificationsEnabled) {
        await cancelReminderNotification();
        console.log("[only-three] Reminder suppressed — tomorrow already planned");
        return;
      }

      await cancelReminderNotification();
      console.log("[only-three] Reminder cancelled");
    };

    void syncReminder();
  }, [hydrated, settings, tomorrowFilledCount]);

  const dailyReminderHours: Record<DailyReminderTime, { hour: number; minute: number }> = useMemo(() => ({
    early: { hour: 8, minute: 0 },
    midmorning: { hour: 10, minute: 30 },
    midday: { hour: 12, minute: 30 },
  }), []);

  useEffect(() => {
    if (!hydrated) return;

    const signature = `${settings.dailyReminderEnabled}-${settings.dailyReminderTime}`;
    if (signature === lastDailyReminderSignature.current) return;
    lastDailyReminderSignature.current = signature;

    const syncDailyReminder = async (): Promise<void> => {
      if (settings.dailyReminderEnabled) {
        const time = dailyReminderHours[settings.dailyReminderTime];
        const success = await scheduleDailyReminderNotification(time.hour, time.minute);
        console.log("[only-three] Daily reminder scheduled", { success, time: settings.dailyReminderTime });
        if (!success) {
          setSettings((current) => ({ ...current, dailyReminderEnabled: false }));
        }
        return;
      }
      await cancelDailyReminderNotification();
      console.log("[only-three] Daily reminder cancelled");
    };

    void syncDailyReminder();
  }, [hydrated, settings.dailyReminderEnabled, settings.dailyReminderTime, dailyReminderHours]);

  useEffect(() => {
    if (!hydrated) return;
    const mode = settings.badgeMode;
    const todayUncompleted = todayPlan.tasks.filter((t) => t.title.trim().length > 0 && !t.isCompleted).length;
    const totalUncompleted = uncompletedTasks.length + todayUncompleted;
    if (mode === "none") {
      void setBadgeCount(0);
    } else if (mode === "dot") {
      void setBadgeCount(totalUncompleted > 0 ? 1 : 0);
    } else {
      void setBadgeCount(totalUncompleted);
    }
  }, [hydrated, settings.badgeMode, uncompletedTasks.length, todayPlan]);

  return useMemo(() => ({
    dayPlans,
    todayKey,
    todayPlan,
    tomorrowPlan,
    tomorrowKey,
    historyPlans,
    uncompletedTasks,
    retroCompletedTasks,
    olderCompletedTasks,
    settings,
    streak,
    completedCount,
    availableTaskCount,
    allComplete,
    isLoading: stateQuery.isLoading || !hydrated,
    currentPalette,
    showTutorial,
    completeTutorial,
    resetTutorial,
    resetToFirstTime,
    tomorrowFilledCount,
    deleteTask,
    deleteUncompletedTasks,
    updateTaskTitle,
    retroCompletions,
    toggleTaskCompletion,
    recordRetroCompletion,
    removeRetroCompletion,
    addTaskToTomorrow,
    removeTaskFromTomorrow,
    isTaskInTomorrow,
    addTaskToToday,
    removeTaskFromToday,
    isTaskInToday,
    todayFilledCount,
    updateNotifications,
    updateReminderTime,
    updateDefaultTaskLabelMode,
    updateDayTaskLabelMode,
    getEffectiveLabelMode,
    updateBadgeMode,
    updateDailyReminderEnabled,
    updateDailyReminderTime,
    dailyReminderHours,
    loadExampleData,
    updateTheme,
    updateHomeLayout,
    memoryTasks,
    memoryCompletions,
    addMemoryTask,
    deleteMemoryTask,
    toggleMemoryTaskCompletion,
    pushMemoryTaskToTomorrow,
    moveTodayTaskToMemory,
    moveTomorrowTaskToMemory,
    tomorrowTaskOrigins,
    getTomorrowTaskOrigin,
    todayTaskOrigins,
    getTodayTaskOrigin,
    clearHistory,
  }), [
    allComplete,
    availableTaskCount,
    completedCount,
    completeTutorial,
    resetToFirstTime,
    currentPalette,
    dayPlans,
    historyPlans,
    hydrated,
    todayKey,
    resetTutorial,
    settings,
    showTutorial,
    stateQuery.isLoading,
    streak,
    todayPlan,
    tomorrowKey,
    tomorrowPlan,
    tomorrowFilledCount,
    deleteTask,
    deleteUncompletedTasks,
    retroCompletions,
    toggleTaskCompletion,
    recordRetroCompletion,
    removeRetroCompletion,
    addTaskToTomorrow,
    removeTaskFromTomorrow,
    isTaskInTomorrow,
    addTaskToToday,
    removeTaskFromToday,
    isTaskInToday,
    todayFilledCount,
    uncompletedTasks,
    retroCompletedTasks,
    olderCompletedTasks,
    updateDefaultTaskLabelMode,
    updateDayTaskLabelMode,
    getEffectiveLabelMode,
    updateNotifications,
    updateReminderTime,
    updateTaskTitle,
    updateBadgeMode,
    updateDailyReminderEnabled,
    updateDailyReminderTime,
    dailyReminderHours,
    loadExampleData,
    updateTheme,
    updateHomeLayout,
    memoryTasks,
    memoryCompletions,
    addMemoryTask,
    deleteMemoryTask,
    toggleMemoryTaskCompletion,
    pushMemoryTaskToTomorrow,
    moveTodayTaskToMemory,
    moveTomorrowTaskToMemory,
    tomorrowTaskOrigins,
    getTomorrowTaskOrigin,
    todayTaskOrigins,
    getTodayTaskOrigin,
    clearHistory,
  ]);
});
