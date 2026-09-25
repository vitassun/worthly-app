import Foundation

struct InsightCardModel: Identifiable, Equatable {
    let id: String
    let overline: String
    let headline: String
    let detail: String
    let leftLabel: String?
    let leftValue: String?
    let rightLabel: String?
    let rightValue: String?
    let isEmphasis: Bool

    init(
        id: String,
        overline: String,
        headline: String,
        detail: String,
        leftLabel: String? = nil,
        leftValue: String? = nil,
        rightLabel: String? = nil,
        rightValue: String? = nil,
        isEmphasis: Bool = false
    ) {
        self.id = id
        self.overline = overline
        self.headline = headline
        self.detail = detail
        self.leftLabel = leftLabel
        self.leftValue = leftValue
        self.rightLabel = rightLabel
        self.rightValue = rightValue
        self.isEmphasis = isEmphasis
    }
}

struct InsightSnapshot {
    let evaluatedCount: Int
    let matureCount: Int
    let averageSatisfaction: Double?
    let cards: [InsightCardModel]

    var primaryCard: InsightCardModel? {
        cards.first
    }
}

enum InsightEngine {
    private static let minimumEarlySample = 3
    private static let minimumMatureSample = 3
    private static let minimumCategorySample = 3
    private static let minimumDiscountGroupSample = 2
    private static let meaningfulDiscountThreshold = 0.20
    private static let meaningfulScoreGap = 0.5

    private struct Evaluation {
        let item: WorthlyItem
        let checkIn: CheckIn

        var satisfaction: Double {
            Double(checkIn.satisfactionScore)
        }

        var desire: Double {
            Double(item.desireScore)
        }

        var stageDays: Int {
            checkIn.stageDays
        }
    }

    static func snapshot(for items: [WorthlyItem]) -> InsightSnapshot {
        let evaluations = items.compactMap(evaluation(for:))
        let matureEvaluations = evaluations.filter { $0.stageDays >= CheckInStage.day30.rawValue }

        var cards: [InsightCardModel] = []

        if evaluations.count >= minimumEarlySample {
            cards.append(expectationRealityCard(from: evaluations))
        }

        if let discountCard = discountCard(from: matureEvaluations) {
            cards.append(discountCard)
        }

        if let categoryCard = categoryCard(from: matureEvaluations) {
            cards.append(categoryCard)
        }

        if let longTermCard = longTermPurchaseCard(from: matureEvaluations) {
            cards.append(longTermCard)
        }

        return InsightSnapshot(
            evaluatedCount: evaluations.count,
            matureCount: matureEvaluations.count,
            averageSatisfaction: evaluations.count >= minimumEarlySample ? average(evaluations.map(\.satisfaction)) : nil,
            cards: cards
        )
    }

    static func remainingUntilFirstInsight(for items: [WorthlyItem]) -> Int {
        max(0, minimumEarlySample - items.compactMap(evaluation(for:)).count)
    }

    private static func evaluation(for item: WorthlyItem) -> Evaluation? {
        guard item.state == .bought,
              (1...10).contains(item.desireScore),
              let latest = latestCheckIn(for: item) else {
            return nil
        }

        return Evaluation(item: item, checkIn: latest)
    }

    private static func latestCheckIn(for item: WorthlyItem) -> CheckIn? {
        item.checkIns
            .filter {
                CheckInStage(rawValue: $0.stageDays) != nil
                    && (1...10).contains($0.satisfactionScore)
            }
            .max { lhs, rhs in
                if lhs.stageDays == rhs.stageDays {
                    if lhs.createdAt == rhs.createdAt {
                        return lhs.id.uuidString > rhs.id.uuidString
                    }
                    return lhs.createdAt < rhs.createdAt
                }
                return lhs.stageDays < rhs.stageDays
            }
    }

    private static func expectationRealityCard(from evaluations: [Evaluation]) -> InsightCardModel {
        let averageDesire = average(evaluations.map(\.desire)) ?? 0
        let averageSatisfaction = average(evaluations.map(\.satisfaction)) ?? 0
        let gap = averageSatisfaction - averageDesire

        let headline: String
        if abs(gap) < meaningfulScoreGap {
            headline = "你买前的想要程度，和后来满意度很接近。"
        } else if gap < 0 {
            headline = "你买前通常比后来更兴奋。"
        } else {
            headline = "有些东西，买了以后反而比预期更值。"
        }

        let detail: String
        if abs(gap) < meaningfulScoreGap {
            detail = "基于 \(evaluations.count) 件已经回访的购买。两者平均只差 \(format(abs(gap))) 分，Worthly 暂时不会把它解读成明显偏差。"
        } else if gap < 0 {
            detail = "基于 \(evaluations.count) 件已经回访的购买。购买前想要度平均比最新满意度高 \(format(abs(gap))) 分。"
        } else {
            detail = "基于 \(evaluations.count) 件已经回访的购买。最新满意度平均比购买前想要度高 \(format(gap)) 分。"
        }

        return InsightCardModel(
            id: "expectation-reality",
            overline: "EXPECTATION / REALITY",
            headline: headline,
            detail: detail,
            leftLabel: "买前想要",
            leftValue: format(averageDesire),
            rightLabel: "后来满意",
            rightValue: format(averageSatisfaction),
            isEmphasis: true
        )
    }

