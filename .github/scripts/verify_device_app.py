"""Reject simulator or appearance-locked apps before publishing the unsigned IPA."""
import pathlib
import plistlib
import subprocess
import sys

app = pathlib.Path(sys.argv[1]).resolve()
with (app / "Info.plist").open("rb") as file:
    info = plistlib.load(file)

assert info.get("CFBundleSupportedPlatforms") == ["iPhoneOS"], "Not an iPhoneOS app"
assert info.get("DTPlatformName") == "iphoneos", "Wrong build platform"
assert "UIUserInterfaceStyle" not in info, "App must follow system appearance"
binary = app / info["CFBundleExecutable"]
architectures = subprocess.check_output(["lipo", "-archs", str(binary)], text=True).split()
assert "arm64" in architectures, f"Missing device arm64: {architectures}"
assert not {"x86_64", "i386"}.intersection(architectures), "Simulator architecture found"
version = info["CFBundleShortVersionString"]
build = info["CFBundleVersion"]
print(f"Verified iPhoneOS / {' '.join(architectures)} / version {version} ({build}) / system appearance")
