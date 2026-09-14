/**
 * Deterministic pseudo-randomness.
 *
 * The reasoning visual needs to look irregular — branches at uneven angles,
 * nodes firing out of step. `Math.random()` cannot be used for that: the
 * server and the client would draw different trees and hydration would
 * mismatch, and the layout would reshuffle on every navigation.
 *
 * So irregularity is *derived* instead: hash the project id into a seed and
 * pull a repeatable stream from it. Same project, same tree, every render, on
 * both sides of hydration — but a different project gets a genuinely different
 * shape, and editing the row changes it. Irregular, not random.
 */

/** FNV-1a. Small, fast, and well-mixed enough for layout jitter. */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — a compact, well-distributed PRNG over a 32-bit seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A repeatable stream of helpers seeded from any string key. */
export function seededStream(key: string) {
  const next = seededRandom(hashSeed(key))
  return {
    /** Float in [min, max). */
    range: (min: number, max: number) => min + next() * (max - min),
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    /** True with probability `p`. */
    chance: (p: number) => next() < p,
    raw: next,
  }
}
