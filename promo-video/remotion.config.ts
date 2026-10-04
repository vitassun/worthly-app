import { Config } from "@remotion/cli/config";

// Keep RGB colors intact until the explicit video color-space conversion.
Config.setVideoImageFormat("png");
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
Config.setPixelFormat("yuv420p");
// CRF 14 + the slow preset: the 82s film gets plenty of
// headroom. This keeps the small Chinese text inside the phone mock crisp
// instead of letting 4:2:0 chroma subsampling smear the glyph edges.
Config.setCrf(14);
Config.setX264Preset("slow");
// The film is deterministic: no randomness, no wall-clock reads.
Config.setConcurrency(4);
