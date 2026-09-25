import SwiftUI
import SwiftData

struct CheckInView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let item: WorthlyItem
    let stage: CheckInStage

    @State private var satisfactionScore = 7
    @State private var usageFrequency: UsageFrequency = .weekly
    @State private var note = ""
    @State private var duplicateDetected = false

    private var alreadyCompleted: Bool {
        CheckInSchedule.isCompleted(stage, for: item)
    }

    private var canSubmit: Bool {
        guard
            item.state == .bought,
            CheckInSchedule.nextPendingStage(for: item) == stage,
            let dueDate = CheckInSchedule.dueDate(for: item, stage: stage)
        else { return false }

        return dueDate <= .now && !alreadyCompleted
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
                }
                .padding(.horizontal, WorthlyTheme.pagePadding)
                .padding(.vertical, 24)
            }
        }
        .navigationTitle("\(stage.rawValue) 天回访")
        .navigationBarTitleDisplayMode(.inline)
        .alert("这次回访已经记录过了", isPresented: $duplicateDetected) {
            Button("好", role: .cancel) {}
        } message: {
            Text("Worthly 每个阶段只保留一次回访。")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("\(stage.rawValue) DAYS LATER")
                .font(WorthlyTheme.overline)
                .foregroundStyle(WorthlyTheme.accent)

            Text("现在还觉得\n它值吗？")
                .font(WorthlyTheme.displayTitle)
                .foregroundStyle(WorthlyTheme.text)

            Text(item.name)
                .font(.headline)
                .foregroundStyle(WorthlyTheme.muted)

            Text("不要回忆购买时有多兴奋，只记录现在。")
                .foregroundStyle(WorthlyTheme.muted)
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
                    .foregroundStyle(WorthlyTheme.accent)
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

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 108), spacing: 10)], spacing: 10) {
                ForEach(UsageFrequency.allCases) { option in
                    Button {
                        usageFrequency = option
                    } label: {
                        Text(option.displayName)
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .foregroundStyle(usageFrequency == option ? WorthlyTheme.background : WorthlyTheme.text)
                            .background(usageFrequency == option ? WorthlyTheme.text : WorthlyTheme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(.plain)
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
                .lineLimit(2...5)
                .padding(16)
                .background(WorthlyTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
        }
    }

    private var saveButton: some View {
        Button("记下现在的感觉") {
            save()
        }
        .buttonStyle(WorthlyPrimaryButtonStyle())
        .disabled(!canSubmit)
        .opacity(canSubmit ? 1 : 0.45)
    }

    private func save() {
        guard item.state == .bought else { return }
        guard !CheckInSchedule.isCompleted(stage, for: item) else {
            duplicateDetected = true
            return
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
        try? modelContext.save()
        CheckInReminderService.shared.reschedule(for: item)
        dismiss()
    }
}