    private static func discountCard(from evaluations: [Evaluation]) -> InsightCardModel? {
        let priced = evaluations.compactMap { evaluation -> (Evaluation, Double)? in
            guard let original = evaluation.item.originalPrice,
                  let paid = evaluation.item.paidPrice,
                  original.isFinite,
                  paid.isFinite,
                  original > 0,
                  paid > 0,
                  paid <= original else {
                return nil
            }

            return (evaluation, (original - paid) / original)
        }

        let strongerDiscount = priced.filter { $0.1 >= meaningfulDiscountThreshold }
        let lighterDiscount = priced.filter { $0.1 < meaningfulDiscountThreshold }

        guard strongerDiscount.count >= minimumDiscountGroupSample,
              lighterDiscount.count >= minimumDiscountGroupSample else {
            return nil
        }

        let strongerAverage = average(strongerDiscount.map { $0.0.satisfaction }) ?? 0
        let lighterAverage = average(lighterDiscount.map { $0.0.satisfaction }) ?? 0
        let gap = strongerAverage - lighterAverage

        let headline: String
        if abs(gap) < meaningfulScoreGap {
            headline = "目前看，折扣大小和你的长期满意度差得不多。"
        } else if gap < 0 {
            headline = "你记录的大折扣购买，后来满意度反而更低。"
        } else {
            headline = "你记录的大折扣购买，后来满意度更高。"
        }

        return InsightCardModel(
            id: "discount-pattern",
            overline: "DISCOUNT PATTERN · 30+ DAYS",
            headline: headline,
            detail: "只比较已到 30 / 90 天、且同时记录原价和到手价的项目。这里描述的是你的样本关联，不代表折扣本身造成了结果。",
            leftLabel: "≥20% OFF · \(strongerDiscount.count)件",
            leftValue: format(strongerAverage),
            rightLabel: "<20% OFF · \(lighterDiscount.count)件",
            rightValue: format(lighterAverage)
        )
    }

    private static func categoryCard(from evaluations: [Evaluation]) -> InsightCardModel? {
        let grouped = Dictionary(grouping: evaluations) { evaluation in
            normalizedCategory(evaluation.item.category)
        }

        let qualified = grouped.compactMap { category, values -> (String, [Evaluation], Double)? in
            guard values.count >= minimumCategorySample,
                  let score = average(values.map(\.satisfaction)) else {
                return nil
            }
            return (category, values, score)
        }

        guard let strongest = qualified.max(by: { lhs, rhs in
            if lhs.2 != rhs.2 { return lhs.2 < rhs.2 }
            if lhs.1.count != rhs.1.count { return lhs.1.count < rhs.1.count }
            return lhs.0 > rhs.0
        }) else {
            return nil
        }

        return InsightCardModel(
            id: "category-pattern",
            overline: "CATEGORY PATTERN · 30+ DAYS",
            headline: "目前长期平均满意度最高的类别是「\(strongest.0)」。",
            detail: "这个结论只在同一类别至少积累 \(minimumCategorySample) 件 30 / 90 天回访后出现。目前基于 \(strongest.1.count) 件记录。",
            leftLabel: "长期满意",
            leftValue: format(strongest.2),
            rightLabel: "样本",
            rightValue: "\(strongest.1.count)"
        )
    }

    private static func longTermPurchaseCard(from evaluations: [Evaluation]) -> InsightCardModel? {
        guard evaluations.count >= minimumMatureSample,
              let highest = evaluations.max(by: { lhs, rhs in
                  if lhs.satisfaction != rhs.satisfaction {
                      return lhs.satisfaction < rhs.satisfaction
                  }
                  return lhs.item.id.uuidString > rhs.item.id.uuidString
              }),
              let lowest = evaluations.min(by: { lhs, rhs in
                  if lhs.satisfaction != rhs.satisfaction {
                      return lhs.satisfaction < rhs.satisfaction
                  }
                  return lhs.item.id.uuidString < rhs.item.id.uuidString
              }) else {
            return nil
        }

        let headline: String
        if highest.item.id == lowest.item.id || highest.satisfaction == lowest.satisfaction {
            headline = "你的长期购买满意度目前很接近。"
        } else {
            headline = "回看 30 天以后，最值和最不值已经开始分开了。"
        }

        return InsightCardModel(
            id: "long-term-extremes",
            overline: "LONG-TERM MEMORY",
            headline: headline,
            detail: "只使用已经进入 30 / 90 天阶段的最新回访。它会随着后续回访继续变化。",
            leftLabel: truncatedMetricLabel(highest.item.name),
            leftValue: format(highest.satisfaction),
            rightLabel: truncatedMetricLabel(lowest.item.name),
            rightValue: format(lowest.satisfaction)
        )
    }

    private static func average(_ values: [Double]) -> Double? {
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private static func format(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(1)))
    }

    private static func normalizedCategory(_ category: String) -> String {
        let trimmed = category.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "其他" : trimmed
    }

    private static func truncatedMetricLabel(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalized = trimmed.isEmpty ? "未命名商品" : trimmed
        let limit = 10
        guard normalized.count > limit else { return normalized }
        return String(normalized.prefix(limit - 1)) + "…"
    }
}
