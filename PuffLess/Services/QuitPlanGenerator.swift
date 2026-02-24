import Foundation

struct QuitPlanGenerator {

    /// Generates a step-down schedule of weekly puff targets that smoothly
    /// decreases from `startingPuffs` to 0 over `weeks` weeks.
    static func generateWeeklyTargets(startingPuffs: Int, weeks: Int) -> [Int] {
        guard weeks > 0, startingPuffs > 0 else { return [0] }

        var targets: [Int] = []
        for week in 0..<weeks {
            let progress = Double(week) / Double(weeks)
            // Ease-out curve so the biggest drops happen early
            // when the user has more room, and it tapers gently near zero
            let factor = 1.0 - pow(progress, 0.7)
            let target = Int(round(Double(startingPuffs) * factor))
            targets.append(max(0, target))
        }
        targets.append(0)
        return targets
    }

    /// Generates a nicotine strength step-down schedule.
    /// Common strengths: 50mg, 35mg, 20mg, 10mg, 5mg, 0mg
    static func generateNicotineStepDown(startingMg: Double, weeks: Int) -> [Double] {
        let standardLevels: [Double] = [50, 35, 20, 10, 5, 3, 0]
        let relevantLevels = standardLevels.filter { $0 <= startingMg } + (standardLevels.contains(startingMg) ? [] : [startingMg])
        let sorted = relevantLevels.sorted(by: >)

        guard weeks > 0, sorted.count > 1 else { return [0] }

        let weeksPerStep = max(1, weeks / sorted.count)
        var schedule: [Double] = []

        for level in sorted {
            for _ in 0..<weeksPerStep {
                schedule.append(level)
                if schedule.count >= weeks { break }
            }
            if schedule.count >= weeks { break }
        }

        while schedule.count < weeks + 1 {
            schedule.append(0)
        }

        return Array(schedule.prefix(weeks + 1))
    }

    /// Calculates the daily puff goal for a given date based on the plan.
    static func dailyGoalForDate(_ date: Date, plan: QuitPlan) -> Int {
        let days = Calendar.current.dateComponents([.day], from: plan.startDate, to: date).day ?? 0
        let week = max(0, days / 7)
        guard !plan.weeklyTargets.isEmpty else { return 0 }
        let index = min(week, plan.weeklyTargets.count - 1)
        return plan.weeklyTargets[index]
    }

    /// Calculates total money saved based on puffs avoided.
    static func moneySaved(totalPuffsAvoided: Int, costPerPuff: Double) -> Double {
        return Double(totalPuffsAvoided) * costPerPuff
    }

    /// Builds a complete QuitPlan from onboarding inputs.
    static func buildPlan(
        methods: [QuitMethod],
        startingPuffs: Int,
        startingNicotine: Double,
        targetDate: Date
    ) -> QuitPlan {
        let weeks = max(1, Calendar.current.dateComponents([.day], from: .now, to: targetDate).day ?? 1) / 7
        let weeklyTargets = generateWeeklyTargets(startingPuffs: startingPuffs, weeks: weeks)
        let nicotineStepDown = generateNicotineStepDown(startingMg: startingNicotine, weeks: weeks)

        return QuitPlan(
            activeMethods: methods,
            startDate: .now,
            targetEndDate: targetDate,
            weeklyTargets: weeklyTargets,
            nicotineStepDown: nicotineStepDown
        )
    }
}
