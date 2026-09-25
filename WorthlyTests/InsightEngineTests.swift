import XCTest
import SwiftData
@testable import Worthly

final class InsightEngineTests: XCTestCase {
    func testZeroAndTwoEvaluationsDoNotCreatePersonalInsights() {
        XCTAssertTrue(InsightEngine.snapshot(for: []).cards.isEmpty)

        let two = [
            makeItem(checkIns: [(.day7, 8)]),
            makeItem(checkIns: [(.day7, 6)])
        ]
        let snapshot = InsightEngine.snapshot(for: two)
        XCTAssertEqual(snapshot.evaluatedCount, 2)
        XCTAssertNil(snapshot.averageSatisfaction)
        XCTAssertTrue(snapshot.cards.isEmpty)
    }

    func testThreeEvaluationsCreateSnapshotAndExpectationCard() {
        let items = [
            makeItem(desire: 9, checkIns: [(.day7, 4)]),
            makeItem(desire: 7, checkIns: [(.day7, 6)]),
            makeItem(desire: 8, checkIns: [(.day7, 5)])
        ]

        let snapshot = InsightEngine.snapshot(for: items)
        XCTAssertEqual(snapshot.evaluatedCount, 3)
        XCTAssertEqual(snapshot.averageSatisfaction, 5)
        XCTAssertTrue(snapshot.cards.contains { $0.id == "expectation-reality" })
    }

    func testLatestStageWinsOncePerItem() {
        let item = makeItem(checkIns: [(.day7, 2), (.day30, 8)])
        let snapshot = InsightEngine.snapshot(for: [item])
        XCTAssertEqual(snapshot.evaluatedCount, 1)
        XCTAssertEqual(snapshot.matureCount, 1)
        XCTAssertEqual(snapshot.averageSatisfaction, 8)

        let allStages = makeItem(checkIns: [(.day7, 2), (.day30, 5), (.day90, 9)])
        let latest = InsightEngine.snapshot(for: [allStages])
        XCTAssertEqual(latest.evaluatedCount, 1)
        XCTAssertEqual(latest.matureCount, 1)
        XCTAssertEqual(latest.averageSatisfaction, 9)
    }

    func testPassedAndConsideringItemsDoNotContribute() {
        let passed = makeItem(state: .passed, checkIns: [(.day90, 9)])
        let considering = makeItem(state: .considering, checkIns: [(.day30, 8)])
        let snapshot = InsightEngine.snapshot(for: [passed, considering])
        XCTAssertEqual(snapshot.evaluatedCount, 0)
        XCTAssertNil(snapshot.averageSatisfaction)
        XCTAssertTrue(snapshot.cards.isEmpty)
    }

    func testDiscountPatternRequiresTwoItemsInEachGroup() {
        let oneVsThree = [
            makeItem(originalPrice: 100, paidPrice: 70, checkIns: [(.day30, 8)]),
            makeItem(originalPrice: 100, paidPrice: 90, checkIns: [(.day30, 7)]),
            makeItem(originalPrice: 100, paidPrice: 95, checkIns: [(.day30, 6)]),
            makeItem(originalPrice: 100, paidPrice: 99, checkIns: [(.day30, 5)])
        ]
        XCTAssertFalse(InsightEngine.snapshot(for: oneVsThree).cards.contains { $0.id == "discount-pattern" })

        let twoVsTwo = [
            makeItem(originalPrice: 100, paidPrice: 70, checkIns: [(.day30, 8)]),
            makeItem(originalPrice: 100, paidPrice: 75, checkIns: [(.day90, 7)]),
            makeItem(originalPrice: 100, paidPrice: 90, checkIns: [(.day30, 6)]),
            makeItem(originalPrice: 100, paidPrice: 95, checkIns: [(.day90, 5)])
        ]
        XCTAssertTrue(InsightEngine.snapshot(for: twoVsTwo).cards.contains { $0.id == "discount-pattern" })
    }

