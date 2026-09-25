import SwiftUI

enum WorthlyTheme {
    static let background = Color(hex: 0xEFEAE0)
    static let surface = Color(hex: 0xE5DFD2)
    static let text = Color(hex: 0x1A1A1A)
    static let muted = Color(hex: 0x5C5852)
    static let accent = Color(hex: 0xCD6F47)
    static let nearBlack = Color(hex: 0x0A0A0A)

    static let pagePadding: CGFloat = 20
    static let cardRadius: CGFloat = 18

    static let displayTitle = Font.system(.largeTitle, design: .serif, weight: .bold)
    static let sectionTitle = Font.system(.title2, design: .serif, weight: .bold)
    static let overline = Font.system(.caption, design: .monospaced, weight: .semibold)
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

struct WorthlyPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(WorthlyTheme.background)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 50)
            .padding(.horizontal, 18)
            .background(WorthlyTheme.text)
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
            .opacity(configuration.isPressed ? 0.78 : 1)
    }
}

struct WorthlyCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(20)
            .background(WorthlyTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
    }
}

extension View {
    func worthlyCard() -> some View {
        modifier(WorthlyCardModifier())
    }
}
