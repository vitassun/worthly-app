# Worthly TestFlight Candidate Checklist

Use this list before creating each candidate build. A checked source/configuration item does not replace a simulator or device test. App Store Connect tasks below are intentionally unfinished.

## Pre-build

- [x] App version and build number are defined once for Debug and Release: `0.1.0` / `1`.
- [x] Bundle identifier is `com.vitassun.worthly`; Debug and Release use Automatic signing with no hard-coded Team ID.
- [x] A 1024 × 1024 AppIcon asset is present. This is a restrained geometric W mark; replace or approve it as final brand artwork before public release.
- [x] Privacy manifest is bundled; it declares app-only UserDefaults access and no tracking or collected data.
- [ ] Confirm the archive contains no secrets, signing certificates, provisioning profiles, or private keys.
- [ ] Build the Release simulator configuration on macOS/Xcode.
- [ ] Create and inspect a signed device archive using the account’s own Apple Developer team in Xcode.

## Functional checks

- [ ] First-launch onboarding appears once; both completion choices work.
- [ ] Add and edit an item; mark it bought and passed.
- [ ] Complete sequential 7 / 30 / 90 day check-ins.
- [ ] Tap reminders from foreground, background, and terminated states; verify deleted/completed stages are safe.
- [ ] Confirm insight thresholds with sparse and mature data.
- [ ] Export JSON with items, optional values, and nested check-ins.
- [ ] Confirm destructive Delete All, cascade behavior, reminder cleanup, and the clean Home state.

## Accessibility

- [ ] Complete a VoiceOver quick pass on primary actions, scores, prices, and selected choices.
- [ ] Inspect onboarding, Add Item, Check-in, Settings, Item Detail, and Insights at the largest Dynamic Type size.
- [ ] Verify Reduce Motion behavior and 44 pt minimum control targets.

## Privacy

- [x] The product remains local-first; no analytics, ads, tracking, or account backend is included.
- [x] Data export is manually initiated through the system share sheet.
- [ ] Verify deletion on a device and review the privacy answers before external testing.

## App Store Connect — later

- [ ] Screenshots
- [ ] App description
- [ ] Privacy answers
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Age rating
- [ ] TestFlight external-testing information

No App Store Connect submission or upload has been performed by this checklist.
