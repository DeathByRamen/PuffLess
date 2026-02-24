export type VapeDeviceType = 'Disposable' | 'Pod System' | 'Mod/Tank' | 'Other';

export type QuitMethod = 'Gradual Reduction' | 'Trigger Tracking' | 'Cold Turkey' | 'NRT Tracking' | 'Gamification';

export type NotificationPreference = 'Encourage me often' | 'Just the essentials' | 'Only milestones';

export type CravingTrigger = 'Stress' | 'Boredom' | 'Social' | 'Habit' | 'After Meal' | 'Anxiety' | 'Celebration' | 'Other';

export type CravingAction = 'Vaped' | 'Resisted' | 'Used NRT' | 'Breathing Exercise' | 'Other';

export type NRTType = 'Patch' | 'Gum' | 'Lozenge' | 'Other';

export type MilestoneType = 'Health' | 'Financial' | 'Streak';

export interface UserProfile {
  deviceType: VapeDeviceType;
  startingNicotineLevel: number;
  startingPuffsPerDay: number;
  selectedMethods: QuitMethod[];
  targetQuitDate: string; // ISO date
  createdAt: string;
  notificationPreference: NotificationPreference;
  quietHoursStart: number;
  quietHoursEnd: number;
  costPerPod: number;
  puffsPerPod: number;
}

export interface DailyLog {
  date: string; // ISO date (start of day)
  puffCount: number;
  nicotineStrength: number;
  dailyGoal: number;
  goalMet: boolean;
  mood: number;
  notes: string;
}

export interface Craving {
  id: string;
  timestamp: string;
  intensity: number;
  trigger: CravingTrigger;
  action: CravingAction;
  durationMinutes?: number;
  notes: string;
}

export interface NRTEntry {
  id: string;
  date: string;
  type: NRTType;
  dosageMg: number;
  notes: string;
}

export interface QuitPlan {
  activeMethods: QuitMethod[];
  startDate: string;
  targetEndDate: string;
  weeklyTargets: number[];
  nicotineStepDown: number[];
}

export interface Milestone {
  type: MilestoneType;
  title: string;
  description: string;
  dateUnlocked?: string;
  notified: boolean;
}
