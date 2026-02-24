import SwiftUI
import SwiftData

@main
struct PuffLessApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            UserProfile.self,
            DailyLog.self,
            Craving.self,
            NRTEntry.self,
            Milestone.self,
            QuitPlan.self,
        ])
    }
}
