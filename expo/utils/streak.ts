import { DayPlan, StreakState } from "@/types/only-three";

function wasCompletedOnTime(plan: DayPlan): boolean {
  const availableTasks = plan.tasks.filter((task) => task.title.trim().length > 0);
  if (availableTasks.length === 0) return false;
  if (!availableTasks.every((task) => task.isCompleted)) return false;

  for (const task of availableTasks) {
    if (!task.completedAt) continue;
    const completedDate = task.completedAt.slice(0, 10);
    if (completedDate !== plan.date) {
      console.log("[streak] Task completed late", { taskTitle: task.title, planDate: plan.date, completedDate });
      return false;
    }
  }

  return true;
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(`${dateA}T12:00:00`);
  const b = new Date(`${dateB}T12:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function calculateStreakState(dayPlans: DayPlan[]): StreakState {
  const completedPlans = [...dayPlans]
    .filter(wasCompletedOnTime)
    .sort((left, right) => right.date.localeCompare(left.date));

  if (completedPlans.length === 0) {
    return {
      current: 0,
      best: 0,
      lastCompletedDate: null,
    };
  }

  const today = getLocalDateString();
  const mostRecentDate = completedPlans[0].date;
  const gapFromToday = daysBetween(today, mostRecentDate);

  let best = 0;
  let running = 0;
  let previousDate: string | null = null;

  for (let i = 0; i < completedPlans.length; i++) {
    const planDate = completedPlans[i].date;

    if (i === 0) {
      running = 1;
    } else {
      const diff = previousDate ? daysBetween(previousDate, planDate) : 999;
      if (diff === 1) {
        running += 1;
      } else {
        best = Math.max(best, running);
        running = 1;
      }
    }

    previousDate = planDate;
  }

  best = Math.max(best, running);

  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = 1; i < completedPlans.length; i++) {
      const diff = daysBetween(completedPlans[i - 1].date, completedPlans[i].date);
      if (diff === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  console.log("[streak] calculated", { today, mostRecentDate, gapFromToday, current, best });

  return {
    current,
    best,
    lastCompletedDate: mostRecentDate,
  };
}
