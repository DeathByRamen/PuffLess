import Foundation
import SwiftData

@Model
final class QuitPlan {
    var activeMethods: [QuitMethod]
    var startDate: Date
    var targetEndDate: Date
    var weeklyTargets: [Int]
    var nicotineStepDown: [Double]

    init(
        activeMethods: [QuitMethod] = [.gradualReduction],
        startDate: Date = .now,
        targetEndDate: Date = Calendar.current.date(byAdding: .day, value: 60, to: .now)!,
        weeklyTargets: [Int] = [],
        nicotineStepDown: [Double] = []
    ) {
        self.activeMethods = activeMethods
        self.startDate = startDate
        self.targetEndDate = targetEndDate
        self.weeklyTargets = weeklyTargets
        self.nicotineStepDown = nicotineStepDown
    }

    var totalWeeks: Int {
        let days = Calendar.current.dateComponents([.day], from: startDate, to: targetEndDate).day ?? 0
        return max(1, days / 7)
    }

    var currentWeek: Int {
        let days = Calendar.current.dateComponents([.day], from: startDate, to: .now).day ?? 0
        return min(max(0, days / 7), totalWeeks - 1)
    }

    var todaysGoal: Int {
        guard !weeklyTargets.isEmpty else { return 0 }
        let week = min(currentWeek, weeklyTargets.count - 1)
        return weeklyTargets[week]
    }

    var currentNicotineTarget: Double {
        guard !nicotineStepDown.isEmpty else { return 0 }
        let week = min(currentWeek, nicotineStepDown.count - 1)
        return nicotineStepDown[week]
    }

    var progressPercent: Double {
        guard totalWeeks > 0 else { return 0 }
        return min(1.0, Double(currentWeek) / Double(totalWeeks))
    }

    var daysRemaining: Int {
        let days = Calendar.current.dateComponents([.day], from: .now, to: targetEndDate).day ?? 0
        return max(0, days)
    }
}
