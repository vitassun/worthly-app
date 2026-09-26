import XCTest
import SwiftData
@testable import Worthly

final class ItemLibraryQueryTests: XCTestCase {
    func testSearchMatchesNameCategorySourceNoteReasonAndStateDisplayNames() {
        let item = makeItem(
            id: uuid(1),
            name: "Headphones",
            category: "数码",
            sourceNote: "朋友推荐",
            state: .passed,
            reason: .discount
        )

        for text in ["headphones", "数码", "朋友推荐", "折扣", "没买"] {
            let results = query([item], searchText: "  \(text) \n")
            XCTAssertEqual(results.map(\.id), [item.id], "Expected search to match \(text)")
        }
    }

    func testStateAndTrimmedCategoryFiltersCanBeCombined() {
        let matching = makeItem(id: uuid(1), name: "Match", category: " 数码 ", state: .bought)
        let wrongState = makeItem(id: uuid(2), name: "Wrong state", category: "数码", state: .considering)
        let wrongCategory = makeItem(id: uuid(3), name: "Wrong category", category: "生活", state: .bought)

        let results = ItemLibraryQuery.filtered(
            items: [matching, wrongState, wrongCategory],
            searchText: "",
            stateFilter: .bought,
            category: " 数码 ",
            sortOrder: .newest
        )

        XCTAssertEqual(results.map(\.id), [matching.id])
    }

    func testAllStateFilterIncludesEveryItemState() {
        let states: [ItemState] = [.considering, .bought, .passed, .archived]
        let items = states.enumerated().map { index, state in
            makeItem(id: uuid(index + 1), name: state.displayName, state: state)
        }

        let results = query(items, stateFilter: .all)

        XCTAssertEqual(results.count, states.count)
        for state in states {
            XCTAssertTrue(results.contains { $0.state == state })
        }
    }

    func testSortOrdersUseDeterministicDateDesireAndUUIDTieBreaks() {
        let oldestHighID = makeItem(id: uuid(4), createdAt: date(-10), desireScore: 9)
        let middle = makeItem(id: uuid(3), createdAt: date(0), desireScore: 8)
        let newestHighID = makeItem(id: uuid(2), createdAt: date(10), desireScore: 9)
        let newestLowID = makeItem(id: uuid(1), createdAt: date(10), desireScore: 9)
        let items = [oldestHighID, middle, newestHighID, newestLowID]

        XCTAssertEqual(
            query(items, sortOrder: .newest).map(\.id),
            [newestLowID.id, newestHighID.id, middle.id, oldestHighID.id]
        )
        XCTAssertEqual(
            query(items, sortOrder: .oldest).map(\.id),
            [oldestHighID.id, middle.id, newestLowID.id, newestHighID.id]
        )
        XCTAssertEqual(
            query(items, sortOrder: .desireHigh).map(\.id),
            [newestLowID.id, newestHighID.id, oldestHighID.id, middle.id]
        )
    }

    func testAvailableCategoriesTrimEmptyAndDeduplicate() {
        let items = [
            makeItem(id: uuid(1), category: " 数码 "),
            makeItem(id: uuid(2), category: "数码"),
            makeItem(id: uuid(3), category: ""),
            makeItem(id: uuid(4), category: " \n "),
            makeItem(id: uuid(5), category: "生活")
        ]

        XCTAssertEqual(ItemLibraryQuery.availableCategories(in: items), ["其他", "生活", "数码"])
    }

    private func query(
        _ items: [WorthlyItem],
        searchText: String = "",
        stateFilter: ItemLibraryStateFilter = .all,
        category: String? = nil,
        sortOrder: ItemLibrarySort = .newest
    ) -> [WorthlyItem] {
        ItemLibraryQuery.filtered(
            items: items,
            searchText: searchText,
            stateFilter: stateFilter,
            category: category,
            sortOrder: sortOrder
        )
    }

    private func makeItem(
        id: UUID,
        name: String = "Item",
        category: String = "其他",
        sourceNote: String? = nil,
        createdAt: Date = Date(timeIntervalSince1970: 1_735_689_600),
        state: ItemState = .considering,
        reason: PurchaseReason = .need,
        desireScore: Int = 5
    ) -> WorthlyItem {
        WorthlyItem(
            id: id,
            name: name,
            category: category,
            sourceNote: sourceNote,
            createdAt: createdAt,
            state: state,
            reason: reason,
            desireScore: desireScore
        )
    }

    private func uuid(_ value: Int) -> UUID {
        UUID(uuidString: String(format: "00000000-0000-0000-0000-%012d", value)) ?? UUID()
    }

    private func date(_ offset: TimeInterval) -> Date {
        Date(timeIntervalSince1970: 1_735_689_600 + offset)
    }
}
