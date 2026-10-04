#!/usr/bin/env node
/**
 * Worthly promo film — the score.
 *
 * This is a synthesiser, not a sample library. Every sound below is generated
 * from oscillators, envelopes and a reverb, so:
 *
 *   - there is no third-party audio asset and no licence question;
 *   - the result is deterministic (fixed PRNG seed, no wall clock), so a
 *     re-render of the film produces the identical audio;
 *   - the score is versioned as code, like everything else in this project.
 *
 * The original 32-second score below is retimed to the 82-second v0.2.0 film
 * using `src/timeline.ts`. The following times describe the original score:
 *
 *    0.00  opening     a D drone fades out of silence, one bell asks the question
 *    3.27  thesis      the drone holds; the question is answered by a second bell
 *    5.23  before      F colour arrives — warmth, "记下来"
 *    9.70  wait        the mix thins out; the harmony suspends
 *   11.63  decide      G colour lifts; a decision is being made
 *   13.43  purchase    G resolves into the upper register
 *   15.43  time        three identical bells, one per 7 / 30 / 90 day check-in,
 *                      rising D5 → E5 → F5 as understanding deepens
 *   21.10  anytime     A minor colour, intimate
 *   23.20  zoomout     voices accumulate
 *   25.03  insight     the fullest harmony in the film; the rising figure from
 *                      the check-ins completes as A5 → F5 → D5, a D minor
 *                      arpeggio falling home
 *   28.20  philosophy  decay begins — 让结论慢一点出现
 *   30.20  end         a single low D, then silence
 *
 * No percussion, no melody line, no drums. It is a bed: quiet, modal, and
 * deliberately unexciting, because the film's tone is calm and non-judgmental
 * and music that pushes would fight it.
 *
 * Usage:
 *   node scripts/make-score.mjs [--out public/audio/worthly-score.wav] [--gain-db 0]
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SCENES, FPS, TOTAL_FRAMES, sceneById, REVIEW_ROW_FRAMES } from "../src/timeline.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const OUT = path.resolve(root, argOf("--out", "public/audio/worthly-score.wav"));
const TARGET_LUFS = Number(argOf("--target-lufs", "-16"));
const TRIM_DB = Number(argOf("--gain-db", "0"));

// −16 LUFS integrated keeps the instrumental score present and warm,
// but still a bed. −1.0 dBFS true-peak ceiling leaves room for lossy codecs to
// overshoot without clipping.
const PEAK_CEILING = 0.891;

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

const SR = 48000;
const DURATION = TOTAL_FRAMES / FPS;
const N = Math.round(SR * DURATION);
const CHANNELS = 2;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const cents = (value) => Math.pow(2, value / 1200);

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** Deterministic PRNG, so the "air" layer is identical on every run. */
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Attack-hold-release envelope. Always starts and ends at exactly zero. */
const env = (t, dur, attack, release) => {
  if (t < 0 || t > dur) return 0;
  const a = attack > 0 ? smoothstep(t / attack) : 1;
  const r = release > 0 ? smoothstep((dur - t) / release) : 1;
  return a < r ? a : r;
};

/** Constant-power pan. pan −1 = hard left, +1 = hard right. */
const panGains = (pan) => {
  const p = (clamp01((pan + 1) / 2) * Math.PI) / 2;
  return { gl: Math.cos(p), gr: Math.sin(p) };
};

// ---------------------------------------------------------------------------
// Buses — each layer is rendered into its own buffers so it can be measured
// and balanced before the mix. Guessing at levels is how synth beds end up
// either inaudible or overbearing.
// ---------------------------------------------------------------------------

const bus = () => ({ l: new Float64Array(N), r: new Float64Array(N) });
const padBus = bus();
const bellBus = bus();
const airBus = bus();

// ---------------------------------------------------------------------------
// Layer 1 — the pad
// ---------------------------------------------------------------------------

// Four partials is enough for a soft string/organ colour. More than this and
// the pad starts to sound like a synth patch instead of an instrument — and
// the upper partials are what mask the bells, so they are kept low.
const PAD_PARTIALS = [
  [1, 1.0],
  [2, 0.26],
  [3, 0.08],
  [4, 0.03],
];
const PAD_DETUNE = [-5.5, 0, 5.5];
const PAD_DETUNE_GAIN = [0.45, 1.0, 0.45];
const PAD_NORM = 1 / 2.35;

