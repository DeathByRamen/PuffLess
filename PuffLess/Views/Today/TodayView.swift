import SwiftUI
import SwiftData

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]
    @Query private var plans: [QuitPlan]
    @Query(sort: \DailyLog.date, order: .reverse) private var logs: [DailyLog]
    @Query(
        filter: #Predicate<Craving> { craving in true },
        sort: \Craving.timestamp,
        order: .reverse
    ) private var allCravings: [Craving]

    @State private var showingQuickLog = false
    @State private var showingCravingLog = false

    private var profile: UserProfile? { profiles.first }
    private var plan: QuitPlan? { plans.first }

    private var todayLog: DailyLog? {
        logs.first { Calendar.current.isDateInToday($0.date) }
    }

    private var todayCravings: [Craving] {
        allCravings.filter { Calendar.current.isDateInToday($0.timestamp) }
    }

    private var streak: Int {
        var count = 0
        let calendar = Calendar.current
        let sortedLogs = logs.sorted { $0.date > $1.date }
        var checkDate = calendar.startOfDay(for: .now)

        for log in sortedLogs {
            let logDate = calendar.startOfDay(for: log.date)
            if logDate == checkDate && log.goalMet {
                count += 1
                checkDate = calendar.date(byAdding: .day, value: -1, to: checkDate)!
            } else if logDate == checkDate {
                break
            }
        }
        return count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    dailyProgressCard
                    streakCard
                    actionButtons
                    todayCravingsCard
                    motivationalCard
                }
                .padding()
            }
            .navigationTitle("Today")
            .sheet(isPresented: $showingQuickLog) {
                QuickLogView()
            }
            .sheet(isPresented: $showingCravingLog) {
                CravingLogView()
            }
        }
    }

    // MARK: - Daily Progress

    private var dailyProgressCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Daily Progress")
                    .font(.headline)
                Spacer()
                Text(Date.now.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            let puffs = todayLog?.puffCount ?? 0
            let goal = plan?.todaysGoal ?? 0

            ZStack {
                Circle()
                    .stroke(Color(.systemGray5), lineWidth: 12)
                Circle()
                    .trim(from: 0, to: goal > 0 ? min(1.0, CGFloat(puffs) / CGFloat(goal)) : 0)
                    .stroke(
                        puffs <= goal ? Color.teal : Color.red,
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring, value: puffs)

                VStack(spacing: 4) {
                    Text("\(puffs)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                    Text("of \(goal) puffs")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 180)

            if puffs <= goal {
                Label(
                    goal - puffs == 0 ? "You've hit your limit -- stay strong!" : "\(goal - puffs) puffs remaining",
                    systemImage: "checkmark.circle"
                )
                .font(.subheadline)
                .foregroundStyle(.teal)
            } else {
                Label(
                    "\(puffs - goal) over today's goal",
                    systemImage: "exclamationmark.triangle"
                )
                .font(.subheadline)
                .foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Streak

    private var streakCard: some View {
        HStack {
            Image(systemName: "flame.fill")
                .font(.title)
                .foregroundStyle(.orange)
            VStack(alignment: .leading) {
                Text("\(streak) day streak")
                    .font(.title3).bold()
                Text("Days under goal")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if let profile, plan != nil {
                let avoided = max(0, profile.startingPuffsPerDay - (todayLog?.puffCount ?? profile.startingPuffsPerDay))
                let saved = QuitPlanGenerator.moneySaved(totalPuffsAvoided: avoided, costPerPuff: profile.costPerPuff)
                VStack(alignment: .trailing) {
                    Text("$\(String(format: "%.2f", saved))")
                        .font(.title3).bold()
                        .foregroundStyle(.green)
                    Text("saved today")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        HStack(spacing: 14) {
            Button(action: { showingQuickLog = true }) {
                Label("Log Puffs", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .foregroundStyle(.white)
                    .background(.teal, in: RoundedRectangle(cornerRadius: 14))
            }

            Button(action: { showingCravingLog = true }) {
                Label("Craving", systemImage: "bolt.heart.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .foregroundStyle(.teal)
                    .background(Color.teal.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }

    // MARK: - Cravings

    private var todayCravingsCard: some View {
        Group {
            if !todayCravings.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Today's Cravings (\(todayCravings.count))")
                        .font(.headline)

                    let resisted = todayCravings.filter { $0.action != .vaped }.count
                    let total = todayCravings.count
                    Text("\(resisted) of \(total) resisted")
                        .font(.subheadline)
                        .foregroundStyle(resisted > total / 2 ? .teal : .orange)

                    ForEach(todayCravings.prefix(3), id: \.timestamp) { craving in
                        HStack {
                            Image(systemName: craving.trigger.icon)
                                .foregroundStyle(.secondary)
                            Text(craving.trigger.rawValue)
                                .font(.subheadline)
                            Spacer()
                            Image(systemName: craving.action.icon)
                                .foregroundStyle(craving.action == .vaped ? .red : .teal)
                            Text(craving.timestamp.formatted(date: .omitted, time: .shortened))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    // MARK: - Motivational

    private var motivationalCard: some View {
        let messages = [
            "Every puff you skip is a win. They add up.",
            "You're rewiring your brain. It takes time, but you're doing it.",
            "Cravings last 3-5 minutes. You've survived harder things.",
            "You don't need to be perfect. You need to keep going.",
            "Tomorrow's version of you will be grateful for today's choices.",
        ]
        let message = messages[Calendar.current.component(.day, from: .now) % messages.count]

        return VStack(spacing: 8) {
            Image(systemName: "quote.opening")
                .foregroundStyle(.teal.opacity(0.5))
            Text(message)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .italic()
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
