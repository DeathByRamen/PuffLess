import Foundation
import UserNotifications

@MainActor
final class NotificationManager: ObservableObject {
    static let shared = NotificationManager()

    @Published var isAuthorized = false

    private let center = UNUserNotificationCenter.current()
    private let maxDailyNotifications = 2

    func requestPermission() async {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            isAuthorized = granted
        } catch {
            isAuthorized = false
        }
    }

    func checkAuthorizationStatus() async {
        let settings = await center.notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }

    // MARK: - Scheduled Notifications

    func scheduleMorningCheckIn(hour: Int = 8, minute: Int = 0) {
        let content = UNMutableNotificationContent()
        content.title = "Good morning"
        content.body = "Ready to check in on your progress? You've got this."
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "morning-checkin", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleEveningReminder(hour: Int = 20, minute: Int = 0) {
        let content = UNMutableNotificationContent()
        content.title = "How did today go?"
        content.body = "Take a moment to log your day. It only takes a few seconds."
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "evening-reminder", content: content, trigger: trigger)
        center.add(request)
    }

    // MARK: - Milestone Notifications

    func sendMilestoneNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "milestone-\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        center.add(request)
    }

    // MARK: - Re-engagement

    func scheduleGentleReengagement() {
        let content = UNMutableNotificationContent()
        content.title = "No pressure"
        content.body = "Just checking in. Your progress is still here whenever you're ready."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3 * 24 * 60 * 60, repeats: false)
        let request = UNNotificationRequest(identifier: "reengagement", content: content, trigger: trigger)
        center.add(request)
    }

    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
    }

    func setupNotifications(preference: NotificationPreference, quietStart: Int, quietEnd: Int) {
        cancelAllNotifications()

        switch preference {
        case .often:
            scheduleMorningCheckIn(hour: max(quietEnd, 8))
            scheduleEveningReminder(hour: min(quietStart, 20))
            scheduleGentleReengagement()
        case .balanced:
            scheduleEveningReminder(hour: min(quietStart, 20))
        case .milestonesOnly:
            break
        }
    }
}
