import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  LAST_RESULT_STORAGE_KEY,
  clearGameResult,
  loadGameResult,
  saveGameResult,
} from "./game-result-storage";

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

describe("game-result-storage", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-02T16:00:00.000Z"));
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

  it("stores and restores the last game result", () => {
    saveGameResult({
      sessionId: "session-1",
      seed: 13579,
      url: "https://example.test/song",
      totalNotes: 12,
      hitCount: 10,
      lateCount: 1,
      missCount: 1,
      score: 1234,
      accuracy: 0.92,
      endedAt: "2025-08-02T16:00:00.000Z",
    });

    const result = loadGameResult("session-1");
    expect(result).toEqual({
      sessionId: "session-1",
      seed: 13579,
      url: "https://example.test/song",
      totalNotes: 12,
      hitCount: 10,
      lateCount: 1,
      missCount: 1,
      score: 1234,
      accuracy: 0.92,
      endedAt: "2025-08-02T16:00:00.000Z",
    });
  });

  it("returns null when no stored result matches", () => {
    saveGameResult({
      sessionId: "session-2",
      seed: 42,
      url: "https://example.test/song",
      totalNotes: 4,
      hitCount: 3,
      lateCount: 1,
      missCount: 0,
      score: 470,
      accuracy: 0.875,
      endedAt: "2025-08-02T16:00:00.000Z",
    });

    expect(loadGameResult("session-1")).toBeNull();
  });

  it("clears stored results", () => {
    saveGameResult({
      sessionId: "session-3",
      seed: 777,
      url: "https://example.test/song",
      totalNotes: 6,
      hitCount: 4,
      lateCount: 1,
      missCount: 1,
      score: 620,
      accuracy: 0.833,
      endedAt: "2025-08-02T16:05:00.000Z",
    });

    clearGameResult();
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(
      LAST_RESULT_STORAGE_KEY,
    );
    expect(loadGameResult("session-3")).toBeNull();
  });
});
