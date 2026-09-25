import Foundation

struct CheckInDueEntry: Identifiable {
    let item: WorthlyItem
    let stage: CheckInStage
    let dueDate: Date

    var id: String {
        "\(item.id.uuidString)-\(stage.rawValue)"
    }
}

enum CheckInSchedule {
    static func anchorDate(for item: WorthlyItem) -> Date? {
        guard item.state == .bought else { return nil }
        return item.purchaseDate ?? item.decisionDate
    }

    static func dueDate(for item: WorthlyItem, stage: CheckInStage) -> Date? {
        guard let anchor = anchorDate(for: item) else { return nil }
        return Calendar.current.date(byAdding: .day, value: stage.rawValue, to: anchor)
    }

    static func completedStages(for item: WorthlyItem) -> Set<Int> {
        Set(item.checkIns.map(\.stageDays))
    }

    static func nextPendingStage(for item: WorthlyItem) -> CheckInStage? {
        let completed = completedStages(for: item)
        return CheckInStage.allCases
            .sorted { $0.rawValue < $1.rawValue }
            .first { !completed.contains($0.rawValue) }
    }

    static func dueEntry(for item: WorthlyItem, now: Date = .now) -> CheckInDueEntry? {
        guard
            let stage = nextPendingStage(for: item),
            let dueDate = dueDate(for: item, stage: stage),
            dueDate <= now
        else {
            return nil
        }

        return CheckInDueEntry(item: item, stage: stage, dueDate: dueDate)
    }

    static func dueEntries(for items: [WorthlyItem], now: Date = .now) -> [CheckInDueEntry] {
        items
            .compactMap { dueEntry(for: $0, now: now) }
            .sorted { lhs, rhs in
                if lhs.dueDate == rhs.dueDate {
                    return lhs.item.createdAt < rhs.item.createdAt
                }
                return lhs.dueDate < rhs.dueDate
            }
    }

    static func isCompleted(_ stage: CheckInStage, for item: WorthlyItem) -> Bool {
        completedStages(for: item).contains(stage.rawValue)
    }
}
