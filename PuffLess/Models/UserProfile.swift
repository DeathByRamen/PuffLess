import Foundation
import SwiftData

@Model
final class UserProfile {
    var deviceType: VapeDeviceType
    var startingNicotineLevel: Double
    var startingPuffsPerDay: Int
    var selectedMethods: [QuitMethod]
    var targetQuitDate: Date
    var createdAt: Date

    var notificationPreference: NotificationPreference
    var quietHoursStart: Int
    var quietHoursEnd: Int

    var costPerPod: Double
    var puffsPerPod: Int

    init(
        deviceType: VapeDeviceType = .podSystem,
        startingNicotineLevel: Double = 50,
        startingPuffsPerDay: Int = 200,
        selectedMethods: [QuitMethod] = [.gradualReduction],
        targetQuitDate: Date = Calendar.current.date(byAdding: .day, value: 60, to: .now)!,
        notificationPreference: NotificationPreference = .balanced,
        quietHoursStart: Int = 22,
        quietHoursEnd: Int = 8,
        costPerPod: Double = 15.0,
        puffsPerPod: Int = 200
    ) {
        self.deviceType = deviceType
        self.startingNicotineLevel = startingNicotineLevel
        self.startingPuffsPerDay = startingPuffsPerDay
        self.selectedMethods = selectedMethods
        self.targetQuitDate = targetQuitDate
        self.createdAt = .now
        self.notificationPreference = notificationPreference
        self.quietHoursStart = quietHoursStart
        self.quietHoursEnd = quietHoursEnd
        self.costPerPod = costPerPod
        self.puffsPerPod = puffsPerPod
    }

    var costPerPuff: Double {
        guard puffsPerPod > 0 else { return 0 }
        return costPerPod / Double(puffsPerPod)
    }
}

enum VapeDeviceType: String, Codable, CaseIterable {
    case disposable = "Disposable"
    case podSystem = "Pod System"
    case mod = "Mod/Tank"
    case other = "Other"

    var icon: String {
        switch self {
        case .disposable: return "flame"
        case .podSystem: return "rectangle.portrait"
        case .mod: return "cylinder"
        case .other: return "questionmark.circle"
        }
    }
}

enum QuitMethod: String, Codable, CaseIterable, Identifiable {
    case gradualReduction = "Gradual Reduction"
    case behavioral = "Trigger Tracking"
    case coldTurkey = "Cold Turkey"
    case nrt = "NRT Tracking"
    case gamification = "Gamification"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .gradualReduction: return "chart.line.downtrend.xyaxis"
        case .behavioral: return "brain.head.profile"
        case .coldTurkey: return "hand.raised"
        case .nrt: return "cross.case"
        case .gamification: return "trophy"
        }
    }

    var description: String {
        switch self {
        case .gradualReduction:
            return "Slowly reduce your daily puffs and nicotine strength over weeks"
        case .behavioral:
            return "Identify your triggers and build healthier habits to replace vaping"
        case .coldTurkey:
            return "Pick a quit date and stop completely with withdrawal support"
        case .nrt:
            return "Track patches, gum, or lozenges alongside your vape reduction"
        case .gamification:
            return "Stay motivated with streaks, badges, and milestone rewards"
        }
    }
}

enum NotificationPreference: String, Codable, CaseIterable {
    case often = "Encourage me often"
    case balanced = "Just the essentials"
    case milestonesOnly = "Only milestones"
}
