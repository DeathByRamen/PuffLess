import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isOnboarded } from './src/services/storage';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TodayScreen from './src/screens/TodayScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import PlanScreen from './src/screens/PlanScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Colors } from './src/constants/theme';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Today: { focused: 'sunny', unfocused: 'sunny-outline' },
  Progress: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  Plan: { focused: 'clipboard', unfocused: 'clipboard-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function App() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboarded().then(setOnboarded);
  }, []);

  if (onboarded === null) return null;

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const icons = TAB_ICONS[route.name];
              const iconName = focused ? icons.focused : icons.unfocused;
              return <Ionicons name={iconName} size={22} color={color} />;
            },
            tabBarActiveTintColor: Colors.teal,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
            tabBarStyle: {
              backgroundColor: Colors.white,
              borderTopColor: Colors.borderLight,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 64,
            },
            headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700', fontSize: 22, color: Colors.text, letterSpacing: -0.3 },
          })}
        >
          <Tab.Screen name="Today" component={TodayScreen} />
          <Tab.Screen name="Progress" component={ProgressScreen} />
          <Tab.Screen name="Plan" component={PlanScreen} options={{ title: 'My Plan' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
