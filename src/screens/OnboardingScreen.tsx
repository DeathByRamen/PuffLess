import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Platform, TextInput } from 'react-native';
import DateTimePicker from '../components/DateTimePickerWrapper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { QUIT_METHODS, DEVICE_COST_LABELS, DEVICE_PUFF_LABELS, DEVICE_COST_RANGES, DEVICE_PUFF_RANGES } from '../constants/data';
import { VapeDeviceType, QuitMethod } from '../models/types';
import { saveProfile, savePlan, setOnboarded } from '../services/storage';
import { buildPlan } from '../services/planGenerator';
import Slider from '../components/Slider';

const { width } = Dimensions.get('window');

interface Props { onComplete: () => void; }

const DEVICE_DATA: { type: VapeDeviceType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'Disposable', icon: 'flame-outline' },
  { type: 'Pod System', icon: 'phone-portrait-outline' },
  { type: 'Mod/Tank', icon: 'build-outline' },
  { type: 'Other', icon: 'help-circle-outline' },
];

const METHOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gradual Reduction': 'trending-down-outline', 'Trigger Tracking': 'bulb-outline',
  'Cold Turkey': 'hand-left-outline', 'NRT Tracking': 'medkit-outline',
};

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [deviceType, setDeviceType] = useState<VapeDeviceType>('Pod System');
  const [puffsPerDay, setPuffsPerDay] = useState(200);
  const [nicotineLevel, setNicotineLevel] = useState(50);
  const [costPerPod, setCostPerPod] = useState(DEVICE_COST_RANGES['Pod System'].default);
  const [puffsPerPod, setPuffsPerPod] = useState(DEVICE_PUFF_RANGES['Pod System'].default);
  const [selectedMethods, setSelectedMethods] = useState<Set<QuitMethod>>(new Set(['Gradual Reduction']));
  const defaultTarget = new Date();
  defaultTarget.setDate(defaultTarget.getDate() + 60);
  const [targetDate, setTargetDate] = useState<Date>(defaultTarget);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInputText, setDateInputText] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const costRange = DEVICE_COST_RANGES[deviceType];
    const puffRange = DEVICE_PUFF_RANGES[deviceType];
    if (deviceType === 'Disposable') {
      setCostPerPod(costRange.default);
      setPuffsPerPod(puffRange.default);
      setNicotineLevel(5);
    } else {
      setCostPerPod((c) => (c >= costRange.min && c <= costRange.max ? c : costRange.default));
      setPuffsPerPod((p) => (p >= puffRange.min && p <= puffRange.max ? p : puffRange.default));
      setNicotineLevel(50);
    }
  }, [deviceType]);

  const animateStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 100);
  };

  const toggleMethod = (m: QuitMethod) => {
    const next = new Set(selectedMethods);
    if (next.has(m)) { if (next.size > 1) next.delete(m); } else { next.add(m); }
    setSelectedMethods(next);
  };

  const handleComplete = async () => {
    const targetIso = targetDate.toISOString();
    const methods = Array.from(selectedMethods);
    await saveProfile({ deviceType, startingNicotineLevel: nicotineLevel, startingPuffsPerDay: puffsPerDay, selectedMethods: methods, targetQuitDate: targetIso, createdAt: new Date().toISOString(), notificationPreference: 'Just the essentials', quietHoursStart: 22, quietHoursEnd: 8, costPerPod, puffsPerPod });
    await savePlan(buildPlan(methods, puffsPerDay, nicotineLevel, targetIso));
    await setOnboarded();
    onComplete();
  };

  const parseDateInput = (text: string): Date | null => {
    const mdy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
      const d = new Date(parseInt(mdy[3], 10), parseInt(mdy[1], 10) - 1, parseInt(mdy[2], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const applyDateInput = () => {
    const d = parseDateInput(dateInputText.trim());
    if (d && d > new Date()) {
      setTargetDate(d);
      setDateInputText('');
    }
  };

  const totalSteps = 5;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={s.centerContent}>
          <View style={s.heroGlow}>
            <Ionicons name="leaf" size={52} color={Colors.mint} />
          </View>
          <Text style={s.heroTitle}>PuffLess</Text>
          <Text style={s.heroSub}>Your personal guide to quitting vaping.{'\n'}At your pace, on your terms.</Text>
        </View>
      );
      case 1: return (
        <View style={s.stepContent}>
          <Text style={s.stepTitle}>What do you vape?</Text>
          <Text style={s.stepSub}>This helps us tailor your plan</Text>
          <View style={s.grid}>
            {DEVICE_DATA.map(({ type, icon }) => {
              const active = deviceType === type;
              return (
                <TouchableOpacity key={type} style={[s.deviceCard, active && s.deviceCardActive]} onPress={() => setDeviceType(type)} activeOpacity={0.8}>
                  <View style={[s.iconCircle, active && s.iconCircleActive]}>
                    <Ionicons name={icon} size={26} color={active ? Colors.textInverse : Colors.textMuted} />
                  </View>
                  <Text style={[s.deviceLabel, active && { color: Colors.mint }]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
      case 2: {
        const costRange = DEVICE_COST_RANGES[deviceType];
        const puffRange = DEVICE_PUFF_RANGES[deviceType];
        const costStep = deviceType === 'Disposable' ? 1 : 0.5;
        const puffStep = deviceType === 'Disposable' ? 500 : deviceType === 'Mod/Tank' ? 100 : 10;
        return (
          <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={s.stepTitle}>Your current usage</Text>
            <Text style={s.stepSub}>Be honest — this is just a starting point</Text>
            <View style={s.inputCard}><Slider label="Puffs per day" displayValue={`${puffsPerDay}`} value={puffsPerDay} min={10} max={500} step={5} onChange={setPuffsPerDay} /></View>
            <View style={s.inputCard}><Slider label="Nicotine strength" displayValue={`${nicotineLevel}mg`} value={nicotineLevel} min={0} max={60} step={5} onChange={setNicotineLevel} /></View>
            <View style={s.inputCard}><Slider label={DEVICE_COST_LABELS[deviceType]} displayValue={`$${costPerPod.toFixed(deviceType === 'Disposable' ? 0 : 2)}`} value={costPerPod} min={costRange.min} max={costRange.max} step={costStep} onChange={setCostPerPod} /></View>
            <View style={s.inputCard}><Slider label={DEVICE_PUFF_LABELS[deviceType]} displayValue={`${puffsPerPod}`} value={puffsPerPod} min={puffRange.min} max={puffRange.max} step={puffStep} onChange={setPuffsPerPod} /></View>
          </ScrollView>
        );
      }
      case 3: return (
        <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.stepTitle}>Pick your methods</Text>
          <Text style={s.stepSub}>Choose one or more. You can change these later.</Text>
          {QUIT_METHODS.map(({ method, description }) => {
            const active = selectedMethods.has(method);
            return (
              <TouchableOpacity key={method} style={[s.methodCard, active && s.methodCardActive]} onPress={() => toggleMethod(method)} activeOpacity={0.8}>
                <View style={[s.iconCircle, active && s.iconCircleActive]}>
                  <Ionicons name={METHOD_ICONS[method]} size={20} color={active ? Colors.textInverse : Colors.textMuted} />
                </View>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[s.methodTitle, active && { color: Colors.mint }]}>{method}</Text>
                  <Text style={s.methodDesc}>{description}</Text>
                </View>
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? Colors.mint : Colors.border} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
      case 4: {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);
        const targetDays = Math.round((targetDate.getTime() - Date.now()) / 86400000);
        return (
          <ScrollView style={s.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={s.stepTitle}>Set your target</Text>
            <Text style={s.stepSub}>When do you want to be nicotine-free?</Text>
            <TouchableOpacity style={[s.inputCard, s.datePickerBtn]} onPress={() => Platform.OS !== 'web' && setShowDatePicker(true)} activeOpacity={0.8} disabled={Platform.OS === 'web'}>
              <Ionicons name="calendar" size={24} color={Colors.mint} />
              <View style={{ flex: 1 }}>
                <Text style={s.datePickerLabel}>{Platform.OS === 'web' ? 'Target date' : 'Pick a date'}</Text>
                <Text style={s.datePickerValue}>{targetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              {Platform.OS !== 'web' && <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />}
            </TouchableOpacity>
            {Platform.OS !== 'web' && showDatePicker && (
              <DateTimePicker
                value={targetDate}
                mode="date"
                minimumDate={minDate}
                maximumDate={new Date(Date.now() + 365 * 86400000)}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (d) setTargetDate(d);
                  if (Platform.OS === 'android') setShowDatePicker(false);
                }}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity style={s.datePickerDone} onPress={() => setShowDatePicker(false)}>
                <Text style={s.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            <View style={s.inputCard}>
              <Text style={s.dateInputLabel}>Or enter date (MM/DD/YYYY)</Text>
              <View style={s.dateInputRow}>
                <TextInput
                  style={s.dateInput}
                  value={dateInputText}
                  onChangeText={setDateInputText}
                  placeholder="e.g. 06/15/2025"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity style={[s.dateInputBtn, Shadows.sm]} onPress={applyDateInput} activeOpacity={0.85}>
                  <Text style={s.dateInputBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.datePill}>
              <Ionicons name="flag" size={16} color={Colors.mint} />
              <Text style={s.dateText}>{targetDays} days • {targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </View>
          </ScrollView>
        );
      }
      default: return null;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[s.dot, i <= step && s.dotFilled, i === step && s.dotCurrent]} />
        ))}
      </View>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>{renderStep()}</Animated.View>
      <View style={s.nav}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => animateStep(step - 1)} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity style={[s.nextBtn, Shadows.glow]} onPress={() => step < totalSteps - 1 ? animateStep(step + 1) : handleComplete()} activeOpacity={0.85}>
          <Text style={s.nextText}>{step === totalSteps - 1 ? 'Start My Plan' : 'Continue'}</Text>
          {step < totalSteps - 1 && <Ionicons name="chevron-forward" size={18} color={Colors.textInverse} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotFilled: { backgroundColor: Colors.mintMuted },
  dotCurrent: { backgroundColor: Colors.mint, width: 28 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  heroGlow: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.mintMuted, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing['3xl'], ...Shadows.glow },
  heroTitle: { fontSize: 42, fontWeight: '800', color: Colors.text, letterSpacing: -1, marginBottom: Spacing.md },
  heroSub: { fontSize: 17, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  stepContent: { flex: 1, paddingHorizontal: Spacing.xl },
  stepTitle: { ...Type.h2, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  stepSub: { ...Type.bodySm, marginBottom: Spacing['2xl'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  deviceCard: { width: (width - Spacing.xl * 2 - Spacing.md) / 2, paddingVertical: Spacing['2xl'], alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border },
  deviceCardActive: { borderColor: Colors.mint, backgroundColor: Colors.mintSubtle },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  iconCircleActive: { backgroundColor: Colors.mint },
  deviceLabel: { ...Type.label, color: Colors.textSecondary },
  inputCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border },
  methodCardActive: { borderColor: Colors.mint, backgroundColor: Colors.mintSubtle },
  methodTitle: { ...Type.label },
  methodDesc: { ...Type.caption, marginTop: 2 },
  targetCenter: { alignItems: 'center', marginVertical: Spacing['3xl'] },
  targetNum: { fontSize: 72, fontWeight: '800', color: Colors.mint, letterSpacing: -2 },
  targetUnit: { fontSize: 18, color: Colors.textSecondary },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { ...Type.caption },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  datePickerLabel: { ...Type.caption, color: Colors.textMuted },
  datePickerValue: { ...Type.bodyMedium, fontWeight: '700', marginTop: 2 },
  datePickerDone: { marginTop: Spacing.sm, paddingVertical: Spacing.sm },
  datePickerDoneText: { ...Type.bodyMedium, color: Colors.mint, fontWeight: '600' },
  dateInputLabel: { ...Type.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  dateInputRow: { flexDirection: 'row', gap: Spacing.sm },
  dateInput: { flex: 1, backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, ...Type.bodyMedium },
  dateInputBtn: { backgroundColor: Colors.mint, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, justifyContent: 'center' },
  dateInputBtnText: { ...Type.bodyMedium, fontWeight: '700', color: Colors.textInverse },
  datePill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl, padding: Spacing.md, backgroundColor: Colors.mintMuted, borderRadius: Radius.full },
  dateText: { ...Type.bodyMedium, color: Colors.mint },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...Type.bodyMedium, color: Colors.textMuted },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.mint, paddingVertical: 14, paddingHorizontal: Spacing['2xl'], borderRadius: Radius.lg },
  nextText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
