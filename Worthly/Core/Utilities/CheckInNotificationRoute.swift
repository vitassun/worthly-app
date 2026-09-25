import Foundation

enum CheckInNotificationDestination: Equatable {
    case home
    case checkIn(itemID: UUID, stage: CheckInStage)
    case itemDetail(itemID: UUID)
}

struct CheckInNotificationRoute: Equatable, Identifiable {
    let itemID: UUID
    let stage: CheckInStage

    var id: String { "\(itemID.uuidString)-\(stage.rawValue)" }

    static func parse(userInfo: [AnyHashable: Any]) -> CheckInNotificationRoute? {
        guard
            let rawID = userInfo["itemID"] as? String,
            let itemID = UUID(uuidString: rawID),
            let rawStage = userInfo["stage"] as? Int,
            let stage = CheckInStage(rawValue: rawStage)
        else { return nil }

        return CheckInNotificationRoute(itemID: itemID, stage: stage)
    }

    func destination(in items: [WorthlyItem]) -> CheckInNotificationDestination {
        guard let item = items.first(where: { $0.id == itemID }), item.state == .bought else {
            return .home
        }

        if CheckInSchedule.isCompleted(stage, for: item) {
            return .itemDetail(itemID: itemID)
        }

        guard CheckInSchedule.nextPendingStage(for: item) == stage else {
            return .itemDetail(itemID: itemID)
        }

        return .checkIn(itemID: itemID, stage: stage)
    }
}
