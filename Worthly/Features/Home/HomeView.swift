import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var now = Date.now
    @Query(sort: \WorthlyItem.createdAt, order: .reverse) private var items: [WorthlyItem]
    let onAdd: () -> Void
    let onOpenInsights: () -> Void

    private var dueReviews: [CheckInDueEntry] {
        CheckInSchedule.dueEntries(for: items, now: now)
    }

    private var decisionRevisits: [DecisionReviewEntry] {
        DecisionReviewSchedule.dueEntries(for: items, now: now)
    }

    private var considering: [WorthlyItem] {
        let revisitingIDs = Set(decisionRevisits.map(\.item.id))
        return items.filter { $0.state == .considering && !revisitingIDs.contains($0.id) }
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
                    .accessibilityLabel("记下一件正在考虑的东西")

                    if items.isEmpty {
                        emptyState
                    } else {
                        if !dueReviews.isEmpty {
                            dueReviewSection
                        }

                        if !decisionRevisits.isEmpty {
                            decisionRevisitSection
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
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { now = .now }
        }
        .task {
            while !Task.isCancelled {
                now = .now
                do { try await Task.sleep(for: .seconds(60)) } catch { return }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(now.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()))
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
            Image(systemName: "circle.dashed")
                .font(.title)
                .accessibilityHidden(true)
            Text("先记下一件你正在考虑的东西。")
                .font(WorthlyTheme.sectionTitle)
            Text("现在不用判断对错。Worthly 会在之后帮你回来看看，它到底值不值。")
                .font(.body)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .foregroundStyle(WorthlyTheme.text)
        .worthlyCard()
        .accessibilityElement(children: .combine)
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
            if dueReviews.count > 3 {
                NavigationLink {
                    ReviewQueueView(kind: .checkIn)
                } label: {
                    Label("查看全部 \(dueReviews.count) 件待回访", systemImage: "arrow.right")
                        .frame(minHeight: 44)
                }
                .foregroundStyle(WorthlyTheme.text)
            }
        }
    }

    private var decisionRevisitSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 5) {
                Text("还想买吗？")
                    .font(WorthlyTheme.sectionTitle)
                    .foregroundStyle(WorthlyTheme.text)
                Text("放了一段时间了，回来看看当初的想要还在不在。")
                    .font(.subheadline)
                    .foregroundStyle(WorthlyTheme.muted)
            }

            ForEach(decisionRevisits.prefix(3)) { entry in
                NavigationLink {
                    ItemDetailView(item: entry.item)
                } label: {
                    DecisionReviewRow(entry: entry)
                }
                .buttonStyle(.plain)
            }

            if decisionRevisits.count > 3 {
                NavigationLink {
                    ReviewQueueView(kind: .decision)
                } label: {
                    Label("查看全部 \(decisionRevisits.count) 件待决定", systemImage: "arrow.right")
                        .frame(minHeight: 44)
                }
                .foregroundStyle(WorthlyTheme.text)
            }
        }
    }

    private func insightTeaser(_ insight: InsightCardModel) -> some View {
        Button(action: onOpenInsights) {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("YOUR FIRST PATTERN")
                        .font(WorthlyTheme.overline)
                        .foregroundStyle(WorthlyTheme.background.opacity(0.72))

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
            .background(WorthlyTheme.emphasis)
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("查看消费洞察：\(insight.headline)")
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

/// Home stays concise; the complete queue is a separate native navigation destination.
private struct ReviewQueueView: View {
    enum Kind: Equatable { case checkIn, decision }
    let kind: Kind
    @Query private var items: [WorthlyItem]
    @Environment(\.scenePhase) private var scenePhase
    @State private var now = Date.now

    var body: some View {
        let reviews = CheckInSchedule.dueEntries(for: items, now: now)
        let decisions = DecisionReviewSchedule.dueEntries(for: items, now: now)
        let isEmpty = kind == .checkIn ? reviews.isEmpty : decisions.isEmpty
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if isEmpty {
                    Text("现在没有待处理的回访。")
                        .font(WorthlyTheme.sectionTitle)
                    Text("新的回访到期后，会出现在这里。")
                        .foregroundStyle(WorthlyTheme.muted)
                } else if kind == .checkIn {
                    ForEach(reviews) { entry in
                        NavigationLink {
                            CheckInView(item: entry.item, stage: entry.stage)
                        } label: {
                            DueCheckInRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    ForEach(decisions) { entry in
                        NavigationLink {
                            ItemDetailView(item: entry.item)
                        } label: {
                            DecisionReviewRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(WorthlyTheme.pagePadding)
        }
        .background(WorthlyTheme.background.ignoresSafeArea())
        .foregroundStyle(WorthlyTheme.text)
        .navigationTitle(kind == .checkIn ? "待回访" : "待决定")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { now = .now }
        }
        .task {
            while !Task.isCancelled {
                now = .now
                do { try await Task.sleep(for: .seconds(60)) } catch { return }
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
                    .foregroundStyle(WorthlyTheme.muted)

                Text(entry.item.name)
                    .font(.headline)
                    .foregroundStyle(WorthlyTheme.text)
                    .fixedSize(horizontal: false, vertical: true)

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

struct DecisionReviewRow: View {
    let entry: DecisionReviewEntry

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 7) {
                Text("DECISION · \(DecisionReviewSchedule.reviewIntervalDays) DAYS")
                    .font(WorthlyTheme.overline)
                    .foregroundStyle(WorthlyTheme.muted)

                Text(entry.item.name)
                    .font(.headline)
                    .foregroundStyle(WorthlyTheme.text)
                    .fixedSize(horizontal: false, vertical: true)

                Text("买了，还是先放下？")
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
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 8) {
                    Text(item.state.displayName)
                    Text("·")
                    Text(item.reason.displayName)
                }
                .font(.caption)
                .foregroundStyle(WorthlyTheme.muted)
                .accessibilityLabel("状态：\(item.state.displayName)。原因：\(item.reason.displayName)")
            }

            Spacer(minLength: 12)

            if let price = item.paidPrice ?? item.originalPrice {
                Text(PriceFormatter.currency(price))
                    .font(.system(.subheadline, design: .monospaced, weight: .semibold))
                    .foregroundStyle(WorthlyTheme.text)
                    .accessibilityLabel("价格 \(PriceFormatter.currency(price))")
            }
        }
        .worthlyCard()
    }
}
