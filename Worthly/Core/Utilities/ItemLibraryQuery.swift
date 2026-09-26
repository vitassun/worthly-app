import Foundation

enum ItemLibraryStateFilter: String, CaseIterable, Identifiable {
    case all
    case considering
    case bought
    case passed
    case archived

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all: "全部"
        case .considering: "考虑中"
        case .bought: "已购买"
        case .passed: "没买"
        case .archived: "已归档"
        }
    }

    fileprivate func includes(_ state: ItemState) -> Bool {
        switch self {
        case .all: true
        case .considering: state == .considering
        case .bought: state == .bought
        case .passed: state == .passed
        case .archived: state == .archived
        }
    }
}

enum ItemLibrarySort: String, CaseIterable, Identifiable {
    case newest
    case oldest
    case desireHigh

    var id: String { rawValue }

    var title: String {
        switch self {
        case .newest: "最近记录"
        case .oldest: "最早记录"
        case .desireHigh: "最想要"
        }
    }
}

enum ItemLibraryQuery {
    static func filtered(
        items: [WorthlyItem],
        searchText: String,
        stateFilter: ItemLibraryStateFilter,
        category: String? = nil,
        sortOrder: ItemLibrarySort
    ) -> [WorthlyItem] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        let selectedCategory = category.map(normalizedCategory)

        let matchingItems = items.filter { item in
            guard stateFilter.includes(item.state) else { return false }

            if let selectedCategory,
               normalizedCategory(item.category) != selectedCategory {
                return false
            }

            guard !query.isEmpty else { return true }
            return [
                item.name,
                item.category,
                item.sourceNote ?? "",
                item.reason.displayName,
                item.state.displayName
            ]
            .contains { $0.localizedCaseInsensitiveContains(query) }
        }

        return matchingItems.sorted { lhs, rhs in
            switch sortOrder {
            case .newest:
                if lhs.createdAt != rhs.createdAt { return lhs.createdAt > rhs.createdAt }
                return lhs.id.uuidString < rhs.id.uuidString
            case .oldest:
                if lhs.createdAt != rhs.createdAt { return lhs.createdAt < rhs.createdAt }
                return lhs.id.uuidString < rhs.id.uuidString
            case .desireHigh:
                if lhs.desireScore != rhs.desireScore { return lhs.desireScore > rhs.desireScore }
                if lhs.createdAt != rhs.createdAt { return lhs.createdAt > rhs.createdAt }
                return lhs.id.uuidString < rhs.id.uuidString
            }
        }
    }

    static func availableCategories(in items: [WorthlyItem]) -> [String] {
        Set(items.map { normalizedCategory($0.category) }).sorted()
    }

    private static func normalizedCategory(_ category: String) -> String {
        let trimmed = category.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "其他" : trimmed
    }
}
