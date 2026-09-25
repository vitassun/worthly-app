import SwiftData

enum WorthlyDataDeletion {
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
