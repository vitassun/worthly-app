import Foundation

struct DecisionReviewEntry: Identifiable {
    let item: WorthlyItem
    let dueDate: Date

    var id: String {
        item.id.uuidString
    }
}

enum DecisionReviewSchedule {
    static let reviewIntervalDays = 7

    static func anchorDate(for item: WorthlyItem) -> Date? {
        guard item.state == .considering else { return nil }
        return item.createdAt
    }

    static func dueDate(for item: WorthlyItem) -> Date? {
        guard let anchor = anchorDate(for: item) else { return nil }
        return Calendar.current.date(byAdding: .day, value: reviewIntervalDays, to: anchor)
    }

    static func isDue(_ item: WorthlyItem, now: Date = .now) -> Bool {
        guard let dueDate = dueDate(for: item) else { return false }
        return dueDate <= now
    }

    static func dueEntries(for items: [WorthlyItem], now: Date = .now) -> [DecisionReviewEntry] {
        items
            .compactMap { item in
                guard let dueDate = dueDate(for: item), dueDate <= now else { return nil }
                return DecisionReviewEntry(item: item, dueDate: dueDate)
            }
            .sorted { lhs, rhs in
                if lhs.dueDate != rhs.dueDate {
                    return lhs.dueDate < rhs.dueDate
                }
                if lhs.item.createdAt != rhs.item.createdAt {
                    return lhs.item.createdAt < rhs.item.createdAt
                }
                return lhs.item.id.uuidString < rhs.item.id.uuidString
            }
    }
}