function addPad(target, startSec, durSec, midi, gain, pan, opts = {}) {
  const {
    attack = 2.2,
    release = 2.8,
    lfoRate = 0.085,
    lfoDepth = 0.1,
    lfoPhase = 0,
  } = opts;

  const s0 = Math.max(0, Math.floor(startSec * SR));
  const s1 = Math.min(N, Math.ceil((startSec + durSec) * SR));
  if (s1 <= s0) return;

  const f0 = midiToFreq(midi);
  const { gl, gr } = panGains(pan);

  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const e = env(t, durSec, attack, release);
    if (e <= 0) continue;

    let v = 0;
    for (let d = 0; d < PAD_DETUNE.length; d++) {
      const fd = f0 * cents(PAD_DETUNE[d]);
      const dg = PAD_DETUNE_GAIN[d];
      for (let p = 0; p < PAD_PARTIALS.length; p++) {
        v += Math.sin(2 * Math.PI * fd * PAD_PARTIALS[p][0] * t) * PAD_PARTIALS[p][1] * dg;
      }
    }

    // A very slow amplitude drift is what stops a static pad sounding dead.
    const lfo = 1 + lfoDepth * Math.sin(2 * Math.PI * lfoRate * t + lfoPhase);
    const s = v * PAD_NORM * e * lfo * gain;

    target.l[i] += s * gl;
    target.r[i] += s * gr;
  }
}

// ---------------------------------------------------------------------------
// Layer 2 — bells
// ---------------------------------------------------------------------------

// Slightly inharmonic ratios, which is what makes a struck tone read as a bell
// rather than as a sine beep. The decays are deliberately short: a 7 s ring in
// a texture this dense just smears into the pad, and the film needs these to
// read as *marks*, not as a wash.
const BELL_PARTIALS = [
  [1.0, 1.0, 3.6],
  [2.004, 0.32, 2.2],
  [2.997, 0.13, 1.4],
  [4.09, 0.06, 0.9],
  [5.43, 0.025, 0.55],
];
const BELL_ATTACK = 0.014;
const BELL_TAIL = 0.25;

function addBell(target, startSec, midi, gain, pan) {
  const longest = BELL_PARTIALS.reduce((max, p) => Math.max(max, p[2]), 0);
  const durSec = longest + BELL_TAIL;

  const s0 = Math.max(0, Math.floor(startSec * SR));
  const s1 = Math.min(N, Math.ceil((startSec + durSec) * SR));
  if (s1 <= s0) return;

  const f0 = midiToFreq(midi);
  const { gl, gr } = panGains(pan);

  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const attack = smoothstep(t / BELL_ATTACK);
    const tail = smoothstep((durSec - t) / BELL_TAIL);

    let v = 0;
    for (let p = 0; p < BELL_PARTIALS.length; p++) {
      const [ratio, pg, decay] = BELL_PARTIALS[p];
      const tau = decay / 4.6; // ≈1% amplitude left after `decay` seconds
      v += Math.sin(2 * Math.PI * f0 * ratio * t) * pg * Math.exp(-t / tau);
    }

    const s = v * attack * tail * gain;
    target.l[i] += s * gl;
    target.r[i] += s * gr;
  }
}

// ---------------------------------------------------------------------------
// Layer 3 — air
// ---------------------------------------------------------------------------

// Band-limited noise, buried far below the pad. Its only job is to stop the
// synthesis sounding sterile. If you can hear it as hiss, it is too loud.
function addAir(target, peak) {
  const random = mulberry32(0x5eed_1234);
  const lpCoeff = 1 - Math.exp((-2 * Math.PI * 2600) / SR);
  const hpCoeff = 1 - Math.exp((-2 * Math.PI * 180) / SR);
  let lp = 0;
  let hp = 0;

  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const noise = random() * 2 - 1;

    lp += lpCoeff * (noise - lp);
    hp += hpCoeff * (lp - hp);
    const band = lp - hp;

    // Swells in after the opening and retreats before the end card.
    const swell = smoothstep((t - 4) / 9) * smoothstep((30.5 - t) / 7);
    const s = band * swell * peak;

    target.l[i] += s;
    target.r[i] += s * 0.92;
  }
}

// ---------------------------------------------------------------------------
// Layer 4 — sound design
// ---------------------------------------------------------------------------

// Everything below sits 25–35 dB under the pad. The test is not "can you hear
// the sound effect" — it is "does the picture feel thinner when it is muted".
// A cue that announces itself has failed, however quiet it is in absolute terms.
//
// The vocabulary is deliberately tiny: a switch, a sheet of paper, a room
// breathing, and a held tone. No whoosh, no impact, no riser, no drum.

const sfxBus = bus();

