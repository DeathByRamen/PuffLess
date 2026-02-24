import SwiftUI
import SwiftData

struct CravingLogView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var intensity: Double = 3
    @State private var trigger: CravingTrigger = .habit
    @State private var action: CravingAction = .resisted
    @State private var notes: String = ""
    @State private var showingSuggestion = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    intensitySection
                    triggerSection

                    if showingSuggestion {
                        suggestionCard
                    }

                    actionSection

                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)

                    Button(action: saveCraving) {
                        Text("Log Craving")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(.teal, in: RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding()
            }
            .navigationTitle("Log Craving")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private var intensitySection: some View {
        VStack(spacing: 12) {
            Text("How strong is this craving?")
                .font(.headline)
            Text(intensityLabel)
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(intensityColor)
            Slider(value: $intensity, in: 1...5, step: 1)
                .tint(intensityColor)
            HStack {
                Text("Mild").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("Overwhelming").font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private var intensityLabel: String {
        switch Int(intensity) {
        case 1: return "Mild"
        case 2: return "Moderate"
        case 3: return "Strong"
        case 4: return "Intense"
        case 5: return "Overwhelming"
        default: return "Strong"
        }
    }

    private var intensityColor: Color {
        switch Int(intensity) {
        case 1: return .green
        case 2: return .teal
        case 3: return .yellow
        case 4: return .orange
        case 5: return .red
        default: return .yellow
        }
    }

    private var triggerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("What triggered it?")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 90))], spacing: 10) {
                ForEach(CravingTrigger.allCases) { t in
                    Button(action: {
                        trigger = t
                        withAnimation { showingSuggestion = true }
                    }) {
                        VStack(spacing: 6) {
                            Image(systemName: t.icon)
                                .font(.title3)
                            Text(t.rawValue)
                                .font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(trigger == t ? Color.teal.opacity(0.12) : Color(.tertiarySystemGroupedBackground))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(trigger == t ? .teal : .clear, lineWidth: 1.5)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var suggestionCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "lightbulb.fill")
                .foregroundStyle(.yellow)
            Text(trigger.suggestion)
                .font(.subheadline)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.yellow.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private var actionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("What did you do?")
                .font(.headline)
            ForEach(CravingAction.allCases, id: \.self) { a in
                Button(action: { action = a }) {
                    HStack {
                        Image(systemName: a.icon)
                            .foregroundStyle(action == a ? .teal : .secondary)
                            .frame(width: 28)
                        Text(a.rawValue)
                            .font(.subheadline)
                        Spacer()
                        if action == a {
                            Image(systemName: "checkmark")
                                .foregroundStyle(.teal)
                        }
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal)
                    .background(action == a ? Color.teal.opacity(0.08) : Color(.tertiarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func saveCraving() {
        let craving = Craving(
            intensity: Int(intensity),
            trigger: trigger,
            action: action,
            notes: notes
        )
        modelContext.insert(craving)
        dismiss()
    }
}
