import SwiftUI
import SwiftData

enum WorthlyRootTab: Hashable {
    case home
    case things
    case insights
    case settings
}

struct RootTabView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedTab: WorthlyRootTab = .home
    @State private var isAddingItem = false
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @StateObject private var notificationRouter = CheckInNotificationRouter.shared
    @State private var notificationDestination: NotificationDestination?

    var body: some View {
        Group {
            if hasCompletedOnboarding {
                TabView(selection: $selectedTab) {
                    NavigationStack {
                        HomeView(
                            onAdd: { isAddingItem = true },
                            onOpenInsights: { selectedTab = .insights }
                        )
                    }
                    .tabItem { Label("首页", systemImage: "circle.grid.2x2") }
                    .tag(WorthlyRootTab.home)

                    NavigationStack {
                        ThingsView(onAdd: { isAddingItem = true })
                    }
                    .tabItem { Label("记录", systemImage: "square.stack") }
                    .tag(WorthlyRootTab.things)

                    NavigationStack {
                        InsightsView()
                    }
                    .tabItem { Label("洞察", systemImage: "chart.line.uptrend.xyaxis") }
                    .tag(WorthlyRootTab.insights)

                    NavigationStack {
                        SettingsView(onDataDeleted: { selectedTab = .home })
                    }
                    .tabItem { Label("我的", systemImage: "person") }
                    .tag(WorthlyRootTab.settings)
                }
                .tint(WorthlyTheme.accent)
            } else {
                WorthlyOnboardingView(
                    onComplete: { hasCompletedOnboarding = true },
                    onAddFirstItem: {
                        hasCompletedOnboarding = true
                        isAddingItem = true
                    }
                )
            }
        }
        .sheet(isPresented: $isAddingItem) {
            NavigationStack {
                AddItemView()
            }
            .presentationDetents([.large])
        }
        .sheet(item: $notificationDestination) { destination in
            NavigationStack {
                if destination.stageIsCompleted {
                    ItemDetailView(item: destination.item)
                } else {
                    CheckInView(item: destination.item, stage: destination.stage)
                }
            }
        }
        .task(id: notificationRouter.pendingRoute) {
            await consumePendingNotificationRoute()
        }
    }

    private func consumePendingNotificationRoute() async {
        guard let route = notificationRouter.pendingRoute else { return }

        while !Task.isCancelled {
            do {
                let items = try modelContext.fetch(FetchDescriptor<WorthlyItem>())
                guard notificationRouter.pendingRoute == route else { return }

                let destination = route.destination(in: items)
                notificationRouter.consume(route)
                selectedTab = .home

                switch destination {
                case .home:
                    notificationDestination = nil
                case .checkIn(let itemID, let stage):
                    if let item = items.first(where: { $0.id == itemID }) {
                        notificationDestination = NotificationDestination(item: item, stage: stage, stageIsCompleted: false)
                    } else {
                        notificationDestination = nil
                    }
                case .itemDetail(let itemID):
                    if let item = items.first(where: { $0.id == itemID }) {
                        notificationDestination = NotificationDestination(item: item, stage: route.stage, stageIsCompleted: true)
                    } else {
                        notificationDestination = nil
                    }
                }
                return
            } catch {
                try? await Task.sleep(nanoseconds: 250_000_000)
            }
        }
    }
}

private struct NotificationDestination: Identifiable {
    let item: WorthlyItem
    let stage: CheckInStage
    let stageIsCompleted: Bool

    var id: String { "\(item.id.uuidString)-\(stage.rawValue)-\(stageIsCompleted)" }
}

private struct WorthlyOnboardingView: View {
    let onComplete: () -> Void
    let onAddFirstItem: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var page = 0

    private let pages: [(title: String, detail: String)] = [
        ("什么消费，\n真的值得你？", "Worthly 不是传统记账工具。它记录你买之前有多想要，以及买之后到底满不满意。"),
        ("让答案慢慢出现。", "想要 → 买下 → 7 / 30 / 90 天回来看看 → 慢慢知道什么适合自己。"),
        ("从一件东西开始。", "先把正在考虑的东西记下来，之后再回来看看当时的期待和真实感受。")
    ]

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("WORTHLY · 值不值")
                        .font(WorthlyTheme.overline)
                        .foregroundStyle(WorthlyTheme.accent)

                    VStack(alignment: .leading, spacing: 20) {
                        Text(pages[page].title)
                            .font(WorthlyTheme.displayTitle)
                            .foregroundStyle(WorthlyTheme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(pages[page].detail)
                            .font(.title3)
                            .foregroundStyle(WorthlyTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                            .lineSpacing(5)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 64)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("入门介绍，第 \(page + 1) 页，共 \(pages.count) 页。\(pages[page].title)\(pages[page].detail)")

                    HStack(spacing: 8) {
                        ForEach(pages.indices, id: \.self) { index in
                            Circle()
                                .fill(index == page ? WorthlyTheme.text : WorthlyTheme.muted.opacity(0.35))
                                .frame(width: 7, height: 7)
                        }
                    }
                    .padding(.top, 28)
                    .accessibilityHidden(true)

                    VStack(spacing: 4) {
                        if page == pages.count - 1 {
                            Button(action: onAddFirstItem) {
                                Text("记下第一件东西")
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .buttonStyle(WorthlyPrimaryButtonStyle())
                            .accessibilityLabel("记下第一件东西")

                            Button("先看看", action: onComplete)
                                .font(.headline)
                                .foregroundStyle(WorthlyTheme.text)
                                .frame(maxWidth: .infinity, minHeight: 50)
                                .contentShape(Rectangle())
                                .accessibilityLabel("先看看 Worthly")
                        } else {
                            Button {
                                if reduceMotion {
                                    page += 1
                                } else {
                                    withAnimation(.easeInOut(duration: 0.2)) { page += 1 }
                                }
                            } label: {
                                Text("继续")
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .buttonStyle(WorthlyPrimaryButtonStyle())
                            .accessibilityLabel("继续，第 \(page + 2) 页")
                        }
                    }
                    .padding(.top, 56)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.top, 24)
                .padding(.bottom, 24)
            }
        }
    }
}
