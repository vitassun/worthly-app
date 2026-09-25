import Foundation
import UserNotifications

final class CheckInReminderService {
    static let shared = CheckInReminderService()
    static let enabledKey = "worthly.checkInRemindersEnabled"

    private let center = UNUserNotificationCenter.current()
    private let calendar = Calendar.current

    private init() {}

    var isEnabled: Bool {
        UserDefaults.standard.bool(forKey: Self.enabledKey)
    }

    func enable(for items: [WorthlyItem]) async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            UserDefaults.standard.set(granted, forKey: Self.enabledKey)

            if granted {
                for item in items where item.state == .bought {
                    reschedule(for: item)
                }
            }

            return granted
        } catch {
            UserDefaults.standard.set(false, forKey: Self.enabledKey)
            return false
        }
    }

    func disable() {
        UserDefaults.standard.set(false, forKey: Self.enabledKey)
        center.removeAllPendingNotificationRequests()
    }

    func reschedule(for item: WorthlyItem) {
        let identifiers = CheckInStage.allCases.map { identifier(for: item, stage: $0) }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)

        guard
            isEnabled,
            item.state == .bought,
            let stage = CheckInSchedule.nextPendingStage(for: item)
        else { return }

        schedule(item: item, stage: stage)
    }

    func cancel(item: WorthlyItem, stage: CheckInStage) {
        center.removePendingNotificationRequests(withIdentifiers: [identifier(for: item, stage: stage)])
    }

    private func schedule(item: WorthlyItem, stage: CheckInStage) {
        guard let dueDate = CheckInSchedule.dueDate(for: item, stage: stage) else { return }
        guard let deliveryDate = calendar.date(bySettingHour: 10, minute: 0, second: 0, of: dueDate) else { return }
        guard deliveryDate > .now else { return }

        let content = UNMutableNotificationContent()
        content.title = "回来看看，它还值不值"
        content.body = "\(item.name) 已经买了 \(stage.rawValue) 天。花 10 秒记录现在的真实感受。"
        content.sound = .default

        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: deliveryDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: identifier(for: item, stage: stage),
            content: content,
            trigger: trigger
        )

        Task {
            try? await center.add(request)
        }
    }

    private func identifier(for item: WorthlyItem, stage: CheckInStage) -> String {
        "worthly.checkin.\(item.id.uuidString).\(stage.rawValue)"
    }
}
