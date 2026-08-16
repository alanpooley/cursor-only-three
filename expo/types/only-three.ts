export type TaskSize = "big" | "medium" | "small";
export type TaskOrigin = "uncompleted" | "memory";
export type TaskLabelMode = "sized" | "numbered";

export interface DailyTask {
  id: string;
  title: string;
  type: TaskSize;
  isCompleted: boolean;
  completedAt?: string;
}

export interface DayPlan {
  id: string;
  date: string;
  tasks: DailyTask[];
  taskLabelMode?: TaskLabelMode;
  createdAt: string;
  updatedAt: string;
}

export interface StreakState {
  current: number;
  best: number;
  lastCompletedDate: string | null;
}

export type ThemeMode = "night" | "dark" | "light" | "obsidian";
export type HomeLayoutMode = "tabs" | "sidebar";
export type BadgeMode = "count" | "dot" | "none";

export type DailyReminderTime = "early" | "midmorning" | "midday";

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  theme: ThemeMode;
  homeLayout: HomeLayoutMode;
  defaultTaskLabelMode: TaskLabelMode;
  badgeMode: BadgeMode;
  dailyReminderEnabled: boolean;
  dailyReminderTime: DailyReminderTime;
}

export interface RetroCompletion {
  id: string;
  taskTitle: string;
  taskType: TaskSize;
  originalDate: string;
  completedAt: string;
}

export interface MemoryTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface MemoryCompletion {
  id: string;
  taskTitle: string;
  completedAt: string;
}

export interface AppState {
  dayPlans: DayPlan[];
  settings: AppSettings;
  retroCompletions?: RetroCompletion[];
  memoryTasks?: MemoryTask[];
  memoryCompletions?: MemoryCompletion[];
  tomorrowTaskOrigins?: Partial<Record<TaskSize, TaskOrigin>>;
  todayTaskOrigins?: Partial<Record<TaskSize, TaskOrigin>>;
}
