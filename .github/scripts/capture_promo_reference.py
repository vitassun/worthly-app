#!/usr/bin/env python3
"""Capture real SwiftUI references in a disposable macOS Simulator checkout.

The prepare command appends one temporary XCTest to an existing test source. It
never changes the app, models, Xcode project or production test definitions.
The restore command removes the temporary addition and verifies original bytes.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import struct
import subprocess
import time


ROOT = Path(__file__).resolve().parents[2]
TEST_FILE = ROOT / "WorthlyTests/NotificationAndDeletionTests.swift"
BACKUP = ROOT / "build/promo-native-fixture.original"
MARKER = "// BEGIN TEMPORARY WORTHLY PROMO NATIVE REFERENCE"
METHOD = "WorthlyTests/NotificationAndDeletionTests/testCapturePromoNativeReference"


def dump_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def hero_seed() -> dict:
    """Read the same single-item example used by the film; fail on format drift."""
    text = (ROOT / "promo-video/src/data/demo.ts").read_text(encoding="utf-8")
    hero_id = re.search(r'export const HERO_ITEM_ID = ("[^"\n]+");', text)
    if not hero_id:
        raise ValueError("Promo HERO_ITEM_ID is missing")
    start = text.index("    id: HERO_ITEM_ID,")
    end = text.index("\n  },", start)
    block = text[start:end]

    def field(part: str, key: str):
        match = re.search(rf'\b{re.escape(key)}:\s*("(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?),', part)
        if not match:
            raise ValueError(f"Promo seed field is missing or unsupported: {key}")
        return json.loads(match.group(1))

    seed = {"id": json.loads(hero_id.group(1))}
    for key in ["name", "category", "sourceNote", "createdAt", "state", "reason",
                "expectedUsage", "desireScore", "originalPrice", "paidPrice",
                "purchaseDate", "decisionDate"]:
        seed[key] = field(block, key)
    check_ins = block[block.index("    checkIns: ["):]
    rows = re.findall(r'\{\s*id:\s*"[^"\n]+".*?\n      \}', check_ins, re.DOTALL)
    seed["checkIns"] = [
        {key: field(row, key) for key in ["id", "stageDays", "satisfactionScore",
                                        "usageFrequency", "note", "createdAt"]}
        for row in rows
    ]
    if seed["state"] != "bought" or [r["stageDays"] for r in seed["checkIns"]] != [7, 30, 90]:
        raise ValueError("Native reference expects the film's bought item with all three stages")
    return seed


SWIFT_FIXTURE = r'''
// BEGIN TEMPORARY WORTHLY PROMO NATIVE REFERENCE
import SwiftUI
import UIKit

private struct WorthlyPromoReferenceSeed: Decodable {
    struct Review: Decodable {
        let id: String
        let stageDays: Int
        let satisfactionScore: Int
        let usageFrequency: String
        let note: String
        let createdAt: String
    }
    let id: String
    let name: String
    let category: String
    let sourceNote: String
    let createdAt: String
    let reason: String
    let expectedUsage: String
    let desireScore: Int
    let originalPrice: Double
    let paidPrice: Double
    let purchaseDate: String
    let decisionDate: String
    let checkIns: [Review]
}

private struct WorthlyPromoReferenceNavigation: View {
    let item: WorthlyItem
    @State private var path: [UUID]

    init(item: WorthlyItem) {
        self.item = item
        _path = State(initialValue: [item.id])
    }

    var body: some View {
        NavigationStack(path: $path) {
            ThingsView(onAdd: {})
                .navigationDestination(for: UUID.self) { _ in
                    ItemDetailView(item: item)
                }
        }
    }
}

extension NotificationAndDeletionTests {
    @MainActor
    func testCapturePromoNativeReference() async throws {
        let seedData = Data(##"__SEED_JSON__"##.utf8)
        let seed = try JSONDecoder().decode(WorthlyPromoReferenceSeed.self, from: seedData)
        let dateFormatter = ISO8601DateFormatter()
        func date(_ value: String) throws -> Date {
            try XCTUnwrap(dateFormatter.date(from: value + "+08:00"))
        }
        let schema = Schema([WorthlyItem.self, CheckIn.self])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [configuration])
        let item = WorthlyItem(
            id: try XCTUnwrap(UUID(uuidString: seed.id)),
            name: seed.name,
            category: seed.category,
            sourceNote: seed.sourceNote,
            createdAt: try date(seed.createdAt),
            state: .bought,
            reason: try XCTUnwrap(PurchaseReason(rawValue: seed.reason)),
            expectedUsage: try XCTUnwrap(ExpectedUsage(rawValue: seed.expectedUsage)),
            desireScore: seed.desireScore,
            originalPrice: seed.originalPrice,
            paidPrice: seed.paidPrice,
            purchaseDate: try date(seed.purchaseDate),
            decisionDate: try date(seed.decisionDate)
        )
        container.mainContext.insert(item)
        for review in seed.checkIns {
            let checkIn = CheckIn(
                id: try XCTUnwrap(UUID(uuidString: review.id)),
                stage: try XCTUnwrap(CheckInStage(rawValue: review.stageDays)),
                satisfactionScore: review.satisfactionScore,
                usageFrequency: try XCTUnwrap(UsageFrequency(rawValue: review.usageFrequency)),
                note: review.note,
                createdAt: try date(review.createdAt),
                item: item
            )
            container.mainContext.insert(checkIn)
        }
        try container.mainContext.save()

        // Awaiting on the main actor lets UIKit/SwiftUI finish native run-loop layout.
        try await Task.sleep(for: .milliseconds(500))
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let scene = try XCTUnwrap(scenes.first { $0.activationState == .foregroundActive } ?? scenes.first)
        let originalKeyWindow = scene.windows.first { $0.isKeyWindow }
        let output = FileManager.default.temporaryDirectory.appendingPathComponent("worthly-promo-native", isDirectory: true)
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        var images: [[String: Any]] = []
        var boundsMetadata: [String: Any] = [:]

        for (appearance, style) in [("light", UIUserInterfaceStyle.light), ("dark", UIUserInterfaceStyle.dark)] {
            let host = UIHostingController(rootView:
                WorthlyPromoReferenceNavigation(item: item)
                    .modelContainer(container)
                    .environment(\.locale, Locale(identifier: "zh_CN"))
                    .environment(\.timeZone, try XCTUnwrap(TimeZone(identifier: "Asia/Shanghai")))
                    .tint(WorthlyTheme.accent)
            )
            let window = UIWindow(windowScene: scene)
            window.frame = scene.coordinateSpace.bounds
            window.overrideUserInterfaceStyle = style
            window.rootViewController = host
            window.windowLevel = .normal + 1
            window.makeKeyAndVisible()
            defer {
                window.isHidden = true
                window.rootViewController = nil
                originalKeyWindow?.makeKey()
            }
            for _ in 0..<3 {
                host.view.setNeedsLayout()
                window.layoutIfNeeded()
                try await Task.sleep(for: .milliseconds(250))
            }
            XCTAssertEqual(host.traitCollection.userInterfaceStyle, style)
            XCTAssertGreaterThan(window.bounds.width, 0)
            XCTAssertGreaterThan(window.bounds.height, window.bounds.width)
            XCTAssertGreaterThan(host.view.safeAreaInsets.top, 0)

            func render(_ section: String, offset: CGFloat) throws {
                window.layoutIfNeeded()
                let format = UIGraphicsImageRendererFormat()
                format.preferredRange = .standard
                format.scale = window.screen.scale
                format.opaque = true
                let renderer = UIGraphicsImageRenderer(bounds: window.bounds, format: format)
                var hierarchyDrawn = false
                let screenshot = renderer.image { _ in
                    hierarchyDrawn = window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
                }
                XCTAssertTrue(hierarchyDrawn, "Native window hierarchy did not render")
                let png = try XCTUnwrap(screenshot.pngData())
                let filename = section == "top" ? "item-detail-\(appearance).png" : "item-detail-\(appearance)-after.png"
                try png.write(to: output.appendingPathComponent(filename), options: .atomic)
                images.append([
                    "file": filename, "appearance": appearance, "section": section,
                    "scrollOffsetY": Double(offset), "hierarchyDrawn": hierarchyDrawn,
                    "pixelWidth": screenshot.cgImage?.width ?? 0,
                    "pixelHeight": screenshot.cgImage?.height ?? 0
                ])
            }
            try render("top", offset: 0)
            boundsMetadata = [
                "width": Double(window.bounds.width), "height": Double(window.bounds.height),
                "scale": Double(window.screen.scale),
                "safeArea": ["top": Double(host.view.safeAreaInsets.top),
                             "bottom": Double(host.view.safeAreaInsets.bottom),
                             "left": Double(host.view.safeAreaInsets.left),
                             "right": Double(host.view.safeAreaInsets.right)]
            ]

            // Optional additional evidence: scroll the real native content to its AFTER card.
            func findScrollView(_ view: UIView) -> UIScrollView? {
                if let scroll = view as? UIScrollView,
                   scroll.bounds.width > window.bounds.width - 60,
                   scroll.contentSize.height > scroll.bounds.height + 20 { return scroll }
                for child in view.subviews {
                    if let found = findScrollView(child) { return found }
                }
                return nil
            }
            if let scroll = findScrollView(host.view) {
                let y = max(-scroll.adjustedContentInset.top,
                            scroll.contentSize.height - scroll.bounds.height + scroll.adjustedContentInset.bottom)
                scroll.setContentOffset(CGPoint(x: 0, y: y), animated: false)
                try await Task.sleep(for: .milliseconds(350))
                try render("after", offset: scroll.contentOffset.y)
            }
        }
        let metadata: [String: Any] = [
            "sourceSHA": "__SOURCE_SHA__",
            "version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            "build": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown",
            "bundleIdentifier": Bundle.main.bundleIdentifier ?? "unknown",
            "simulatorName": __SIMULATOR_NAME__, "simulatorUDID": "__SIMULATOR_UDID__",
            "simulatorOS": UIDevice.current.systemVersion,
            "modelIdentifier": ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] ?? "unknown",
            "renderMethod": "UIHostingController + actual ItemDetailView + UIWindow.drawHierarchy",
            "navigationRoute": "ThingsView -> native NavigationStack push -> ItemDetailView",
            "referenceKind": "Native SwiftUI Simulator view rendering; not a physical-device recording",
            "locale": "zh_CN", "timeZone": "Asia/Shanghai",
            "currencyExample": PriceFormatter.currency(item.paidPrice ?? 0),
            "bounds": boundsMetadata, "images": images,
            "seed": try JSONSerialization.jsonObject(with: seedData),
            "capturedAt": ISO8601DateFormatter().string(from: .now)
        ]
        let data = try JSONSerialization.data(withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
        try data.write(to: output.appendingPathComponent("metadata.json"), options: .atomic)

        // Capture the actual four-tab shell as well as the detail route. These are
        // generated references with our demo item, never copies of user screenshots.
        // Use the App's existing window so system materials retain the normal
        // window level and compositor attachment; hold its root alive for restore.
        let homeWindow = try XCTUnwrap(originalKeyWindow, "Actual App key window is missing")
        let originalRootController = try XCTUnwrap(homeWindow.rootViewController, "Actual App root controller is missing")
        let originalWindowStyle = homeWindow.overrideUserInterfaceStyle
        let originalWindowHidden = homeWindow.isHidden
        let originalWindowWasKey = homeWindow.isKeyWindow
        let originalWindowMetadata: [String: Any] = [
            "windowClass": String(describing: type(of: homeWindow)),
            "rootControllerClass": String(describing: type(of: originalRootController)),
            "level": Double(homeWindow.windowLevel.rawValue),
            "isHidden": originalWindowHidden, "isKeyWindow": originalWindowWasKey,
            "overrideUserInterfaceStyle": originalWindowStyle.rawValue
        ]
        let defaults = UserDefaults.standard
        let originalOnboarding = defaults.object(forKey: "hasCompletedOnboarding")
        let originalRoute = CheckInNotificationRouter.shared.pendingRoute
        let originalDefaultTimeZone = NSTimeZone.default
        let homeTimeZone = try XCTUnwrap(TimeZone(identifier: "Asia/Shanghai"))
        NSTimeZone.default = homeTimeZone
        CheckInNotificationRouter.shared.pendingRoute = nil
        defaults.set(true, forKey: "hasCompletedOnboarding")
        defer {
            if let originalOnboarding {
                defaults.set(originalOnboarding, forKey: "hasCompletedOnboarding")
            } else {
                defaults.removeObject(forKey: "hasCompletedOnboarding")
            }
            NSTimeZone.default = originalDefaultTimeZone
            CheckInNotificationRouter.shared.pendingRoute = originalRoute
            homeWindow.rootViewController = originalRootController
            homeWindow.overrideUserInterfaceStyle = originalWindowStyle
            homeWindow.isHidden = originalWindowHidden
            if originalWindowWasKey { homeWindow.makeKey() }
        }

        let homeConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let homeContainer = try ModelContainer(for: schema, configurations: [homeConfiguration])
        var homeCalendar = Calendar(identifier: .gregorian)
        homeCalendar.timeZone = homeTimeZone
        let homeNow = Date.now
        let homePurchaseDate = try XCTUnwrap(homeCalendar.date(byAdding: .day, value: -40, to: homeNow))
        let homeItem = WorthlyItem(
            id: try XCTUnwrap(UUID(uuidString: seed.id)),
            name: seed.name,
            category: seed.category,
            sourceNote: seed.sourceNote,
            createdAt: homePurchaseDate,
            state: .bought,
            reason: try XCTUnwrap(PurchaseReason(rawValue: seed.reason)),
            expectedUsage: try XCTUnwrap(ExpectedUsage(rawValue: seed.expectedUsage)),
            desireScore: seed.desireScore,
            originalPrice: seed.originalPrice,
            paidPrice: seed.paidPrice,
            purchaseDate: homePurchaseDate,
            decisionDate: homePurchaseDate
        )
        homeContainer.mainContext.insert(homeItem)
        let homeReview = CheckIn(
            id: try XCTUnwrap(UUID(uuidString: seed.checkIns[0].id)),
            stage: .day7,
            satisfactionScore: seed.checkIns[0].satisfactionScore,
            usageFrequency: try XCTUnwrap(UsageFrequency(rawValue: seed.checkIns[0].usageFrequency)),
            note: seed.checkIns[0].note,
            createdAt: try XCTUnwrap(homeCalendar.date(byAdding: .day, value: 7, to: homePurchaseDate)),
            item: homeItem
        )
        homeContainer.mainContext.insert(homeReview)
        try homeContainer.mainContext.save()
        XCTAssertEqual(CheckInSchedule.dueEntries(for: [homeItem], now: homeNow).map(\.stage), [.day30])
        XCTAssertTrue(InsightEngine.snapshot(for: [homeItem]).cards.isEmpty)
        XCTAssertTrue(DecisionReviewSchedule.dueEntries(for: [homeItem], now: homeNow).isEmpty)
        var homeImages: [[String: Any]] = []
        var homeBoundsMetadata: [String: Any] = [:]

        for (appearance, style) in [("light", UIUserInterfaceStyle.light), ("dark", UIUserInterfaceStyle.dark)] {
            let host = UIHostingController(rootView:
                RootTabView()
                    .modelContainer(homeContainer)
                    .environment(\.locale, Locale(identifier: "zh_CN"))
                    .environment(\.calendar, homeCalendar)
                    .environment(\.timeZone, homeTimeZone)
                    .tint(WorthlyTheme.accent)
            )
            let window = homeWindow
            window.overrideUserInterfaceStyle = .unspecified
            window.rootViewController = host
            window.makeKeyAndVisible()
            for _ in 0..<4 {
                host.view.setNeedsLayout()
                window.layoutIfNeeded()
                try await Task.sleep(for: .milliseconds(250))
            }
            XCTAssertEqual(window.bounds.width, 402, accuracy: 0.1)
            XCTAssertEqual(window.bounds.height, 874, accuracy: 0.1)
            XCTAssertNil(CheckInNotificationRouter.shared.pendingRoute)

            func findTabBar(_ view: UIView) -> UITabBar? {
                if let tabBar = view as? UITabBar, !tabBar.isHidden { return tabBar }
                for child in view.subviews {
                    if let found = findTabBar(child) { return found }
                }
                return nil
            }
            let tabBar = try XCTUnwrap(findTabBar(window), "Actual system TabView bar is missing")
            let tabBarFrame = tabBar.convert(tabBar.bounds, to: window)
            XCTAssertEqual(tabBar.items?.count, 4)
            XCTAssertGreaterThan(tabBarFrame.height, 0)
            XCTAssertLessThanOrEqual(tabBarFrame.maxY, window.bounds.height + 1)

            // Keep this actual window visible until the macOS observer captures the
            // Simulator's full system compositor, including material and status bar.
            let nonce = UUID().uuidString
            let request: [String: Any] = [
                "appearance": appearance, "nonce": nonce, "sourceSHA": "__SOURCE_SHA__",
                "pixelWidth": Int((window.bounds.width * window.screen.scale).rounded()),
                "pixelHeight": Int((window.bounds.height * window.screen.scale).rounded())
            ]
            let requestData = try JSONSerialization.data(withJSONObject: request, options: [.sortedKeys])
            try requestData.write(to: output.appendingPathComponent("home-request.json"), options: .atomic)
            let deadline = Date.now.addingTimeInterval(30)
            var acknowledgement: [String: Any]?
            while Date.now < deadline {
                if let ackData = try? Data(contentsOf: output.appendingPathComponent("home-ack.json")),
                   let ack = (try? JSONSerialization.jsonObject(with: ackData)) as? [String: Any],
                   ack["nonce"] as? String == nonce,
                   ack["appearance"] as? String == appearance {
                    acknowledgement = ack
                    break
                }
                try await Task.sleep(for: .milliseconds(100))
            }
            let ack = try XCTUnwrap(acknowledgement, "Full-screen Simulator capture did not acknowledge \(appearance) within 30 seconds")
            XCTAssertEqual(host.traitCollection.userInterfaceStyle, style)
            XCTAssertEqual(ack["captureMethod"] as? String, "simctl-io-full-screen")
            XCTAssertEqual(ack["sourceSHA"] as? String, "__SOURCE_SHA__")
            XCTAssertEqual(ack["pixelWidth"] as? Int, 1206)
            XCTAssertEqual(ack["pixelHeight"] as? Int, 2622)
            let filename = "home-\(appearance).png"
            homeImages.append([
                "file": filename, "appearance": appearance, "section": "home",
                "captureMethod": "simctl-io-full-screen", "nonce": nonce,
                "pixelWidth": ack["pixelWidth"] ?? 0, "pixelHeight": ack["pixelHeight"] ?? 0,
                "sha256": ack["sha256"] ?? "unknown",
                "colorHandling": "Unmodified Simulator compositor PNG; no grading or conversion",
                "accessibility": [
                    "reduceTransparencyEnabled": UIAccessibility.isReduceTransparencyEnabled,
                    "darkerSystemColorsEnabled": UIAccessibility.isDarkerSystemColorsEnabled,
                    "reduceMotionEnabled": UIAccessibility.isReduceMotionEnabled,
                    "contrast": host.traitCollection.accessibilityContrast.rawValue
                ],
                "window": [
                    "usesOriginalAppWindow": true,
                    "windowClass": String(describing: type(of: window)),
                    "rootControllerClass": String(describing: type(of: host)),
                    "level": Double(window.windowLevel.rawValue),
                    "isHidden": window.isHidden, "isKeyWindow": window.isKeyWindow,
                    "overrideUserInterfaceStyle": window.overrideUserInterfaceStyle.rawValue,
                    "resolvedUserInterfaceStyle": host.traitCollection.userInterfaceStyle.rawValue
                ],
                "tabBar": ["x": Double(tabBarFrame.minX), "y": Double(tabBarFrame.minY),
                           "width": Double(tabBarFrame.width), "height": Double(tabBarFrame.height),
                           "items": tabBar.items?.compactMap(\.title) ?? []]
            ])
            homeBoundsMetadata = [
                "width": Double(window.bounds.width), "height": Double(window.bounds.height),
                "scale": Double(window.screen.scale),
                "safeArea": ["top": Double(host.view.safeAreaInsets.top),
                             "bottom": Double(host.view.safeAreaInsets.bottom),
                             "left": Double(host.view.safeAreaInsets.left),
                             "right": Double(host.view.safeAreaInsets.right)]
            ]
        }
        let homeMetadata: [String: Any] = [
            "sourceSHA": "__SOURCE_SHA__",
            "version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            "build": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown",
            "bundleIdentifier": Bundle.main.bundleIdentifier ?? "unknown",
            "simulatorName": __SIMULATOR_NAME__, "simulatorUDID": "__SIMULATOR_UDID__",
            "simulatorOS": UIDevice.current.systemVersion,
            "modelIdentifier": ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] ?? "unknown",
            "renderMethod": "Live actual RootTabView in the original App window + xcrun simctl io screenshot of the entire system compositor",
            "originalAppWindow": originalWindowMetadata,
            "referenceKind": "Full-screen native Simulator capture; not a user screenshot or physical-device recording",
            "locale": "zh_CN", "timeZone": homeTimeZone.identifier,
            "foundationCurrentTimeZone": TimeZone.current.identifier,
            "foundationDefaultTimeZone": NSTimeZone.default.identifier,
            "homeDateText": homeNow.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()),
            "bounds": homeBoundsMetadata, "images": homeImages,
            "seed": ["name": homeItem.name, "category": homeItem.category,
                     "reason": homeItem.reason.rawValue, "expectedUsage": homeItem.expectedUsage.rawValue,
                     "desireScore": homeItem.desireScore, "originalPrice": homeItem.originalPrice ?? 0,
                     "paidPrice": homeItem.paidPrice ?? 0,
                     "purchaseDate": ISO8601DateFormatter().string(from: homePurchaseDate),
                     "purchaseDaysBeforeCapture": 40,
                     "checkIns": [["stageDays": 7, "satisfactionScore": homeReview.satisfactionScore]],
                     "dueStage": 30, "dueCards": 1, "recentBoughtCards": 1,
                     "consideringCards": 0, "insightCards": 0],
            "capturedAt": ISO8601DateFormatter().string(from: .now)
        ]
        let homeData = try JSONSerialization.data(withJSONObject: homeMetadata, options: [.prettyPrinted, .sortedKeys])
        try homeData.write(to: output.appendingPathComponent("home-metadata.json"), options: .atomic)
    }
}
// END TEMPORARY WORTHLY PROMO NATIVE REFERENCE
'''


def select_simulator(args: argparse.Namespace) -> None:
    result = subprocess.run(["xcrun", "simctl", "list", "devices", "available", "--json"],
                            check=True, capture_output=True, text=True)
    groups = json.loads(result.stdout)["devices"]
    devices = [(device, runtime) for runtime, group in groups.items() for device in group
               if device.get("isAvailable") and device["name"].startswith("iPhone")]
    preferred = ["iPhone 17", "iPhone 16 Pro", "iPhone 16", "iPhone 15", "iPhone 14 Pro"]
    devices.sort(key=lambda pair: (preferred.index(pair[0]["name"]) if pair[0]["name"] in preferred else 100,
                                   pair[0]["name"], pair[1], pair[0]["udid"]))
    if not devices:
        raise RuntimeError("No available iPhone Simulator runtime")
    device, runtime = devices[0]
    selection = {"id": device["udid"], "name": device["name"], "state": device["state"], "runtime": runtime}
    dump_json(args.output, selection)
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            for key, value in selection.items():
                if "\n" in value or "\r" in value:
                    raise ValueError("Unexpected multiline Simulator identifier")
                handle.write(f"{key}={value}\n")
    print(json.dumps(selection, ensure_ascii=False))


def prepare(args: argparse.Namespace) -> None:
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_sha):
        raise ValueError("source SHA must be a full Git commit SHA")
    if not re.fullmatch(r"[0-9A-Fa-f-]{36}", args.simulator_udid):
        raise ValueError("Simulator UDID is invalid")
    original = TEST_FILE.read_bytes()
    if MARKER.encode() in original or BACKUP.exists():
        raise RuntimeError("Temporary native fixture is already present; restore it first")
    seed = hero_seed()
    seed_json = json.dumps(seed, ensure_ascii=False, separators=(",", ":"))
    if '"##' in seed_json:
        raise ValueError("Seed contains the Swift raw-string delimiter")
    fixture = (SWIFT_FIXTURE.replace("__SEED_JSON__", seed_json)
               .replace("__SOURCE_SHA__", args.source_sha)
               .replace("__SIMULATOR_NAME__", json.dumps(args.simulator_name, ensure_ascii=False))
               .replace("__SIMULATOR_UDID__", args.simulator_udid))
    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    BACKUP.write_bytes(original)
    TEST_FILE.write_bytes(original + b"\n" + fixture.encode("utf-8"))
    dump_json(BACKUP.with_suffix(".json"), {"file": str(TEST_FILE.relative_to(ROOT)),
                                         "originalSHA256": hashlib.sha256(original).hexdigest(),
                                         "sourceSHA": args.source_sha, "onlyTesting": METHOD})
    print(f"Prepared one temporary native-reference test: {METHOD}")


def restore(_: argparse.Namespace) -> None:
    if not BACKUP.exists():
        if MARKER.encode() in TEST_FILE.read_bytes():
            raise RuntimeError("Temporary fixture exists without a recovery backup")
        print("No temporary fixture to restore")
        return
    original = BACKUP.read_bytes()
    recorded = json.loads(BACKUP.with_suffix(".json").read_text(encoding="utf-8"))
    if hashlib.sha256(original).hexdigest() != recorded["originalSHA256"]:
        raise RuntimeError("Original test-source backup checksum mismatch")
    TEST_FILE.write_bytes(original)
    assert hashlib.sha256(TEST_FILE.read_bytes()).hexdigest() == recorded["originalSHA256"]
    BACKUP.unlink()
    BACKUP.with_suffix(".json").unlink()
    print("Restored original test source byte for byte")


def png_information(path: Path) -> dict:
    """Inspect PNG headers/profile identifiers without decoding or changing pixels."""
    data = path.read_bytes()
    if len(data) < 10_000 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise RuntimeError(f"Invalid or empty PNG: {path.name}")
    width, height = struct.unpack(">II", data[16:24])
    profiles = []
    position = 8
    while position + 12 <= len(data):
        length = struct.unpack(">I", data[position:position + 4])[0]
        chunk_type = data[position + 4:position + 8]
        chunk = data[position + 8:position + 8 + length]
        if len(chunk) != length:
            raise RuntimeError(f"Truncated PNG chunk: {path.name}")
        if chunk_type == b"iCCP":
            profiles.append({"chunk": "iCCP", "profileName": chunk.split(b"\x00", 1)[0].decode("latin-1")})
        elif chunk_type in [b"sRGB", b"cICP", b"gAMA", b"cHRM"]:
            profiles.append({"chunk": chunk_type.decode("ascii"), "payloadHex": chunk.hex()})
        position += 12 + length
        if chunk_type == b"IEND":
            break
    return {"pixelWidth": width, "pixelHeight": height, "bitsPerComponent": data[24],
            "pngColorProfiles": profiles, "sha256": hashlib.sha256(data).hexdigest()}


def atomic_json(path: Path, value: object) -> None:
    temporary = path.with_name(path.name + ".tmp")
    dump_json(temporary, value)
    temporary.replace(path)


def observe_home(args: argparse.Namespace) -> None:
    """Capture the live Simulator compositor while the native test keeps its window visible."""
    args.output.mkdir(parents=True, exist_ok=True)
    simulator = args.simulator_udid
    captured: list[dict] = []
    handled_nonces: set[str] = set()
    original_appearance = None
    status_overridden = False
    observer_started_at = time.time()
    deadline = time.monotonic() + args.timeout
    test_complete = args.output / "home-test-complete"
    test_complete.unlink(missing_ok=True)

    def simctl(*command: str, check: bool = True) -> subprocess.CompletedProcess:
        return subprocess.run(["xcrun", "simctl", *command], check=check, capture_output=True,
                              text=True, timeout=20)

    def stop_observer(signum, _frame):
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGTERM, stop_observer)
    signal.signal(signal.SIGINT, stop_observer)
    try:
        current = simctl("ui", simulator, "appearance", check=False)
        match = re.search(r"\b(light|dark)\b", current.stdout.lower())
        if current.returncode == 0 and match:
            original_appearance = match.group(1)
        print("Observer ready; waiting for app installation and a live Home capture request", flush=True)
        while time.monotonic() < deadline:
            # xcodebuild installs the test host later. Missing containers and files
            # are expected here, and must not end the observer on the initial 404.
            container = simctl("get_app_container", simulator, "com.vitassun.worthly", "data", check=False)
            if container.returncode != 0 or not container.stdout.strip():
                time.sleep(0.5)
                continue
            sandbox = Path(container.stdout.strip()) / "tmp/worthly-promo-native"
            try:
                request_path = sandbox / "home-request.json"
                if request_path.stat().st_mtime < observer_started_at:
                    time.sleep(0.2)
                    continue
                request = json.loads(request_path.read_text(encoding="utf-8"))
            except (FileNotFoundError, json.JSONDecodeError):
                time.sleep(0.2)
                continue
            if request.get("sourceSHA") != args.source_sha or request.get("nonce") in handled_nonces:
                time.sleep(0.2)
                continue
            appearance = request.get("appearance")
            nonce = request.get("nonce")
            if appearance not in ["light", "dark"] or not isinstance(nonce, str) or not re.fullmatch(r"[0-9A-Fa-f-]{36}", nonce):
                raise RuntimeError("Invalid live Home capture handshake")
            if any(image["appearance"] == appearance for image in captured):
                raise RuntimeError("A second capture request reused the same appearance")
            if (request.get("pixelWidth"), request.get("pixelHeight")) != (1206, 2622):
                raise RuntimeError("Live Home window does not match the 1206 x 2622 reference screen")
            simctl("ui", simulator, "appearance", appearance)
            simctl("status_bar", simulator, "override", "--time", "9:41",
                   "--batteryState", "charged", "--batteryLevel", "100",
                   "--wifiMode", "active", "--wifiBars", "3",
                   "--cellularMode", "active", "--cellularBars", "4")
            status_overridden = True
            time.sleep(0.4)
            filename = f"home-{appearance}.png"
            simctl("io", simulator, "screenshot", "--type=png", str(args.output / filename))
            image = {"file": filename, "appearance": appearance, "nonce": nonce,
                     "sourceSHA": args.source_sha, "captureMethod": "simctl-io-full-screen",
                     "capturedAt": datetime.now(timezone.utc).isoformat(),
                     "colorHandling": "Original simctl compositor PNG bytes; no pixel modification",
                     **png_information(args.output / filename)}
            if (image["pixelWidth"], image["pixelHeight"]) != (1206, 2622):
                raise RuntimeError("Full-screen Simulator screenshot has unexpected dimensions")
            captured.append(image)
            handled_nonces.add(nonce)
            atomic_json(args.output / "home-compositor-capture.json", {
                "sourceSHA": args.source_sha, "simulatorUDID": simulator,
                "captureMethod": "simctl-io-full-screen", "images": captured,
                "demoStatusBar": {"time": "9:41", "batteryLevel": 100, "batteryState": "charged",
                                  "wifiBars": 3, "cellularBars": 4},
                "colorHandling": "Unmodified PNGs; actual embedded profile/chunks recorded per image",
            })
            atomic_json(sandbox / "home-ack.json", image)
            print(f"Captured full-screen {appearance} Home, nonce={nonce}, sha256={image['sha256']}", flush=True)
            if len(captured) == 2:
                # Keep the system's dark appearance until the Swift test has
                # checked traits and finished. Restoring after its ACK is a race.
                print("Both frames acknowledged; waiting for xcodebuild test completion before restoring Simulator state", flush=True)
                while time.monotonic() < deadline:
                    if test_complete.exists():
                        return
                    time.sleep(0.1)
                raise TimeoutError("xcodebuild did not signal Home test completion")
        raise TimeoutError("Home compositor observer timed out before both live captures")
    finally:
        for command in [
            ("status_bar", simulator, "clear") if status_overridden else None,
            ("ui", simulator, "appearance", original_appearance) if original_appearance else None,
        ]:
            if command:
                try:
                    simctl(*command, check=False)
                except (OSError, subprocess.TimeoutExpired) as error:
                    print(f"Simulator demo-state cleanup failed: {error}", flush=True)


def collect(args: argparse.Namespace) -> None:
    source = args.container / "tmp/worthly-promo-native"
    args.output.mkdir(parents=True, exist_ok=True)
    count = 0
    combined_images = []
    for metadata_name, required in [
        ("metadata.json", {"item-detail-light.png", "item-detail-dark.png"}),
        ("home-metadata.json", {"home-light.png", "home-dark.png"}),
    ]:
        metadata = json.loads((source / metadata_name).read_text(encoding="utf-8"))
        if metadata["sourceSHA"] != args.source_sha:
            raise RuntimeError("Screenshot source SHA does not match the checkout")
        if metadata["bundleIdentifier"] != "com.vitassun.worthly":
            raise RuntimeError("Reference did not come from the Worthly app test host")
        listed = {entry["file"] for entry in metadata["images"]}
        if not required.issubset(listed):
            raise RuntimeError(f"Both light and dark native references are required: {metadata_name}")
        observer_images = {}
        if metadata_name == "home-metadata.json":
            observer_manifest = json.loads((args.output / "home-compositor-capture.json").read_text(encoding="utf-8"))
            if observer_manifest["sourceSHA"] != args.source_sha or observer_manifest["captureMethod"] != "simctl-io-full-screen":
                raise RuntimeError("Home observer provenance does not match this capture")
            observer_images = {image["file"]: image for image in observer_manifest["images"]}
        for entry in metadata["images"]:
            filename = entry["file"]
            if Path(filename).name != filename or not filename.endswith(".png"):
                raise RuntimeError("Invalid native screenshot metadata")
            png_path = args.output / filename if metadata_name == "home-metadata.json" else source / filename
            png = png_information(png_path)
            width, height = png["pixelWidth"], png["pixelHeight"]
            if width != entry["pixelWidth"] or height != entry["pixelHeight"] or width <= 0 or height <= width:
                raise RuntimeError(f"PNG dimensions disagree with native metadata: {filename}")
            if metadata_name == "home-metadata.json":
                bounds = metadata["bounds"]
                if (bounds["width"], bounds["height"]) != (402, 874):
                    raise RuntimeError("Home reference must use the actual 402 x 874 iPhone viewport")
                if (width, height) != (1206, 2622):
                    raise RuntimeError("Full-screen Home reference must have 1206 x 2622 pixels")
                if len(entry["tabBar"]["items"]) != 4:
                    raise RuntimeError("Home reference is missing the real four-tab system bar")
                observed = observer_images.get(filename)
                if not observed or observed["nonce"] != entry["nonce"] or observed["sha256"] != png["sha256"] or entry["sha256"] != png["sha256"]:
                    raise RuntimeError("Home screenshot does not match the acknowledged live window")
                if entry["captureMethod"] != "simctl-io-full-screen":
                    raise RuntimeError("Home screenshot was not captured from the system compositor")
                entry["pngColorProfiles"] = png["pngColorProfiles"]
                entry["bitsPerComponent"] = png["bitsPerComponent"]
            else:
                if not entry["hierarchyDrawn"]:
                    raise RuntimeError("Detail hierarchy was not drawn")
                shutil.copy2(png_path, args.output / filename)
            combined_images.append({"file": filename, "appearance": entry["appearance"],
                                    "section": entry["section"], "sha256": png["sha256"],
                                    "captureMethod": "simctl-io-full-screen" if metadata_name == "home-metadata.json" else "UIWindow.drawHierarchy",
                                    "metadata": metadata_name, "pixelWidth": width, "pixelHeight": height})
            count += 1
        dump_json(args.output / metadata_name, metadata)
    dump_json(args.output / "reference-capture-manifest.json", {"sourceSHA": args.source_sha,
              "images": combined_images, "homeColorHandling": "Original system compositor PNG bytes; no modification"})
    print(f"Collected {count} native reference images from {args.source_sha}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    select = commands.add_parser("select-simulator")
    select.add_argument("--output", type=Path, required=True)
    select.set_defaults(function=select_simulator)
    prep = commands.add_parser("prepare")
    prep.add_argument("--source-sha", required=True)
    prep.add_argument("--simulator-name", required=True)
    prep.add_argument("--simulator-udid", required=True)
    prep.set_defaults(function=prepare)
    recovery = commands.add_parser("restore")
    recovery.set_defaults(function=restore)
    observer = commands.add_parser("observe-home")
    observer.add_argument("--simulator-udid", required=True)
    observer.add_argument("--source-sha", required=True)
    observer.add_argument("--output", type=Path, required=True)
    observer.add_argument("--timeout", type=float, default=1200)
    observer.set_defaults(function=observe_home)
    copy = commands.add_parser("collect")
    copy.add_argument("--container", type=Path, required=True)
    copy.add_argument("--output", type=Path, required=True)
    copy.add_argument("--source-sha", required=True)
    copy.set_defaults(function=collect)
    args = parser.parse_args()
    args.function(args)


if __name__ == "__main__":
    main()