// One trim for the whole layer, so the balance between cues stays fixed when the
// overall level is adjusted. See SFX_PEAK_CEILING_DB at the end of this section.
const SFX_GAIN = 0.5;

/** A tactile tick — the sound a well-made switch makes, not a UI beep. */
function addTick(target, t0, { gain = 0.05, pan = 0, hz = 2100, bright = 5200, dur = 0.016 } = {}) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const random = mulberry32((Math.round(t0 * 1000) ^ 0x7c1c) >>> 0);
  const { gl, gr } = panGains(pan);
  const hpC = 1 - Math.exp((-2 * Math.PI * 1500) / SR);
  const lpC = 1 - Math.exp((-2 * Math.PI * bright) / SR);
  let lp1 = 0;
  let lp2 = 0;

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const e = env(t, dur, 0.0006, dur - 0.0006);
    const noise = random() * 2 - 1;
    lp1 += hpC * (noise - lp1);
    lp2 += lpC * (noise - lp1 - lp2);
    const tone = Math.sin(2 * Math.PI * hz * t) * Math.exp(-t / (dur / 4.2));
    const s = (lp2 * 1.5 + tone * 0.45) * e * gain * SFX_GAIN;
    target.l[idx] += s * gl;
    target.r[idx] += s * gr;
  }
}

/**
 * A soft puff — a card arriving on paper. Band-limited noise with a slow attack
 * and a long release, so it reads as air moving rather than as a hit.
 */
function addPaper(target, t0, { gain = 0.05, pan = 0, dur = 0.26, hp = 420, lp = 3000 } = {}) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const random = mulberry32((Math.round(t0 * 1000) ^ 0x1a2b) >>> 0);
  const { gl, gr } = panGains(pan);
  const hpC = 1 - Math.exp((-2 * Math.PI * hp) / SR);
  const lpC = 1 - Math.exp((-2 * Math.PI * lp) / SR);
  let lp1 = 0;
  let lp2 = 0;

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const e = env(t, dur, 0.035, dur * 0.82);
    const noise = random() * 2 - 1;
    lp1 += hpC * (noise - lp1);
    lp2 += lpC * (noise - lp1 - lp2);
    const s = lp2 * e * gain * SFX_GAIN;
    target.l[idx] += s * gl;
    target.r[idx] += s * gr;
  }
}

/** The room taking a breath at a chapter change. Half a second, barely there. */
function addBreath(target, t0, { gain = 0.045, pan = 0, dur = 0.85 } = {}) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const random = mulberry32((Math.round(t0 * 1000) ^ 0x3c9d) >>> 0);
  const { gl, gr } = panGains(pan);
  const hpC = 1 - Math.exp((-2 * Math.PI * 190) / SR);
  const lpC = 1 - Math.exp((-2 * Math.PI * 1300) / SR);
  let lp1 = 0;
  let lp2 = 0;

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const e = env(t, dur, dur * 0.34, dur * 0.62);
    const noise = random() * 2 - 1;
    lp1 += hpC * (noise - lp1);
    lp2 += lpC * (noise - lp1 - lp2);
    const s = lp2 * e * gain * SFX_GAIN;
    target.l[idx] += s * gl;
    target.r[idx] += s * gr;
  }
}

/** A scroll coming to rest. Shorter and brighter than a breath, still soft. */
function addStop(target, t0, { gain = 0.04, pan = 0, dur = 0.2 } = {}) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const random = mulberry32((Math.round(t0 * 1000) ^ 0x51ef) >>> 0);
  const { gl, gr } = panGains(pan);
  const hpC = 1 - Math.exp((-2 * Math.PI * 520) / SR);
  const lpC = 1 - Math.exp((-2 * Math.PI * 2600) / SR);
  let lp1 = 0;
  let lp2 = 0;

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const e = env(t, dur, 0.012, dur * 0.8);
    const noise = random() * 2 - 1;
    lp1 += hpC * (noise - lp1);
    lp2 += lpC * (noise - lp1 - lp2);
    const s = lp2 * e * gain * SFX_GAIN;
    target.l[idx] += s * gl;
    target.r[idx] += s * gr;
  }
}

/**
 * A held tone under a card. Two partials, a soft attack and a long decay — the
 * pad's own colour, briefly agreeing with the picture.
 */
function addTone(target, t0, { midi = 50, gain = 0.05, pan = 0, dur = 0.9 } = {}) {
  const start = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const { gl, gr } = panGains(pan);
  const f = midiToFreq(midi);

  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const e = env(t, dur, 0.05, dur * 0.85);
    const s =
      (Math.sin(2 * Math.PI * f * t) +
        0.28 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t / 0.3)) *
      e *
      gain *
      SFX_GAIN;
    target.l[idx] += s * gl;
    target.r[idx] += s * gr;
  }
}

