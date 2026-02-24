import { QuitMethod, QuitPlan } from '../models/types';

export function generateWeeklyTargets(startingPuffs: number, weeks: number): number[] {
  if (weeks <= 0 || startingPuffs <= 0) return [0];

  const targets: number[] = [];
  for (let week = 0; week < weeks; week++) {
    const progress = week / weeks;
    const factor = 1.0 - Math.pow(progress, 0.7);
    targets.push(Math.max(0, Math.round(startingPuffs * factor)));
  }
  targets.push(0);
  return targets;
}

export function generateNicotineStepDown(startingMg: number, weeks: number): number[] {
  const standardLevels = [50, 35, 20, 10, 5, 3, 0];
  let relevant = standardLevels.filter((l) => l <= startingMg);
  if (!standardLevels.includes(startingMg)) relevant = [startingMg, ...relevant];
  relevant.sort((a, b) => b - a);

  if (weeks <= 0 || relevant.length <= 1) return [0];

  const weeksPerStep = Math.max(1, Math.floor(weeks / relevant.length));
  const schedule: number[] = [];

  for (const level of relevant) {
    for (let i = 0; i < weeksPerStep; i++) {
      schedule.push(level);
      if (schedule.length >= weeks) break;
    }
    if (schedule.length >= weeks) break;
  }

  while (schedule.length < weeks + 1) schedule.push(0);
  return schedule.slice(0, weeks + 1);
}

export function buildPlan(
  methods: QuitMethod[],
  startingPuffs: number,
  startingNicotine: number,
  targetDate: string,
): QuitPlan {
  const now = new Date();
  const target = new Date(targetDate);
  const days = Math.max(1, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, Math.floor(days / 7));

  return {
    activeMethods: methods,
    startDate: now.toISOString(),
    targetEndDate: targetDate,
    weeklyTargets: generateWeeklyTargets(startingPuffs, weeks),
    nicotineStepDown: generateNicotineStepDown(startingNicotine, weeks),
  };
}

export function getCurrentWeek(plan: QuitPlan): number {
  const days = Math.round((Date.now() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.max(1, plan.weeklyTargets.length - 1);
  return Math.min(Math.max(0, Math.floor(days / 7)), totalWeeks - 1);
}

export function getTodaysGoal(plan: QuitPlan): number {
  if (plan.weeklyTargets.length === 0) return 0;
  const week = getCurrentWeek(plan);
  return plan.weeklyTargets[Math.min(week, plan.weeklyTargets.length - 1)];
}

export function getPlanProgress(plan: QuitPlan): number {
  const totalWeeks = Math.max(1, plan.weeklyTargets.length - 1);
  return Math.min(1, getCurrentWeek(plan) / totalWeeks);
}

export function getDaysRemaining(plan: QuitPlan): number {
  const days = Math.round((new Date(plan.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function moneySaved(puffsAvoided: number, costPerPuff: number): number {
  return puffsAvoided * costPerPuff;
}
