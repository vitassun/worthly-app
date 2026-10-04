"""Read native PNG colors with their ICC profile; never write or modify images."""
import io
import json
import sys
from PIL import Image, ImageCms

image = Image.open(sys.argv[1])
targets = json.loads(sys.argv[2])
profile_bytes = image.info.get("icc_profile")
profile_name = "unprofiled / assumed sRGB"
if profile_bytes:
    profile = ImageCms.ImageCmsProfile(io.BytesIO(profile_bytes))
    profile_name = ImageCms.getProfileName(profile).strip()
    rgb = ImageCms.profileToProfile(image.convert("RGB"), profile,
                                   ImageCms.createProfile("sRGB"), outputMode="RGB")
else:
    rgb = image.convert("RGB")
colors = rgb.getcolors(rgb.width * rgb.height)
counts = {role: 0 for role in targets}
tint = 0
for count, color in colors:
    for role, hex_value in targets.items():
        target = tuple(int(hex_value[i:i + 2], 16) for i in (0, 2, 4))
        # Color-profile conversion and the native 8-bit screenshot each round.
        if max(abs(channel - expected) for channel, expected in zip(color, target)) <= 2:
            counts[role] += count
    r, g, b = color
    if r > 140 and r - g > 30 and g - b > 15:
        tint += count
print(json.dumps({"profileName": profile_name, "counts": counts,
                  "systemTabTint": tint, "comparisonTolerance": 2,
                  "colorEvaluation": "ICC-to-sRGB in memory; original PNG unchanged"}))
