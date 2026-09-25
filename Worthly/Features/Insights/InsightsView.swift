import SwiftUI
import SwiftData

struct InsightsView: View {
    @Query private var items: [WorthlyItem]

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    Text("你真正觉得\n值得的是什么？")
                        .font(WorthlyTheme.displayTitle)
                        .foregroundStyle(WorthlyTheme.text)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("INSIGHTS · EARLY")
                            .font(WorthlyTheme.overline)
                            .foregroundStyle(WorthlyTheme.accent)
                        Text(items.isEmpty ? "先积累几次真实决定。" : "正在建立你的消费画像。")
                            .font(WorthlyTheme.sectionTitle)
                        Text("Worthly 不急着下结论。等 7 / 30 / 90 天回访积累起来，这里才会出现真正属于你的规律。")
                            .foregroundStyle(WorthlyTheme.muted)
                    }
                    .worthlyCard()
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle("洞察")
        .navigationBarTitleDisplayMode(.inline)
    }
}
