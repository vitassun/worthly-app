import SwiftUI
import SwiftData

struct ThingsView: View {
    let onAdd: () -> Void

    @Query private var items: [WorthlyItem]
    @State private var searchText = ""
    @State private var stateFilter: ItemLibraryStateFilter = .all
    @State private var selectedCategory: String? = nil
    @State private var sortOrder: ItemLibrarySort = .newest

    private var filteredItems: [WorthlyItem] {
        ItemLibraryQuery.filtered(
            items: items,
            searchText: searchText,
            stateFilter: stateFilter,
            category: selectedCategory,
            sortOrder: sortOrder
        )
    }

    private var availableCategories: [String] {
        ItemLibraryQuery.availableCategories(in: items)
    }

    private var hasActiveFilters: Bool {
        !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || stateFilter != .all
            || selectedCategory != nil
            || sortOrder != .newest
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("你的消费记忆")
                        .font(WorthlyTheme.displayTitle)
                        .foregroundStyle(WorthlyTheme.text)
                        .fixedSize(horizontal: false, vertical: true)

                    stateChips
                    filterMenus

                    if items.isEmpty {
                        emptyLibraryState
                    } else if filteredItems.isEmpty {
                        noResultsState
                    } else {
                        Text("\(filteredItems.count) 件记录")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(WorthlyTheme.muted)
                            .accessibilityLabel("共 \(filteredItems.count) 件记录")

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
        .searchable(text: $searchText, prompt: "搜索名称、分类或备注")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(action: onAdd) {
                    Image(systemName: "plus")
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                }
                .accessibilityLabel("记下一件")
            }
        }
    }

    private var stateChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 9) {
                ForEach(ItemLibraryStateFilter.allCases) { filter in
                    let isSelected = stateFilter == filter
                    Button {
                        stateFilter = filter
                    } label: {
                        Text(filter.title)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(isSelected ? WorthlyTheme.background : WorthlyTheme.text)
                            .padding(.horizontal, 15)
                            .frame(minHeight: 44)
                            .background(isSelected ? WorthlyTheme.nearBlack : WorthlyTheme.surface)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("筛选状态：\(filter.title)")
                    .accessibilityValue(isSelected ? "已选中" : "未选中")
                }
            }
        }
    }

    private var filterMenus: some View {
        HStack(spacing: 12) {
            Menu {
                Button("全部分类") { selectedCategory = nil }
                ForEach(availableCategories, id: \.self) { category in
                    Button(category) { selectedCategory = category }
                }
            } label: {
                Label(selectedCategory ?? "全部分类", systemImage: "line.3.horizontal.decrease")
                    .font(.subheadline)
                    .foregroundStyle(WorthlyTheme.text)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 44)
                    .background(WorthlyTheme.surface)
                    .clipShape(Capsule())
            }
            .accessibilityLabel("分类：\(selectedCategory ?? "全部分类")")

            Spacer(minLength: 0)

            Menu {
                ForEach(ItemLibrarySort.allCases) { order in
                    Button(order.title) { sortOrder = order }
                }
            } label: {
                Label(sortOrder.title, systemImage: "arrow.up.arrow.down")
                    .font(.subheadline)
                    .foregroundStyle(WorthlyTheme.text)
                    .padding(.horizontal, 12)
                    .frame(minHeight: 44)
                    .background(WorthlyTheme.surface)
                    .clipShape(Capsule())
            }
            .accessibilityLabel("排序：\(sortOrder.title)")
        }
    }

    private var emptyLibraryState: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("还没有消费记忆。")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)
            Text("先记下一件正在考虑的东西。之后无论买了还是没买，这里都会留下完整记录。")
                .font(.body)
                .foregroundStyle(WorthlyTheme.muted)
                .fixedSize(horizontal: false, vertical: true)
            Button(action: onAdd) {
                Text("记下一件")
                    .fixedSize(horizontal: false, vertical: true)
            }
            .buttonStyle(WorthlyPrimaryButtonStyle())
            .accessibilityLabel("记下一件正在考虑的东西")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .worthlyCard()
    }

    private var noResultsState: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("没有找到符合条件的记录。")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)
            Text("换个关键词或筛选条件试试。")
                .font(.body)
                .foregroundStyle(WorthlyTheme.muted)
                .fixedSize(horizontal: false, vertical: true)

            if hasActiveFilters {
                Button("清除筛选", action: clearFilters)
                    .font(.headline)
                    .foregroundStyle(WorthlyTheme.text)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .background(WorthlyTheme.background)
                    .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .worthlyCard()
        .accessibilityElement(children: .contain)
    }

    private func clearFilters() {
        searchText = ""
        stateFilter = .all
        selectedCategory = nil
        sortOrder = .newest
    }
}
