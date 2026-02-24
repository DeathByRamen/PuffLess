import SwiftUI
import SwiftData

struct SettingsView: View {
    @Query private var profiles: [UserProfile]
    @Query private var plans: [QuitPlan]
    @Query(sort: \DailyLog.date) private var logs: [DailyLog]
    @Query(sort: \Craving.timestamp) private var cravings: [Craving]

    @StateObject private var notifications = NotificationManager.shared
    @State private var showingResetAlert = false
    @State private var showingExportSheet = false

    private var profile: UserProfile? { profiles.first }

    var body: some View {
        NavigationStack {
            List {
                profileSection
                notificationSection
                dataSection
                aboutSection
            }
            .navigationTitle("Settings")
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        Section("Profile") {
            if let profile {
                LabeledContent("Device", value: profile.deviceType.rawValue)
                LabeledContent("Starting Puffs/Day", value: "\(profile.startingPuffsPerDay)")
                LabeledContent("Starting Nicotine", value: "\(Int(profile.startingNicotineLevel))mg")
                LabeledContent("Started", value: profile.createdAt.formatted(date: .abbreviated, time: .omitted))

                if let plan = plans.first {
                    LabeledContent("Target Date", value: plan.targetEndDate.formatted(date: .abbreviated, time: .omitted))
                }

                NavigationLink("Active Methods") {
                    MethodsListView(profile: profile)
                }
            } else {
                Text("No profile found")
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Notifications

    private var notificationSection: some View {
        Section("Notifications") {
            if let profile {
                Picker("Frequency", selection: Binding(
                    get: { profile.notificationPreference },
                    set: { newValue in
                        profile.notificationPreference = newValue
                        notifications.setupNotifications(
                            preference: newValue,
                            quietStart: profile.quietHoursStart,
                            quietEnd: profile.quietHoursEnd
                        )
                    }
                )) {
                    ForEach(NotificationPreference.allCases, id: \.self) { pref in
                        Text(pref.rawValue).tag(pref)
                    }
                }

                LabeledContent("Quiet Hours") {
                    Text("\(profile.quietHoursStart):00 - \(profile.quietHoursEnd):00")
                        .foregroundStyle(.secondary)
                }

                if !notifications.isAuthorized {
                    Button("Enable Notifications") {
                        Task { await notifications.requestPermission() }
                    }
                }
            }
        }
    }

    // MARK: - Data

    private var dataSection: some View {
        Section("Data") {
            LabeledContent("Days Logged", value: "\(logs.count)")
            LabeledContent("Cravings Logged", value: "\(cravings.count)")

            Button("Export Data") {
                showingExportSheet = true
            }
            .sheet(isPresented: $showingExportSheet) {
                ExportView(logs: logs, cravings: cravings, profile: profile)
            }

            Button("Reset All Data", role: .destructive) {
                showingResetAlert = true
            }
            .alert("Reset All Data?", isPresented: $showingResetAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Reset", role: .destructive) {
                    resetData()
                }
            } message: {
                Text("This will permanently delete all your logs, cravings, and plan. This cannot be undone.")
            }
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        Section("About") {
            LabeledContent("Version", value: "1.0.0")
            LabeledContent("Made with", value: "SwiftUI")

            Link(destination: URL(string: "https://github.com/DeathByRamen/PuffLess")!) {
                LabeledContent("GitHub") {
                    Image(systemName: "arrow.up.right.square")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    @Environment(\.modelContext) private var modelContext

    private func resetData() {
        do {
            try modelContext.delete(model: DailyLog.self)
            try modelContext.delete(model: Craving.self)
            try modelContext.delete(model: NRTEntry.self)
            try modelContext.delete(model: Milestone.self)
            try modelContext.delete(model: QuitPlan.self)
            try modelContext.delete(model: UserProfile.self)
        } catch {
            // Handle error silently for v1
        }
    }
}

// MARK: - Methods List

struct MethodsListView: View {
    let profile: UserProfile

    var body: some View {
        List {
            ForEach(QuitMethod.allCases) { method in
                HStack(spacing: 14) {
                    Image(systemName: method.icon)
                        .font(.title2)
                        .foregroundStyle(profile.selectedMethods.contains(method) ? .teal : .secondary)
                        .frame(width: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(method.rawValue)
                            .font(.subheadline).fontWeight(.medium)
                        Text(method.description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if profile.selectedMethods.contains(method) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.teal)
                    }
                }
            }
        }
        .navigationTitle("Methods")
    }
}

// MARK: - Export View

struct ExportView: View {
    @Environment(\.dismiss) private var dismiss
    let logs: [DailyLog]
    let cravings: [Craving]
    let profile: UserProfile?

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 48))
                    .foregroundStyle(.teal)

                Text("Export Your Data")
                    .font(.title2).bold()

                Text("Your data will be exported as a CSV file that you can open in any spreadsheet app.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: 8) {
                    Label("\(logs.count) daily logs", systemImage: "calendar")
                    Label("\(cravings.count) craving entries", systemImage: "bolt.heart")
                }
                .font(.subheadline)

                Spacer()

                if let csvData = generateCSV() {
                    ShareLink(item: csvData, preview: SharePreview("PuffLess Data", image: Image(systemName: "doc.text"))) {
                        Text("Share CSV")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(.teal, in: RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func generateCSV() -> String? {
        var csv = "Date,Puffs,Goal,Goal Met,Mood,Nicotine (mg)\n"
        for log in logs.sorted(by: { $0.date < $1.date }) {
            let date = log.date.formatted(date: .numeric, time: .omitted)
            csv += "\(date),\(log.puffCount),\(log.dailyGoal),\(log.goalMet),\(log.mood),\(log.nicotineStrength)\n"
        }
        return csv
    }
}
