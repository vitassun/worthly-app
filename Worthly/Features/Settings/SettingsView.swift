import SwiftUI
import SwiftData
import UniformTypeIdentifiers

struct SettingsView: View {
    var onDataDeleted: () -> Void = {}
    @Environment(\.modelContext) private var modelContext
    @Query private var items: [WorthlyItem]
    @AppStorage(CheckInReminderService.enabledKey) private var remindersEnabled = false
    @State private var notificationDenied = false
    @State private var showingDeleteConfirmation = false
    @State private var showingExportSheet = false
    @State private var exportPayload: WorthlyJSONTransfer?
    @State private var operationError: String?

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            List {
                Section("数据") {
                    Button {
                        prepareExport()
                    } label: {
                        Label("导出我的数据", systemImage: "square.and.arrow.up")
                    }
                    .accessibilityLabel("导出我的 Worthly 数据为 JSON")

                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("删除所有数据", systemImage: "trash")
                    }
                    .accessibilityLabel("删除所有 Worthly 数据")
                }

                Section("提醒") {
                    Toggle("7 / 30 / 90 天回访提醒", isOn: reminderBinding)
                        .tint(WorthlyTheme.accent)

                    Text("开启后，Worthly 会在回访当天上午提醒一次。不会发送营销通知。拒绝通知权限后，App 内的回访队列仍然可用。")
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Section("偏好") {
                    LabeledContent("货币", value: "CNY · 人民币")
                    LabeledContent("语言", value: "简体中文")
                }

                Section("关于") {
                    LabeledContent("版本", value: appVersion)
                    Text("你的记录保存在这台设备上。导出由系统分享功能在本地完成；Worthly 不会上传你的消费数据。")
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("我的")
        .confirmationDialog(
            "永久删除所有数据？",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("永久删除所有数据", role: .destructive) {
                deleteAllData()
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("所有记录、回访和洞察基础数据都会永久删除。此操作无法撤销。")
        }
        .sheet(isPresented: $showingExportSheet) {
            NavigationStack {
                VStack(alignment: .leading, spacing: 18) {
                    Text("你的 Worthly 数据已准备好。")
                        .font(WorthlyTheme.sectionTitle)
                        .foregroundStyle(WorthlyTheme.text)
                    Text("JSON 文件只会通过系统分享面板交给你选择的目标，不会上传到 Worthly 服务器。")
                        .foregroundStyle(WorthlyTheme.muted)

                    if let exportPayload {
                        ShareLink(
                            item: exportPayload,
                            preview: SharePreview("Worthly 数据导出", image: Image(systemName: "doc.text"))
                        ) {
                            Label("分享 JSON 文件", systemImage: "square.and.arrow.up")
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .buttonStyle(WorthlyPrimaryButtonStyle())
                        .accessibilityLabel("分享 Worthly JSON 数据文件")
                    }

                    Spacer()
                }
                .padding(WorthlyTheme.pagePadding)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(WorthlyTheme.background.ignoresSafeArea())
                .navigationTitle("导出数据")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("完成") { showingExportSheet = false }
                    }
                }
            }
            .presentationDetents([.medium])
        }
        .alert("通知没有开启", isPresented: $notificationDenied) {
            Button("好", role: .cancel) {}
        } message: {
            Text("你仍然可以在首页看到到期回访；需要通知时可稍后在系统设置中允许。")
        }
        .alert("操作失败", isPresented: Binding(
            get: { operationError != nil },
            set: { if !$0 { operationError = nil } }
        )) {
            Button("好", role: .cancel) { operationError = nil }
        } message: {
            Text(operationError ?? "请稍后重试。")
        }
    }

    private var appVersion: String {
        let info = Bundle.main.infoDictionary ?? [:]
        let version = info["CFBundleShortVersionString"] as? String ?? "未设置"
        let build = info["CFBundleVersion"] as? String ?? "未设置"
        return "Version \(version) (\(build))"
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

    private func prepareExport() {
        do {
            exportPayload = WorthlyJSONTransfer(data: try WorthlyDataExporter.data(for: items))
            showingExportSheet = true
        } catch {
            operationError = "无法创建 JSON 导出文件：\(error.localizedDescription)"
        }
    }

    private func deleteAllData() {
        do {
            try WorthlyDataDeletion.deleteAll(in: modelContext) {
                CheckInReminderService.shared.cancelAllReminders()
            }
            onDataDeleted()
        } catch {
            modelContext.rollback()
            operationError = "删除数据失败：\(error.localizedDescription)"
        }
    }
}

private struct WorthlyJSONTransfer: Transferable, Identifiable {
    let id = UUID()
    let data: Data

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(exportedContentType: .json) { transfer in
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("Worthly-Export-\(transfer.id.uuidString).json")
            try transfer.data.write(to: url, options: .atomic)
            return SentTransferredFile(url)
        }
    }
}
