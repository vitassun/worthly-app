import SwiftUI
import SwiftData

struct HomeView: View {
    @Query(sort: \WorthlyItem.createdAt, order: .reverse) private var items: [WorthlyItem]
    let onAdd: () -> Void

    private var considering: [WorthlyItem] {
        items.filter { $0.state == .considering }
    }

    private var bought: [WorthlyItem] {
        items.filter { $0.state == .bought }
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    header

                    Button(action: onAdd) {
                        Label("记下一件", systemImage: "plus")
                    }
                    .buttonStyle(WorthlyPrimaryButtonStyle())

                    if items.isEmpty {
                        emptyState
                    } else {
                        if !considering.isEmpty {
                            itemSection(title: "还在考虑", items: Array(considering.prefix(3)))
                        }

                        if !bought.isEmpty {
                            itemSection(title: "最近买了", items: Array(bought.prefix(3)))
                        }
                    }
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .toolbarBackground(WorthlyTheme.background, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(Date.now.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()))
                .font(WorthlyTheme.overline)
                .textCase(.uppercase)
                .foregroundStyle(WorthlyTheme.muted)

            Text("最近有什么\n让你觉得「值得」？")
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)
                .lineSpacing(5)
        }
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("◎")
                .font(.system(size: 28, weight: .medium, design: .serif))
            Text("先记下第一件想买的东西。")
                .font(WorthlyTheme.sectionTitle)
            Text("现在不用判断对错。Worthly 会在之后帮你回来看看，它到底值不值。")
                .font(.body)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .foregroundStyle(WorthlyTheme.text)
        .worthlyCard()
    }

    @ViewBuilder
    private func itemSection(title: String, items: [WorthlyItem]) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)

            ForEach(items) { item in
                NavigationLink {
                    ItemDetailView(item: item)
                } label: {
                    ItemRowView(item: item)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct ItemRowView: View {
    let item: WorthlyItem

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            VStack(alignment: .leading, spacing: 7) {
                Text(item.name)
                    .font(.headline)
                    .foregroundStyle(WorthlyTheme.text)
                    .lineLimit(2)

                HStack(spacing: 8) {
                    Text(item.state.displayName)
                    Text("·")
                    Text(item.reason.displayName)
                }
                .font(.caption)
                .foregroundStyle(WorthlyTheme.muted)
            }

            Spacer(minLength: 12)

            if let price = item.paidPrice ?? item.originalPrice {
                Text(PriceFormatter.currency(price))
                    .font(.system(.subheadline, design: .monospaced, weight: .semibold))
                    .foregroundStyle(WorthlyTheme.text)
            }
        }
        .worthlyCard()
    }
}
