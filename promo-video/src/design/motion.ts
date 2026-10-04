/**
 * Motion language.
 *
 * Worthly motion is calm, precise and purposeful. There is no overshoot, no
 * bounce and no transition that draws more attention than the content it
 * carries. Everything here is expressed as an eased 0→1 progress value so a
 * scene can compose several elements from the same clock.
 */
import { Easing, interpolate } from "remotion";

/** Long, decelerating ease used for reveals. Nothing snaps into place. */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

/** Symmetric ease for crossfades and layout moves. */
export const easeInOut = Easing.bezier(0.45, 0, 0.25, 1);

/** Accelerating ease, used only for exits. */
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

/**
 * Symmetric ease-in-out. Scene envelopes use this so an entrance and its exit
 * are mirror images: a scene must not hold at full strength and then vanish in
 * three frames, which is what a back-loaded curve does.
 */
export const easeBoth = Easing.bezier(0.4, 0, 0.6, 1);

/**
 * Nearly critically damped spring. Remotion's default damping of 10 produces a
 * visible bounce; Worthly never bounces, so this is overdamped on purpose and
 * only used for tactile UI moments (chip selection, button press).
 */
export const uiSpring = {
  damping: 200,
  mass: 1,
  stiffness: 190,
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * A 0→1 progress value that starts at `start` and settles after `duration`
 * frames. The workhorse for every reveal in the film.
 */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (input: number) => number = easeOut,
): number => {
  // A zero-length beat is a legal authoring mistake ("show it immediately"),
  // and Remotion's interpolate rejects it, so resolve it here instead.
  if (duration <= 0) return frame < start ? 0 : 1;
  return interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing,
  });
};

/** A 1→0 progress value that begins at `start` and completes after `duration`. */
export const exit = (
  frame: number,
  start: number,
  duration: number,
  easing: (input: number) => number = easeIn,
): number => {
  if (duration <= 0) return frame < start ? 1 : 0;
  return interpolate(frame, [start, start + duration], [1, 0], {
    ...clamp,
    easing,
  });
};

/**
 * A window envelope: rises from 0 over `inDuration` frames, holds, then falls
 * to 0 over `outDuration` frames. Used to keep every scene's entrance and exit
 * symmetrical without hand-tuning each one.
 */
export const envelope = (
  frame: number,
  durationInFrames: number,
  inDuration = 6,
  outDuration = 6,
): number => {
  const entrance = progress(frame, 0, inDuration, easeBoth);
  // A scene that ends the film has no exit: `outFrames={0}` must not produce a
  // degenerate [n, n] interpolation range.
  if (outDuration <= 0 || durationInFrames - outDuration >= durationInFrames) {
    return entrance;
  }
  return Math.min(
    entrance,
    interpolate(frame, [durationInFrames - outDuration, durationInFrames], [1, 0], {
      ...clamp,
      easing: easeBoth,
    }),
  );
};

/** Map a 0→1 progress onto a translate, in film pixels. */
export const rise = (p: number, distance = 28): number => (1 - p) * distance;

/** Map a 0→1 progress onto a restrained scale. Worthly never zooms hard. */
export const settle = (p: number, from = 0.985, to = 1): number => from + (to - from) * p;

/** Mask-reveal for a single line of type: the line slides up out of its own box. */
export const maskLine = (p: number, lineHeight: number): string =>
  `translateY(${(1 - p) * lineHeight * 0.62}px)`;

/* ------------------------------------------------------------------ */
/* Signature motion                                                    */
/* ------------------------------------------------------------------ */

/**
 * A value that settles into place.
 *
 * The number starts a little below its final value and closes the gap on a
 * decelerating ease. That reads as a counter coming to rest rather than a slot
 * machine rolling: there are only a handful of visible steps, and the last one
 * lands. Used for the day counters and the satisfaction scores — the two places
 * in the film where a number is the point of the shot.
 *
 * `span` is the fraction of the value the counter starts below.
 */
export const settleNumber = (p: number, value: number, span = 0.14): number => {
  const run = Math.max(2, Math.round(value * span));
  return Math.max(0, Math.round(value - (1 - p) * run));
};

/**
 * The film's tactile "this just changed" gesture: fade, rise, and settle out of
 * a 2 % oversize. Short, damped, and never bouncy. Applied to a score, a chip,
 * or a card that has just taken on a new value.
 */
export const settleIn = (
  p: number,
  rise = 10,
  from = 0.98,
): { opacity: number; transform: string } => ({
  opacity: p,
  transform: `translateY(${(1 - p) * rise}px) scale(${from + (1 - from) * p})`,
});

/**
 * Frame offset for the `index`-th element of a list.
 *
 * The library rows arrive a few frames apart — close enough that the sequence
 * reads as one movement rather than as a list animating in.
 */
export const stagger = (index: number, step: number): number => index * step;

/**
 * The hero card's arrival: a shallow rise on an ease that is already almost
 * flat by the time it lands, so the card settles rather than stops.
 */
export const heroArrival = (
  frame: number,
  start: number,
  duration = 20,
): { opacity: number; transform: string } => {
  const p = progress(frame, start, duration, easeInOut);
  return {
    opacity: Math.min(1, p * 1.35),
    transform: `translateY(${(1 - p) * 11}px) scale(${0.992 + 0.008 * p})`,
  };
};
