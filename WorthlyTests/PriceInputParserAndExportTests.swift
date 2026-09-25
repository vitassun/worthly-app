import XCTest
import SwiftData
@testable import Worthly

final class PriceInputParserAndExportTests: XCTestCase {
    func testPriceParserAcceptsOptionalAndValidAmounts() {
        XCTAssertNil(PriceInputParser.value(from: ""))
        XCTAssertTrue(PriceInputParser.isValidOptional("  "))
        XCTAssertEqual(PriceInputParser.value(from: "639"), 639)
        XCTAssertEqual(PriceInputParser.value(from: "639.50"), 639.5)
        XCTAssertEqual(PriceInputParser.value(from: "  ¥ 639.50  "), 639.5)
    }

    func testPriceParserRejectsInvalidAndNonFiniteAmounts() {
        for input in ["abc", "0", "-1", "1e309"] {
            XCTAssertNil(PriceInputParser.value(from: input), "Unexpected value for \(input)")
            XCTAssertFalse(PriceInputParser.isValidOptional(input), "Unexpected validity for \(input)")
        }
        XCTAssertNotNil(PriceInputParser.validationMessage(for: "abc"))
        XCTAssertNotNil(PriceInputParser.validationMessage(for: "0"))
        XCTAssertTrue(PriceInputParser.value(from: "1e308")?.isFinite == true)
    }

    func testExportHasCompleteItemCheckInAndISO8601Dates() throws {
        let created = fixedDate
        let purchase = created.addingTimeInterval(86_400)
        let item = WorthlyItem(
            id: stableUUID(1),
            name: "Headphones",
            category: "数码",
            sourceNote: "朋友推荐",
            createdAt: created,
            state: .bought,
            reason: .experience,
            expectedUsage: .daily,
            desireScore: 9,
            originalPrice: 1200,
            paidPrice: 999,
            purchaseDate: purchase,
            decisionDate: purchase
        )
        _ = CheckIn(
            id: stableUUID(11),
            stage: .day30,
            satisfactionScore: 8,
            usageFrequency: .daily,
            note: "通勤经常用",
            createdAt: purchase.addingTimeInterval(30 * 86_400),
            item: item
        )

        let data = try WorthlyDataExporter.data(for: [item], exportedAt: fixedDate)
        let root = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(root["exportVersion"] as? Int, WorthlyDataExporter.exportVersion)
        XCTAssertEqual(root["exportedAt"] as? String, iso8601(fixedDate))
        let exportedItems = try XCTUnwrap(root["items"] as? [[String: Any]])
        let exported = try XCTUnwrap(exportedItems.first)
        XCTAssertEqual(exported["id"] as? String, item.id.uuidString)
        XCTAssertEqual(exported["name"] as? String, "Headphones")
        XCTAssertEqual(exported["category"] as? String, "数码")
        XCTAssertEqual(exported["state"] as? String, "bought")
        XCTAssertEqual(exported["reason"] as? String, "experience")
        XCTAssertEqual(exported["desireScore"] as? Int, 9)
        XCTAssertEqual(exported["expectedUsage"] as? String, "daily")
        XCTAssertEqual(exported["originalPrice"] as? Double, 1200)
        XCTAssertEqual(exported["paidPrice"] as? Double, 999)
        XCTAssertEqual(exported["createdAt"] as? String, iso8601(created))
        XCTAssertEqual(exported["purchaseDate"] as? String, iso8601(purchase))
        XCTAssertEqual(exported["decisionDate"] as? String, iso8601(purchase))
        XCTAssertEqual(exported["note"] as? String, "朋友推荐")
        XCTAssertEqual(exported["sourceNote"] as? String, "朋友推荐")

        let checkIns = try XCTUnwrap(exported["checkIns"] as? [[String: Any]])
        let checkIn = try XCTUnwrap(checkIns.first)
        XCTAssertEqual(checkIn["stage"] as? Int, 30)
        XCTAssertEqual(checkIn["satisfactionScore"] as? Int, 8)
        XCTAssertEqual(checkIn["usageFrequency"] as? String, "daily")
        XCTAssertEqual(checkIn["note"] as? String, "通勤经常用")
        XCTAssertEqual(checkIn["createdAt"] as? String, iso8601(purchase.addingTimeInterval(30 * 86_400)))
    }

    func testExportOmitsNilFieldsAndSanitizesNonFinitePrices() throws {
        let item = WorthlyItem(
            id: stableUUID(2),
            name: "Optional",
            originalPrice: .infinity,
            paidPrice: .nan
        )
        let data = try WorthlyDataExporter.data(for: [item], exportedAt: fixedDate)
        let string = try XCTUnwrap(String(data: data, encoding: .utf8))
        XCTAssertFalse(string.localizedCaseInsensitiveContains("nan"))
        XCTAssertFalse(string.localizedCaseInsensitiveContains("infinity"))

        let root = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        let itemObject = try XCTUnwrap((root["items"] as? [[String: Any]])?.first)
        XCTAssertNil(itemObject["originalPrice"])
        XCTAssertNil(itemObject["paidPrice"])
        XCTAssertNil(itemObject["purchaseDate"])
        XCTAssertNil(itemObject["decisionDate"])
        XCTAssertNil(itemObject["note"])
        XCTAssertNoThrow(try JSONSerialization.jsonObject(with: data))
    }

    func testExportOrderingIsStableRegardlessOfInputOrder() throws {
        let first = WorthlyItem(id: stableUUID(3), name: "First", createdAt: fixedDate)
        let second = WorthlyItem(id: stableUUID(4), name: "Second", createdAt: fixedDate.addingTimeInterval(1))
        let a = try WorthlyDataExporter.data(for: [first, second], exportedAt: fixedDate)
        let b = try WorthlyDataExporter.data(for: [second, first], exportedAt: fixedDate)
        XCTAssertEqual(a, b)
    }

    private var fixedDate: Date { Date(timeIntervalSince1970: 1_735_689_600) }

    private func stableUUID(_ value: Int) -> UUID {
        UUID(uuidString: String(format: "00000000-0000-0000-0000-%012d", value)) ?? UUID()
    }

    private func iso8601(_ date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }
}