    func testInvalidPricesAreExcludedFromDiscountGroups() {
        let items = [
            makeItem(originalPrice: 100, paidPrice: 70, checkIns: [(.day30, 8)]),
            makeItem(originalPrice: 100, paidPrice: 75, checkIns: [(.day30, 7)]),
            makeItem(originalPrice: 100, paidPrice: 90, checkIns: [(.day30, 6)]),
            makeItem(originalPrice: 100, paidPrice: 110, checkIns: [(.day30, 5)])
        ]
        XCTAssertFalse(InsightEngine.snapshot(for: items).cards.contains { $0.id == "discount-pattern" })

        let missingAndZero = [
            makeItem(originalPrice: 100, paidPrice: 70, checkIns: [(.day30, 8)]),
            makeItem(originalPrice: 100, paidPrice: 75, checkIns: [(.day30, 7)]),
            makeItem(originalPrice: 100, paidPrice: 0, checkIns: [(.day30, 6)]),
            makeItem(originalPrice: nil, paidPrice: 90, checkIns: [(.day30, 5)])
        ]
        XCTAssertFalse(InsightEngine.snapshot(for: missingAndZero).cards.contains { $0.id == "discount-pattern" })
    }

    func testCategoryNeedsThreeMatureItems() {
        let two = [
            makeItem(category: "数码", checkIns: [(.day30, 8)]),
            makeItem(category: "数码", checkIns: [(.day90, 7)])
        ]
        XCTAssertFalse(InsightEngine.snapshot(for: two).cards.contains { $0.id == "category-pattern" })

        let three = two + [makeItem(category: "数码", checkIns: [(.day30, 9)])]
        XCTAssertTrue(InsightEngine.snapshot(for: three).cards.contains { $0.id == "category-pattern" })
    }

    func testLongTermMemoryRequiresThreeMatureItems() {
        let earlyOnly = [
            makeItem(checkIns: [(.day7, 8)]),
            makeItem(checkIns: [(.day7, 7)]),
            makeItem(checkIns: [(.day7, 6)])
        ]
        XCTAssertFalse(InsightEngine.snapshot(for: earlyOnly).cards.contains { $0.id == "long-term-extremes" })

        let mature = [
            makeItem(checkIns: [(.day30, 8)]),
            makeItem(checkIns: [(.day30, 7)]),
            makeItem(checkIns: [(.day90, 6)])
        ]
        XCTAssertTrue(InsightEngine.snapshot(for: mature).cards.contains { $0.id == "long-term-extremes" })
    }

    func testMetricsRemainFiniteAndNonemptyForExtremePrices() {
        let items = [
            makeItem(originalPrice: .greatestFiniteMagnitude, paidPrice: 1, checkIns: [(.day90, 9)]),
            makeItem(originalPrice: .infinity, paidPrice: .nan, checkIns: [(.day30, 8)]),
            makeItem(originalPrice: 0, paidPrice: 0, checkIns: [(.day7, 7)])
        ]
        let snapshot = InsightEngine.snapshot(for: items)
        XCTAssertNotNil(snapshot.averageSatisfaction)
        XCTAssertTrue(snapshot.averageSatisfaction?.isFinite == true)
        XCTAssertFalse(snapshot.cards.contains { card in
            [card.leftValue, card.rightValue].compactMap { $0 }
                .contains { $0.isEmpty || $0.localizedCaseInsensitiveContains("nan") || $0.localizedCaseInsensitiveContains("inf") }
        })
    }

    private func makeItem(
        state: ItemState = .bought,
        category: String = "其他",
        desire: Int = 7,
        originalPrice: Double? = nil,
        paidPrice: Double? = nil,
        checkIns: [(CheckInStage, Int)]
    ) -> WorthlyItem {
        let item = WorthlyItem(
            name: "Item \(UUID().uuidString.prefix(5))",
            category: category,
            state: state,
            desireScore: desire,
            originalPrice: originalPrice,
            paidPrice: paidPrice,
            purchaseDate: .now
        )
        for (stage, score) in checkIns {
            _ = CheckIn(stage: stage, satisfactionScore: score, usageFrequency: .weekly, item: item)
        }
        return item
    }
}
