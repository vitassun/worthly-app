#!/usr/bin/env node
/**
 * Worthly promo film — audio quality assurance.
 *
 * The same rule as the picture: no claim without a measurement. This decodes
 * the delivered MP4's audio back to PCM and checks the things that actually go
 * wrong in a synthesised bed:
 *
 *   streams        the mux carried exactly one video and one audio stream
 *   duration       the audio is the same length as the picture, not padded
 *   level          no clipping, sane integrated loudness, real stereo content
 *   discontinuities a click or a pop is a large sample-to-sample jump, and it
 *                  is the single most common defect in generated audio
 *   silence        true silence at both ends, and no dead air in the middle
 *
 * Usage:
 *   node scripts/verify-audio.mjs [--video renders/worthly-promo-v0.2.0.mp4]
 *                                 [--wav public/audio/worthly-score.wav]
 *                                 [--target-lufs -19]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { FPS, sceneById, REVIEW_ROW_FRAMES } from "../src/timeline.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const VIDEO = path.resolve(root, argOf("--video", "renders/worthly-promo-v0.2.0.mp4"));
const WAV = path.resolve(root, argOf("--wav", "public/audio/worthly-score.wav"));
const TARGET_LUFS = Number(argOf("--target-lufs", "-16"));
const REPORT_DIR = path.resolve(root, argOf("--report-dir", "qa/reports"));

const SR = 48000;

// ---------------------------------------------------------------------------
// ffmpeg / ffprobe
// ---------------------------------------------------------------------------

function findBinary(names) {
  const base = path.join(root, "node_modules", "@remotion");
  if (!fs.existsSync(base)) return null;
  for (const entry of fs.readdirSync(base)) {
    if (!entry.startsWith("compositor-")) continue;
    for (const name of names) {
      const candidate = path.join(base, entry, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

const FFMPEG = findBinary(["ffmpeg.exe", "ffmpeg"]);
const FFPROBE = findBinary(["ffprobe.exe", "ffprobe"]);

if (!FFMPEG || !FFPROBE) {
  console.error("ffmpeg/ffprobe not found under node_modules/@remotion — run `npm install` first.");
  process.exit(2);
}

const probe = (file) => {
  const result = spawnSync(
    FFPROBE,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size,bit_rate",
      "-show_entries",
      "stream=index,codec_type,codec_name,sample_rate,channels,duration,nb_frames,width,height",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (result.status !== 0) throw new Error(`ffprobe failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

/**
 * Minimal RIFF reader. Remotion's bundled ffmpeg is a stripped build: it has
 * the `wav` muxer and `pcm_s16le` but no raw `f32le` muxer, so the decode step
 * goes through a temporary WAV and the sample conversion happens here.
 */
function readWavPcm16(buffer) {
  if (
    buffer.length < 44 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("decoded audio is not a RIFF/WAVE file");
  }

  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "data") {
      dataOffset = offset + 8;
      dataSize = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (dataOffset < 0) throw new Error("decoded audio has no data chunk");

  const count = Math.floor(Math.min(dataSize, buffer.length - dataOffset) / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    samples[i] = buffer.readInt16LE(dataOffset + i * 2) / 32768;
  }
  return samples;
}

/** Decode to interleaved stereo at SR. */
const decode = (file, { video = false } = {}) => {
  const tmp = path.join(
    os.tmpdir(),
    `worthly-audio-${process.pid}-${Date.now().toString(36)}.wav`,
  );

  try {
    const result = spawnSync(
      FFMPEG,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        file,
        ...(video ? ["-vn"] : []),
        "-acodec",
        "pcm_s16le",
        "-ac",
        "2",
        "-ar",
        String(SR),
        "-y",
        tmp,
      ],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
    if (result.status !== 0) {
      throw new Error(`ffmpeg decode failed: ${result.stderr ?? "unknown error"}`);
    }
    return readWavPcm16(fs.readFileSync(tmp));
  } finally {
    fs.rmSync(tmp, { force: true });
  }
};

