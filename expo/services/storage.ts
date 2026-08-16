import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppSettings, AppState, BadgeMode, DailyReminderTime, DailyTask, DayPlan, RetroCompletion, TaskSize } from "@/types/only-three";
import { formatDateKey } from "@/utils/date";

const STORAGE_KEY = "only-three-state-v1";
const TUTORIAL_KEY = "only-three-tutorial-seen";
const MEMORY_TOOLTIP_KEY = "only-three-memory-tooltip-seen";

const orderedTaskTypes: TaskSize[] = ["big", "medium", "small"];

export function createDefaultTasks(): DailyTask[] {
  return orderedTaskTypes.map((type) => ({
    id: `${type}-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    type,
    isCompleted: false,
  }));
}

export function createEmptyDayPlan(date = new Date()): DayPlan {
  const timestamp = new Date().toISOString();
  return {
    id: `plan-${formatDateKey(date)}`,
    date: formatDateKey(date),
    tasks: createDefaultTasks(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const defaultSettings: AppSettings = {
  notificationsEnabled: false,
  reminderHour: 19,
  reminderMinute: 30,
  theme: "dark",
  homeLayout: "tabs",
  defaultTaskLabelMode: "sized",
  badgeMode: "none" as BadgeMode,
  dailyReminderEnabled: false,
  dailyReminderTime: "midmorning" as DailyReminderTime,
};

export function createSeedPlans(): DayPlan[] {
  const now = new Date();
  const plans: DayPlan[] = [];

  const seedDays: Array<{ daysAgo: number; tasks: Array<{ title: string; type: TaskSize; isCompleted: boolean }> }> = [
    {
      daysAgo: 1,
      tasks: [
        { title: "Finish quarterly report", type: "big", isCompleted: true },
        { title: "Reply to client emails", type: "medium", isCompleted: false },
        { title: "Order new headphones", type: "small", isCompleted: true },
      ],
    },
    {
      daysAgo: 2,
      tasks: [
        { title: "Prepare slide deck for Friday", type: "big", isCompleted: false },
        { title: "Schedule dentist appointment", type: "medium", isCompleted: true },
        { title: "Water the plants", type: "small", isCompleted: true },
      ],
    },
    {
      daysAgo: 3,
      tasks: [
        { title: "Deep clean the kitchen", type: "big", isCompleted: true },
        { title: "Read chapter 5 of design book", type: "medium", isCompleted: true },
        { title: "Take vitamins to work", type: "small", isCompleted: true },
      ],
    },
    {
      daysAgo: 5,
      tasks: [
        { title: "Submit project proposal", type: "big", isCompleted: true },
        { title: "Call the bank about fees", type: "medium", isCompleted: false },
        { title: "Pick up dry cleaning", type: "small", isCompleted: false },
      ],
    },
    {
      daysAgo: 7,
      tasks: [
        { title: "Plan weekend hiking trip", type: "big", isCompleted: true },
        { title: "Fix leaking faucet", type: "medium", isCompleted: true },
        { title: "Send birthday card to Mom", type: "small", isCompleted: true },
      ],
    },
  ];

  for (const seed of seedDays) {
    const d = new Date(now);
    d.setDate(d.getDate() - seed.daysAgo);
    const dateKey = formatDateKey(d);
    const ts = d.toISOString();

    plans.push({
      id: `plan-${dateKey}`,
      date: dateKey,
      tasks: seed.tasks.map((t) => ({
        id: `${t.type}-${dateKey}-${Math.random().toString(36).slice(2, 8)}`,
        title: t.title,
        type: t.type,
        isCompleted: t.isCompleted,
        completedAt: t.isCompleted ? ts : undefined,
      })),
      createdAt: ts,
      updatedAt: ts,
    });
  }

  return plans;
}

export function createSeedRetroCompletions(): RetroCompletion[] {
  const now = new Date();

  const todayDate = new Date(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const threeDaysAgoDate = new Date(now);
  threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3);

  const fiveDaysAgoKey = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5));
  const twoDaysAgoKey = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2));
  const march28Date = new Date(2026, 2, 28);

  const sevenDaysAgoKey = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));

  return [
    {
      id: `retro-seed-1`,
      taskTitle: "Reply to client emails",
      taskType: "medium" as TaskSize,
      originalDate: formatDateKey(yesterdayDate),
      completedAt: todayDate.toISOString(),
    },
    {
      id: `retro-seed-2`,
      taskTitle: "Call the bank about fees",
      taskType: "medium" as TaskSize,
      originalDate: fiveDaysAgoKey,
      completedAt: threeDaysAgoDate.toISOString(),
    },
    {
      id: `retro-seed-3`,
      taskTitle: "Pick up dry cleaning",
      taskType: "small" as TaskSize,
      originalDate: fiveDaysAgoKey,
      completedAt: yesterdayDate.toISOString(),
    },
    {
      id: `retro-seed-4`,
      taskTitle: "Prepare slide deck for Friday",
      taskType: "big" as TaskSize,
      originalDate: twoDaysAgoKey,
      completedAt: yesterdayDate.toISOString(),
    },
    {
      id: `retro-seed-5`,
      taskTitle: "Book flight for conference",
      taskType: "medium" as TaskSize,
      originalDate: sevenDaysAgoKey,
      completedAt: march28Date.toISOString(),
    },
  ];
}

function createFirstTimeTodayPlan(): DayPlan {
  const plan = createEmptyDayPlan();
  plan.tasks = plan.tasks.map((task) => {
    if (task.type === "big") {
      return { ...task, title: "Download Only Three!" };
    }
    if (task.type === "medium") {
      return { ...task, title: "Open the app!" };
    }
    if (task.type === "small") {
      return { ...task, title: "Complete your first task!" };
    }
    return task;
  });
  return plan;
}

function createFirstTimeMemoryTasks(): import('@/types/only-three').MemoryTask[] {
  return [
    {
      id: `mem-seed-${Math.random().toString(36).slice(2, 8)}`,
      title: "Example task: Go outside",
      isCompleted: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

export const defaultAppState: AppState = {
  dayPlans: [createFirstTimeTodayPlan()],
  settings: defaultSettings,
  retroCompletions: [],
  memoryTasks: createFirstTimeMemoryTasks(),
  memoryCompletions: [],
};

export async function loadAppState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultAppState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;

    const plans = Array.isArray(parsed.dayPlans) && parsed.dayPlans.length > 0 ? parsed.dayPlans : defaultAppState.dayPlans;

    const retroCompletions = Array.isArray((parsed as Record<string, unknown>).retroCompletions)
      ? (parsed as AppState).retroCompletions ?? []
      : [];

    const memoryTasks = Array.isArray((parsed as Record<string, unknown>).memoryTasks)
      ? (parsed as AppState).memoryTasks ?? []
      : [];

    const memoryCompletions = Array.isArray((parsed as Record<string, unknown>).memoryCompletions)
      ? (parsed as AppState).memoryCompletions ?? []
      : [];

    return {
      dayPlans: plans,
      retroCompletions,
      memoryTasks,
      memoryCompletions,
      settings: {
        notificationsEnabled: parsed.settings?.notificationsEnabled ?? defaultSettings.notificationsEnabled,
        reminderHour: parsed.settings?.reminderHour ?? defaultSettings.reminderHour,
        reminderMinute: parsed.settings?.reminderMinute ?? defaultSettings.reminderMinute,
        theme: (parsed.settings?.theme as AppSettings["theme"]) ?? defaultSettings.theme,
        homeLayout: (parsed.settings as Partial<AppSettings> | undefined)?.homeLayout ?? defaultSettings.homeLayout,
        defaultTaskLabelMode: (parsed.settings as Partial<AppSettings> | undefined)?.defaultTaskLabelMode ?? defaultSettings.defaultTaskLabelMode,
        badgeMode: (parsed.settings as Partial<AppSettings> | undefined)?.badgeMode ?? defaultSettings.badgeMode,
        dailyReminderEnabled: (parsed.settings as Partial<AppSettings> | undefined)?.dailyReminderEnabled ?? defaultSettings.dailyReminderEnabled,
        dailyReminderTime: (parsed.settings as Partial<AppSettings> | undefined)?.dailyReminderTime ?? defaultSettings.dailyReminderTime,
      },
    };
  } catch (error) {
    console.log("[storage] Failed to parse app state", error);
    return defaultAppState;
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadTutorialSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TUTORIAL_KEY);
  return value === "true";
}

export async function saveTutorialSeen(seen: boolean): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_KEY, seen ? "true" : "false");
}

export async function loadMemoryTooltipSeen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(MEMORY_TOOLTIP_KEY);
  return value === "true";
}

export async function saveMemoryTooltipSeen(seen: boolean): Promise<void> {
  await AsyncStorage.setItem(MEMORY_TOOLTIP_KEY, seen ? "true" : "false");
}

export async function clearAllAppData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(TUTORIAL_KEY);
  await AsyncStorage.removeItem(MEMORY_TOOLTIP_KEY);
  console.log("[storage] All app data cleared");
}
