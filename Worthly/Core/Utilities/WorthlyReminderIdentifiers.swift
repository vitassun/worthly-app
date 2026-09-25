import Foundation

enum WorthlyReminderIdentifiers {
    static let prefix = "worthly.checkin."

    static func matching(_ identifiers: [String]) -> [String] {
        identifiers.filter { $0.hasPrefix(prefix) }
    }
}
