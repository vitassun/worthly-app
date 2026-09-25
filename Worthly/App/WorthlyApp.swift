import SwiftUI
import SwiftData

@main
struct WorthlyApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(for: [WorthlyItem.self, CheckIn.self])
    }
}