/**
 * Where the sound design lands.
 *
 * The times mirror `src/timeline.ts` — the cut is the specification. Chapter
 * breaths only go on the changes that actually turn a page; every one of them
 * would turn the device into a metronome.
 */
const SFX = [
  // chapter changes
  ["breath", 5.233, {}],
  ["breath", 15.433, {}],
  ["breath", 25.0, {}],
  ["breath", 28.067, {}],
  ["breath", 29.733, {}],

  // cards arriving
  ["paper", 10.5, { pan: 0.1 }],
  ["tone", 10.5, { midi: 57, gain: 0.042 }],
  ["paper", 23.5, { pan: -0.15 }],
  ["paper", 25.367, { pan: 0.15 }],
  ["tone", 25.367, { midi: 50, gain: 0.05 }],
  ["paper", 26.467, { pan: -0.2 }],
  ["paper", 26.733, { pan: -0.1 }],

  // scroll coming to rest
  ["stop", 22.267, { pan: -0.05 }],
  ["stop", 24.633, {}],

  // UI confirmations
  ["tick", 6.367, { pan: 0.12 }],
  ["tick", 6.833, { pan: -0.12 }],
  ["tick", 7.2, { pan: 0.1 }],
  ["tick", 8.567, { pan: 0.1 }],
  ["tick", 8.833, { pan: 0.08, bright: 6000 }],
  ["tick", 12.833, { pan: 0.05, hz: 1800 }],
  ["tick", 14.7, { pan: 0.05, hz: 1800 }],
  ["tick", 22.4, { pan: -0.05, bright: 6000 }],

  // the numbers coming to rest — 7 / 30 / 90 days, then their scores
  ["tick", 11.3, { gain: 0.038, hz: 2600 }],
  ["tick", 16.7, { gain: 0.038, hz: 2600 }],
  ["tick", 18.033, { gain: 0.038, hz: 2600 }],
  ["tick", 19.367, { gain: 0.038, hz: 2600 }],
  ["tick", 16.9, { gain: 0.03, hz: 3000, bright: 6000 }],
  ["tick", 18.233, { gain: 0.03, hz: 3000, bright: 6000 }],
  ["tick", 19.567, { gain: 0.03, hz: 3000, bright: 6000 }],

  // the ending lockup: mark, name, line
  ["tick", 29.867, { gain: 0.04, hz: 1500, bright: 3800 }],
  ["paper", 30.133, { gain: 0.04, pan: 0.05 }],
  ["tick", 30.467, { gain: 0.034, hz: 2000 }],
];

// Enforced here, where the isolated bus is available: the sound design must
// never lift the mix enough for a listener to notice a cue as a cue.
//
// The ceiling is expressed in the same pre-normalisation units the layer report
// prints, where the pad peaks at about +1.7 dBFS — so −28 dBFS is roughly 30 dB
// under the pad's peak, and about 13 dB under the finished mix's RMS.
const SFX_PEAK_CEILING_DB = -28;

// ---------------------------------------------------------------------------
// Global dynamics — the film's emotional shape, applied to the pad only.
// ---------------------------------------------------------------------------

const AUTOMATION = [
  [0.0, 0.0],
  [2.4, 0.55],
  [5.0, 1.0],
  [9.2, 0.86],
  [11.4, 1.0],
  [15.2, 1.08],
  [20.7, 0.94],
  [24.5, 1.14],
  [27.9, 0.8],
  [30.2, 0.55],
  [32.0, 0.0],
];

function automationAt(t) {
  if (t <= AUTOMATION[0][0]) return AUTOMATION[0][1];
  for (let i = 1; i < AUTOMATION.length; i++) {
    const [t1, v1] = AUTOMATION[i];
    if (t <= t1) {
      const [t0, v0] = AUTOMATION[i - 1];
      const span = t1 - t0;
      const k = span > 0 ? smoothstep((t - t0) / span) : 1;
      return v0 + (v1 - v0) * k;
    }
  }
  return AUTOMATION[AUTOMATION.length - 1][1];
}

// ---------------------------------------------------------------------------
// Reverb — a small Freeverb-style Schroeder network.
// ---------------------------------------------------------------------------

