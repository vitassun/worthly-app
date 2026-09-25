import Foundation
import SwiftData

enum ItemState: String, CaseIterable, Identifiable {
    case considering
    case bought
    case passed
    case archived

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .considering: "考虑中"
        case .bought: "已购买"
        case .passed: "没买"
        case .archived: "已归档"
        }
    }
}

enum PurchaseReason: String, CaseIterable, Identifiable {
    case need
    case experience
    case reward
    case trend
    case mood
    case discount
    case appearance
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .need: "需要"
        case .experience: "提升体验"
        case .reward: "奖励自己"
        case .trend: "被种草"
        case .mood: "情绪"
        case .discount: "折扣"
        case .appearance: "好看"
        case .other: "其他"
        }
    }
}

enum ExpectedUsage: String, CaseIterable, Identifiable {
    case daily
    case weekly
    case occasionally
    case unsure

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .daily: "每天"
        case .weekly: "每周"
        case .occasionally: "偶尔"
        case .unsure: "不知道"
        }
    }
}

@Model
final class WorthlyItem {
    var id: UUID
    var name: String
    var category: String
    var sourceNote: String?
    var createdAt: Date

    var stateRawValue: String
    var reasonRawValue: String
    var expectedUsageRawValue: String

    var desireScore: Int
    var originalPrice: Double?
    var paidPrice: Double?
    var purchaseDate: Date?

    @Relationship(deleteRule: .cascade, inverse: \CheckIn.item)
    var checkIns: [CheckIn] = []

    init(
        id: UUID = UUID(),
        name: String,
        category: String = "其他",
        sourceNote: String? = nil,
        createdAt: Date = .now,
        state: ItemState = .considering,
        reason: PurchaseReason = .need,
        expectedUsage: ExpectedUsage = .unsure,
        desireScore: Int = 5,
        originalPrice: Double? = nil,
        paidPrice: Double? = nil,
        purchaseDate: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.category = category
        self.sourceNote = sourceNote
        self.createdAt = createdAt
        self.stateRawValue = state.rawValue
        self.reasonRawValue = reason.rawValue
        self.expectedUsageRawValue = expectedUsage.rawValue
        self.desireScore = desireScore
        self.originalPrice = originalPrice
        self.paidPrice = paidPrice
        self.purchaseDate = purchaseDate
    }

    var state: ItemState {
        get { ItemState(rawValue: stateRawValue) ?? .considering }
        set { stateRawValue = newValue.rawValue }
    }

    var reason: PurchaseReason {
        get { PurchaseReason(rawValue: reasonRawValue) ?? .other }
        set { reasonRawValue = newValue.rawValue }
    }

    var expectedUsage: ExpectedUsage {
        get { ExpectedUsage(rawValue: expectedUsageRawValue) ?? .unsure }
        set { expectedUsageRawValue = newValue.rawValue }
    }

    var savedAmount: Double? {
        guard let originalPrice, let paidPrice, originalPrice > 0, paidPrice <= originalPrice else {
            return nil
        }
        return originalPrice - paidPrice
    }

    var discountPercent: Double? {
        guard let originalPrice, let savedAmount, originalPrice > 0 else { return nil }
        return savedAmount / originalPrice
    }
}
