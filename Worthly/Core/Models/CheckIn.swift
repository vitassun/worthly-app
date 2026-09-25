import Foundation
import SwiftData

enum CheckInStage: Int, CaseIterable, Identifiable {
    case day7 = 7
    case day30 = 30
    case day90 = 90

    var id: Int { rawValue }
    var displayName: String { "\(rawValue) 天" }
}

enum UsageFrequency: String, CaseIterable, Identifiable {
    case daily
    case severalTimesWeek
    case weekly
    case rarely
    case notUsedYet

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .daily: "几乎每天"
        case .severalTimesWeek: "每周几次"
        case .weekly: "大约每周"
        case .rarely: "很少"
        case .notUsedYet: "几乎没用"
        }
    }
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
        usageFrequency: UsageFrequency,
        note: String? = nil,
        createdAt: Date = .now,
        item: WorthlyItem? = nil
    ) {
        self.id = id
        self.stageDays = stage.rawValue
        self.satisfactionScore = satisfactionScore
        self.usageFrequency = usageFrequency.rawValue
        self.note = note
        self.createdAt = createdAt
        self.item = item
    }

    var stage: CheckInStage? {
        CheckInStage(rawValue: stageDays)
    }

    var usage: UsageFrequency {
        UsageFrequency(rawValue: usageFrequency) ?? .weekly
    }
}
