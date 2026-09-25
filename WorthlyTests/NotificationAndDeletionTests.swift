import XCTest
import SwiftData
import UserNotifications
@testable import Worthly

final class NotificationAndDeletionTests: XCTestCase {
    func testValidNotificationPayloadParses() throws {
        let id = UUID()
        let route = try XCTUnwrap(CheckInNotificationRoute.parse(userInfo: [
            "itemID": id.uuidString,
            "stage": 30
        ]))
        XCTAssertEqual(route.itemID, id)
        XCTAssertEqual(route.stage, .day30)
    }

    func testInvalidUUIDAndStagePayloadsAreIgnored() {
        XCTAssertNil(CheckInNotificationRoute.parse(userInfo: ["itemID": "bad-id", "stage": 7]))
        XCTAssertNil(CheckInNotificationRoute.parse(userInfo: ["itemID": UUID().uuidString, "stage": 31]))
        XCTAssertNil(CheckInNotificationRoute.parse(userInfo: ["itemID": UUID().uuidString]))
    }

    func testDeletedItemFallsBackHome() {
        let route = CheckInNotificationRoute(itemID: UUID(), stage: .day7)
        XCTAssertEqual(route.destination(in: []), .home)
    }

    func testCompletedStageOpensDetailAndNeverCheckIn() {
        let item = makeBoughtItem(completed: [.day7])
        let route = CheckInNotificationRoute(itemID: item.id, stage: .day7)
        XCTAssertEqual(route.destination(in: [item]), .itemDetail(itemID: item.id))
    }

    func testNonCurrentStageFallsBackToDetail() {
        let item = makeBoughtItem()
        let route = CheckInNotificationRoute(itemID: item.id, stage: .day30)
        XCTAssertEqual(route.destination(in: [item]), .itemDetail(itemID: item.id))
    }

    func testCurrentNextStageOpensMatchingCheckIn() {
        let item = makeBoughtItem(completed: [.day7])
        let route = CheckInNotificationRoute(itemID: item.id, stage: .day30)
        XCTAssertEqual(route.destination(in: [item]), .checkIn(itemID: item.id, stage: .day30))
    }

    func testForegroundNotificationsUseSystemBannerAndSoundOptions() {
        let options = WorthlyNotificationPresentationPolicy.foregroundOptions
        XCTAssertTrue(options.contains(.banner))
        XCTAssertTrue(options.contains(.sound))
        XCTAssertFalse(options.contains(.list))
    }

    func testNotificationRouteStaysPendingUntilModelContextCanResolveIt() {
        let router = CheckInNotificationRouter.shared
        router.pendingRoute = nil
        let id = UUID()
        router.receive(userInfo: ["itemID": id.uuidString, "stage": 7])
        let route = try XCTUnwrap(router.pendingRoute)
        XCTAssertEqual(route.itemID, id)
        router.consume(route)
        XCTAssertNil(router.pendingRoute)
    }

    @MainActor
    func testDeleteAllCascadesCheckInsAndPreservesPreferences() throws {
        let schema = Schema([WorthlyItem.self, CheckIn.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let context = container.mainContext
        let item = makeBoughtItem()
        let checkIn = CheckIn(stage: .day7, satisfactionScore: 8, usageFrequency: .weekly, item: item)
        context.insert(item)
        context.insert(checkIn)
        try context.save()

        let suiteName = "WorthlyTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        defaults.set(true, forKey: "hasCompletedOnboarding")
        defaults.set("CNY", forKey: "worthly.currency")
        var cleanupCalled = false

        try WorthlyDataDeletion.deleteAll(in: context) { cleanupCalled = true }

        XCTAssertTrue(cleanupCalled)
        XCTAssertEqual(try context.fetch(FetchDescriptor<WorthlyItem>()).count, 0)
        XCTAssertEqual(try context.fetch(FetchDescriptor<CheckIn>()).count, 0)
        XCTAssertTrue(defaults.bool(forKey: "hasCompletedOnboarding"))
        XCTAssertEqual(defaults.string(forKey: "worthly.currency"), "CNY")
    }

    func testReminderCleanupOnlySelectsWorthlyIdentifiers() {
        let ids = [
            "worthly.checkin.123.7",
            "com.otherapp.reminder",
            "worthly.checkin.456.30",
            "other.worthly.checkin.789"
        ]
        XCTAssertEqual(
            WorthlyReminderIdentifiers.matching(ids),
            ["worthly.checkin.123.7", "worthly.checkin.456.30"]
        )
    }

    private func makeBoughtItem(completed: [CheckInStage] = []) -> WorthlyItem {
        let item = WorthlyItem(name: "Bought", state: .bought, purchaseDate: Date(timeIntervalSince1970: 1_735_689_600))
        for stage in completed {
            _ = CheckIn(stage: stage, satisfactionScore: 8, usageFrequency: .weekly, item: item)
        }
        return item
    }

}
