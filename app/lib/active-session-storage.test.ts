import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { SessionCreateResponse } from "../../types/session";
import {
  ACTIVE_SESSION_STORAGE_KEY,
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "./active-session-storage";

const SAMPLE_SESSION: SessionCreateResponse = {
  sessionId: "f0c116b0-cc3e-4ee8-a6e2-f718b8dbd9f6",
  seed: 424242,
  audioUrl: "https://cdn.playasul.local/audio/f0c116b0",
  beatmap: {
    bpm: 140,
    energyEnvelope: [0.2, 0.4, 0.6],
    beatTimeline: [0, 450, 900],
    spectralCentroidSeq: [0.31, 0.53, 0.6],
    keyProgression: ["C", "G"],
    segments: [
      {
        label: "intro",
        startSec: 0,
      },
    ],
    notes: [
      {
        t: 0,
        lane: 1,
      },
      {
        t: 450,
        lane: 2,
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
    clear: vi.fn(() => map.clear()),
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(map.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
  };
}

describe("active-session-storage", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-02T15:00:00.000Z"));
    (globalThis as typeof globalThis & { window?: typeof window }).window = {
      sessionStorage: createMockStorage(),
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

  it("persists the last active session", () => {
    saveActiveSession(SAMPLE_SESSION);

    const stored = loadActiveSession();
    expect(stored).not.toBeNull();
    expect(stored?.sessionId).toBe(SAMPLE_SESSION.sessionId);
    expect(stored?.storedAt).toBe("2025-08-02T15:00:00.000Z");

    const storage = window.sessionStorage;
    expect(storage.setItem).toHaveBeenCalledWith(
      ACTIVE_SESSION_STORAGE_KEY,
      expect.stringContaining(SAMPLE_SESSION.sessionId),
    );
  });

  it("returns null when session id does not match", () => {
    saveActiveSession(SAMPLE_SESSION);

    expect(loadActiveSession("mismatch")).toBeNull();
  });

  it("clears stored payload", () => {
    saveActiveSession(SAMPLE_SESSION);
    clearActiveSession();

    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(
      ACTIVE_SESSION_STORAGE_KEY,
    );
    expect(loadActiveSession()).toBeNull();
  });
});
