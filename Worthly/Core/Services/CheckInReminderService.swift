import Foundation
import UIKit
import UserNotifications
import Combine

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
        cancelAllReminders()
    }

    func cancelAllReminders() {
        center.getPendingNotificationRequests { requests in
            let identifiers = WorthlyReminderIdentifiers.matching(requests.map(\.identifier))
            self.center.removePendingNotificationRequests(withIdentifiers: identifiers)
        }
        center.getDeliveredNotifications { notifications in
            let identifiers = WorthlyReminderIdentifiers.matching(notifications.map { $0.request.identifier })
            self.center.removeDeliveredNotifications(withIdentifiers: identifiers)
        }
    }

    func reschedule(for item: WorthlyItem) {
        let identifiers = CheckInStage.allCases.map { identifier(for: item.id, stage: $0) }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)

        guard
            isEnabled,
            item.state == .bought,
            let stage = CheckInSchedule.nextPendingStage(for: item)
        else { return }

        schedule(item: item, stage: stage)
    }

    func cancel(item: WorthlyItem, stage: CheckInStage) {
        center.removePendingNotificationRequests(withIdentifiers: [identifier(for: item.id, stage: stage)])
    }

    func cancelReminders(for itemID: UUID) {
        let identifiers = CheckInStage.allCases.map { identifier(for: itemID, stage: $0) }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        center.removeDeliveredNotifications(withIdentifiers: identifiers)
    }

    private func schedule(item: WorthlyItem, stage: CheckInStage) {
        guard let dueDate = CheckInSchedule.dueDate(for: item, stage: stage) else { return }
        guard let deliveryDate = calendar.date(bySettingHour: 10, minute: 0, second: 0, of: dueDate) else { return }
        guard deliveryDate > .now else { return }

        let content = UNMutableNotificationContent()
        content.title = "回来看看，它还值不值"
        content.body = "\(item.name) 已经买了 \(stage.rawValue) 天。花 10 秒记录现在的真实感受。"
        content.sound = .default
        content.userInfo = [
            "itemID": item.id.uuidString,
            "stage": stage.rawValue
        ]

        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: deliveryDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(
            identifier: identifier(for: item.id, stage: stage),
            content: content,
            trigger: trigger
        )

        Task {
            try? await center.add(request)
        }
    }

    private func identifier(for itemID: UUID, stage: CheckInStage) -> String {
        "\(WorthlyReminderIdentifiers.prefix)\(itemID.uuidString).\(stage.rawValue)"
    }
}

final class CheckInNotificationRouter: ObservableObject {
    static let shared = CheckInNotificationRouter()
    @Published var pendingRoute: CheckInNotificationRoute?

    private init() {}

    func receive(userInfo: [AnyHashable: Any]) {
        guard let route = CheckInNotificationRoute.parse(userInfo: userInfo) else { return }
        pendingRoute = route
    }

    func consume(_ route: CheckInNotificationRoute) {
        guard pendingRoute == route else { return }
        pendingRoute = nil
    }
}

enum WorthlyNotificationPresentationPolicy {
    static var foregroundOptions: UNNotificationPresentationOptions { [.banner, .sound] }
}

final class WorthlyApplicationDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        DispatchQueue.main.async {
            CheckInNotificationRouter.shared.receive(userInfo: userInfo)
            completionHandler()
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler(WorthlyNotificationPresentationPolicy.foregroundOptions)
    }
}
