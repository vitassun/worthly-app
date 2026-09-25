import SwiftUI

struct SettingsView: View {
    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            List {
                Section("Worthly") {
                    LabeledContent("版本", value: "0.1 foundation")
                    LabeledContent("默认货币", value: "CNY")
                    LabeledContent("语言", value: "中文")
                }

                Section("稍后接入") {
                    Label("提醒", systemImage: "bell")
                    Label("数据导出", systemImage: "square.and.arrow.up")
                    Label("订阅", systemImage: "checkmark.seal")
                    Label("隐私与删除", systemImage: "hand.raised")
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("我的")
    }
}
