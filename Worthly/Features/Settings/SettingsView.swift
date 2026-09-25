import SwiftUI
import SwiftData

struct SettingsView: View {
    @Query private var items: [WorthlyItem]
    @AppStorage(CheckInReminderService.enabledKey) private var remindersEnabled = false
    @State private var notificationDenied = false

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            List {
                Section("Worthly") {
                    LabeledContent("版本", value: "0.2 check-ins")
                    LabeledContent("默认货币", value: "CNY")
                    LabeledContent("语言", value: "中文")
                }

                Section("回访") {
                    Toggle("7 / 30 / 90 天提醒", isOn: reminderBinding)
                        .tint(WorthlyTheme.accent)

                    Text("开启后，Worthly 会在回访当天上午提醒一次。不会发送营销通知。")
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.muted)
                }

                Section("稍后接入") {
                    Label("数据导出", systemImage: "square.and.arrow.up")
                    Label("订阅", systemImage: "checkmark.seal")
                    Label("隐私与删除", systemImage: "hand.raised")
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("我的")
        .alert("通知没有开启", isPresented: $notificationDenied) {
            Button("好", role: .cancel) {}
        } message: {
            Text("你仍然可以在首页看到到期回访；需要通知时可稍后在系统设置中允许。")
        }
    }

    private var reminderBinding: Binding<Bool> {
        Binding(
            get: { remindersEnabled },
            set: { newValue in
                if newValue {
                    Task {
                        let granted = await CheckInReminderService.shared.enable(for: items)
                        await MainActor.run {
                            remindersEnabled = granted
                            notificationDenied = !granted
                        }
                    }
                } else {
                    remindersEnabled = false
                    CheckInReminderService.shared.disable()
                }
            }
        )
    }
}