function reverb(dryL, dryR, { wet = 0.34, feedback = 0.84, damp = 0.34 } = {}) {
  const scale = SR / 44100;
  const combTuning = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) =>
    Math.max(1, Math.round(n * scale)),
  );
  const allpassTuning = [556, 441, 341, 225].map((n) => Math.max(1, Math.round(n * scale)));
  const spread = Math.max(1, Math.round(23 * scale));

  const run = (dry, offset) => {
    const out = new Float64Array(N);

    const combs = combTuning.map((size) => ({
      size: size + offset,
      buffer: new Float32Array(size + offset),
      index: 0,
      store: 0,
    }));
    const allpasses = allpassTuning.map((size) => ({
      size: size + offset,
      buffer: new Float32Array(size + offset),
      index: 0,
    }));

    for (let i = 0; i < N; i++) {
      const input = dry[i] * 0.015;
      let sum = 0;

      for (const comb of combs) {
        const y = comb.buffer[comb.index];
        comb.store = y * (1 - damp) + comb.store * damp;
        comb.buffer[comb.index] = input + comb.store * feedback;
        comb.index = (comb.index + 1) % comb.size;
        sum += y;
      }

      let value = sum;
      for (const ap of allpasses) {
        const y = ap.buffer[ap.index];
        ap.buffer[ap.index] = value + y * 0.5;
        value = y - value;
        ap.index = (ap.index + 1) % ap.size;
      }

      out[i] = value;
    }

    return out;
  };

  const wetL = run(dryL, 0);
  const wetR = run(dryR, spread);

  return { l: wetL, r: wetR, wet };
}

// ---------------------------------------------------------------------------
// The arrangement
// ---------------------------------------------------------------------------

/** [start, dur, [[midi, gain, pan], …]] */
const PAD = [
  // A continuous low D holds the film together. Every chord below is modal
  // around it: D-F is the minor third, D-G the fourth, D-A the fifth.
  [0.0, 32.0, [[50, 0.3, 0]], { attack: 5.0, release: 4.0 }],

  // 0.00–5.2 · opening + thesis — open and questioning
  [1.1, 6.6, [[62, 0.5, 0.3], [64, 0.26, -0.35]]],
  [3.3, 5.6, [[57, 0.34, -0.3]]],

  // 5.2–11.6 · before + wait — F colour, warmth
  [4.7, 8.0, [[53, 0.62, -0.22], [60, 0.38, 0.24]]],
  [6.6, 6.6, [[65, 0.44, 0.34], [69, 0.26, -0.3]]],
  [9.5, 6.8, [[57, 0.42, 0.2], [64, 0.28, -0.26]]],

  // 11.6–15.4 · decide + purchase — G lifts
  [11.9, 7.2, [[55, 0.58, -0.2], [62, 0.38, 0.2]]],
  [13.9, 5.8, [[67, 0.34, 0.3], [71, 0.2, -0.3]]],

  // 15.4–21.0 · the 7 / 30 / 90 timeline — patient, back to D
  [15.6, 8.0, [[50, 0.6, 0.15], [57, 0.38, -0.2]]],
  [16.7, 6.0, [[62, 0.42, 0.3], [65, 0.28, -0.3]]],

  // 21.0–25.0 · anytime + library — A minor, intimate, accumulating
  [21.2, 7.6, [[57, 0.6, -0.2], [64, 0.38, 0.2]]],
  [23.2, 6.0, [[60, 0.36, 0.3], [69, 0.24, -0.3]]],

  // 25.0–28.1 · insight — the fullest harmony in the film
  [25.1, 7.2, [[50, 0.72, 0], [57, 0.44, -0.2]]],
  [25.1, 6.6, [[62, 0.5, 0.25], [65, 0.34, -0.2], [69, 0.26, 0.35], [74, 0.16, -0.35]]],

  // 28.1–32.0 · philosophy + end — decay to a single note
  [28.4, 3.4, [[50, 0.58, 0], [57, 0.3, 0.1]]],
  [30.2, 1.8, [[50, 0.42, 0]]],
];

