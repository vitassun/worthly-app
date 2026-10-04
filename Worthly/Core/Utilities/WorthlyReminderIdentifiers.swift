import Foundation

enum WorthlyReminderIdentifiers {
    static let prefix = "worthly.checkin."

    static func matching(_ identifiers: [String]) -> [String] {
        identifiers.filter { $0.hasPrefix(prefix) }
    }
}

/// Snapshots invalidate queued notification additions after a new schedule, delete or opt-out.
struct WorthlyReminderGeneration {
    struct Token: Equatable {
        let global: Int
        let item: Int
    }

    private var global = 0
    private var items: [UUID: Int] = [:]

    func token(for itemID: UUID) -> Token {
        Token(global: global, item: items[itemID, default: 0])
    }

    func isCurrent(_ token: Token, for itemID: UUID) -> Bool {
        token == self.token(for: itemID)
    }

    mutating func invalidate(for itemID: UUID) {
        items[itemID, default: 0] += 1
    }

    mutating func invalidateAll() {
        global += 1
        items.removeAll()
    }
}
