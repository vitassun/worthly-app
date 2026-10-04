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

    func testNotificationRouteStaysPendingUntilModelContextCanResolveIt() throws {
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

    func testRescheduledFutureStageOpensDetailInsteadOfDisabledCheckIn() {
        let item = WorthlyItem(name: "Future", state: .bought, purchaseDate: .distantFuture)
        let route = CheckInNotificationRoute(itemID: item.id, stage: .day7)
        XCTAssertEqual(route.destination(in: [item]), .itemDetail(itemID: item.id))
    }

    func testReminderGenerationInvalidatesOnlyTheChangedItem() {
        var generations = WorthlyReminderGeneration()
        let first = UUID()
        let second = UUID()
        let firstToken = generations.token(for: first)
        let secondToken = generations.token(for: second)
        generations.invalidate(for: first)
        XCTAssertFalse(generations.isCurrent(firstToken, for: first))
        XCTAssertTrue(generations.isCurrent(secondToken, for: second))
        let replacement = generations.token(for: first)
        generations.invalidate(for: first)
        XCTAssertFalse(generations.isCurrent(replacement, for: first))
    }

    func testGlobalReminderCancellationInvalidatesEveryQueuedAddition() {
        var generations = WorthlyReminderGeneration()
        let id = UUID()
        let token = generations.token(for: id)
        generations.invalidateAll()
        XCTAssertFalse(generations.isCurrent(token, for: id))
        XCTAssertTrue(generations.isCurrent(generations.token(for: id), for: id))
    }

    @MainActor
    func testEditingAStagedReviewPreservesIdentityDateStageAndUpdatesInsight() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let items = (1...3).map { _ in makeBoughtItem(completed: [.day7, .day30]) }
        items.forEach { context.insert($0) }
        try context.save()
        let item = items[0]
        let checkIn = try XCTUnwrap(item.checkIns.first { $0.stage == .day30 })
        let id = checkIn.id
        let date = checkIn.createdAt
        try CheckInRecordService.update(checkIn, for: item, satisfactionScore: 2, usageFrequency: .rarely, note: "  更正感受\n", in: context)

        XCTAssertEqual(checkIn.id, id)
        XCTAssertEqual(checkIn.createdAt, date)
        XCTAssertEqual(checkIn.stage, .day30)
        XCTAssertEqual(checkIn.note, "更正感受")
        XCTAssertEqual(checkIn.usage, .rarely)
        XCTAssertEqual(item.checkIns.count, 2)
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day90)
        XCTAssertEqual(try XCTUnwrap(InsightEngine.snapshot(for: items).averageSatisfaction), 6, accuracy: 0.001)
    }

    @MainActor
    func testEditingAdHocReviewKeepsItExcludedFromInsights() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem()
        let checkIn = CheckIn(stage: nil, satisfactionScore: 5, usageFrequency: .weekly, item: item)
        context.insert(item)
        try context.save()
        try CheckInRecordService.update(checkIn, for: item, satisfactionScore: 9, usageFrequency: .daily, note: "   ", in: context)
        XCTAssertTrue(checkIn.isAdHoc)
        XCTAssertNil(checkIn.note)
        XCTAssertEqual(InsightEngine.snapshot(for: [item]).evaluatedCount, 0)
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day7)
    }

    @MainActor
    func testDeletingLatestStageReopensQueueAndPreservesOtherReflections() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem(completed: [.day7, .day30])
        _ = CheckIn(stage: nil, satisfactionScore: 6, usageFrequency: .weekly, item: item)
        context.insert(item)
        try context.save()
        let checkIn = try XCTUnwrap(item.checkIns.first { $0.stage == .day30 })
        var cleanupCalled = false
        try WorthlyDataDeletion.deleteCheckIn(checkIn, in: context, refreshItemReminders: {
            // Verify deletion is durable before reminder side effects happen.
            cleanupCalled = true
            XCTAssertEqual(item.checkIns.count, 2)
            XCTAssertFalse(CheckInSchedule.isCompleted(.day30, for: item))
        })
        XCTAssertTrue(cleanupCalled)
        XCTAssertEqual(try context.fetch(FetchDescriptor<CheckIn>()).count, 2)
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day30)
        XCTAssertEqual(InsightEngine.snapshot(for: [item]).matureCount, 0)
    }

    @MainActor
    func testDeletingAdHocReviewHasNoReminderSideEffects() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem(completed: [.day7])
        let checkIn = CheckIn(stage: nil, satisfactionScore: 9, usageFrequency: .daily, item: item)
        context.insert(item)
        try context.save()
        var cleanupCalled = false
        try WorthlyDataDeletion.deleteCheckIn(checkIn, in: context, refreshItemReminders: { cleanupCalled = true })
        XCTAssertFalse(cleanupCalled)
        XCTAssertEqual(item.checkIns.count, 1)
        XCTAssertEqual(CheckInSchedule.nextPendingStage(for: item), .day30)
        XCTAssertEqual(InsightEngine.snapshot(for: [item]).evaluatedCount, 1)
    }

    @MainActor
    func testFailedReviewDeletionRollsBackWithoutCancelingReminders() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem(completed: [.day7])
        context.insert(item)
        try context.save()
        let checkIn = try XCTUnwrap(item.checkIns.first)
        var cleanupCalled = false
        XCTAssertThrowsError(try WorthlyDataDeletion.deleteCheckIn(checkIn, in: context,
            refreshItemReminders: { cleanupCalled = true }, saveChanges: { throw TestSaveError.failed }))
        XCTAssertFalse(cleanupCalled)
        XCTAssertEqual(try context.fetch(FetchDescriptor<CheckIn>()).count, 1)
        XCTAssertTrue(CheckInSchedule.isCompleted(.day7, for: item))
    }

    @MainActor
    func testFailedReviewEditRestoresOriginalValues() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem(completed: [.day7])
        context.insert(item)
        try context.save()
        let checkIn = try XCTUnwrap(item.checkIns.first)
        let date = checkIn.createdAt
        XCTAssertThrowsError(try CheckInRecordService.update(checkIn, for: item, satisfactionScore: 1,
            usageFrequency: .rarely, note: "new", in: context, saveChanges: { throw TestSaveError.failed }))
        XCTAssertEqual(checkIn.satisfactionScore, 8)
        XCTAssertEqual(checkIn.usage, .weekly)
        XCTAssertNil(checkIn.note)
        XCTAssertEqual(checkIn.createdAt, date)
        XCTAssertEqual(checkIn.stage, .day7)
    }

    @MainActor
    func testInvalidReviewScoreAndUnrelatedItemCannotMutateSavedReview() throws {
        let container = try makeContainer()
        let context = container.mainContext
        let item = makeBoughtItem(completed: [.day7])
        context.insert(item)
        try context.save()
        let checkIn = try XCTUnwrap(item.checkIns.first)
        XCTAssertThrowsError(try CheckInRecordService.update(checkIn, for: item, satisfactionScore: 11,
            usageFrequency: .rarely, note: "new", in: context))
        XCTAssertThrowsError(try CheckInRecordService.update(checkIn, for: makeBoughtItem(), satisfactionScore: 1,
            usageFrequency: .rarely, note: "new", in: context))
        XCTAssertEqual(checkIn.satisfactionScore, 8)
        XCTAssertEqual(checkIn.usage, .weekly)
        XCTAssertNil(checkIn.note)
    }

    private enum TestSaveError: Error { case failed }

    @MainActor
    private func makeContainer() throws -> ModelContainer {
        let schema = Schema([WorthlyItem.self, CheckIn.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        return try ModelContainer(for: schema, configurations: [configuration])
    }

    private func makeBoughtItem(completed: [CheckInStage] = []) -> WorthlyItem {
        let item = WorthlyItem(name: "Bought", state: .bought, purchaseDate: Date(timeIntervalSince1970: 1_735_689_600))
        for stage in completed {
            _ = CheckIn(stage: stage, satisfactionScore: 8, usageFrequency: .weekly, item: item)
        }
        return item
    }

}