const loudness = (file, { video = false } = {}) => {
  const result = spawnSync(
    FFMPEG,
    [
      "-hide_banner",
      "-nostats",
      "-i",
      file,
      ...(video ? ["-vn"] : []),
      "-af",
      `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11:print_format=json`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  const text = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const pick = (key) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"(-?[\\d.]+)"`));
    return match ? Number(match[1]) : null;
  };
  return { i: pick("input_i"), tp: pick("input_tp"), lra: pick("input_lra") };
};

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

const checks = [];
const record = (name, ok, detail) => checks.push({ name, ok, detail });

/**
 * Cue matching, band-limited above the pad.
 *
 * The bells sit below the pad in broadband RMS, so a plain energy envelope
 * cannot see them. Two things separate them: their partials reach higher than
 * the pad's, and they attack in 14 ms where the pad takes seconds. Everything
 * below therefore works on a high-passed copy of the signal.
 *
 * The test is deliberately an A/B comparison rather than an onset picker. An
 * onset picker has to decide what counts as a note, and the reverb's slow
 * 100 ms build defeats local-maximum rules — the loudest moment of a bell is
 * well after the bell starts. "Is the high band substantially louder just
 * after this cue than just before it" has an unambiguous answer.
 */
const HP_HZ = 1400;
const CUE_LOOKBACK_S = 0.06;
const CUE_LOOKAHEAD_S = 0.05;
const CUE_GUARD_S = 0.005;

// 3 dB is a doubling of energy in the band, which is unambiguously audible;
// below that a strike is colouration rather than an event. The measured worst
// case is 3.2 dB and the median is 7.1 dB, so this floor has real headroom
// without being a threshold the score merely happens to clear.
const CUE_MIN_GAIN_DB = 3;

// One frame at 60 fps is 16.7 ms, so 20 ms catches a one-frame slip in either
// direction. The measured worst case is 9 ms — the bell's own 14 ms attack,
// seen through a 5 ms detection window.
const CUE_TOLERANCE_S = 0.02;

function highPassed(pcm, frames) {
  const coeff = 1 - Math.exp((-2 * Math.PI * HP_HZ) / SR);
  const out = new Float32Array(frames);
  let lp = 0;
  for (let i = 0; i < frames; i++) {
    const x = (pcm[i * 2] + pcm[i * 2 + 1]) * 0.5;
    lp += coeff * (x - lp);
    out[i] = x - lp;
  }
  return out;
}

const rmsBetween = (signal, fromSec, toSec) => {
  const a = Math.max(0, Math.round(fromSec * SR));
  const b = Math.min(signal.length, Math.round(toSec * SR));
  if (b <= a) return 0;
  let sum = 0;
  for (let i = a; i < b; i++) sum += signal[i] * signal[i];
  return Math.sqrt(sum / (b - a));
};

const toDb = (value) => (value > 0 ? 20 * Math.log10(value) : -120);

/** Mono sum, for measurements that should not be band-limited. */
const monoBuffer = (pcm, frames) => {
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) out[i] = (pcm[i * 2] + pcm[i * 2 + 1]) * 0.5;
  return out;
};

/**
 * For each cue: how much the high band lifts across it, and when that lift
 * first crosses 1.5× the pre-cue level. The second number is the strike time.
 */
function matchCues(signal, cues) {
  const window = Math.round(0.005 * SR);
  const step = Math.round(0.001 * SR);

  return cues.map((cue) => {
    const before = rmsBetween(signal, cue.t - CUE_LOOKBACK_S, cue.t - CUE_GUARD_S);
    const after = rmsBetween(signal, cue.t + CUE_GUARD_S, cue.t + CUE_LOOKAHEAD_S);
    const gainDb = toDb(after) - toDb(before);

    const threshold = Math.max(before * 1.5, 1e-7);
    const start = Math.max(0, Math.round((cue.t - 0.02) * SR));
    const end = Math.min(signal.length - window, Math.round((cue.t + CUE_LOOKAHEAD_S) * SR));

    let strike = null;
    for (let i = start; i < end; i += step) {
      if (rmsBetween(signal, i / SR, (i + window) / SR) > threshold) {
        strike = i / SR;
        break;
      }
    }

    return {
      cue: cue.t,
      midi: cue.midi,
      gainDb,
      strike,
      delta: strike === null ? null : strike - cue.t,
    };
  });
}

/**
 * How far each sound-design cue lifts the mix across itself.
 *
 * Two details matter. The window is tight — 25 ms from the cue — because a bell
 * landing a few tens of milliseconds later would otherwise be read as the cue's
 * own level. And only *positive* lifts count: a cue can only ever add energy, so
 * a negative number is the arrangement's own dynamics, not the sound design.
 */
const matchSfx = (signal, cues) =>
  cues.map((cue) => {
    const before = rmsBetween(signal, cue.t - 0.06, cue.t - 0.006);
    const after = rmsBetween(signal, cue.t + 0.003, cue.t + 0.028);
    return { kind: cue.kind, t: cue.t, jumpDb: toDb(after) - toDb(before) };
  });

/** A cue that lifts the mix more than this has stopped being sound design. */
const SFX_JUMP_LIMIT_DB = 2.5;

function analyse(file, { video, label, cues, sfxCues }) {
  const info = probe(file);
  const streams = info.streams ?? [];
  const videoStreams = streams.filter((s) => s.codec_type === "video");
  const audioStreams = streams.filter((s) => s.codec_type === "audio");
  const formatDuration = Number(info.format?.duration ?? 0);
  const videoDuration = Number(videoStreams[0]?.duration ?? formatDuration);
  const audioDuration = Number(audioStreams[0]?.duration ?? formatDuration);

  const pcm = decode(file, { video });
  const frames = Math.floor(pcm.length / 2);

  let peak = 0;
  let sumL = 0;
  let sumR = 0;
  let dcL = 0;
  let dcR = 0;
  let cross = 0;
  let maxDelta = 0;
  let maxDeltaAt = 0;
  const overThreshold = [];

  const prevL = { v: pcm.length > 0 ? pcm[0] : 0 };
  const prevR = { v: pcm.length > 1 ? pcm[1] : 0 };

  for (let i = 0; i < frames; i++) {
    const l = pcm[i * 2];
    const r = pcm[i * 2 + 1];

    if (Math.abs(l) > peak) peak = Math.abs(l);
    if (Math.abs(r) > peak) peak = Math.abs(r);

    sumL += l * l;
    sumR += r * r;
    dcL += l;
    dcR += r;
    cross += l * r;

    // A click is a discontinuity, so look at the first difference, not the
    // sample value. Anything this far above the signal's own slew rate is a
    // seam rather than music.
    const dl = Math.abs(l - prevL.v);
    const dr = Math.abs(r - prevR.v);
    const d = Math.max(dl, dr);
    if (d > maxDelta) {
      maxDelta = d;
      maxDeltaAt = i;
    }
    if (d > 0.25) overThreshold.push({ t: i / SR, d });
    prevL.v = l;
    prevR.v = r;
  }

  const rmsL = Math.sqrt(sumL / Math.max(1, frames));
  const rmsR = Math.sqrt(sumR / Math.max(1, frames));
  const rms = Math.sqrt((rmsL * rmsL + rmsR * rmsR) / 2);

  // Correlation tells us the stereo image is real rather than a duplicated
  // mono channel.
  const denom = Math.sqrt(sumL * sumR);
  const correlation = denom > 0 ? cross / denom : 1;

  // The very start and the very end must be digital silence: a player that
  // opens or closes on a non-zero sample produces an audible click. The
  // windows are short because a long fade to zero is correct and desirable —
  // what matters is the actual first and last milliseconds.
  const edgeWindow = Math.round(0.02 * SR);
  let headMax = 0;
  for (let i = 0; i < Math.min(edgeWindow, frames); i++) {
    headMax = Math.max(headMax, Math.abs(pcm[i * 2]), Math.abs(pcm[i * 2 + 1]));
  }
  let tailMax = 0;
  for (let i = Math.max(0, frames - edgeWindow); i < frames; i++) {
    tailMax = Math.max(tailMax, Math.abs(pcm[i * 2]), Math.abs(pcm[i * 2 + 1]));
  }
  const lastSample =
    frames > 0 ? Math.max(Math.abs(pcm[(frames - 1) * 2]), Math.abs(pcm[(frames - 1) * 2 + 1])) : 0;

  // First moment the signal becomes audible. Comparing this between the score
  // and the muxed film is a cheap, direct A/V alignment check.
  const onsetWindow = Math.round(0.01 * SR);
  let onset = -1;
  for (let start = 0; start + onsetWindow <= frames; start += onsetWindow) {
    let sum = 0;
    for (let i = start; i < start + onsetWindow; i++) {
      sum += pcm[i * 2] * pcm[i * 2] + pcm[i * 2 + 1] * pcm[i * 2 + 1];
    }
    if (Math.sqrt(sum / (onsetWindow * 2)) > 0.005) {
      onset = start / SR;
      break;
    }
  }

  // Longest run below −80 dBFS away from the intentional fades.
  const silenceFloor = 1e-4;
  let longestSilence = 0;
  let silenceStart = -1;
  const from = Math.round(3 * SR);
  const to = Math.max(from, frames - Math.round(3 * SR));
  for (let i = from; i < Math.min(to, frames); i++) {
    const quiet = Math.abs(pcm[i * 2]) < silenceFloor && Math.abs(pcm[i * 2 + 1]) < silenceFloor;
    if (quiet && silenceStart < 0) silenceStart = i;
    if (!quiet && silenceStart >= 0) {
      longestSilence = Math.max(longestSilence, (i - silenceStart) / SR);
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0) longestSilence = Math.max(longestSilence, (to - silenceStart) / SR);

  const loud = loudness(file, { video });
  const band = cues?.length ? highPassed(pcm, frames) : null;
  const cueMatches = cues?.length ? matchCues(band, cues) : null;
  const sfxJumps = sfxCues?.length ? matchSfx(monoBuffer(pcm, frames), sfxCues) : null;

  const db = (value) => (value > 0 ? 20 * Math.log10(value) : -Infinity);

  return {
    label,
    file: path.relative(root, file).replace(/\\/g, "/"),
    videoStreams: videoStreams.length,
    audioStreams: audioStreams.length,
    audioCodec: audioStreams[0]?.codec_name ?? null,
    audioChannels: Number(audioStreams[0]?.channels ?? 0),
    audioSampleRate: Number(audioStreams[0]?.sample_rate ?? 0),
    videoDuration,
    audioDuration,
    frames,
    seconds: frames / SR,
    peakDb: db(peak),
    rmsDb: db(rms),
    rmsLdb: db(rmsL),
    rmsRdb: db(rmsR),
    skewDb: db(rmsL) - db(rmsR),
    dcL: dcL / Math.max(1, frames),
    dcR: dcR / Math.max(1, frames),
    correlation,
    maxDelta,
    maxDeltaAt: maxDeltaAt / SR,
    overThreshold,
    headMax,
    tailMax,
    lastSample,
    onset,
    cueMatches,
    sfxJumps,
    longestSilence,
    lufs: loud,
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const lines = [];
const say = (text = "") => {
  lines.push(text);
  console.log(text);
};

const cuePath = path.join(REPORT_DIR, "score-cues.json");
const cueSheet = fs.existsSync(cuePath) ? JSON.parse(fs.readFileSync(cuePath, "utf8")) : null;

const score = analyse(WAV, {
  video: false,
  label: "score (source WAV)",
  cues: cueSheet?.bells ?? null,
  sfxCues: cueSheet?.sfx ?? null,
});
const film = analyse(VIDEO, {
  video: true,
  label: "film (delivered MP4)",
  cues: cueSheet?.bells ?? null,
  sfxCues: cueSheet?.sfx ?? null,
});

const f = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : "—");

say(`audio verification · ${film.file}`);
say("=".repeat(100));

for (const s of [score, film]) {
  say("");
  say(`${s.label}   ${s.file}`);
  say("-".repeat(100));
  say(`  streams        ${s.videoStreams} video · ${s.audioStreams} audio${s.audioCodec ? ` (${s.audioCodec}, ${s.audioChannels}ch, ${s.audioSampleRate} Hz)` : ""}`);
  say(`  duration       video ${f(s.videoDuration, 3)}s · audio ${f(s.audioDuration, 3)}s · decoded ${f(s.seconds, 3)}s`);
  say(`  level          peak ${f(s.peakDb, 2)} dBFS · RMS ${f(s.rmsDb, 2)} dBFS · L/R skew ${f(s.skewDb, 2)} dB`);
  say(`  loudness       ${s.lufs.i === null ? "—" : `${f(s.lufs.i, 2)} LUFS`} integrated · true peak ${s.lufs.tp === null ? "—" : `${f(s.lufs.tp, 2)} dBTP`} · LRA ${s.lufs.lra === null ? "—" : `${f(s.lufs.lra, 2)} LU`}`);
  say(`  stereo         correlation ${f(s.correlation, 3)}`);
  say(`  DC offset      L ${s.dcL.toExponential(2)} · R ${s.dcR.toExponential(2)}`);
  say(`  continuity     max sample step ${f(s.maxDelta, 4)} at ${f(s.maxDeltaAt, 2)}s · ${s.overThreshold.length} steps > 0.25`);
  say(`  edges          first 20ms max ${s.headMax.toExponential(2)} · last 20ms max ${s.tailMax.toExponential(2)} · final sample ${s.lastSample.toExponential(2)}`);
  say(`  onset          ${f(s.onset, 3)}s`);
  say(
    `  cue lift       ${s.cueMatches === null ? "—" : `${s.cueMatches.filter((m) => m.gainDb >= CUE_MIN_GAIN_DB).length}/${s.cueMatches.length} cues lift the high band ≥ ${CUE_MIN_GAIN_DB} dB`}`,
  );
  say(`  dead air       longest silent stretch excluding 3s edges: ${f(s.longestSilence, 3)}s`);
}

// ---------------------------------------------------------------------------
// Verdicts — judged on the delivered MP4, which is what actually ships.
// ---------------------------------------------------------------------------

const EPS = 0.02;

record(
  "mux carried one video and one audio stream",
  film.videoStreams === 1 && film.audioStreams === 1,
  `${film.videoStreams} video · ${film.audioStreams} audio`,
);
record(
  "audio length matches the picture",
  Math.abs(film.audioDuration - film.videoDuration) <= EPS &&
    Math.abs(film.seconds - film.videoDuration) <= EPS,
  `video ${f(film.videoDuration, 3)}s · audio ${f(film.audioDuration, 3)}s · decoded ${f(film.seconds, 3)}s`,
);
record(
  "audio is not silent",
  film.rmsDb > -60,
  `RMS ${f(film.rmsDb, 2)} dBFS`,
);
record(
  "no clipping",
  film.peakDb <= -1.0,
  `peak ${f(film.peakDb, 2)} dBFS (ceiling −1.0)`,
);
record(
  "integrated loudness is on target",
  film.lufs.i !== null && Math.abs(film.lufs.i - TARGET_LUFS) <= 1.5,
  `${f(film.lufs.i, 2)} LUFS vs target ${TARGET_LUFS}`,
);
record(
  "true peak is under the codec headroom",
  film.lufs.tp !== null && film.lufs.tp <= -1.0,
  `${f(film.lufs.tp, 2)} dBTP`,
);
record(
  "stereo image is real, not duplicated mono",
  film.correlation < 0.999 && film.correlation > 0,
  `correlation ${f(film.correlation, 3)}`,
);
record(
  "left and right are balanced",
  Math.abs(film.skewDb) <= 3,
  `${f(film.skewDb, 2)} dB`,
);
record(
  "no DC offset",
  Math.abs(film.dcL) < 0.002 && Math.abs(film.dcR) < 0.002,
  `L ${film.dcL.toExponential(2)} · R ${film.dcR.toExponential(2)}`,
);
record(
  "no clicks or pops",
  film.maxDelta < 0.35,
  `max sample step ${f(film.maxDelta, 4)} at ${f(film.maxDeltaAt, 2)}s`,
);
record(
  "starts and ends in true silence",
  film.headMax < 1e-3 && film.tailMax < 1e-3 && film.lastSample < 1e-4,
  `first 20ms ${film.headMax.toExponential(2)} · last 20ms ${film.tailMax.toExponential(2)} · final sample ${film.lastSample.toExponential(2)}`,
);
record(
  "audio is aligned with the score",
  film.onset !== null && score.onset !== null && Math.abs(film.onset - score.onset) <= 0.05,
  `score ${f(score.onset, 3)}s · film ${f(film.onset, 3)}s`,
);
record(
  "no dead air in the body of the film",
  film.longestSilence < 3,
  `longest ${f(film.longestSilence, 3)}s`,
);
record(
  "encoded music preserves the source level",
  score.lufs.i !== null && film.lufs.i !== null &&
    Math.abs(film.lufs.i - score.lufs.i) < 0.5 && Math.abs(film.rmsDb - score.rmsDb) < 1,
  `source ${f(score.lufs.i)} LUFS · delivered ${f(film.lufs.i)} LUFS`,
);

// ---------------------------------------------------------------------------
// Does the score actually follow the cut?
// ---------------------------------------------------------------------------

// Beats the score is written to. These mirror `src/timeline.ts` (the time
// scene starts at frame 926 at 60 fps) and `TimeScene`'s row timing (+40 /
// +120 / +200 frames). If the cut is re-timed this table must be updated —
// that is the point: the check exists to fail when picture and score drift.
//
// The frames below are the 30 fps timeline: the AFTER scene starts at frame 463
// and its three rows land 20 / 60 / 100 frames into it. If `src/timeline.ts` or
// `TimeScene.tsx` is retimed, these have to move with them.
const CUT_BEATS = REVIEW_ROW_FRAMES.map((f,i)=>({t:(sceneById("time").from+f)/FPS,label:["7-day check-in","30-day check-in","90-day check-in"][i]}));

say("");
say("score vs cut");
say("-".repeat(100));

if (!cueSheet) {
  say(`  no cue sheet at ${path.relative(root, cuePath).replace(/\\/g, "/")} — run \`npm run score\` first`);
  record("cue sheet is available", false, "missing qa/reports/score-cues.json");
} else {
  record(
    "cue sheet length matches the film",
    Math.abs(cueSheet.duration - film.videoDuration) < 0.001,
    `${cueSheet.duration}s vs ${f(film.videoDuration, 3)}s`,
  );

  if (cueSheet.music) {
    say(`  music          ${cueSheet.music.style}`);
    say(`  tempo / key    ${cueSheet.music.bpm} BPM · ${cueSheet.music.key}`);
    say(`  source         ${cueSheet.music.sampleSource} · ${cueSheet.music.sampleLicense}`);
    record("musical arrangement and source are documented",
      Number.isFinite(cueSheet.music.bpm) && cueSheet.music.bpm > 0 &&
      typeof cueSheet.music.style === "string" &&
      typeof cueSheet.music.sampleSource === "string" &&
      typeof cueSheet.music.sampleLicense === "string",
      `${cueSheet.music.style} · ${cueSheet.music.bpm} BPM`,
    );
  }

  // The new piano arrangement has no illustrative bells. Bell timing and
  // high-band prominence apply only to scores that actually declare bells.
  if (cueSheet.bells?.length) {

  const matches = film.cueMatches;
  const worstGain = matches.reduce((min, m) => Math.min(min, m.gainDb), Infinity);
  const offsets = matches.map((m) => m.delta).filter((d) => d !== null);
  const worstOffset = offsets.length ? Math.max(...offsets.map(Math.abs)) : Infinity;

  say(`  declared bells  ${matches.length}`);
  say(`  high-band lift  worst ${f(worstGain, 1)} dB (floor ${CUE_MIN_GAIN_DB} dB)`);
  say(
    `  strike offset   worst ${Number.isFinite(worstOffset) ? `${(worstOffset * 1000).toFixed(0)} ms` : "—"} (tolerance ±${CUE_TOLERANCE_S * 1000} ms)`,
  );
  say("");
  say("     cue    midi     lift    strike   offset");
  for (const m of matches) {
    say(
      `   ${m.cue.toFixed(2).padStart(6)}s  ${String(m.midi).padStart(3)}  ${`${f(m.gainDb, 1)} dB`.padStart(7)}  ${(m.strike === null ? "—" : `${m.strike.toFixed(3)}s`).padStart(8)}  ${(m.delta === null ? "—" : `${(m.delta * 1000).toFixed(0)} ms`).padStart(7)}`,
    );
  }

  record(
    "every score cue lifts the high band where it is declared",
    matches.every((m) => m.gainDb >= CUE_MIN_GAIN_DB),
    `${matches.filter((m) => m.gainDb >= CUE_MIN_GAIN_DB).length}/${matches.length} cues ≥ ${CUE_MIN_GAIN_DB} dB · worst ${f(worstGain, 1)} dB`,
  );
  record(
    "every score cue strikes on its declared time",
    matches.every((m) => m.delta !== null && Math.abs(m.delta) <= CUE_TOLERANCE_S),
    `worst ${Number.isFinite(worstOffset) ? `${(worstOffset * 1000).toFixed(0)} ms` : "—"} of ±${CUE_TOLERANCE_S * 1000} ms`,
  );

  // The three check-in bells are the film's structural motif — one per
  // 7 / 30 / 90 day row, timed to the row animations.
  const motif = CUT_BEATS.map((beat) => {
    const cue = cueSheet.bells.reduce((best, b) =>
      Math.abs(b.t - beat.t) < Math.abs(best.t - beat.t) ? b : best,
    );
    const match = matches.find((m) => Math.abs(m.cue - beat.t) < 0.01);
    return { ...beat, cue: cue.t, strike: match?.strike ?? null, delta: match?.delta ?? null };
  });

  say("");
  say("  7 / 30 / 90 motif — bells must land on the row animations");
  for (const row of motif) {
    say(
      `    ${row.label.padEnd(18)} picture ${row.t.toFixed(3)}s · score ${row.cue.toFixed(3)}s · struck ${row.strike === null ? "—" : `${row.strike.toFixed(3)}s`} · offset ${row.delta === null ? "—" : `${(row.delta * 1000).toFixed(0)} ms`}`,
    );
  }

  record(
    "the 7 / 30 / 90 motif lands on the check-in rows",
    motif.every(
      (row) =>
        Math.abs(row.cue - row.t) <= 0.01 &&
        row.delta !== null &&
        Math.abs(row.delta) <= CUE_TOLERANCE_S,
    ),
    motif
      .map((r) => `${r.label} ${Math.abs(r.cue - r.t) <= 0.01 ? "exact" : `${((r.cue - r.t) * 1000).toFixed(0)} ms`}`)
      .join(" · "),
  );

  // Sound design. The layer only works if it is never the thing you notice, so
  // the check is the opposite of the bell check: instead of proving a cue is
  // present, it proves no cue is loud.
  const sfxCues = cueSheet.sfx ?? [];
  if (sfxCues.length) {
    const jumps = film.sfxJumps;
    // Only positive lifts: a cue adds energy, so a drop is the music moving.
    const worst = jumps.reduce((best, j) => (j.jumpDb > best.jumpDb ? j : best), jumps[0]);

    say("");
    say("  sound design — no cue may announce itself");
    say(
      `    ${sfxCues.length} cues · largest lift ${f(worst.jumpDb, 2)} dB at ${worst.t.toFixed(2)}s (${worst.kind}) · limit ${SFX_JUMP_LIMIT_DB} dB`,
    );

    record(
      "the cue sheet declares the sound design",
      sfxCues.every((cue) => typeof cue.kind === "string" && Number.isFinite(cue.t)),
      `${sfxCues.length} cues across ${new Set(sfxCues.map((c) => c.kind)).size} kinds`,
    );
    record(
      "no sound-design cue draws attention to itself",
      worst.jumpDb <= SFX_JUMP_LIMIT_DB,
      `largest lift ${f(worst.jumpDb, 2)} dB (${worst.kind} at ${worst.t.toFixed(2)}s) · limit ${SFX_JUMP_LIMIT_DB} dB`,
    );
  }
  }
}

say("");
say("checks");
say("-".repeat(100));
for (const check of checks) {
  say(`  ${check.ok ? "PASS" : "FAIL"}  ${check.name}`);
  say(`        ${check.detail}`);
}

const failed = checks.filter((check) => !check.ok);
say("");
say(`${checks.length} checks · ${failed.length} failed`);
if (failed.length) {
  say("");
  say("failures");
  for (const check of failed) say(`  · ${check.name} — ${check.detail}`);
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORT_DIR, "audio.txt"), `${lines.join("\n")}\n`);
fs.writeFileSync(
  path.join(REPORT_DIR, "audio.json"),
  `${JSON.stringify({ targetLufs: TARGET_LUFS, score, film, cueSheet, checks }, null, 2)}\n`,
);

process.exitCode = failed.length ? 1 : 0;