/** [start, midi, gain, pan] */
// Gains are set so each bell lifts the 1.4–8 kHz band by at least 6 dB above
// the pad at that moment. A quieter bell is not a subtle bell, it is an
// inaudible one: the reverb return alone puts more high-band energy in the air
// than a timid strike does. `scripts/verify-audio.mjs` measures this.
const BELLS = [
  // opening question, answered
  [0.55, 74, 0.59, 0.15],
  [2.05, 69, 0.51, -0.2],
  [3.45, 65, 0.45, 0.25],

  // one mark per act entry, quiet
  [5.4, 74, 0.37, -0.15],
  [9.8, 69, 0.46, 0.2],
  [11.8, 74, 0.37, -0.2],
  [13.6, 69, 0.37, 0.2],
  [15.6, 74, 0.48, 0.1],

  // 7 / 30 / 90 — the same question asked three times, climbing. These land
  // exactly on the row animations at 16.100 / 17.433 / 18.767.
  [16.1, 74, 0.56, -0.25],
  [17.43, 76, 0.56, 0.25],
  [18.77, 77, 0.56, -0.25],

  // later acts
  [21.2, 76, 0.42, 0.2],
  [23.35, 69, 0.39, -0.2],

  // insight — the climbing figure completes and falls home: A5 → F5 → D5. The
  // notes are spaced 0.9 s apart so each one's tail has decayed before the next
  // lands; closer than that and they smear into one event instead of an arpeggio.
  [25.4, 81, 0.59, 0.2],
  [26.3, 77, 0.59, -0.2],
  [27.2, 74, 0.8, 0.15],

  // philosophy + end
  [28.3, 69, 0.39, -0.15],
  [30.3, 62, 0.56, 0],
];

/** Map the previous score to the revised cut; keep UI cues at local frames. */
const OLD_CUT = [[0,"opening"],[98/30,"thesis"],[157/30,"before"],[285/30,"wait"],[349/30,"decide"],[403/30,"purchase"],[463/30,"time"],[630/30,"anytime"],[696/30,"zoomout"],[750/30,"insight"],[842/30,"philosophy"],[892/30,"end"]];
function revisedTime(t) {
  if(t >= 32) return DURATION;
  const [oldStart,id] = OLD_CUT.findLast(([start]) => start <= t);
  if(id === "time") {
    const starts=[20/30,60/30,100/30];
    const local=t-oldStart;
    const row=starts.findLastIndex(start=>start <= local + 0.015);
    if(row>=0) return sceneById(id).from/FPS + REVIEW_ROW_FRAMES[row]/FPS + local-starts[row];
  }
  return sceneById(id).from/FPS + t-oldStart;
}
for(const cue of SFX) cue[1]=revisedTime(cue[1]);
for(const cue of AUTOMATION) cue[0]=revisedTime(cue[0]);
for(const cue of PAD) { const end=revisedTime(cue[0]+cue[1]); cue[0]=revisedTime(cue[0]); cue[1]=end-cue[0]; }
for(const cue of BELLS) cue[0]=revisedTime(cue[0]);
for(const id of ["past","queue","correction","patterns","privacy","appearance"]) {
  const scene=sceneById(id), t=scene.from/FPS, dur=scene.durationInFrames/FPS;
  PAD.push([t-0.4,dur+1.2,[[50,0.45,0],[57,0.28,-0.2],[65,0.2,0.2]],{attack:1,release:1.2}]);
  BELLS.push([t+0.45,74,0.56,0.15]);
  SFX.push(["breath",t,{}]);
}
BELLS.sort((a,b)=>a[0]-b[0]);
SFX.sort((a,b)=>a[1]-b[1]);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const started = Date.now();

for (const [start, dur, notes, opts] of PAD) {
  for (const [midi, gain, pan] of notes) {
    addPad(padBus, start, dur, midi, gain, pan, opts ?? {});
  }
}

// The automation curve is applied to the pad before the reverb, so the room
// breathes with the arrangement instead of sitting on top of it.
for (let i = 0; i < N; i++) {
  const g = automationAt(i / SR);
  padBus.l[i] *= g;
  padBus.r[i] *= g;
}

for (const [start, midi, gain, pan] of BELLS) {
  addBell(bellBus, start, midi, gain, pan);
}

addAir(airBus, 0.075);

for (const [kind, t, opts] of SFX) {
  if (kind === "tick") addTick(sfxBus, t, opts);
  else if (kind === "paper") addPaper(sfxBus, t, opts);
  else if (kind === "breath") addBreath(sfxBus, t, opts);
  else if (kind === "stop") addStop(sfxBus, t, opts);
  else if (kind === "tone") addTone(sfxBus, t, opts);
  else throw new Error(`Unknown sound-design cue: ${kind}`);
}

// ---------------------------------------------------------------------------
// Mix
// ---------------------------------------------------------------------------

const dryL = new Float64Array(N);
const dryR = new Float64Array(N);
for (let i = 0; i < N; i++) {
  dryL[i] = padBus.l[i] + bellBus.l[i];
  dryR[i] = padBus.r[i] + bellBus.r[i];
}

const wet = reverb(dryL, dryR);

