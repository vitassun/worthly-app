import XCTest
import SwiftData
@testable import Worthly

final class DecisionReviewScheduleTests: XCTestCase {
    func testConsideringItemIsNotDueBeforeSevenDays() throws {
        let item = makeConsideringItem(createdAt: fixedDate)
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 6, to: fixedDate))

        XCTAssertFalse(DecisionReviewSchedule.isDue(item, now: now))
        XCTAssertTrue(DecisionReviewSchedule.dueEntries(for: [item], now: now).isEmpty)
    }

    func testConsideringItemIsDueAtExactlySevenDays() throws {
        let item = makeConsideringItem(createdAt: fixedDate)
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 7, to: fixedDate))

        XCTAssertTrue(DecisionReviewSchedule.isDue(item, now: now))
        XCTAssertEqual(DecisionReviewSchedule.dueEntries(for: [item], now: now).map(\.item.id), [item.id])
    }

    func testDueDateIsCreationDatePlusReviewInterval() throws {
        let item = makeConsideringItem(createdAt: fixedDate)
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 40, to: fixedDate))

        let entry = try XCTUnwrap(DecisionReviewSchedule.dueEntries(for: [item], now: now).first)
        XCTAssertEqual(DecisionReviewSchedule.reviewIntervalDays, 7)
        XCTAssertEqual(entry.dueDate, Calendar.current.date(byAdding: .day, value: 7, to: fixedDate))
    }

    func testBoughtPassedAndArchivedItemsAreNeverDue() throws {
        let now = try XCTUnwrap(Calendar.current.date(byAdding: .day, value: 30, to: fixedDate))

        for state in [ItemState.bought, .passed, .archived] {
            let item = WorthlyItem(name: state.displayName, createdAt: fixedDate, state: state)

            XCTAssertNil(DecisionReviewSchedule.anchorDate(for: item), "\(state) must not anchor a decision review")
            XCTAssertNil(DecisionReviewSchedule.dueDate(for: item), "\(state) must not have a decision review due date")
            XCTAssertFalse(DecisionReviewSchedule.isDue(item, now: now), "\(state) must not be due")
            XCTAssertTrue(DecisionReviewSchedule.dueEntries(for: [item], now: now).isEmpty, "\(state) must not produce an entry")
        }
    }

    func testDueEntriesSkipItemsThatAreNotDue() throws {
        let due = makeConsideringItem(id: uuid(1), createdAt: date(-10))
        let notDue = makeConsideringItem(id: uuid(2), createdAt: date(-2))
        let bought = WorthlyItem(id: uuid(3), name: "Bought", createdAt: date(-30), state: .bought)
        let now = date(0)

        let entries = DecisionReviewSchedule.dueEntries(for: [due, notDue, bought], now: now)

        XCTAssertEqual(entries.map(\.item.id), [due.id])
    }

    func testDueEntriesUseDeterministicDueDateThenCreatedAtThenIdentifierOrder() throws {
        let shared = date(-10)
        let highIdentifier = makeConsideringItem(id: uuid(9), createdAt: shared)
        let lowIdentifier = makeConsideringItem(id: uuid(1), createdAt: shared)
        let earliest = makeConsideringItem(id: uuid(5), createdAt: date(-20))

        let entries = DecisionReviewSchedule.dueEntries(for: [highIdentifier, lowIdentifier, earliest], now: date(0))

        XCTAssertEqual(entries.map(\.item.id), [earliest.id, lowIdentifier.id, highIdentifier.id])
    }

    func testEachDueConsideringItemProducesExactlyOneEntry() {
        let items = [
            makeConsideringItem(id: uuid(1), createdAt: date(-10)),
            makeConsideringItem(id: uuid(2), createdAt: date(-8)),
            makeConsideringItem(id: uuid(3), createdAt: date(-30))
        ]

        let entries = DecisionReviewSchedule.dueEntries(for: items, now: date(0))

        XCTAssertEqual(entries.count, items.count)
        XCTAssertEqual(Set(entries.map(\.id)).count, entries.count)
    }

    private var fixedDate: Date {
        Date(timeIntervalSince1970: 1_735_689_600)
    }

    private func makeConsideringItem(id: UUID = UUID(), createdAt: Date) -> WorthlyItem {
        WorthlyItem(id: id, name: "Considering", createdAt: createdAt, state: .considering)
    }

    private func uuid(_ value: Int) -> UUID {
        UUID(uuidString: String(format: "00000000-0000-0000-0000-%012d", value)) ?? UUID()
    }

    private func date(_ offset: TimeInterval) -> Date {
        Date(timeIntervalSince1970: 1_735_689_600 + offset)
    }
}
