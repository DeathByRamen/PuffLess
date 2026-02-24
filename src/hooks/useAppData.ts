import { useState, useEffect, useCallback } from 'react';
import { UserProfile, DailyLog, Craving, QuitPlan, NRTEntry } from '../models/types';
import * as Storage from '../services/storage';
import { getTodaysGoal } from '../services/planGenerator';

export function useAppData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<QuitPlan | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [cravings, setCravings] = useState<Craving[]>([]);
  const [nrtEntries, setNrtEntries] = useState<NRTEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [p, pl, l, c, n] = await Promise.all([
      Storage.getProfile(),
      Storage.getPlan(),
      Storage.getDailyLogs(),
      Storage.getCravings(),
      Storage.getNRTEntries(),
    ]);
    setProfile(p);
    setPlan(pl);
    setLogs(l);
    setCravings(c);
    setNrtEntries(n);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find((l) => l.date === todayStr) ?? null;
  const todayCravings = cravings.filter((c) => c.timestamp.startsWith(todayStr));
  const todaysGoal = plan ? getTodaysGoal(plan) : 0;

  const streak = (() => {
    let count = 0;
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (const log of sorted) {
      const logDate = log.date;
      const checkStr = checkDate.toISOString().split('T')[0];
      if (logDate === checkStr && log.goalMet) {
        count++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else if (logDate === checkStr) {
        break;
      }
    }
    return count;
  })();

  const totalPuffsAvoided = profile
    ? logs.reduce((sum, log) => sum + Math.max(0, profile.startingPuffsPerDay - log.puffCount), 0)
    : 0;

  const costPerPuff = profile && profile.puffsPerPod > 0 ? profile.costPerPod / profile.puffsPerPod : 0;

  return {
    profile, plan, logs, cravings, nrtEntries,
    todayLog, todayCravings, todaysGoal, streak,
    totalPuffsAvoided, costPerPuff,
    loading, reload,
  };
}
