import Foundation
import SwiftData

@Model
final class Milestone {
    var type: MilestoneType
    var title: String
    var milestoneDescription: String
    var dateUnlocked: Date?
    var notified: Bool

    init(
        type: MilestoneType,
        title: String,
        milestoneDescription: String,
        dateUnlocked: Date? = nil,
        notified: Bool = false
    ) {
        self.type = type
        self.title = title
        self.milestoneDescription = milestoneDescription
        self.dateUnlocked = dateUnlocked
        self.notified = notified
    }

    var isUnlocked: Bool {
        dateUnlocked != nil
    }

    static let healthMilestones: [(title: String, description: String, hours: Int)] = [
        ("Heart Rate Drops", "Your heart rate begins returning to normal", 0),
        ("Nicotine Leaving", "Nicotine starts clearing from your bloodstream", 8),
        ("Taste Returns", "Your sense of taste and smell start improving", 48),
        ("Breathing Easier", "Bronchial tubes begin to relax, breathing gets easier", 72),
        ("Circulation Improves", "Blood circulation noticeably improves", 336),
        ("Lung Function Up", "Lung function begins to improve significantly", 720),
        ("Coughing Decreases", "Coughing and shortness of breath decrease", 2160),
    ]

    static let financialThresholds: [Double] = [10, 25, 50, 100, 250, 500, 1000]

    static let streakThresholds: [Int] = [1, 3, 7, 14, 30, 60, 90, 180, 365]
}

enum MilestoneType: String, Codable {
    case health = "Health"
    case financial = "Financial"
    case streak = "Streak"

    var icon: String {
        switch self {
        case .health: return "heart.fill"
        case .financial: return "dollarsign.circle.fill"
        case .streak: return "flame.fill"
        }
    }

    var color: String {
        switch self {
        case .health: return "red"
        case .financial: return "green"
        case .streak: return "orange"
        }
    }
}
