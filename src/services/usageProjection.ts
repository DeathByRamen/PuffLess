import { DailyLog } from '../models/types';

/** Linear regression on (dayIndex, puffCount). Returns slope and intercept. */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 3) return { slope: 0, intercept: points[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** Project when puff count reaches 0 based on linear trend. Returns days from first point, or null if not decreasing. */
function projectDaysToZero(slope: number, intercept: number): number | null {
  if (slope >= 0) return null; // not decreasing
  const x = -intercept / slope;
  return x;
}

export interface ProjectionResult {
  projectedDate: string; // ISO date
  daysFromNow: number;
  daysSoonerOrLater: number; // positive = sooner, negative = later
  slope: number; // puffs per day change
  windowDays: number;
  sampleSize: number;
  canProject: boolean;
}

const WINDOWS = [21, 14, 7] as const;
const MIN_POINTS = 5;

/**
 * Projects when the user will reach 0 puffs based on usage trend.
 * Uses the longest rolling window with enough data (min 5 points).
 */
export function projectQuitDate(logs: DailyLog[], targetQuitDate: string): ProjectionResult | null {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < MIN_POINTS) return null;

  const targetDate = new Date(targetQuitDate);

  for (const window of WINDOWS) {
    const windowed = sorted.slice(-window);
    if (windowed.length < MIN_POINTS) continue;

    const firstDate = new Date(windowed[0].date);
    const points = windowed.map((log, i) => ({
      x: i,
      y: log.puffCount,
    }));

    const { slope, intercept } = linearRegression(points);
    const daysToZero = projectDaysToZero(slope, intercept);
    if (daysToZero === null) continue;

    // Projected date = first point date + daysToZero
    const projectedDate = new Date(firstDate);
    projectedDate.setDate(projectedDate.getDate() + Math.round(daysToZero));
    const projectedStr = projectedDate.toISOString().split('T')[0];

    const daysFromNow = Math.round((projectedDate.getTime() - Date.now()) / 86400000);
    const daysSoonerOrLater = Math.round((targetDate.getTime() - projectedDate.getTime()) / 86400000);

    return {
      projectedDate: projectedStr,
      daysFromNow,
      daysSoonerOrLater,
      slope,
      windowDays: window,
      sampleSize: windowed.length,
      canProject: true,
    };
  }
  return null;
}
