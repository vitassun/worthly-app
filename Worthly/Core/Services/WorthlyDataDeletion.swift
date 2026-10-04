import SwiftData

enum WorthlyDataDeletion {
    /// Only staged deletion changes the review queue. Side effects run after a successful save.
    static func deleteCheckIn(
        _ checkIn: CheckIn,
        in modelContext: ModelContext,
        refreshItemReminders: () -> Void,
        saveChanges: (() throws -> Void)? = nil
    ) throws {
        let isStaged = checkIn.stage != nil
        modelContext.delete(checkIn)
        do {
            if let saveChanges { try saveChanges() } else { try modelContext.save() }
            if isStaged { refreshItemReminders() }
        } catch {
            modelContext.rollback()
            throw error
        }
    }

    static func deleteAll(
        in modelContext: ModelContext,
        cancelWorthlyReminders: () -> Void
    ) throws {
        let items = try modelContext.fetch(FetchDescriptor<WorthlyItem>())
        for item in items {
            modelContext.delete(item)
        }
        try modelContext.save()
        cancelWorthlyReminders()
    }
}
