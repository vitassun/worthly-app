import SwiftUI
import SwiftData

struct InsightsView: View {
    @Query(sort: \WorthlyItem.createdAt, order: .reverse) private var items: [WorthlyItem]

    private var snapshot: InsightSnapshot {
        InsightEngine.snapshot(for: items)
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    header

                    if let average = snapshot.averageSatisfaction {
                        worthScoreCard(average: average)
                    } else {
                        sparseState
                    }

                    ForEach(snapshot.cards) { card in
                        InsightCardView(card: card)
                    }

                    progressCard
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle("洞察")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(WorthlyTheme.background, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("YOUR WORTH MEMORY")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)

            Text("你真正觉得\n值得的是什么？")
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)
                .lineSpacing(5)
        }
    }

    private func worthScoreCard(average: Double) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("CURRENT SNAPSHOT")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(average.formatted(.number.precision(.fractionLength(1))))
                    .font(.system(size: 54, weight: .bold, design: .serif))
                    .foregroundStyle(WorthlyTheme.text)

                Text("/ 10")
                    .font(.system(.title3, design: .monospaced, weight: .semibold))
                    .foregroundStyle(WorthlyTheme.muted)
            }

            Text("来自 \(snapshot.evaluatedCount) 件已经完成至少一次回访的购买。它不是消费成绩，只是你目前留下来的真实满意度快照。")
                .font(.subheadline)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .worthlyCard()
    }

    private var sparseState: some View {
        let remaining = InsightEngine.remainingUntilFirstInsight(for: items)

        return VStack(alignment: .leading, spacing: 14) {
            Text("INSIGHTS · EARLY")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)

            Text(remaining > 0 ? "还差 \(remaining) 条回访，第一条个人规律就会出现。" : "正在建立你的消费画像。")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)

            Text("Worthly 不会用一两次购买就给你贴标签。至少积累 3 件已经回访的购买后，才开始比较买前想要和后来满意。")
                .font(.body)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .worthlyCard()
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("DATA CONFIDENCE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            Text("让结论慢一点出现。")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)

            HStack(spacing: 24) {
                progressMetric(label: "已回访购买", value: "\(snapshot.evaluatedCount)")
                progressMetric(label: "30+ 天样本", value: "\(snapshot.matureCount)")
            }

            Text("折扣、类别和长期最值/最不值只使用 30 / 90 天回访，并设置最低样本门槛，避免把偶然的一次体验当成你的消费规律。")
                .font(.subheadline)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .worthlyCard()
    }

    private func progressMetric(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .monospaced, weight: .bold))
                .foregroundStyle(WorthlyTheme.text)
            Text(label)
                .font(.caption)
                .foregroundStyle(WorthlyTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct InsightCardView: View {
    let card: InsightCardModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(card.overline)
                .font(WorthlyTheme.overline)
                .foregroundStyle(card.isEmphasis ? WorthlyTheme.accent : WorthlyTheme.muted)

            Text(card.headline)
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(primaryText)
                .fixedSize(horizontal: false, vertical: true)

            if let leftLabel = card.leftLabel,
               let leftValue = card.leftValue,
               let rightLabel = card.rightLabel,
               let rightValue = card.rightValue {
                HStack(alignment: .top, spacing: 18) {
                    metric(label: leftLabel, value: leftValue)
                    metric(label: rightLabel, value: rightValue)
                }
            }

            Text(card.detail)
                .font(.subheadline)
                .foregroundStyle(secondaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .background(card.isEmphasis ? WorthlyTheme.nearBlack : WorthlyTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
    }

    private var primaryText: Color {
        card.isEmphasis ? WorthlyTheme.background : WorthlyTheme.text
    }

    private var secondaryText: Color {
        card.isEmphasis ? WorthlyTheme.background.opacity(0.72) : WorthlyTheme.muted
    }

    private func metric(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(value)
                .font(.system(.title2, design: .monospaced, weight: .bold))
                .foregroundStyle(primaryText)

            Text(label)
                .font(.caption)
                .foregroundStyle(secondaryText)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
