import Foundation
import SwiftData

/// Corrects a saved reflection without rewriting its identity, stage or original date.
enum CheckInRecordService {
    enum EditError: LocalizedError {
        case unavailable
        case invalidScore

        var errorDescription: String? {
            switch self {
            case .unavailable: "这次回访已经不存在，或不属于这条已购记录。"
            case .invalidScore: "满意度需要在 1 到 10 分之间。"
            }
        }
    }

    static func update(
        _ checkIn: CheckIn,
        for item: WorthlyItem,
        satisfactionScore: Int,
        usageFrequency: UsageFrequency,
        note: String,
        in modelContext: ModelContext,
        saveChanges: (() throws -> Void)? = nil
    ) throws {
        guard item.state == .bought,
              checkIn.item?.id == item.id,
              item.checkIns.contains(where: { $0.id == checkIn.id }) else {
            throw EditError.unavailable
        }
        guard (1...10).contains(satisfactionScore) else { throw EditError.invalidScore }

        let originalScore = checkIn.satisfactionScore
        let originalUsage = checkIn.usageFrequency
        let originalNote = checkIn.note

        checkIn.satisfactionScore = satisfactionScore
        checkIn.usageFrequency = usageFrequency.rawValue
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        checkIn.note = trimmedNote.isEmpty ? nil : trimmedNote

        do {
            if let saveChanges { try saveChanges() } else { try modelContext.save() }
        } catch {
            modelContext.rollback()
            // SwiftData may not have registered these synchronous property mutations yet.
            // Restore the live model as well as rolling back the persistence transaction.
            checkIn.satisfactionScore = originalScore
            checkIn.usageFrequency = originalUsage
            checkIn.note = originalNote
            throw error
        }
    }
}
