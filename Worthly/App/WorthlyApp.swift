import SwiftUI
import SwiftData

@main
struct WorthlyApp: App {
    @UIApplicationDelegateAdaptor(WorthlyApplicationDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(for: [WorthlyItem.self, CheckIn.self])
    }
}
