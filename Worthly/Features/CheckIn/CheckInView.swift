import SwiftUI
import SwiftData

struct CheckInView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Environment(\.scenePhase) private var scenePhase
    @State private var now = Date.now

    let item: WorthlyItem
    let stage: CheckInStage?
    private let existingCheckIn: CheckIn?

    @State private var satisfactionScore = 7
    @State private var usageFrequency: UsageFrequency = .weekly
    @State private var note = ""
    @State private var duplicateDetected = false
    @State private var operationError: String?
    @State private var showingDeleteConfirmation = false
    @FocusState private var noteIsFocused: Bool
    @ScaledMetric(relativeTo: .body) private var usageMinimumWidth: CGFloat = 108

    init(item: WorthlyItem, stage: CheckInStage?) {
        self.item = item
        self.stage = stage
        existingCheckIn = nil
    }

    init(item: WorthlyItem, checkIn: CheckIn) {
        self.item = item
        stage = checkIn.stage
        existingCheckIn = checkIn
        _satisfactionScore = State(initialValue: checkIn.satisfactionScore)
        _usageFrequency = State(initialValue: checkIn.usage)
        _note = State(initialValue: checkIn.note ?? "")
    }

    private var alreadyCompleted: Bool {
        guard let stage else { return false }
        return CheckInSchedule.isCompleted(stage, for: item)
    }

    private var canSubmit: Bool {
        if let existingCheckIn {
            return item.state == .bought && item.checkIns.contains { $0.id == existingCheckIn.id }
        }
        guard item.state == .bought, !alreadyCompleted else { return false }
        guard let stage else { return true }
        return CheckInSchedule.nextPendingStage(for: item) == stage && CheckInSchedule.isDue(stage, for: item, now: now)
    }

    var body: some View {
        ZStack {
            WorthlyTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    header
                    scoreSection
                    usageSection
                    noteSection
                    saveButton
                    if existingCheckIn != nil {
                        Button("删除这次回访", role: .destructive) {
                            showingDeleteConfirmation = true
                        }
                        .frame(maxWidth: .infinity, minHeight: 44)
                    }
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .navigationTitle(existingCheckIn != nil ? "编辑回访" : stage.map { "\($0.rawValue) 天回访" } ?? "随时回访")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { now = .now }
        }
        .task {
            while !Task.isCancelled {
                now = .now
                do { try await Task.sleep(for: .seconds(60)) } catch { return }
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("完成") { noteIsFocused = false }
            }
        }
        .confirmationDialog("永久删除这次回访？", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
            Button("删除这次回访", role: .destructive) { deleteCheckIn() }
            Button("取消", role: .cancel) {}
        } message: {
            Text(existingCheckIn?.isAdHoc == true
                 ? "只删除这次随时回访，其他回访和阶段提醒不会改变。此操作无法撤销。"
                 : "这一阶段将重新等待回访，洞察会根据剩余阶段重新计算。其他回访会保留。此操作无法撤销。")
        }
        .alert("这次回访已经记录过了", isPresented: $duplicateDetected) {
            Button("好", role: .cancel) {}
        } message: {
            Text("Worthly 每个阶段只保留一次回访。")
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text(stage.map { "\($0.rawValue) DAYS LATER" } ?? "ANYTIME · 随时回访")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.muted)

            Text(existingCheckIn != nil ? "修正这次回访。" : "现在还觉得\n它值吗？")
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)

            Text(item.name)
                .font(.headline)
                .foregroundStyle(WorthlyTheme.muted)

            Text(existingCheckIn != nil ? "更正当时的记录，保留原来的回访日期和阶段。新的感受可以另记一条随时回访。" : "不要回忆购买时有多兴奋，只记录现在。")
                .foregroundStyle(WorthlyTheme.muted)
            if let existingCheckIn {
                Text(existingCheckIn.createdAt.formatted(date: .abbreviated, time: .shortened))
                    .font(WorthlyTheme.overline)
                    .foregroundStyle(WorthlyTheme.muted)
            }
        }
    }

    private var scoreSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                Text("现在满意吗？")
                    .font(WorthlyTheme.sectionTitle)
                Spacer()
                Text("\(satisfactionScore)/10")
                    .font(.system(.title3, design: .monospaced, weight: .bold))
                    .foregroundStyle(WorthlyTheme.text)
                    .fixedSize()
            }

            Slider(
                value: Binding(
                    get: { Double(satisfactionScore) },
                    set: { satisfactionScore = Int($0.rounded()) }
                ),
                in: 1...10,
                step: 1
            )
            .tint(WorthlyTheme.accent)
            .accessibilityLabel("满意度")
            .accessibilityValue("\(satisfactionScore) 分，满分 10 分")
            .accessibilityHint("从 1 分的后悔到 10 分的很值")

            HStack {
                Text("后悔")
                Spacer()
                Text("很值")
            }
            .font(.caption)
            .foregroundStyle(WorthlyTheme.muted)
        }
        .worthlyCard()
    }

    private var usageSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("最近真的在用吗？")
                .font(WorthlyTheme.sectionTitle)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: min(usageMinimumWidth, 280)), spacing: 10)], spacing: 10) {
                ForEach(UsageFrequency.allCases) { option in
                    Button {
                        usageFrequency = option
                    } label: {
                        HStack(spacing: 7) {
                            Image(systemName: usageFrequency == option ? "checkmark.circle.fill" : "circle")
                                .accessibilityHidden(true)
                            Text(option.displayName)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .padding(.vertical, 8)
                        .foregroundStyle(usageFrequency == option ? WorthlyTheme.background : WorthlyTheme.text)
                        .background(usageFrequency == option ? WorthlyTheme.text : WorthlyTheme.surface)
                        .overlay {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(usageFrequency == option ? WorthlyTheme.accent : WorthlyTheme.text.opacity(0.14), lineWidth: usageFrequency == option ? 2 : 1)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(option.displayName)
                    .accessibilityValue(usageFrequency == option ? "已选择" : "未选择")
                }
            }
        }
    }

    private var noteSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("一句话就够了（可选）")
                .font(.headline)
                .foregroundStyle(WorthlyTheme.text)

            TextField("例如：音质很好，但其实没怎么带出门。", text: $note, axis: .vertical)
                .focused($noteIsFocused)
                .lineLimit(2...5)
                .padding(16)
                .background(WorthlyTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
        }
    }

    private var saveButton: some View {
        Button(existingCheckIn != nil ? "保存修改" : "记下现在的感觉") {
            save()
        }
        .buttonStyle(WorthlyPrimaryButtonStyle())
        .disabled(!canSubmit)
        .opacity(canSubmit ? 1 : 0.45)
        .accessibilityLabel("\(existingCheckIn != nil ? "保存回访修改" : "记下现在的感觉")，满意度 \(satisfactionScore) 分")
    }

    private func save() {
        guard item.state == .bought else { return }
        if let existingCheckIn {
            guard canSubmit else { return }
            do {
                try CheckInRecordService.update(
                    existingCheckIn,
                    for: item,
                    satisfactionScore: satisfactionScore,
                    usageFrequency: usageFrequency,
                    note: note,
                    in: modelContext
                )
                dismiss()
            } catch {
                operationError = "保存失败：\(error.localizedDescription)"
            }
            return
        }
        if let stage {
            guard !CheckInSchedule.isCompleted(stage, for: item) else {
                duplicateDetected = true
                return
            }
        }
        guard canSubmit else { return }

        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let checkIn = CheckIn(
            stage: stage,
            satisfactionScore: satisfactionScore,
            usageFrequency: usageFrequency,
            note: trimmedNote.isEmpty ? nil : trimmedNote,
            item: item
        )

        modelContext.insert(checkIn)

        do {
            try modelContext.save()
            if stage != nil {
                CheckInReminderService.shared.reschedule(for: item)
            }
            dismiss()
        } catch {
            modelContext.rollback()
            operationError = "保存失败：\(error.localizedDescription)"
        }
    }

    private func deleteCheckIn() {
        guard let existingCheckIn, canSubmit else { return }
        do {
            try WorthlyDataDeletion.deleteCheckIn(existingCheckIn, in: modelContext, refreshItemReminders: {
                CheckInReminderService.shared.cancelReminders(for: item.id)
                CheckInReminderService.shared.reschedule(for: item)
            })
            dismiss()
        } catch {
            operationError = "删除失败：\(error.localizedDescription)"
        }
    }
}
