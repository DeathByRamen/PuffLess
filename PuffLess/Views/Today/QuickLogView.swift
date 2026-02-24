import SwiftUI
import SwiftData

struct QuickLogView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \DailyLog.date, order: .reverse) private var logs: [DailyLog]
    @Query private var plans: [QuitPlan]
    @Query private var profiles: [UserProfile]

    @State private var puffsToAdd: Int = 1
    @State private var mood: Int = 3
    @State private var notes: String = ""

    private var todayLog: DailyLog? {
        logs.first { Calendar.current.isDateInToday($0.date) }
    }

    private var currentNicotine: Double {
        plans.first?.currentNicotineTarget ?? profiles.first?.startingNicotineLevel ?? 0
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                currentCountHeader

                puffStepper

                moodPicker

                TextField("Notes (optional)", text: $notes, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)

                Spacer()

                Button(action: logPuffs) {
                    Text("Log \(puffsToAdd) Puff\(puffsToAdd == 1 ? "" : "s")")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(.teal, in: RoundedRectangle(cornerRadius: 14))
                }
            }
            .padding()
            .navigationTitle("Log Puffs")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private var currentCountHeader: some View {
        VStack(spacing: 4) {
            Text("Today so far")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(todayLog?.puffCount ?? 0)")
                .font(.system(size: 56, weight: .bold, design: .rounded))
            if let goal = plans.first?.todaysGoal {
                Text("Goal: \(goal) puffs")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var puffStepper: some View {
        VStack(spacing: 8) {
            Text("Puffs to add")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack(spacing: 24) {
                Button(action: { if puffsToAdd > 1 { puffsToAdd -= 1 } }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.teal)
                }

                Text("\(puffsToAdd)")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .frame(minWidth: 60)

                Button(action: { puffsToAdd += 1 }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.teal)
                }
            }

            HStack(spacing: 12) {
                ForEach([1, 5, 10, 20], id: \.self) { count in
                    Button("+\(count)") {
                        puffsToAdd = count
                    }
                    .buttonStyle(.bordered)
                    .tint(puffsToAdd == count ? .teal : .secondary)
                }
            }
        }
    }

    private var moodPicker: some View {
        VStack(spacing: 8) {
            Text("How are you feeling?")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack(spacing: 16) {
                ForEach(1...5, id: \.self) { value in
                    Button(action: { mood = value }) {
                        Text(moodEmoji(value))
                            .font(.system(size: mood == value ? 40 : 30))
                            .opacity(mood == value ? 1.0 : 0.4)
                    }
                }
            }
        }
    }

    private func moodEmoji(_ value: Int) -> String {
        switch value {
        case 1: return "😫"
        case 2: return "😕"
        case 3: return "😐"
        case 4: return "🙂"
        case 5: return "😁"
        default: return "😐"
        }
    }

    private func logPuffs() {
        if let existing = todayLog {
            existing.puffCount += puffsToAdd
            existing.mood = mood
            if !notes.isEmpty { existing.notes = notes }
            existing.nicotineStrength = currentNicotine
            existing.updateGoalStatus()
        } else {
            let log = DailyLog(
                puffCount: puffsToAdd,
                nicotineStrength: currentNicotine,
                dailyGoal: plans.first?.todaysGoal ?? 0,
                mood: mood,
                notes: notes
            )
            modelContext.insert(log)
        }
        dismiss()
    }
}
