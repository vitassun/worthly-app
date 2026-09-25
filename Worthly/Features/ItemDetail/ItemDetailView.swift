import SwiftUI

struct ItemDetailView: View {
    let item: WorthlyItem

    @State private var isEditing = false
    @State private var decisionMode: PurchaseDecisionMode?

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    header
                    beforeSection
                    purchaseSection

                    if item.state == .considering {
                        decisionActions
                    }

                    afterSection
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("编辑") { isEditing = true }
            }
        }
        .sheet(isPresented: $isEditing) {
            NavigationStack {
                EditItemView(item: item)
            }
        }
        .sheet(item: $decisionMode) { mode in
            NavigationStack {
                PurchaseDecisionView(item: item, mode: mode)
            }
            .presentationDetents(mode == .bought ? [.large] : [.medium, .large])
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(item.state.displayName.uppercased())
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)

            Text(item.name)
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)

            Text("\(item.category) · \(item.reason.displayName)")
                .foregroundStyle(WorthlyTheme.muted)
        }
    }

    private var beforeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("BEFORE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)
            Text("当时有多想要：\(item.desireScore)/10")
                .font(WorthlyTheme.sectionTitle)
            Text("预计使用：\(item.expectedUsage.displayName)")
                .foregroundStyle(WorthlyTheme.muted)
            if let originalPrice = item.originalPrice {
                Text("原价  \(PriceFormatter.currency(originalPrice))")
                    .font(.system(.body, design: .monospaced))
                    .foregroundStyle(WorthlyTheme.muted)
            }
            if let sourceNote = item.sourceNote, !sourceNote.isEmpty {
                Text(sourceNote)
                    .foregroundStyle(WorthlyTheme.muted)
            }
        }
        .worthlyCard()
    }

    private var purchaseSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PURCHASE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            switch item.state {
            case .bought:
                if let paidPrice = item.paidPrice {
                    Text(PriceFormatter.currency(paidPrice))
                        .font(.system(.largeTitle, design: .serif, weight: .bold))
                        .foregroundStyle(WorthlyTheme.text)
                    Text("最终到手价")
                        .foregroundStyle(WorthlyTheme.muted)
                } else {
                    Text("已购买")
                        .font(WorthlyTheme.sectionTitle)
                }

                if let discount = item.discountPercent,
                   let saved = item.savedAmount {
                    Text("-\(PriceFormatter.percent(discount)) · SAVED \(PriceFormatter.currency(saved))")
                        .font(WorthlyTheme.overline)
                        .foregroundStyle(WorthlyTheme.accent)
                }

                if let purchaseDate = item.purchaseDate {
                    Text(purchaseDate.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.muted)
                }

            case .passed:
                Text("最后没有买。")
                    .font(WorthlyTheme.sectionTitle)
                Text("这个决定也会留在你的消费记忆里。")
                    .foregroundStyle(WorthlyTheme.muted)
                if let decisionDate = item.decisionDate {
                    Text(decisionDate.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.muted)
                }

            case .considering:
                Text("还没有做决定。")
                    .font(WorthlyTheme.sectionTitle)

            case .archived:
                Text("这条记录已经归档。")
                    .font(WorthlyTheme.sectionTitle)
            }
        }
        .worthlyCard()
    }

    private var decisionActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("DECIDE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)

            Text("后来呢？")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)

            HStack(spacing: 12) {
                Button("买了") {
                    decisionMode = .bought
                }
                .buttonStyle(WorthlyPrimaryButtonStyle())

                Button("没买") {
                    decisionMode = .passed
                }
                .buttonStyle(WorthlySecondaryButtonStyle())
            }
        }
    }

    private var afterSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("AFTER")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)
            if item.state == .bought {
                Text("下一步：7 / 30 / 90 天回访。")
                    .font(WorthlyTheme.sectionTitle)
                Text("长期满意度才是 Worthly 真正关心的价格。")
                    .foregroundStyle(WorthlyTheme.muted)
            } else if item.state == .passed {
                Text("不买，也是一条完整的消费记忆。")
                    .font(WorthlyTheme.sectionTitle)
                Text("未来的洞察会同时学习你买了什么，也学习你忍住了什么。")
                    .foregroundStyle(WorthlyTheme.muted)
            } else {
                Text("做出购买决定后，这里会开始记录结果。")
                    .foregroundStyle(WorthlyTheme.muted)
            }
        }
        .padding(22)
        .foregroundStyle(WorthlyTheme.background)
        .background(WorthlyTheme.nearBlack)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}
