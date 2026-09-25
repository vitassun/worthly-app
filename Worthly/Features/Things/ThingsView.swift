import SwiftUI
import SwiftData

struct ThingsView: View {
    @Query(sort: \WorthlyItem.createdAt, order: .reverse) private var items: [WorthlyItem]
    @State private var selectedState: ItemState = .considering

    private var filteredItems: [WorthlyItem] {
        items.filter { $0.state == selectedState }
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("你的消费记忆")
                        .font(WorthlyTheme.displayTitle)
                        .foregroundStyle(WorthlyTheme.text)

                    Picker("状态", selection: $selectedState) {
                        ForEach(ItemState.allCases) { state in
                            Text(state.displayName).tag(state)
                        }
                    }
                    .pickerStyle(.segmented)

                    if filteredItems.isEmpty {
                        Text("这里还没有记录。")
                            .foregroundStyle(WorthlyTheme.muted)
                            .padding(.top, 16)
                    } else {
                        ForEach(filteredItems) { item in
                            NavigationLink {
                                ItemDetailView(item: item)
                            } label: {
                                ItemRowView(item: item)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle("记录")
        .navigationBarTitleDisplayMode(.inline)
    }
}
