import { VapeDeviceType, QuitMethod, CravingTrigger, CravingAction, NRTType } from '../models/types';

export const DEVICE_TYPES: { type: VapeDeviceType; icon: string }[] = [
  { type: 'Disposable', icon: 'flame-outline' },
  { type: 'Pod System', icon: 'phone-portrait-outline' },
  { type: 'Mod/Tank', icon: 'build-outline' },
  { type: 'Other', icon: 'help-circle-outline' },
];

export const DEVICE_COST_LABELS: Record<VapeDeviceType, string> = {
  Disposable: 'Cost per disposable',
  'Pod System': 'Cost per pod',
  'Mod/Tank': 'Cost per bottle/refill',
  Other: 'Cost per refill',
};

export const DEVICE_PUFF_LABELS: Record<VapeDeviceType, string> = {
  Disposable: 'Puffs per disposable',
  'Pod System': 'Puffs per pod',
  'Mod/Tank': 'Puffs per bottle',
  Other: 'Puffs per refill',
};

export const DEVICE_COST_RANGES: Record<VapeDeviceType, { min: number; max: number; default: number }> = {
  Disposable: { min: 3, max: 35, default: 20 },
  'Pod System': { min: 5, max: 50, default: 15 },
  'Mod/Tank': { min: 10, max: 60, default: 25 },
  Other: { min: 5, max: 50, default: 15 },
};

export const DEVICE_PUFF_RANGES: Record<VapeDeviceType, { min: number; max: number; default: number }> = {
  Disposable: { min: 500, max: 30000, default: 10000 },
  'Pod System': { min: 50, max: 800, default: 200 },
  'Mod/Tank': { min: 500, max: 3000, default: 1200 },
  Other: { min: 100, max: 2000, default: 500 },
};

export const QUIT_METHODS: { method: QuitMethod; icon: string; description: string }[] = [
  { method: 'Gradual Reduction', icon: 'trending-down-outline', description: 'Slowly reduce your daily puffs and nicotine strength over weeks' },
  { method: 'Trigger Tracking', icon: 'bulb-outline', description: 'Identify your triggers and build healthier habits to replace vaping' },
  { method: 'Cold Turkey', icon: 'hand-left-outline', description: 'Pick a quit date and stop completely with withdrawal support' },
  { method: 'NRT Tracking', icon: 'medkit-outline', description: 'Track patches, gum, or lozenges alongside your vape reduction' },
];

export const CRAVING_TRIGGERS: { trigger: CravingTrigger; icon: string; suggestion: string }[] = [
  { trigger: 'Stress', icon: 'alert-circle-outline', suggestion: 'Try a 2-minute box breathing exercise' },
  { trigger: 'Boredom', icon: 'time-outline', suggestion: 'Take a short walk or stretch' },
  { trigger: 'Social', icon: 'people-outline', suggestion: 'Hold a drink or keep your hands busy' },
  { trigger: 'Habit', icon: 'repeat-outline', suggestion: 'Try a fidget toy or chew gum' },
  { trigger: 'After Meal', icon: 'restaurant-outline', suggestion: 'Brush your teeth or chew mint gum' },
  { trigger: 'Anxiety', icon: 'warning-outline', suggestion: 'Try the 5-4-3-2-1 grounding technique' },
  { trigger: 'Celebration', icon: 'sparkles-outline', suggestion: 'Celebrate with your favorite snack instead' },
  { trigger: 'Other', icon: 'chatbubble-outline', suggestion: 'Take 5 deep breaths and wait 2 minutes' },
];

export const CRAVING_ACTIONS: { action: CravingAction; icon: string }[] = [
  { action: 'Vaped', icon: 'cloud-outline' },
  { action: 'Resisted', icon: 'shield-checkmark-outline' },
  { action: 'Used NRT', icon: 'medkit-outline' },
  { action: 'Breathing Exercise', icon: 'leaf-outline' },
  { action: 'Other', icon: 'chatbubble-outline' },
];

export const NRT_TYPES: { type: NRTType; icon: string }[] = [
  { type: 'Patch', icon: 'bandage-outline' },
  { type: 'Gum', icon: 'ellipse-outline' },
  { type: 'Lozenge', icon: 'tablet-portrait-outline' },
  { type: 'Other', icon: 'flask-outline' },
];

export const HEALTH_MILESTONES = [
  { title: 'Heart Rate Drops', description: 'Your heart rate begins returning to normal', hours: 0 },
  { title: 'Nicotine Leaving', description: 'Nicotine starts clearing from your bloodstream', hours: 8 },
  { title: 'Taste Returns', description: 'Your sense of taste and smell start improving', hours: 48 },
  { title: 'Breathing Easier', description: 'Bronchial tubes begin to relax', hours: 72 },
  { title: 'Circulation Improves', description: 'Blood circulation noticeably improves', hours: 336 },
  { title: 'Lung Function Up', description: 'Lung function begins to improve significantly', hours: 720 },
  { title: 'Coughing Decreases', description: 'Coughing and shortness of breath decrease', hours: 2160 },
];

export const MOTIVATIONAL_MESSAGES = [
  "Every puff you skip is a win. They add up.",
  "You're rewiring your brain. It takes time, but you're doing it.",
  "Cravings last 3-5 minutes. You've survived harder things.",
  "You don't need to be perfect. You need to keep going.",
  "Tomorrow's version of you will be grateful for today's choices.",
  "Small steps still move you forward.",
  "Your lungs are already thanking you.",
  "Progress, not perfection.",
];
