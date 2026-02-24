import SwiftUI
import SwiftData
import Charts

struct ProgressTabView: View {
    @Query(sort: \DailyLog.date, order: .reverse) private var logs: [DailyLog]
    @Query private var profiles: [UserProfile]
    @Query private var plans: [QuitPlan]
    @Query(sort: \Craving.timestamp) private var cravings: [Craving]

    @StateObject private var healthKit = HealthKitManager.shared

    private var profile: UserProfile? { profiles.first }
    private var plan: QuitPlan? { plans.first }

    private var last7DaysLogs: [DailyLog] {
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: .now)!
        return logs.filter { $0.date >= sevenDaysAgo }.sorted { $0.date < $1.date }
    }

    private var totalPuffsAvoided: Int {
        guard let profile else { return 0 }
        return logs.reduce(0) { total, log in
            total + max(0, profile.startingPuffsPerDay - log.puffCount)
        }
    }

    private var totalMoneySaved: Double {
        guard let profile else { return 0 }
        return QuitPlanGenerator.moneySaved(totalPuffsAvoided: totalPuffsAvoided, costPerPuff: profile.costPerPuff)
    }

    private var goalsMetCount: Int {
        logs.filter { $0.goalMet }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    statsRow
                    weeklyChart
                    cravingInsights
                    milestonesSection
                    if healthKit.isAuthorized {
                        healthInsightsCard
                    }
                }
                .padding()
            }
            .navigationTitle("Progress")
            .task {
                healthKit.checkAvailability()
                if healthKit.isAvailable {
                    await healthKit.requestAuthorization()
                    await healthKit.fetchAllData()
                }
            }
        }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 12) {
            StatCard(title: "Saved", value: "$\(String(format: "%.0f", totalMoneySaved))", icon: "dollarsign.circle.fill", color: .green)
            StatCard(title: "Goals Met", value: "\(goalsMetCount)", icon: "checkmark.circle.fill", color: .teal)
            StatCard(title: "Avoided", value: "\(totalPuffsAvoided)", icon: "nosign", color: .orange)
        }
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Last 7 Days")
                .font(.headline)

            if last7DaysLogs.isEmpty {
                Text("Start logging to see your chart")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 180)
            } else {
                Chart {
                    ForEach(last7DaysLogs, id: \.date) { log in
                        BarMark(
                            x: .value("Day", log.date, unit: .day),
                            y: .value("Puffs", log.puffCount)
                        )
                        .foregroundStyle(log.goalMet ? .teal : .red.opacity(0.7))
                        .cornerRadius(4)

                        if log.dailyGoal > 0 {
                            RuleMark(y: .value("Goal", log.dailyGoal))
                                .foregroundStyle(.orange.opacity(0.5))
                                .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 3]))
                        }
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day)) { value in
                        AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                    }
                }
                .frame(height: 200)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Craving Insights

    private var cravingInsights: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Craving Patterns")
                .font(.headline)

            if cravings.isEmpty {
                Text("Log cravings to see your patterns")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                let triggerCounts = Dictionary(grouping: cravings, by: \.trigger)
                    .mapValues { $0.count }
                    .sorted { $0.value > $1.value }

                ForEach(triggerCounts.prefix(4), id: \.key) { trigger, count in
                    HStack {
                        Image(systemName: trigger.icon)
                            .foregroundStyle(.secondary)
                            .frame(width: 24)
                        Text(trigger.rawValue)
                            .font(.subheadline)
                        Spacer()
                        Text("\(count)")
                            .font(.subheadline).bold()

                        let total = cravings.count
                        let pct = total > 0 ? Int(Double(count) / Double(total) * 100) : 0
                        Text("\(pct)%")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .frame(width: 36, alignment: .trailing)
                    }
                }

                let resisted = cravings.filter { $0.action != .vaped }.count
                let pct = cravings.isEmpty ? 0 : Int(Double(resisted) / Double(cravings.count) * 100)
                HStack {
                    Spacer()
                    Text("Resist rate: \(pct)%")
                        .font(.caption)
                        .foregroundStyle(pct >= 50 ? .teal : .orange)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Milestones

    private var milestonesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Health Milestones")
                .font(.headline)

            let hoursQuit = hoursReducing
            ForEach(Milestone.healthMilestones, id: \.hours) { milestone in
                let unlocked = hoursQuit >= milestone.hours
                HStack(spacing: 12) {
                    Image(systemName: unlocked ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(unlocked ? .teal : .secondary)
                    VStack(alignment: .leading) {
                        Text(milestone.title)
                            .font(.subheadline)
                            .fontWeight(unlocked ? .semibold : .regular)
                        Text(milestone.description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(formatHours(milestone.hours))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .opacity(unlocked ? 1.0 : 0.5)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Health Insights

    private var healthInsightsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Health Insights", systemImage: "heart.fill")
                .font(.headline)
                .foregroundStyle(.red)

            if let hr = healthKit.restingHeartRate {
                HStack {
                    Text("Resting Heart Rate")
                        .font(.subheadline)
                    Spacer()
                    Text("\(Int(hr)) bpm")
                        .font(.subheadline).bold()
                }
            }

            if let steps = healthKit.averageSteps {
                HStack {
                    Text("Avg. Daily Steps")
                        .font(.subheadline)
                    Spacer()
                    Text("\(Int(steps))")
                        .font(.subheadline).bold()
                }
            }

            if healthKit.restingHeartRate == nil && healthKit.averageSteps == nil {
                Text("Keep tracking for 7+ days to see health correlations")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Helpers

    private var hoursReducing: Int {
        guard let plan else { return 0 }
        let hours = Calendar.current.dateComponents([.hour], from: plan.startDate, to: .now).hour ?? 0
        return max(0, hours)
    }

    private func formatHours(_ hours: Int) -> String {
        if hours == 0 { return "Immediate" }
        if hours < 24 { return "\(hours)h" }
        if hours < 720 { return "\(hours / 24)d" }
        return "\(hours / 720)mo"
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(value)
                .font(.title3).bold()
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
