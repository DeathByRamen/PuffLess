import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { DEVICE_TYPES, QUIT_METHODS } from '../constants/data';
import { VapeDeviceType, QuitMethod } from '../models/types';
import { saveProfile, savePlan, setOnboarded } from '../services/storage';
import { buildPlan } from '../services/planGenerator';
import Slider from '../components/Slider';

const { width } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [deviceType, setDeviceType] = useState<VapeDeviceType>('Pod System');
  const [puffsPerDay, setPuffsPerDay] = useState(200);
  const [nicotineLevel, setNicotineLevel] = useState(50);
  const [costPerPod, setCostPerPod] = useState(15);
  const [puffsPerPod, setPuffsPerPod] = useState(200);
  const [selectedMethods, setSelectedMethods] = useState<Set<QuitMethod>>(new Set(['Gradual Reduction']));
  const [targetDays, setTargetDays] = useState(60);

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
      deviceType,
      startingNicotineLevel: nicotineLevel,
      startingPuffsPerDay: puffsPerDay,
      selectedMethods: methods,
      targetQuitDate: targetDate,
      createdAt: new Date().toISOString(),
      notificationPreference: 'Just the essentials',
      quietHoursStart: 22,
      quietHoursEnd: 8,
      costPerPod,
      puffsPerPod,
    });

    const plan = buildPlan(methods, puffsPerDay, nicotineLevel, targetDate);
    await savePlan(plan);
    await setOnboarded();
    onComplete();
  };

  const steps = [
    // Welcome
    <View style={styles.stepContent} key="welcome">
      <View style={styles.center}>
        <Text style={styles.bigIcon}>🌬️</Text>
        <Text style={styles.title}>PuffLess</Text>
        <Text style={styles.subtitle}>Your personal guide to quitting vaping.{'\n'}At your pace, on your terms.</Text>
      </View>
    </View>,

    // Device Type
    <View style={styles.stepContent} key="device">
      <Text style={styles.stepTitle}>What do you vape?</Text>
      <Text style={styles.stepSubtitle}>This helps us tailor your plan</Text>
      <View style={styles.grid}>
        {DEVICE_TYPES.map(({ type, icon }) => (
          <TouchableOpacity
            key={type}
            style={[styles.selectionCard, deviceType === type && styles.selectionCardActive]}
            onPress={() => setDeviceType(type)}
          >
            <Text style={styles.cardIcon}>{icon}</Text>
            <Text style={styles.cardLabel}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,

    // Usage
    <ScrollView style={styles.stepContent} key="usage" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your current usage</Text>
      <Text style={styles.stepSubtitle}>Be honest — this is just a starting point</Text>
      <Slider label={`Puffs per day: ${puffsPerDay}`} value={puffsPerDay} min={10} max={500} step={5} onChange={setPuffsPerDay} />
      <Slider label={`Nicotine strength: ${nicotineLevel}mg`} value={nicotineLevel} min={0} max={60} step={5} onChange={setNicotineLevel} />
      <Slider label={`Cost per pod: $${costPerPod.toFixed(2)}`} value={costPerPod} min={5} max={50} step={0.5} onChange={setCostPerPod} />
      <Slider label={`Puffs per pod: ${puffsPerPod}`} value={puffsPerPod} min={50} max={800} step={10} onChange={setPuffsPerPod} />
    </ScrollView>,

    // Methods
    <ScrollView style={styles.stepContent} key="methods" showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Pick your methods</Text>
      <Text style={styles.stepSubtitle}>Choose one or more. You can change these later.</Text>
      {QUIT_METHODS.map(({ method, icon, description }) => (
        <TouchableOpacity
          key={method}
          style={[styles.methodRow, selectedMethods.has(method) && styles.methodRowActive]}
          onPress={() => toggleMethod(method)}
        >
          <Text style={styles.methodIcon}>{icon}</Text>
          <View style={styles.methodText}>
            <Text style={styles.methodTitle}>{method}</Text>
            <Text style={styles.methodDesc}>{description}</Text>
          </View>
          <Text style={styles.check}>{selectedMethods.has(method) ? '✅' : '⭕'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>,

    // Target
    <View style={styles.stepContent} key="target">
      <Text style={styles.stepTitle}>Set your target</Text>
      <Text style={styles.stepSubtitle}>When do you want to be nicotine-free?</Text>
      <Text style={styles.bigNumber}>{targetDays}</Text>
      <Text style={styles.bigNumberLabel}>days</Text>
      <Slider label="" value={targetDays} min={14} max={180} step={7} onChange={setTargetDays} />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>2 weeks</Text>
        <Text style={styles.sliderLabel}>6 months</Text>
      </View>
      <Text style={styles.targetDate}>
        Target: {new Date(Date.now() + targetDays * 86400000).toLocaleDateString()}
      </Text>
    </View>,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
      </View>
      {steps[step]}
      <View style={styles.nav}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => step < steps.length - 1 ? setStep(step + 1) : handleComplete()}
        >
          <Text style={styles.nextText}>{step === steps.length - 1 ? 'Start My Plan' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { height: 4, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  progressFill: { height: 4, backgroundColor: Colors.teal, borderRadius: 2 },
  stepContent: { flex: 1, padding: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bigIcon: { fontSize: 80, marginBottom: Spacing.lg },
  title: { fontSize: 36, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  subtitle: { fontSize: 18, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  stepSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  selectionCard: {
    width: (width - Spacing.xl * 2 - Spacing.md) / 2,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectionCardActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  cardIcon: { fontSize: 32, marginBottom: Spacing.sm },
  cardLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodRowActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  methodIcon: { fontSize: 28, marginRight: Spacing.md },
  methodText: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  methodDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  check: { fontSize: 20 },
  bigNumber: { fontSize: 72, fontWeight: '800', color: Colors.teal, textAlign: 'center', marginTop: Spacing.xxxl },
  bigNumberLabel: { fontSize: 20, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 12, color: Colors.textSecondary },
  targetDate: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xl },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl },
  backText: { fontSize: 16, color: Colors.textSecondary },
  nextButton: {
    backgroundColor: Colors.teal,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.lg,
  },
  nextText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
