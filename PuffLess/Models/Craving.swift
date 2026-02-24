import Foundation
import SwiftData

@Model
final class Craving {
    var timestamp: Date
    var intensity: Int
    var trigger: CravingTrigger
    var action: CravingAction
    var durationMinutes: Int?
    var notes: String

    init(
        timestamp: Date = .now,
        intensity: Int = 3,
        trigger: CravingTrigger = .habit,
        action: CravingAction = .resisted,
        durationMinutes: Int? = nil,
        notes: String = ""
    ) {
        self.timestamp = timestamp
        self.intensity = intensity
        self.trigger = trigger
        self.action = action
        self.durationMinutes = durationMinutes
        self.notes = notes
    }
}

enum CravingTrigger: String, Codable, CaseIterable, Identifiable {
    case stress = "Stress"
    case boredom = "Boredom"
    case social = "Social"
    case habit = "Habit"
    case afterMeal = "After Meal"
    case anxiety = "Anxiety"
    case celebration = "Celebration"
    case other = "Other"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .stress: return "bolt.heart"
        case .boredom: return "clock"
        case .social: return "person.2"
        case .habit: return "repeat"
        case .afterMeal: return "fork.knife"
        case .anxiety: return "exclamationmark.triangle"
        case .celebration: return "party.popper"
        case .other: return "ellipsis.circle"
        }
    }

    var suggestion: String {
        switch self {
        case .stress: return "Try a 2-minute box breathing exercise"
        case .boredom: return "Take a short walk or stretch"
        case .social: return "Hold a drink or keep your hands busy"
        case .habit: return "Try a fidget toy or chew gum"
        case .afterMeal: return "Brush your teeth or chew mint gum"
        case .anxiety: return "Try the 5-4-3-2-1 grounding technique"
        case .celebration: return "Celebrate with your favorite snack instead"
        case .other: return "Take 5 deep breaths and wait 2 minutes"
        }
    }
}

enum CravingAction: String, Codable, CaseIterable {
    case vaped = "Vaped"
    case resisted = "Resisted"
    case usedNRT = "Used NRT"
    case breathingExercise = "Breathing Exercise"
    case otherAction = "Other"

    var icon: String {
        switch self {
        case .vaped: return "smoke"
        case .resisted: return "checkmark.shield"
        case .usedNRT: return "cross.case"
        case .breathingExercise: return "wind"
        case .otherAction: return "ellipsis.circle"
        }
    }
}
