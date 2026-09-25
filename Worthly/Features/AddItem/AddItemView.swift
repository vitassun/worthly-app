import SwiftUI
import SwiftData

struct AddItemView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var name = ""
    @State private var category = "其他"
    @State private var reason: PurchaseReason = .need
    @State private var desireScore = 7
    @State private var expectedUsage: ExpectedUsage = .unsure
    @State private var originalPriceText = ""
    @State private var paidPriceText = ""
    @State private var alreadyBought = false
    @State private var sourceNote = ""

    private let categories = ["服饰", "数码", "美妆", "娱乐", "旅行", "家居", "学习", "其他"]

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var originalPriceError: String? {
        PriceInputParser.validationMessage(for: originalPriceText)
    }

    private var paidPriceError: String? {
        guard alreadyBought else { return nil }
        return PriceInputParser.validationMessage(for: paidPriceText)
    }

    private var canSave: Bool {
        !trimmedName.isEmpty && originalPriceError == nil && paidPriceError == nil
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    intro
                    itemSection
                    motivationSection
                    priceSection
                    saveButton
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.bottom, 36)
            }
        }
        .navigationTitle("记下一件")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("取消") { dismiss() }
            }
        }
    }

    private var intro: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("BEFORE")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)
            Text("先记下现在的感觉。")
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)
            Text("不用写得很完整，20 秒内完成就够了。")
                .foregroundStyle(WorthlyTheme.muted)
        }
        .padding(.top, 18)
    }

    private var itemSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            TextField("想买什么？", text: $name)
                .font(.title3.weight(.semibold))
                .textFieldStyle(.plain)
                .padding(18)
                .background(WorthlyTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))

            Picker("分类", selection: $category) {
                ForEach(categories, id: \.self) { Text($0).tag($0) }
            }
            .pickerStyle(.menu)

            TextField("来自哪里 / 备注（可选）", text: $sourceNote)
                .textFieldStyle(.roundedBorder)
        }
    }

    private var motivationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("为什么想买？")
                .font(WorthlyTheme.sectionTitle)
                .foregroundStyle(WorthlyTheme.text)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 92), spacing: 10)], spacing: 10) {
                ForEach(PurchaseReason.allCases) { option in
                    Button {
                        reason = option
                    } label: {
                        HStack(spacing: 5) {
                            if reason == option {
                                Image(systemName: "checkmark")
                                    .accessibilityHidden(true)
                            }
                            Text(option.displayName)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .padding(.vertical, 7)
                        .foregroundStyle(reason == option ? WorthlyTheme.background : WorthlyTheme.text)
                        .background(reason == option ? WorthlyTheme.text : WorthlyTheme.surface)
                        .overlay {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(reason == option ? WorthlyTheme.accent : WorthlyTheme.text.opacity(0.14), lineWidth: reason == option ? 2 : 1)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(option.displayName)
                    .accessibilityValue(reason == option ? "已选择" : "未选择")
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("现在有多想要？")
                    Spacer()
                    Text("\(desireScore)/10")
                        .font(.system(.subheadline, design: .monospaced, weight: .semibold))
                        .foregroundStyle(WorthlyTheme.accent)
                }
                Slider(value: Binding(
                    get: { Double(desireScore) },
                    set: { desireScore = Int($0.rounded()) }
                ), in: 1...10, step: 1)
                .tint(WorthlyTheme.accent)
                .accessibilityLabel("买前想要程度")
                .accessibilityValue("\(desireScore) 分，满分 10 分")
                .accessibilityHint("调整你现在有多想要这件东西")
            }

            Picker("预计使用", selection: $expectedUsage) {
                ForEach(ExpectedUsage.allCases) { option in
                    Text(option.displayName).tag(option)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var priceSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("价格")
                .font(WorthlyTheme.sectionTitle)

            priceField(
                title: "原价（可选）",
                text: $originalPriceText,
                error: originalPriceError
            )

            Toggle("已经买了", isOn: $alreadyBought)
                .tint(WorthlyTheme.accent)

            if alreadyBought {
                priceField(
                    title: "最终到手价（可选）",
                    text: $paidPriceText,
                    error: paidPriceError
                )
            }
        }
        .foregroundStyle(WorthlyTheme.text)
    }

    private func priceField(title: String, text: Binding<String>, error: String?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            TextField(title, text: text)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)

            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(WorthlyTheme.accent)
            }
        }
    }

    private var saveButton: some View {
        Button("保存") {
            save()
        }
        .buttonStyle(WorthlyPrimaryButtonStyle())
        .disabled(!canSave)
        .opacity(canSave ? 1 : 0.45)
    }

    private func save() {
        guard canSave else { return }

        let originalPrice = PriceInputParser.value(from: originalPriceText)
        let paidPrice = alreadyBought ? PriceInputParser.value(from: paidPriceText) : nil

        let item = WorthlyItem(
            name: trimmedName,
            category: category,
            sourceNote: sourceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : sourceNote,
            state: alreadyBought ? .bought : .considering,
            reason: reason,
            expectedUsage: expectedUsage,
            desireScore: desireScore,
            originalPrice: originalPrice,
            paidPrice: paidPrice,
            purchaseDate: alreadyBought ? .now : nil,
            decisionDate: alreadyBought ? .now : nil
        )

        modelContext.insert(item)
        try? modelContext.save()
        if alreadyBought {
            CheckInReminderService.shared.reschedule(for: item)
        }
        dismiss()
    }
}
