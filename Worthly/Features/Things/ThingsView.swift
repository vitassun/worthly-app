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
                        VStack(alignment: .leading, spacing: 9) {
                            Text("这里暂时没有「\(selectedState.displayName)」记录。")
                                .font(WorthlyTheme.sectionTitle)
                                .foregroundStyle(WorthlyTheme.text)
                            Text("换一个状态看看，或先回首页记下一件正在考虑的东西。")
                                .font(.body)
                                .foregroundStyle(WorthlyTheme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .worthlyCard()
                        .accessibilityElement(children: .combine)
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
