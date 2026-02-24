import SwiftUI
import SwiftData

struct ContentView: View {
    @Query private var profiles: [UserProfile]
    @State private var hasCompletedOnboarding = false
    @State private var selectedTab = 0

    private var isOnboarded: Bool {
        hasCompletedOnboarding || !profiles.isEmpty
    }

    var body: some View {
        if isOnboarded {
            TabView(selection: $selectedTab) {
                TodayView()
                    .tabItem {
                        Label("Today", systemImage: "sun.max.fill")
                    }
                    .tag(0)

                ProgressTabView()
                    .tabItem {
                        Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    .tag(1)

                PlanView()
                    .tabItem {
                        Label("Plan", systemImage: "list.clipboard")
                    }
                    .tag(2)

                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape")
                    }
                    .tag(3)
            }
            .tint(.teal)
        } else {
            OnboardingView {
                withAnimation {
                    hasCompletedOnboarding = true
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [
            UserProfile.self,
            DailyLog.self,
            Craving.self,
            NRTEntry.self,
            Milestone.self,
            QuitPlan.self,
        ], inMemory: true)
}
