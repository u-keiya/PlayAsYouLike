import { randomInt } from "node:crypto";

export const UINT32_MAX = 0xffffffff;

export function randomUint32() {
  return randomInt(0, UINT32_MAX + 1);
}

/**
 * Mulberry32 pseudo random generator.
 * Deterministic and fast enough for beatmap stubs.
 */
export function createSeededRandom(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n + 0x6d2b79f5) >>> 0;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToInt(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}
