import SwiftUI
import SwiftData
import Charts

struct PlanView: View {
    @Query private var plans: [QuitPlan]
    @Query private var profiles: [UserProfile]
    @Query(sort: \NRTEntry.date, order: .reverse) private var nrtEntries: [NRTEntry]

    @State private var showingNRTLog = false

    private var plan: QuitPlan? { plans.first }
    private var profile: UserProfile? { profiles.first }

    var body: some View {
        NavigationStack {
            ScrollView {
                if let plan, let profile {
                    VStack(spacing: 20) {
                        overviewCard(plan: plan)
                        activeMethodsSection(profile: profile)
                        weeklyScheduleChart(plan: plan)
                        if profile.selectedMethods.contains(.nrt) {
                            nrtSection
                        }
                    }
                    .padding()
                } else {
                    ContentUnavailableView(
                        "No Plan Yet",
                        systemImage: "doc.text",
                        description: Text("Complete onboarding to create your quit plan")
                    )
                }
            }
            .navigationTitle("My Plan")
            .sheet(isPresented: $showingNRTLog) {
                NRTLogView()
            }
        }
    }

    // MARK: - Overview

    private func overviewCard(plan: QuitPlan) -> some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Week \(plan.currentWeek + 1) of \(plan.totalWeeks)")
                        .font(.title3).bold()
                    Text("\(plan.daysRemaining) days remaining")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                CircularProgress(progress: plan.progressPercent, size: 60)
            }

            Divider()

            HStack {
                VStack(alignment: .leading) {
                    Text("This week's goal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("\(plan.todaysGoal) puffs/day")
                        .font(.headline)
                }
                Spacer()
                if !plan.nicotineStepDown.isEmpty {
                    VStack(alignment: .trailing) {
                        Text("Nicotine target")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("\(Int(plan.currentNicotineTarget))mg")
                            .font(.headline)
                    }
                }
            }

            if let targetDate = plan.targetEndDate as Date? {
                HStack {
                    Image(systemName: "flag.checkered")
                        .foregroundStyle(.teal)
                    Text("Target: \(targetDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Active Methods

    private func activeMethodsSection(profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active Methods")
                .font(.headline)

            ForEach(profile.selectedMethods) { method in
                HStack(spacing: 14) {
                    Image(systemName: method.icon)
                        .font(.title2)
                        .foregroundStyle(.teal)
                        .frame(width: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(method.rawValue)
                            .font(.subheadline).fontWeight(.semibold)
                        Text(method.description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.teal)
                }
                .padding()
                .background(Color(.tertiarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Weekly Schedule

    private func weeklyScheduleChart(plan: QuitPlan) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Step-Down Schedule")
                .font(.headline)

            if !plan.weeklyTargets.isEmpty {
                Chart {
                    ForEach(Array(plan.weeklyTargets.enumerated()), id: \.offset) { week, target in
                        BarMark(
                            x: .value("Week", "W\(week + 1)"),
                            y: .value("Puffs", target)
                        )
                        .foregroundStyle(week == plan.currentWeek ? .teal : .teal.opacity(0.3))
                        .cornerRadius(4)
                    }
                }
                .frame(height: 160)
                .chartYAxisLabel("Daily puffs")
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - NRT

    private var nrtSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("NRT Log")
                    .font(.headline)
                Spacer()
                Button(action: { showingNRTLog = true }) {
                    Label("Add", systemImage: "plus")
                        .font(.subheadline)
                }
            }

            if nrtEntries.isEmpty {
                Text("No NRT entries yet. Tap + to log.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(nrtEntries.prefix(5), id: \.date) { entry in
                    HStack {
                        Image(systemName: entry.type.icon)
                            .foregroundStyle(.secondary)
                        Text(entry.type.rawValue)
                            .font(.subheadline)
                        Spacer()
                        Text("\(Int(entry.dosageMg))mg")
                            .font(.subheadline).bold()
                        Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Circular Progress

struct CircularProgress: View {
    let progress: Double
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color(.systemGray5), lineWidth: 6)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(.teal, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int(progress * 100))%")
                .font(.caption2).bold()
        }
        .frame(width: size, height: size)
    }
}

// MARK: - NRT Log View

struct NRTLogView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var type: NRTType = .patch
    @State private var dosage: Double = 21
    @State private var notes: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("NRT Type") {
                    Picker("Type", selection: $type) {
                        ForEach(NRTType.allCases, id: \.self) { t in
                            Label(t.rawValue, systemImage: t.icon).tag(t)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Dosage") {
                    HStack {
                        Text("\(Int(dosage))mg")
                            .font(.title2).bold()
                        Slider(value: $dosage, in: 1...42, step: 1)
                            .tint(.teal)
                    }
                }

                Section("Notes") {
                    TextField("Optional", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle("Log NRT")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let entry = NRTEntry(type: type, dosageMg: dosage, notes: notes)
                        modelContext.insert(entry)
                        dismiss()
                    }
                }
            }
        }
    }
}
