import SwiftUI
import UIKit

/// The single source of truth for colour. Every surface, text and accent colour
/// in the app resolves here, so the light editorial palette and its warm dark
/// counterpart stay in one place and can never drift apart.
///
/// The light values are the original locked palette. The dark values invert the
/// same relationships rather than inventing a new look: the cream "paper"
/// becomes the ink, the ink becomes the paper, and the orange is lifted so it
/// keeps enough contrast on a dark ground. `background` and `text` deliberately
/// swap roles, which is what makes every inverted pair in the app — primary
/// buttons, selected chips, emphasis cards — invert correctly for free.
enum WorthlyTheme {
    static let background = adaptive(light: 0xEFEAE0, dark: 0x17140F)
    static let surface = adaptive(light: 0xE5DFD2, dark: 0x221E17)
    static let text = adaptive(light: 0x1A1A1A, dark: 0xEFEAE0)
    static let muted = adaptive(light: 0x5C5852, dark: 0xA69D8F)
    static let accent = adaptive(light: 0xCD6F47, dark: 0xE0895E)

    /// The rare high-contrast emphasis card. Light mode uses near black with
    /// cream text on top; dark mode flips it to a light surface with dark text,
    /// because a near-black card on a dark page would be invisible.
    static let emphasis = adaptive(light: 0x0A0A0A, dark: 0xF5F0E5)

    static let pagePadding: CGFloat = 20
    static let cardRadius: CGFloat = 18

    static let displayTitle = Font.system(.largeTitle, design: .serif, weight: .bold)
    static let sectionTitle = Font.system(.title2, design: .serif, weight: .bold)
    static let overline = Font.system(.caption, design: .monospaced, weight: .semibold)

    private static func adaptive(light: UInt, dark: UInt) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

extension UIColor {
    convenience init(hex: UInt, alpha: CGFloat = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: alpha
        )
    }
}

struct WorthlyPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundStyle(WorthlyTheme.background)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 50)
            .padding(.horizontal, 18)
            .background(WorthlyTheme.text)
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
            .opacity(configuration.isPressed ? 0.78 : 1)
    }
}

struct WorthlySecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .fixedSize(horizontal: false, vertical: true)
            .foregroundStyle(WorthlyTheme.text)
            .frame(maxWidth: .infinity)
            .frame(minHeight: 50)
            .padding(.horizontal, 18)
            .background(WorthlyTheme.surface)
            .overlay {
                RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous)
                    .stroke(WorthlyTheme.text.opacity(0.14), lineWidth: 1)
            }
            .clipShape(RoundedRectangle(cornerRadius: WorthlyTheme.cardRadius, style: .continuous))
            .opacity(configuration.isPressed ? 0.72 : 1)
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
