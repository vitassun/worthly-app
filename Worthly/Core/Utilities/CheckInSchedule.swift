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
    /// 随时回访（非 7 / 30 / 90 阶段）在存储中用 0 表示，不占用任何阶段。
    static let adHocStageDays = 0

    static func anchorDate(for item: WorthlyItem) -> Date? {
        guard item.state == .bought else { return nil }
        return item.purchaseDate ?? item.decisionDate
    }

    static func dueDate(for item: WorthlyItem, stage: CheckInStage) -> Date? {
        guard let anchor = anchorDate(for: item) else { return nil }
        return Calendar.current.date(byAdding: .day, value: stage.rawValue, to: anchor)
    }

    /// Purchase capture records a calendar day; the entire review day is available,
    /// including the morning notification, regardless of the anchor's clock time.
    static func isDue(_ stage: CheckInStage, for item: WorthlyItem, now: Date = .now) -> Bool {
        guard let dueDate = dueDate(for: item, stage: stage) else { return false }
        return Calendar.current.startOfDay(for: dueDate) <= Calendar.current.startOfDay(for: now)
    }

    static func completedStages(for item: WorthlyItem) -> Set<Int> {
        Set(item.checkIns.map(\.stageDays)).subtracting([adHocStageDays])
    }

    /// 按记录时间升序；同一时间的按阶段、再按 id 稳定排序。
    static func timeline(for item: WorthlyItem) -> [CheckIn] {
        item.checkIns.sorted { lhs, rhs in
            if lhs.createdAt != rhs.createdAt { return lhs.createdAt < rhs.createdAt }
            if lhs.stageDays != rhs.stageDays { return lhs.stageDays < rhs.stageDays }
            return lhs.id.uuidString < rhs.id.uuidString
        }
    }

    static func nextPendingStage(for item: WorthlyItem) -> CheckInStage? {
        guard item.state == .bought else { return nil }

        let completed = completedStages(for: item)
        return CheckInStage.allCases
            .sorted { $0.rawValue < $1.rawValue }
            .first { !completed.contains($0.rawValue) }
    }

    static func dueEntry(for item: WorthlyItem, now: Date = .now) -> CheckInDueEntry? {
        guard
            let stage = nextPendingStage(for: item),
            let dueDate = dueDate(for: item, stage: stage),
            isDue(stage, for: item, now: now)
        else {
            return nil
        }

        return CheckInDueEntry(item: item, stage: stage, dueDate: dueDate)
    }

    static func dueEntries(for items: [WorthlyItem], now: Date = .now) -> [CheckInDueEntry] {
        items
            .compactMap { dueEntry(for: $0, now: now) }
            .sorted { lhs, rhs in
                if lhs.dueDate != rhs.dueDate { return lhs.dueDate < rhs.dueDate }
                if lhs.item.createdAt != rhs.item.createdAt { return lhs.item.createdAt < rhs.item.createdAt }
                return lhs.item.id.uuidString < rhs.item.id.uuidString
            }
    }

    static func isCompleted(_ stage: CheckInStage, for item: WorthlyItem) -> Bool {
        completedStages(for: item).contains(stage.rawValue)
    }
}