const outL = new Float64Array(N);
const outR = new Float64Array(N);
const DRY_GAIN = 0.78;
const WET_GAIN = 0.62;

// The sound design is added dry, at the output, rather than sent through the
// room: a tick has to feel like it happened on the glass, not in the hall.
for (let i = 0; i < N; i++) {
  outL[i] = dryL[i] * DRY_GAIN + wet.l[i] * WET_GAIN + airBus.l[i] + sfxBus.l[i];
  outR[i] = dryR[i] * DRY_GAIN + wet.r[i] * WET_GAIN + airBus.r[i] + sfxBus.r[i];
}

// Guarantee absolute silence at both ends of the file — a non-zero first or
// last sample is an audible click when a player starts or stops.
const HEAD = Math.round(0.35 * SR);
const TAIL = Math.round(1.1 * SR);
for (let i = 0; i < N; i++) {
  let g = 1;
  if (i < HEAD) g = smoothstep(i / HEAD);
  const fromEnd = N - 1 - i;
  if (fromEnd < TAIL) g = Math.min(g, smoothstep(fromEnd / TAIL));
  outL[i] *= g;
  outR[i] *= g;
}

// Normalise by peak so the synthesised sum is well-conditioned, then calibrate
// the integrated loudness against a declared target rather than a magic number.
let peak = 0;
for (let i = 0; i < N; i++) {
  const a = Math.abs(outL[i]);
  const b = Math.abs(outR[i]);
  if (a > peak) peak = a;
  if (b > peak) peak = b;
}
const norm = peak > 0 ? 0.84 / peak : 1;
for (let i = 0; i < N; i++) {
  outL[i] *= norm;
  outR[i] *= norm;
}

// ---------------------------------------------------------------------------
// Measure, then write
// ---------------------------------------------------------------------------

const stats = (buffer) => {
  let sum = 0;
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i];
    sum += v * v;
    const a = Math.abs(v);
    if (a > max) max = a;
  }
  const rms = Math.sqrt(sum / buffer.length);
  return {
    peakDb: 20 * Math.log10(max || 1e-12),
    rmsDb: 20 * Math.log10(rms || 1e-12),
  };
};

const layerStats = {
  pad: stats(padBus.l),
  bells: stats(bellBus.l),
  air: stats(airBus.l),
  wet: stats(wet.l),
  sfx: stats(sfxBus.l),
};

function writeWav(fileL, fileR, file) {
  const frames = fileL.length;
  const dataBytes = frames * CHANNELS * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * CHANNELS * 2, 28); // byte rate
  buffer.writeUInt16LE(CHANNELS * 2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    const l = Math.max(-32768, Math.min(32767, Math.round(fileL[i] * 32767)));
    const r = Math.max(-32768, Math.min(32767, Math.round(fileR[i] * 32767)));
    buffer.writeInt16LE(l, offset);
    buffer.writeInt16LE(r, offset + 2);
    offset += 4;
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  return buffer.length;
}

const bytes = writeWav(outL, outR, OUT);

// ---------------------------------------------------------------------------
// Loudness calibration
// ---------------------------------------------------------------------------

