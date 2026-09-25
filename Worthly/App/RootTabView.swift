import SwiftUI

enum WorthlyRootTab: Hashable {
    case home
    case things
    case insights
    case settings
}

struct RootTabView: View {
    @State private var selectedTab: WorthlyRootTab = .home
    @State private var isAddingItem = false

    var body: some View {
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
                ThingsView()
            }
            .tabItem { Label("记录", systemImage: "square.stack") }
            .tag(WorthlyRootTab.things)

            NavigationStack {
                InsightsView()
            }
            .tabItem { Label("洞察", systemImage: "chart.line.uptrend.xyaxis") }
            .tag(WorthlyRootTab.insights)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("我的", systemImage: "person") }
            .tag(WorthlyRootTab.settings)
        }
        .tint(WorthlyTheme.accent)
        .sheet(isPresented: $isAddingItem) {
            NavigationStack {
                AddItemView()
            }
            .presentationDetents([.large])
        }
    }
}
