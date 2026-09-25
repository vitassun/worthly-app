import SwiftUI

struct ItemDetailView: View {
    let item: WorthlyItem

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    header
                    beforeSection
                    purchaseSection
                    afterSection
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.inline)
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
        }
        .worthlyCard()
    }

    private var purchaseSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PURCHASE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            if item.state == .bought {
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
            } else {
                Text(item.state == .passed ? "最后没有买。" : "还没有做决定。")
                    .font(WorthlyTheme.sectionTitle)
            }
        }
        .worthlyCard()
    }

    private var afterSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("AFTER")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)
            if item.state == .bought {
                Text("7 / 30 / 90 天回访将在下一迭代接入。")
                    .font(WorthlyTheme.sectionTitle)
                Text("长期满意度才是 Worthly 真正关心的价格。")
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
