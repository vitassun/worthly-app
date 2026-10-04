import SwiftUI
import SwiftData

enum PurchaseDecisionMode: String, Identifiable {
    case bought
    case passed

    var id: String { rawValue }
}

struct PurchaseDecisionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let item: WorthlyItem
    let mode: PurchaseDecisionMode

    @State private var paidPriceText: String
    @State private var purchaseDate: Date
    @State private var operationError: String?
    @FocusState private var inputIsFocused: Bool

    init(item: WorthlyItem, mode: PurchaseDecisionMode) {
        self.item = item
        self.mode = mode
        _paidPriceText = State(initialValue: PriceInputParser.editingString(item.paidPrice))
        _purchaseDate = State(initialValue: min(item.purchaseDate ?? .now, .now))
    }

    private var paidPriceError: String? {
        guard mode == .bought else { return nil }
        return PriceInputParser.validationMessage(for: paidPriceText)
    }

    private var canConfirm: Bool {
        item.state == .considering && paidPriceError == nil
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    header

                    if mode == .bought {
                        boughtForm
                    } else {
                        passedSummary
                    }

                    confirmButton
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .navigationTitle(mode == .bought ? "标记已买" : "标记没买")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("取消") { dismiss() }
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("完成") { inputIsFocused = false }
            }
        }
        .alert("保存失败", isPresented: Binding(
            get: { operationError != nil },
            set: { if !$0 { operationError = nil } }
        )) {
            Button("好", role: .cancel) { operationError = nil }
        } message: {
            Text(operationError ?? "请稍后重试。")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(mode == .bought ? "PURCHASE" : "PASS")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            Text(item.name)
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)

            Text(mode == .bought ? "记录真实成交，而不是记忆里的价格。" : "没买也是一个值得保留的决定。")
                .foregroundStyle(WorthlyTheme.muted)
        }
    }

    private var boughtForm: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let originalPrice = item.originalPrice {
                LabeledContent("原价", value: PriceFormatter.currency(originalPrice))
                    .font(.system(.body, design: .monospaced))
            }

            VStack(alignment: .leading, spacing: 6) {
                TextField("最终到手价（可选）", text: $paidPriceText)
                    .focused($inputIsFocused)
                    .keyboardType(.decimalPad)
                    .textFieldStyle(.roundedBorder)

                if let paidPriceError {
                    Text(paidPriceError)
                        .font(.caption)
                        .foregroundStyle(WorthlyTheme.text)
                }
            }

            DatePicker("购买日期", selection: $purchaseDate, in: ...Date.now, displayedComponents: .date)
        }
        .worthlyCard()
    }

    private var passedSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("这条记录不会消失。")
                .font(WorthlyTheme.sectionTitle)
            Text("保留当时为什么想买，也保留最后没买的决定。以后再遇到相似的东西，可以回来看看。")
                .foregroundStyle(WorthlyTheme.muted)
        }
        .worthlyCard()
    }

    private var confirmButton: some View {
        Button(mode == .bought ? "确认已购买" : "确认没买") {
            confirm()
        }
        .buttonStyle(WorthlyPrimaryButtonStyle())
        .disabled(!canConfirm)
        .opacity(canConfirm ? 1 : 0.45)
    }

    private func confirm() {
        guard canConfirm else { return }

        switch mode {
        case .bought:
            item.state = .bought
            item.paidPrice = PriceInputParser.value(from: paidPriceText)
            item.purchaseDate = purchaseDate
            item.decisionDate = .now
        case .passed:
            item.state = .passed
            item.paidPrice = nil
            item.purchaseDate = nil
            item.decisionDate = .now
        }

        do {
            try modelContext.save()
            if mode == .bought {
                CheckInReminderService.shared.reschedule(for: item)
            }
            dismiss()
        } catch {
            modelContext.rollback()
            operationError = "保存失败：\(error.localizedDescription)"
        }
    }
}
