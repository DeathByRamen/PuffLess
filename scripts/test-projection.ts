/**
 * Test script for the usage projection / linear regression.
 * Run with: npx tsx scripts/test-projection.ts
 *
 * Creates mock logs with known trends and verifies projectQuitDate output.
 */

import { projectQuitDate } from '../src/services/usageProjection';
import type { DailyLog } from '../src/models/types';

function makeLog(dateStr: string, puffCount: number): DailyLog {
  return {
    date: dateStr,
    puffCount,
    nicotineStrength: 0,
    dailyGoal: 0,
    goalMet: false,
    mood: 3,
    notes: '',
  };
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

console.log('=== Usage Projection Regression Tests ===\n');

// Test 1: Perfect linear decrease (100 -> 90 -> 80 -> 70 -> 60 -> 50)
// Slope = -10/day. From day 0 (100 puffs), we hit 0 at day index 10.
// So projected date = firstDate + 10 days
const decreasingLogs: DailyLog[] = [];
for (let i = 0; i < 7; i++) {
  decreasingLogs.push(makeLog(dateStr(6 - i), 100 - i * 10));
}
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 60);
const result1 = projectQuitDate(decreasingLogs, targetDate.toISOString());

console.log('Test 1: Linear decrease (100, 90, 80, 70, 60, 50, 40)');
console.log('  Expected: slope ≈ -10, projected ~10 days from first point');
console.log('  Result:', result1 ? {
  slope: result1.slope.toFixed(2),
  projectedDate: result1.projectedDate,
  daysFromNow: result1.daysFromNow,
  daysSoonerOrLater: result1.daysSoonerOrLater,
  windowDays: result1.windowDays,
} : 'null (no projection)');
console.log('  Slope check:', result1 && Math.abs(result1.slope - (-10)) < 1 ? '✓' : '✗');
console.log('');

// Test 2: Flat/increasing trend - should return null
const flatLogs: DailyLog[] = [];
for (let i = 0; i < 7; i++) {
  flatLogs.push(makeLog(dateStr(6 - i), 50));
}
const result2 = projectQuitDate(flatLogs, targetDate.toISOString());
console.log('Test 2: Flat trend (50, 50, 50...)');
console.log('  Expected: null (no decreasing trend)');
console.log('  Result:', result2 ? 'has projection (unexpected)' : 'null ✓');
console.log('');

// Test 3: Too few points - should return null
const fewLogs = [
  makeLog(dateStr(2), 80),
  makeLog(dateStr(1), 70),
  makeLog(dateStr(0), 60),
];
const result3 = projectQuitDate(fewLogs, targetDate.toISOString());
console.log('Test 3: Only 3 data points');
console.log('  Expected: null (min 5 points required)');
console.log('  Result:', result3 ? 'has projection (unexpected)' : 'null ✓');
console.log('');

// Test 4: Steep decrease - quitting soon
const steepLogs: DailyLog[] = [];
for (let i = 0; i < 7; i++) {
  steepLogs.push(makeLog(dateStr(6 - i), 50 - i * 7)); // 50, 43, 36, 29, 22, 15, 8
}
const result4 = projectQuitDate(steepLogs, targetDate.toISOString());
console.log('Test 4: Steep decrease (50→8 over 7 days)');
console.log('  Expected: projection within ~1 week');
console.log('  Result:', result4 ? {
  slope: result4.slope.toFixed(2),
  projectedDate: result4.projectedDate,
  daysFromNow: result4.daysFromNow,
} : 'null');
console.log('  Soon projection:', result4 && result4.daysFromNow < 14 ? '✓' : '✗');
console.log('');

console.log('=== Run complete ===');
