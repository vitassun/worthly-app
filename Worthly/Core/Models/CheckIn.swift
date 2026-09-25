import Foundation
import SwiftData

enum CheckInStage: Int, CaseIterable, Identifiable {
    case day7 = 7
    case day30 = 30
    case day90 = 90

    var id: Int { rawValue }
    var displayName: String { "\(rawValue) 天" }
}

@Model
final class CheckIn {
    var id: UUID
    var stageDays: Int
    var satisfactionScore: Int
    var usageFrequency: String
    var note: String?
    var createdAt: Date
    var item: WorthlyItem?

    init(
        id: UUID = UUID(),
        stage: CheckInStage,
        satisfactionScore: Int,
        usageFrequency: String,
        note: String? = nil,
        createdAt: Date = .now,
        item: WorthlyItem? = nil
    ) {
        self.id = id
        self.stageDays = stage.rawValue
        self.satisfactionScore = satisfactionScore
        self.usageFrequency = usageFrequency
        self.note = note
        self.createdAt = createdAt
        self.item = item
    }

    var stage: CheckInStage? {
        CheckInStage(rawValue: stageDays)
    }
}
