import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var step = 0
    @State private var deviceType: VapeDeviceType = .podSystem
    @State private var puffsPerDay: Double = 200
    @State private var nicotineLevel: Double = 50
    @State private var selectedMethods: Set<QuitMethod> = [.gradualReduction]
    @State private var targetDays: Double = 60
    @State private var costPerPod: Double = 15
    @State private var puffsPerPod: Double = 200

    var onComplete: () -> Void

    var body: some View {
        ZStack {
            Color(.systemGroupedBackground).ignoresSafeArea()

            VStack(spacing: 0) {
                progressBar

                TabView(selection: $step) {
                    welcomeStep.tag(0)
                    deviceStep.tag(1)
                    usageStep.tag(2)
                    methodStep.tag(3)
                    targetStep.tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: step)

                navigationButtons
            }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color(.systemGray5))
                RoundedRectangle(cornerRadius: 2)
                    .fill(.teal)
                    .frame(width: geo.size.width * CGFloat(step + 1) / 5.0)
                    .animation(.spring, value: step)
            }
        }
        .frame(height: 4)
        .padding(.horizontal)
        .padding(.top, 8)
    }

    // MARK: - Steps

    private var welcomeStep: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "wind")
                .font(.system(size: 80))
                .foregroundStyle(.teal)
            Text("PuffLess")
                .font(.largeTitle).bold()
            Text("Your personal guide to quitting vaping.\nAt your pace, on your terms.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Spacer()
        }
        .padding()
    }

    private var deviceStep: some View {
        VStack(spacing: 24) {
            stepHeader(title: "What do you vape?", subtitle: "This helps us tailor your plan")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ForEach(VapeDeviceType.allCases, id: \.self) { type in
                    SelectionCard(
                        title: type.rawValue,
                        icon: type.icon,
                        isSelected: deviceType == type
                    ) {
                        deviceType = type
                    }
                }
            }
            Spacer()
        }
        .padding()
    }

    private var usageStep: some View {
        VStack(spacing: 32) {
            stepHeader(title: "Your current usage", subtitle: "Be honest -- this is just a starting point")

            VStack(alignment: .leading, spacing: 8) {
                Text("Puffs per day: **\(Int(puffsPerDay))**")
                Slider(value: $puffsPerDay, in: 10...500, step: 5)
                    .tint(.teal)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Nicotine strength: **\(Int(nicotineLevel))mg**")
                Slider(value: $nicotineLevel, in: 0...60, step: 5)
                    .tint(.teal)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Cost per pod/cartridge: **$\(String(format: "%.2f", costPerPod))**")
                Slider(value: $costPerPod, in: 5...50, step: 0.5)
                    .tint(.teal)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Puffs per pod: **\(Int(puffsPerPod))**")
                Slider(value: $puffsPerPod, in: 50...800, step: 10)
                    .tint(.teal)
            }

            Spacer()
        }
        .padding()
    }

    private var methodStep: some View {
        VStack(spacing: 24) {
            stepHeader(
                title: "Pick your methods",
                subtitle: "Choose one or more. You can change these later."
            )

            ForEach(QuitMethod.allCases) { method in
                MethodSelectionRow(
                    method: method,
                    isSelected: selectedMethods.contains(method)
                ) {
                    if selectedMethods.contains(method) {
                        if selectedMethods.count > 1 {
                            selectedMethods.remove(method)
                        }
                    } else {
                        selectedMethods.insert(method)
                    }
                }
            }
            Spacer()
        }
        .padding()
    }

    private var targetStep: some View {
        VStack(spacing: 32) {
            stepHeader(
                title: "Set your target",
                subtitle: "When do you want to be nicotine-free?"
            )

            Text("\(Int(targetDays)) days")
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .foregroundStyle(.teal)

            Slider(value: $targetDays, in: 14...180, step: 7)
                .tint(.teal)

            HStack {
                Text("2 weeks").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("6 months").font(.caption).foregroundStyle(.secondary)
            }

            if let targetDate = Calendar.current.date(byAdding: .day, value: Int(targetDays), to: .now) {
                Text("Target: \(targetDate.formatted(date: .abbreviated, time: .omitted))")
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
    }

    // MARK: - Navigation

    private var navigationButtons: some View {
        HStack {
            if step > 0 {
                Button("Back") { step -= 1 }
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button(action: {
                if step < 4 {
                    step += 1
                } else {
                    completeOnboarding()
                }
            }) {
                Text(step == 4 ? "Start My Plan" : "Next")
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                    .frame(minWidth: 120)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 24)
                    .background(.teal, in: RoundedRectangle(cornerRadius: 14))
            }
        }
        .padding()
    }

    // MARK: - Helpers

    private func stepHeader(title: String, subtitle: String) -> some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.title2).bold()
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func completeOnboarding() {
        let targetDate = Calendar.current.date(byAdding: .day, value: Int(targetDays), to: .now) ?? .now
        let methods = Array(selectedMethods)

        let profile = UserProfile(
            deviceType: deviceType,
            startingNicotineLevel: nicotineLevel,
            startingPuffsPerDay: Int(puffsPerDay),
            selectedMethods: methods,
            targetQuitDate: targetDate,
            costPerPod: costPerPod,
            puffsPerPod: Int(puffsPerPod)
        )
        modelContext.insert(profile)

        let plan = QuitPlanGenerator.buildPlan(
            methods: methods,
            startingPuffs: Int(puffsPerDay),
            startingNicotine: nicotineLevel,
            targetDate: targetDate
        )
        modelContext.insert(plan)

        onComplete()
    }
}

// MARK: - Supporting Views

struct SelectionCard: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title)
                Text(title)
                    .font(.subheadline).fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(isSelected ? Color.teal.opacity(0.1) : Color(.secondarySystemGroupedBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? .teal : .clear, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}

struct MethodSelectionRow: View {
    let method: QuitMethod
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: method.icon)
                    .font(.title2)
                    .foregroundStyle(isSelected ? .teal : .secondary)
                    .frame(width: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(method.rawValue)
                        .font(.headline)
                    Text(method.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? .teal : .secondary)
                    .font(.title3)
            }
            .padding()
            .background(isSelected ? Color.teal.opacity(0.08) : Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}
