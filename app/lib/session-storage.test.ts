import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SessionCreateResponse } from "../../types/session";
import {
  LAST_SESSION_STORAGE_KEY,
  buildStoredSession,
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from "./session-storage";

const SAMPLE_SESSION: SessionCreateResponse = {
  sessionId: "c3aa2d73-8d0e-43af-a6e7-1d1b7dfd0b2e",
  seed: 987654321,
  audioUrl: "https://cdn.playasul.local/audio/sample?source=foo",
  beatmap: {
    bpm: 128,
    energyEnvelope: [0.1, 0.5, 0.9],
    beatTimeline: [0, 500, 1000],
    spectralCentroidSeq: [100, 200, 300],
    keyProgression: ["C#m", "A", "E"],
    segments: [
      {
        label: "Intro",
        startSec: 0,
      },
    ],
    notes: [
      {
        t: 0,
        lane: 1,
      },
    ],
  },
  effectsPreset: {
    id: "preset-1",
    name: "Azure Bloom",
    baseColorHex: "#38BDF8",
  },
  presets: [],
};

function createMockStorage(): Storage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("session-storage", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-02T12:34:56.000Z"));
    (globalThis as typeof globalThis & { window?: typeof window }).window = {
      localStorage: createMockStorage(),
    } as unknown as typeof window;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalWindow === undefined) {
      delete (globalThis as { window?: typeof window }).window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("builds a deterministic stored session payload", () => {
    const stored = buildStoredSession(SAMPLE_SESSION, {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      colorHex: "#38BDF8",
    });

    expect(stored).toEqual({
      sessionId: SAMPLE_SESSION.sessionId,
      seed: SAMPLE_SESSION.seed,
      colorHex: "#38BDF8",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      storedAt: "2025-08-02T12:34:56.000Z",
    });
  });

  it("persists and restores the latest session", () => {
    const stored = buildStoredSession(SAMPLE_SESSION, {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      colorHex: "#38BDF8",
    });

    saveStoredSession(stored);

    const fromStorage = loadStoredSession();
    expect(fromStorage).toEqual(stored);

    clearStoredSession();
    expect(window.localStorage.getItem(LAST_SESSION_STORAGE_KEY)).toBeNull();
    expect(loadStoredSession()).toBeNull();
  });
});
