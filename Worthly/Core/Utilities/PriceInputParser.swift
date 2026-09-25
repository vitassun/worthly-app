import Foundation

enum PriceInputParser {
    static func value(from text: String) -> Double? {
        let normalized = normalize(text)
        guard !normalized.isEmpty,
              let value = Double(normalized),
              value > 0,
              value.isFinite else {
            return nil
        }
        return value
    }

    static func isValidOptional(_ text: String) -> Bool {
        let normalized = normalize(text)
        return normalized.isEmpty || value(from: normalized) != nil
    }

    static func validationMessage(for text: String) -> String? {
        let normalized = normalize(text)
        guard !normalized.isEmpty else { return nil }
        guard let value = Double(normalized), value.isFinite else {
            return "请输入有效金额，例如 639 或 639.50"
        }
        guard value > 0 else {
            return "金额需要大于 0"
        }
        return nil
    }

    static func editingString(_ value: Double?) -> String {
        guard let value else { return "" }
        if value.rounded() == value {
            return String(format: "%.0f", value)
        }
        return String(format: "%.2f", value)
    }

    private static func normalize(_ text: String) -> String {
        text
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: ",", with: "")
            .replacingOccurrences(of: "¥", with: "")
            .replacingOccurrences(of: "￥", with: "")
            .replacingOccurrences(of: " ", with: "")
    }
}
