import { VapeDeviceType, QuitMethod, CravingTrigger, CravingAction, NRTType } from '../models/types';

export const DEVICE_TYPES: { type: VapeDeviceType; icon: string }[] = [
  { type: 'Disposable', icon: '🔥' },
  { type: 'Pod System', icon: '📱' },
  { type: 'Mod/Tank', icon: '🔧' },
  { type: 'Other', icon: '❓' },
];

export const QUIT_METHODS: { method: QuitMethod; icon: string; description: string }[] = [
  { method: 'Gradual Reduction', icon: '📉', description: 'Slowly reduce your daily puffs and nicotine strength over weeks' },
  { method: 'Trigger Tracking', icon: '🧠', description: 'Identify your triggers and build healthier habits to replace vaping' },
  { method: 'Cold Turkey', icon: '✋', description: 'Pick a quit date and stop completely with withdrawal support' },
  { method: 'NRT Tracking', icon: '💊', description: 'Track patches, gum, or lozenges alongside your vape reduction' },
  { method: 'Gamification', icon: '🏆', description: 'Stay motivated with streaks, badges, and milestone rewards' },
];

export const CRAVING_TRIGGERS: { trigger: CravingTrigger; icon: string; suggestion: string }[] = [
  { trigger: 'Stress', icon: '😤', suggestion: 'Try a 2-minute box breathing exercise' },
  { trigger: 'Boredom', icon: '😴', suggestion: 'Take a short walk or stretch' },
  { trigger: 'Social', icon: '👥', suggestion: 'Hold a drink or keep your hands busy' },
  { trigger: 'Habit', icon: '🔁', suggestion: 'Try a fidget toy or chew gum' },
  { trigger: 'After Meal', icon: '🍽️', suggestion: 'Brush your teeth or chew mint gum' },
  { trigger: 'Anxiety', icon: '⚠️', suggestion: 'Try the 5-4-3-2-1 grounding technique' },
  { trigger: 'Celebration', icon: '🎉', suggestion: 'Celebrate with your favorite snack instead' },
  { trigger: 'Other', icon: '💭', suggestion: 'Take 5 deep breaths and wait 2 minutes' },
];

export const CRAVING_ACTIONS: { action: CravingAction; icon: string }[] = [
  { action: 'Vaped', icon: '💨' },
  { action: 'Resisted', icon: '🛡️' },
  { action: 'Used NRT', icon: '💊' },
  { action: 'Breathing Exercise', icon: '🌬️' },
  { action: 'Other', icon: '💭' },
];

export const NRT_TYPES: { type: NRTType; icon: string }[] = [
  { type: 'Patch', icon: '🩹' },
  { type: 'Gum', icon: '🫧' },
  { type: 'Lozenge', icon: '💊' },
  { type: 'Other', icon: '💉' },
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

export const MOOD_EMOJIS = ['😫', '😕', '😐', '🙂', '😁'];
