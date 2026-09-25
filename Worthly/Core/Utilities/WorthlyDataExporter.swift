import Foundation

enum WorthlyDataExporter {
    static let exportVersion = 1

    static func data(for items: [WorthlyItem], exportedAt: Date = .now) throws -> Data {
        let document = ExportDocument(
            exportVersion: exportVersion,
            exportedAt: exportedAt,
            items: items
                .sorted {
                    if $0.createdAt == $1.createdAt { return $0.id.uuidString < $1.id.uuidString }
                    return $0.createdAt < $1.createdAt
                }
                .map { ExportItem(item: $0) }
        )

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        encoder.nonConformingFloatEncodingStrategy = .throw
        return try encoder.encode(document)
    }
}

private struct ExportDocument: Encodable {
    let exportVersion: Int
    let exportedAt: Date
    let items: [ExportItem]
}

private struct ExportItem: Encodable {
    let id: String
    let name: String
    let category: String
    let state: String
    let reason: String
    let desireScore: Int
    let expectedUsage: String
    let originalPrice: Double?
    let paidPrice: Double?
    let createdAt: Date
    let purchaseDate: Date?
    let decisionDate: Date?
    let note: String?
    let sourceNote: String?
    let checkIns: [ExportCheckIn]

    init(item: WorthlyItem) {
        id = item.id.uuidString
        name = item.name
        category = item.category
        state = item.stateRawValue
        reason = item.reasonRawValue
        desireScore = item.desireScore
        expectedUsage = item.expectedUsageRawValue
        originalPrice = item.originalPrice.flatMap { $0.isFinite ? $0 : nil }
        paidPrice = item.paidPrice.flatMap { $0.isFinite ? $0 : nil }
        createdAt = item.createdAt
        purchaseDate = item.purchaseDate
        decisionDate = item.decisionDate
        note = item.sourceNote
        sourceNote = item.sourceNote
        checkIns = item.checkIns
            .sorted {
                if $0.createdAt == $1.createdAt { return $0.id.uuidString < $1.id.uuidString }
                return $0.createdAt < $1.createdAt
            }
            .map { ExportCheckIn(checkIn: $0) }
    }
}

private struct ExportCheckIn: Encodable {
    let stage: Int
    let satisfactionScore: Int
    let usageFrequency: String
    let note: String?
    let createdAt: Date

    init(checkIn: CheckIn) {
        stage = checkIn.stageDays
        satisfactionScore = checkIn.satisfactionScore
        usageFrequency = checkIn.usageFrequency
        note = checkIn.note
        createdAt = checkIn.createdAt
    }
}