// Measured with ffmpeg's `loudnorm` in analysis mode, which reports ITU-R
// BS.1770 integrated loudness. Remotion ships its own ffmpeg, so this needs no
// system install.
function findFFmpeg() {
  const base = path.join(root, "node_modules", "@remotion");
  if (!fs.existsSync(base)) return null;
  for (const entry of fs.readdirSync(base)) {
    if (!entry.startsWith("compositor-")) continue;
    for (const name of ["ffmpeg.exe", "ffmpeg"]) {
      const candidate = path.join(base, entry, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function measureLufs(file) {
  const ffmpeg = findFFmpeg();
  if (!ffmpeg) return null;
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-nostats",
      "-i",
      file,
      "-af",
      `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:print_format=json`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  const text = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const match = text.match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
  return match ? Number(match[1]) : null;
}

const measurePeak = (l, r) => {
  let max = 0;
  for (let i = 0; i < l.length; i++) {
    const a = Math.abs(l[i]);
    const b = Math.abs(r[i]);
    if (a > max) max = a;
    if (b > max) max = b;
  }
  return max;
};

const provisional = measureLufs(OUT);
let calibratedDb = 0;
let clippedBy = 0;

if (provisional !== null) {
  let delta = TARGET_LUFS - provisional;
  let scale = Math.pow(10, delta / 20);
  const headroom = PEAK_CEILING / measurePeak(outL, outR);
  if (scale > headroom) {
    scale = headroom;
    clippedBy = TARGET_LUFS - (provisional + 20 * Math.log10(scale));
    delta = 20 * Math.log10(scale);
  }
  for (let i = 0; i < N; i++) {
    outL[i] *= scale;
    outR[i] *= scale;
  }
  calibratedDb = delta;
}

// Manual trim, applied after calibration.
const trim = Math.pow(10, TRIM_DB / 20);
for (let i = 0; i < N; i++) {
  outL[i] *= trim;
  outR[i] *= trim;
}

const finalBytes = writeWav(outL, outR, OUT);
const finalLufs = measureLufs(OUT);
void bytes;

// ---------------------------------------------------------------------------
// Cue sheet
// ---------------------------------------------------------------------------

// The score is written to the cut, so the cut is the specification. Emitting
// the cue list lets the QA pass prove that the bells actually land on the
// film's beats, rather than trusting the arrangement comments above.
const cuePath = path.join(root, "qa", "reports", "score-cues.json");
fs.mkdirSync(path.dirname(cuePath), { recursive: true });
fs.writeFileSync(
  cuePath,
  `${JSON.stringify(
    {
      duration: DURATION,
      sampleRate: SR,
      targetLufs: TARGET_LUFS,
      bells: BELLS.map(([t, midi, gain, pan]) => ({ t, midi, gain, pan })),
      sfx: SFX.map(([kind, t]) => ({ kind, t })),
    },
    null,
    2,
  )}\n`,
);

// Measured last, so the printed master numbers describe the file on disk.
const masterL = stats(outL);
const masterR = stats(outR);

const rel = path.relative(root, OUT).replace(/\\/g, "/");
const db = (value) => `${value.toFixed(1).padStart(6)} dBFS`;

console.log(`score · ${rel}`);
console.log(`format           ${SR} Hz · ${CHANNELS} ch · 16-bit PCM · ${DURATION.toFixed(2)}s`);
console.log(`size             ${(finalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`render time      ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log("");
console.log("layer balance (peak / RMS, left channel)");
console.log(`  pad            ${db(layerStats.pad.peakDb)}  ${db(layerStats.pad.rmsDb)}`);
console.log(`  bells          ${db(layerStats.bells.peakDb)}  ${db(layerStats.bells.rmsDb)}`);
console.log(`  air            ${db(layerStats.air.peakDb)}  ${db(layerStats.air.rmsDb)}`);
console.log(`  reverb return  ${db(layerStats.wet.peakDb)}  ${db(layerStats.wet.rmsDb)}`);
console.log(`  sound design   ${db(layerStats.sfx.peakDb)}  ${db(layerStats.sfx.rmsDb)}`);
console.log("");
console.log("master");
console.log(`  left           ${db(masterL.peakDb)}  ${db(masterL.rmsDb)}`);
console.log(`  right          ${db(masterR.peakDb)}  ${db(masterR.rmsDb)}`);
console.log(`  headroom       ${db(-masterL.peakDb)}`);
console.log(`  L/R RMS skew   ${(masterL.rmsDb - masterR.rmsDb).toFixed(2)} dB`);
console.log("");
console.log("loudness");
if (provisional === null) {
  console.log("  skipped        ffmpeg not found — audio written at the provisional level");
} else {
  console.log(`  provisional    ${provisional.toFixed(2)} LUFS (before calibration)`);
  console.log(`  calibration    ${calibratedDb >= 0 ? "+" : ""}${calibratedDb.toFixed(2)} dB`);
  console.log(`  final          ${finalLufs === null ? "?" : finalLufs.toFixed(2)} LUFS   target ${TARGET_LUFS.toFixed(2)}`);
  if (clippedBy > 0.05) {
    console.log(
      `  note           target could not be met without exceeding the peak ceiling;`,
      `${clippedBy.toFixed(2)} LU short`,
    );
  }
}
if (TRIM_DB !== 0) console.log(`  manual trim    ${TRIM_DB >= 0 ? "+" : ""}${TRIM_DB} dB`);
console.log("");
console.log(`cues             ${BELLS.length} bells + ${SFX.length} sound-design cues → ${path.relative(root, cuePath).replace(/\\/g, "/")}`);
if (layerStats.sfx.peakDb > SFX_PEAK_CEILING_DB) {
  console.log(
    `  WARNING        sound design peaks at ${layerStats.sfx.peakDb.toFixed(1)} dBFS, ` +
      `above the ${SFX_PEAK_CEILING_DB} dBFS ceiling — a cue would be audible as a cue`,
  );
}
