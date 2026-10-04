# Piano instrument credit

“A Little Time” for Worthly v0.2.0 uses **Salamander Grand Piano v3**, sampled by **Alexander Holm**, converted to FLAC by **kinwie / sfzinstruments**, under **Creative Commons Attribution 3.0 Unported (CC BY 3.0)**. The complete license is preserved in `LICENSE-CC-BY-3.0.txt`.

- Source: https://github.com/sfzinstruments/SalamanderGrandPiano
- Revision: `3382bf9496bba2486f5ab0de55a264d1dfc38404`
- Original release: https://archive.org/details/SalamanderGrandPianoV3
- License: https://creativecommons.org/licenses/by/3.0/

Selected samples: A2 through A5 in minor thirds, velocity layer 6. The performance changes their pitch by up to two semitones, applies shorter note releases, a small stereo room return and loudness mastering. The upstream SFZ mapping is not used. The melody, harmony and arrangement are original to this film; no existing song is used.

When publishing the film, include this credit in its accompanying description or credits:

> Piano samples: Salamander Grand Piano v3 by Alexander Holm, CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Source: https://github.com/sfzinstruments/SalamanderGrandPiano. Samples adapted for the original Worthly piano score.

The samples are committed so `npm run score` renders offline with Node and ffmpeg. `scripts/fetch-piano-samples.py` restores the pinned originals using GitHub CLI if needed.
