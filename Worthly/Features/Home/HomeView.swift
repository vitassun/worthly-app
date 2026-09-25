import SwiftUI
import SwiftData

struct HomeView: View {
    @Query(sort: \WorthlyItem.createdAt, order: .reverse) private var items: [WorthlyItem]
    let onAdd: () -> Void
    let onOpenInsights: () -> Void

    private var dueReviews: [CheckInDueEntry] {
        CheckInSchedule.dueEntries(for: items)
    }

    private var considering: [WorthlyItem] {
        items.filter { $0.state == .considering }
    }

    private var bought: [WorthlyItem] {
        items.filter { $0.state == .bought }
    }

    private var insightSnapshot: InsightSnapshot {
        InsightEngine.snapshot(for: items)
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
                        if !dueReviews.isEmpty {
                            dueReviewSection
                        }

                        if let primaryInsight = insightSnapshot.primaryCard {
                            insightTeaser(primaryInsight)
                        }

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

    private var dueReviewSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 5) {
                Text("该回来看看了")
                    .font(WorthlyTheme.sectionTitle)
                    .foregroundStyle(WorthlyTheme.text)
                Text("不是催你记账，是看看当时的期待有没有留下来。")
                    .font(.subheadline)
                    .foregroundStyle(WorthlyTheme.muted)
            }

            ForEach(dueReviews.prefix(3)) { entry in
                NavigationLink {
                    CheckInView(item: entry.item, stage: entry.stage)
                } label: {
                    DueCheckInRow(entry: entry)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func insightTeaser(_ insight: InsightCardModel) -> some View {
        Button(action: onOpenInsights) {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("YOUR FIRST PATTERN")
                        .font(WorthlyTheme.overline)
                        .foregroundStyle(WorthlyTheme.accent)

                    Text(insight.headline)
                        .font(WorthlyTheme.sectionTitle)
                        .foregroundStyle(WorthlyTheme.background)
                        .multilineTextAlignment(.leading)

                    Text("查看你的消费洞察")
                        .font(.subheadline)
                        .foregroundStyle(WorthlyTheme.background.opacity(0.7))
                }

                Spacer(minLength: 8)

                Image(systemName: "arrow.up.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(WorthlyTheme.background)
            }
            .padding(20)
            .background(WorthlyTheme.nearBlack)
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
        }
        .buttonStyle(.plain)
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

struct DueCheckInRow: View {
    let entry: CheckInDueEntry

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 7) {
                Text("\(entry.stage.rawValue) DAYS LATER")
                    .font(WorthlyTheme.overline)
                    .foregroundStyle(WorthlyTheme.accent)

                Text(entry.item.name)
                    .font(.headline)
                    .foregroundStyle(WorthlyTheme.text)
                    .lineLimit(2)

                Text("现在还觉得它值吗？")
                    .font(.subheadline)
                    .foregroundStyle(WorthlyTheme.muted)
            }

            Spacer(minLength: 8)

            Image(systemName: "arrow.up.right")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(WorthlyTheme.text)
        }
        .worthlyCard()
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
