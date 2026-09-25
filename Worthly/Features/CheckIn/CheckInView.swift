import SwiftUI

struct CheckInView: View {
    let item: WorthlyItem
    let stage: CheckInStage

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 16) {
                Text("\(stage.rawValue) DAYS LATER")
                    .font(WorthlyTheme.overline)
                    .foregroundStyle(WorthlyTheme.accent)
                Text("现在还觉得\n它值吗？")
                    .font(WorthlyTheme.displayTitle)
                Text(item.name)
                    .foregroundStyle(WorthlyTheme.muted)
                Spacer()
                Text("Iteration 02 will implement the actual check-in form.")
                    .font(.footnote)
                    .foregroundStyle(WorthlyTheme.muted)
            }
            .padding(WorthlyTheme.pagePadding)
        }
    }
}
