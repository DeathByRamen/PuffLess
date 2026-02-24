import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { DEVICE_TYPES, QUIT_METHODS } from '../constants/data';
import { VapeDeviceType, QuitMethod } from '../models/types';
import { saveProfile, savePlan, setOnboarded } from '../services/storage';
import { buildPlan } from '../services/planGenerator';
import Slider from '../components/Slider';

const { width } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Disposable': 'flame-outline',
  'Pod System': 'phone-portrait-outline',
  'Mod/Tank': 'build-outline',
  'Other': 'help-circle-outline',
};

const METHOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gradual Reduction': 'trending-down-outline',
  'Trigger Tracking': 'bulb-outline',
  'Cold Turkey': 'hand-left-outline',
  'NRT Tracking': 'medkit-outline',
  'Gamification': 'trophy-outline',
};

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [deviceType, setDeviceType] = useState<VapeDeviceType>('Pod System');
  const [puffsPerDay, setPuffsPerDay] = useState(200);
  const [nicotineLevel, setNicotineLevel] = useState(50);
  const [costPerPod, setCostPerPod] = useState(15);
  const [puffsPerPod, setPuffsPerPod] = useState(200);
  const [selectedMethods, setSelectedMethods] = useState<Set<QuitMethod>>(new Set(['Gradual Reduction']));
  const [targetDays, setTargetDays] = useState(60);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 120);
  };

  const toggleMethod = (method: QuitMethod) => {
    const next = new Set(selectedMethods);
    if (next.has(method)) {
      if (next.size > 1) next.delete(method);
    } else {
      next.add(method);
    }
    setSelectedMethods(next);
  };

  const handleComplete = async () => {
    const targetDate = new Date(Date.now() + targetDays * 86400000).toISOString();
    const methods = Array.from(selectedMethods);
    await saveProfile({
      deviceType, startingNicotineLevel: nicotineLevel, startingPuffsPerDay: puffsPerDay,
      selectedMethods: methods, targetQuitDate: targetDate, createdAt: new Date().toISOString(),
      notificationPreference: 'Just the essentials', quietHoursStart: 22, quietHoursEnd: 8,
      costPerPod, puffsPerPod,
    });
    await savePlan(buildPlan(methods, puffsPerDay, nicotineLevel, targetDate));
    await setOnboarded();
    onComplete();
  };

  const totalSteps = 5;

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={styles.centerContent}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={48} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>PuffLess</Text>
          <Text style={styles.heroSubtitle}>Your personal guide to quitting vaping.{'\n'}At your pace, on your terms.</Text>
        </View>
      );

      case 1: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>What do you vape?</Text>
          <Text style={styles.stepSubtitle}>This helps us tailor your plan</Text>
          <View style={styles.grid}>
            {DEVICE_TYPES.map(({ type }) => (
              <TouchableOpacity key={type} style={[styles.deviceCard, deviceType === type && styles.deviceCardActive]} onPress={() => setDeviceType(type)}>
                <View style={[styles.deviceIconWrap, deviceType === type && styles.deviceIconWrapActive]}>
                  <Ionicons name={ICONS[type]} size={28} color={deviceType === type ? Colors.white : Colors.textMuted} />
                </View>
                <Text style={[styles.deviceLabel, deviceType === type && styles.deviceLabelActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

      case 2: return (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.stepTitle}>Your current usage</Text>
          <Text style={styles.stepSubtitle}>Be honest — this is just a starting point</Text>
          <View style={styles.sliderCard}>
            <Slider label={`Puffs per day`} displayValue={`${puffsPerDay}`} value={puffsPerDay} min={10} max={500} step={5} onChange={setPuffsPerDay} />
          </View>
          <View style={styles.sliderCard}>
            <Slider label="Nicotine strength" displayValue={`${nicotineLevel}mg`} value={nicotineLevel} min={0} max={60} step={5} onChange={setNicotineLevel} />
          </View>
          <View style={styles.sliderCard}>
            <Slider label="Cost per pod" displayValue={`$${costPerPod.toFixed(2)}`} value={costPerPod} min={5} max={50} step={0.5} onChange={setCostPerPod} />
          </View>
          <View style={styles.sliderCard}>
            <Slider label="Puffs per pod" displayValue={`${puffsPerPod}`} value={puffsPerPod} min={50} max={800} step={10} onChange={setPuffsPerPod} />
          </View>
        </ScrollView>
      );

      case 3: return (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.stepTitle}>Pick your methods</Text>
          <Text style={styles.stepSubtitle}>Choose one or more. You can change these later.</Text>
          {QUIT_METHODS.map(({ method, description }) => {
            const active = selectedMethods.has(method);
            return (
              <TouchableOpacity key={method} style={[styles.methodCard, active && styles.methodCardActive]} onPress={() => toggleMethod(method)}>
                <View style={[styles.methodIconWrap, active && styles.methodIconWrapActive]}>
                  <Ionicons name={METHOD_ICONS[method]} size={22} color={active ? Colors.white : Colors.textMuted} />
                </View>
                <View style={styles.methodTextWrap}>
                  <Text style={[styles.methodTitle, active && { color: Colors.teal }]}>{method}</Text>
                  <Text style={styles.methodDesc}>{description}</Text>
                </View>
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? Colors.teal : Colors.border} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );

      case 4: return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Set your target</Text>
          <Text style={styles.stepSubtitle}>When do you want to be nicotine-free?</Text>
          <View style={styles.targetCenter}>
            <Text style={styles.targetNumber}>{targetDays}</Text>
            <Text style={styles.targetLabel}>days</Text>
          </View>
          <View style={styles.sliderCard}>
            <Slider label="" displayValue="" value={targetDays} min={14} max={180} step={7} onChange={setTargetDays} />
            <View style={styles.sliderRange}>
              <Text style={styles.rangeText}>2 weeks</Text>
              <Text style={styles.rangeText}>6 months</Text>
            </View>
          </View>
          <View style={styles.targetDateCard}>
            <Ionicons name="flag" size={18} color={Colors.teal} />
            <Text style={styles.targetDateText}>
              Target: {new Date(Date.now() + targetDays * 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
      );

      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive, i === step && styles.dotCurrent]} />
        ))}
      </View>

      <Animated.View style={[styles.stepWrapper, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => animateStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => step < totalSteps - 1 ? animateStep(step + 1) : handleComplete()}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>{step === totalSteps - 1 ? 'Start My Plan' : 'Continue'}</Text>
          {step < totalSteps - 1 && <Ionicons name="chevron-forward" size={18} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.tealLight },
  dotCurrent: { backgroundColor: Colors.teal, width: 24 },
  stepWrapper: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  heroIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.tealMuted,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  heroTitle: { ...Type.h1, fontSize: 40, color: Colors.text, marginBottom: Spacing.md },
  heroSubtitle: { ...Type.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, fontSize: 17 },
  stepContent: { flex: 1, paddingHorizontal: Spacing.xl },
  stepTitle: { ...Type.h2, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  stepSubtitle: { ...Type.bodySm, marginBottom: Spacing['2xl'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  deviceCard: {
    width: (width - Spacing.xl * 2 - Spacing.md) / 2,
    paddingVertical: Spacing['2xl'], alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 2, borderColor: Colors.border, ...Shadows.sm,
  },
  deviceCardActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  deviceIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deviceIconWrapActive: { backgroundColor: Colors.teal },
  deviceLabel: { ...Type.label, color: Colors.textSecondary },
  deviceLabelActive: { color: Colors.teal },
  sliderCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  methodCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, marginBottom: Spacing.md,
    borderWidth: 2, borderColor: Colors.border, ...Shadows.sm,
  },
  methodCardActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  methodIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  methodIconWrapActive: { backgroundColor: Colors.teal },
  methodTextWrap: { flex: 1, marginRight: Spacing.sm },
  methodTitle: { ...Type.label },
  methodDesc: { ...Type.caption, marginTop: 2 },
  targetCenter: { alignItems: 'center', marginVertical: Spacing['3xl'] },
  targetNumber: { ...Type.numberLg, color: Colors.teal },
  targetLabel: { ...Type.body, color: Colors.textSecondary, fontSize: 18 },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  rangeText: { ...Type.caption },
  targetDateCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xl,
    padding: Spacing.md, backgroundColor: Colors.tealMuted, borderRadius: Radius.md,
  },
  targetDateText: { ...Type.bodyMedium, color: Colors.teal },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...Type.bodyMedium, color: Colors.textSecondary },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.teal, paddingVertical: 14,
    paddingHorizontal: Spacing['2xl'], borderRadius: Radius.lg,
    ...Shadows.md,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
