import Foundation
import SwiftData

@Model
final class DailyLog {
    var date: Date
    var puffCount: Int
    var nicotineStrength: Double
    var dailyGoal: Int
    var goalMet: Bool
    var mood: Int
    var notes: String

    init(
        date: Date = .now,
        puffCount: Int = 0,
        nicotineStrength: Double = 0,
        dailyGoal: Int = 0,
        mood: Int = 3,
        notes: String = ""
    ) {
        self.date = Calendar.current.startOfDay(for: date)
        self.puffCount = puffCount
        self.nicotineStrength = nicotineStrength
        self.dailyGoal = dailyGoal
        self.goalMet = puffCount <= dailyGoal
        self.mood = mood
        self.notes = notes
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(date)
    }

    func updateGoalStatus() {
        goalMet = puffCount <= dailyGoal
    }
}
