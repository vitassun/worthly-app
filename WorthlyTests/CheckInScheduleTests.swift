import XCTest
import SwiftData
@testable import Worthly

final class CheckInScheduleTests: XCTestCase {
    func testPurchaseAfterEightDaysIsDueAtSevenDays() throws {
        let purchase = fixedDate
        let item = makeBoughtItem(purchaseDate: purchase)
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 8, to: purchase))

        let due = CheckInSchedule.dueEntry(for: item, now: now)
        XCTAssertEqual(due?.stage, .day7)
        XCTAssertEqual(due?.dueDate, Calendar.current.date(byAdding: .day, value: 7, to: purchase))
    }

    func testThirtyOneDaysAndCompletedSevenDayStageIsDueAtThirtyDays() throws {
        let purchase = fixedDate
        let item = makeBoughtItem(purchaseDate: purchase, completed: [.day7])
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 31, to: purchase))

        XCTAssertEqual(CheckInSchedule.dueEntry(for: item, now: now)?.stage, .day30)
    }

    func testOneHundredDaysWithoutCheckInsStillReturnsOnlySevenDayStage() throws {
        let purchase = fixedDate
        let item = makeBoughtItem(purchaseDate: purchase)
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 100, to: purchase))

        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day7)
        XCTAssertEqual(CheckInSchedule.dueEntry(for: item, now: now)?.stage, .day7)
    }

    func testSevenAndThirtyDayCompletionAdvanceSequentiallyToNinetyDays() throws {
        let purchase = fixedDate
        let sevenDone = makeBoughtItem(purchaseDate: purchase, completed: [.day7])
        let afterThirty = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 31, to: purchase))
        XCTAssertEqual(CheckInSchedule.dueEntry(for: sevenDone, now: afterThirty)?.stage, .day30)

        let thirtyDone = makeBoughtItem(purchaseDate: purchase, completed: [.day7, .day30])
        let afterNinety = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 91, to: purchase))
        XCTAssertEqual(CheckInSchedule.dueEntry(for: thirtyDone, now: afterNinety)?.stage, .day90)
    }

    func testCompletingNinetyDayStageLeavesNoPendingStage() {
        let item = makeBoughtItem(purchaseDate: fixedDate, completed: [.day7, .day30, .day90])
        XCTAssertNil(CheckInSchedule.nextPendingStage(for: item))
        XCTAssertNil(CheckInSchedule.dueEntry(for: item, now: .distantFuture))
    }

    func testConsideringAndPassedItemsAreNotScheduled() {
        let considering = WorthlyItem(name: "Considering", state: .considering, purchaseDate: fixedDate)
        let passed = WorthlyItem(name: "Passed", state: .passed, purchaseDate: fixedDate)
        XCTAssertNil(CheckInSchedule.dueEntry(for: considering, now: .distantFuture))
        XCTAssertNil(CheckInSchedule.dueEntry(for: passed, now: .distantFuture))
        XCTAssertNil(CheckInSchedule.nextPendingStage(for: considering))
        XCTAssertNil(CheckInSchedule.nextPendingStage(for: passed))
    }

    func testDecisionDateIsPurchaseDateFallback() {
        let item = WorthlyItem(name: "Fallback", state: .bought, decisionDate: fixedDate)
        XCTAssertEqual(CheckInSchedule.anchorDate(for: item), fixedDate)
    }

    func testCompletedStageIsNotReturnedAgain() {
        let item = makeBoughtItem(purchaseDate: fixedDate, completed: [.day7])
        XCTAssertTrue(CheckInSchedule.isCompleted(.day7, for: item))
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day30)
    }

    func testAdHocCheckInDoesNotCompleteOrAdvanceAnyStage() throws {
        let purchase = fixedDate
        let item = makeBoughtItem(purchaseDate: purchase)
        _ = CheckIn(stage: nil, satisfactionScore: 9, usageFrequency: .weekly, item: item)

        XCTAssertTrue(CheckInSchedule.completedStages(for: item).isEmpty)
        XCTAssertFalse(CheckInSchedule.isCompleted(.day7, for: item))
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day7)

        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 8, to: purchase))
        XCTAssertEqual(CheckInSchedule.dueEntry(for: item, now: now)?.stage, .day7)
    }

    func testAdHocCheckInDoesNotBlockSequentialStages() {
        let item = makeBoughtItem(purchaseDate: fixedDate, completed: [.day7])
        _ = CheckIn(stage: nil, satisfactionScore: 9, usageFrequency: .weekly, item: item)
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day30)
    }

    func testAdHocCheckInIsStoredAsZeroAndMarked() {
        let item = makeBoughtItem(purchaseDate: fixedDate)
        let checkIn = CheckIn(stage: nil, satisfactionScore: 9, usageFrequency: .weekly, item: item)
        XCTAssertTrue(checkIn.isAdHoc)
        XCTAssertNil(checkIn.stage)
        XCTAssertEqual(checkIn.stageDays, 0)
    }

    func testTimelineOrdersChronologicallyThenByStage() {
        let item = makeBoughtItem(purchaseDate: fixedDate)
        let base = fixedDate
        _ = CheckIn(stage: .day7, satisfactionScore: 7, usageFrequency: .weekly, createdAt: base, item: item)
        _ = CheckIn(stage: nil, satisfactionScore: 8, usageFrequency: .weekly, createdAt: base.addingTimeInterval(60), item: item)
        _ = CheckIn(stage: .day30, satisfactionScore: 9, usageFrequency: .weekly, createdAt: base.addingTimeInterval(120), item: item)

        XCTAssertEqual(CheckInSchedule.timeline(for: item).map(\.stageDays), [7, 0, 30])
    }

    private var fixedDate: Date {
        Date(timeIntervalSince1970: 1_735_689_600)
    }

    private func makeBoughtItem(purchaseDate: Date, completed: [CheckInStage] = []) -> WorthlyItem {
        let item = WorthlyItem(name: "Bought", state: .bought, purchaseDate: purchaseDate)
        for stage in completed {
            _ = CheckIn(stage: stage, satisfactionScore: 8, usageFrequency: .weekly, item: item)
        }
        return item
    }
}
