import SwiftUI
import SwiftData

struct EditItemView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let item: WorthlyItem

    @State private var name: String
    @State private var category: String
    @State private var reason: PurchaseReason
    @State private var desireScore: Int
    @State private var expectedUsage: ExpectedUsage
    @State private var originalPriceText: String
    @State private var paidPriceText: String
    @State private var sourceNote: String
    @State private var purchaseDate: Date

    private let categories = ["服饰", "数码", "美妆", "娱乐", "旅行", "家居", "学习", "其他"]

    init(item: WorthlyItem) {
        self.item = item
        _name = State(initialValue: item.name)
        _category = State(initialValue: item.category)
        _reason = State(initialValue: item.reason)
        _desireScore = State(initialValue: item.desireScore)
        _expectedUsage = State(initialValue: item.expectedUsage)
        _originalPriceText = State(initialValue: PriceInputParser.editingString(item.originalPrice))
        _paidPriceText = State(initialValue: PriceInputParser.editingString(item.paidPrice))
        _sourceNote = State(initialValue: item.sourceNote ?? "")
        _purchaseDate = State(initialValue: item.purchaseDate ?? .now)
    }

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var originalPriceError: String? {
        PriceInputParser.validationMessage(for: originalPriceText)
    }

    private var paidPriceError: String? {
        guard item.state == .bought else { return nil }
        return PriceInputParser.validationMessage(for: paidPriceText)
    }

    private var canSave: Bool {
        !trimmedName.isEmpty && originalPriceError == nil && paidPriceError == nil
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("EDIT")
                            .font(WorthlyTheme.overline)
                            .foregroundStyle(WorthlyTheme.accent)
                        Text("改的是记录，不是过去。")
                            .font(WorthlyTheme.displayTitle)
                            .foregroundStyle(WorthlyTheme.text)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        TextField("名称", text: $name)
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

                    VStack(alignment: .leading, spacing: 16) {
                        Text("购买前")
                            .font(WorthlyTheme.sectionTitle)

                        Picker("为什么想买", selection: $reason) {
                            ForEach(PurchaseReason.allCases) { option in
                                Text(option.displayName).tag(option)
                            }
                        }
                        .pickerStyle(.menu)

                        HStack {
                            Text("当时有多想要？")
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

                        Picker("预计使用", selection: $expectedUsage) {
                            ForEach(ExpectedUsage.allCases) { option in
                                Text(option.displayName).tag(option)
                            }
                        }
                        .pickerStyle(.segmented)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        Text("价格")
                            .font(WorthlyTheme.sectionTitle)

                        priceField(
                            title: "原价（可选）",
                            text: $originalPriceText,
                            error: originalPriceError
                        )

                        if item.state == .bought {
                            priceField(
                                title: "最终到手价（可选）",
                                text: $paidPriceText,
                                error: paidPriceError
                            )

                            DatePicker("购买日期", selection: $purchaseDate, displayedComponents: .date)
                        }
                    }

                    Button("保存修改") {
                        save()
                    }
                    .buttonStyle(WorthlyPrimaryButtonStyle())
                    .disabled(!canSave)
                    .opacity(canSave ? 1 : 0.45)
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle("编辑记录")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("取消") { dismiss() }
            }
        }
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

    private func save() {
        guard canSave else { return }

        item.name = trimmedName
        item.category = category
        item.reason = reason
        item.desireScore = desireScore
        item.expectedUsage = expectedUsage
        item.sourceNote = sourceNote.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : sourceNote
        item.originalPrice = PriceInputParser.value(from: originalPriceText)

        if item.state == .bought {
            item.paidPrice = PriceInputParser.value(from: paidPriceText)
            item.purchaseDate = purchaseDate
        }

        try? modelContext.save()
        dismiss()
    }
}
