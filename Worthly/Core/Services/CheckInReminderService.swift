import Foundation
import UIKit
import UserNotifications
import Combine

@MainActor
final class CheckInReminderService {
    static let shared = CheckInReminderService()
    nonisolated static let enabledKey = "worthly.checkInRemindersEnabled"

    private let center = UNUserNotificationCenter.current()
    private let calendar = Calendar.current
    private var generations = WorthlyReminderGeneration()
    private var schedulingTask: Task<Void, Never>?
    private var permissionRequestID: UUID?

    private init() {}

    var isEnabled: Bool {
        UserDefaults.standard.bool(forKey: Self.enabledKey)
    }

    func enable(for items: [WorthlyItem]) async -> Bool {
        let requestID = UUID()
        permissionRequestID = requestID
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            guard permissionRequestID == requestID else { return false }
            permissionRequestID = nil
            UserDefaults.standard.set(granted, forKey: Self.enabledKey)

            if granted {
                for item in items where item.state == .bought {
                    reschedule(for: item)
                }
            }

            return granted
        } catch {
            guard permissionRequestID == requestID else { return false }
            permissionRequestID = nil
            UserDefaults.standard.set(false, forKey: Self.enabledKey)
            return false
        }
    }

    func disable() {
        permissionRequestID = nil
        UserDefaults.standard.set(false, forKey: Self.enabledKey)
        cancelAllReminders()
    }

    func cancelAllReminders() {
        generations.invalidateAll()
        let previousTask = schedulingTask
        schedulingTask = Task {
            await previousTask?.value
            let requests = await center.pendingNotificationRequests()
            let identifiers = WorthlyReminderIdentifiers.matching(requests.map(\.identifier))
            center.removePendingNotificationRequests(withIdentifiers: identifiers)
            let notifications = await center.deliveredNotifications()
            let deliveredIdentifiers = WorthlyReminderIdentifiers.matching(notifications.map { $0.request.identifier })
            center.removeDeliveredNotifications(withIdentifiers: deliveredIdentifiers)
        }
    }

    func reschedule(for item: WorthlyItem) {
        generations.invalidate(for: item.id)
        let identifiers = CheckInStage.allCases.map { identifier(for: item.id, stage: $0) }
        center.removePendingNotificationRequests(withIdentifiers: identifiers)

        let completedIdentifiers = CheckInStage.allCases
            .filter { CheckInSchedule.isCompleted($0, for: item) }
            .map { identifier(for: item.id, stage: $0) }
        center.removeDeliveredNotifications(withIdentifiers: completedIdentifiers)

        guard
            isEnabled,
            item.state == .bought,
            let stage = CheckInSchedule.nextPendingStage(for: item)
        else { return }

        schedule(item: item, stage: stage)
    }

    func cancel(item: WorthlyItem, stage: CheckInStage) {
        generations.invalidate(for: item.id)
        center.removePendingNotificationRequests(withIdentifiers: [identifier(for: item.id, stage: stage)])
    }

    func cancelReminders(for itemID: UUID) {
        generations.invalidate(for: itemID)
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

        // Snapshot identifiers before awaiting; never carry a SwiftData object across this task.
        let itemID = item.id
        let token = generations.token(for: itemID)
        let previousTask = schedulingTask
        schedulingTask = Task {
            await previousTask?.value
            guard isEnabled, generations.isCurrent(token, for: itemID) else { return }
            do {
                try await center.add(request)
            } catch { return }
            if !isEnabled || !generations.isCurrent(token, for: itemID) {
                center.removePendingNotificationRequests(withIdentifiers: [request.identifier])
            }
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
