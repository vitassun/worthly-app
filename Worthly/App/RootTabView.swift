import SwiftUI

struct RootTabView: View {
    @State private var isAddingItem = false

    var body: some View {
        TabView {
            NavigationStack {
                HomeView(onAdd: { isAddingItem = true })
            }
            .tabItem { Label("首页", systemImage: "circle.grid.2x2") }

            NavigationStack {
                ThingsView()
            }
            .tabItem { Label("记录", systemImage: "square.stack") }

            NavigationStack {
                InsightsView()
            }
            .tabItem { Label("洞察", systemImage: "chart.line.uptrend.xyaxis") }

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("我的", systemImage: "person") }
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
