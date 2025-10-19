export const LAST_RESULT_STORAGE_KEY = "play-as-you-like:last-game-result:v1";

export type GameResultPayload = {
  sessionId: string;
  seed: number;
  url: string;
  totalNotes: number;
  hitCount: number;
  lateCount: number;
  missCount: number;
  score: number;
  accuracy: number;
  endedAt: string;
};

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveGameResult(result: GameResultPayload): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Ignore quota errors to match other storage helpers.
  }
}

export function loadGameResult(sessionId?: string): GameResultPayload | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(LAST_RESULT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<GameResultPayload>;

    if (
      typeof parsed.sessionId !== "string" ||
      (sessionId && parsed.sessionId !== sessionId) ||
      typeof parsed.totalNotes !== "number" ||
      typeof parsed.hitCount !== "number" ||
      typeof parsed.lateCount !== "number" ||
      typeof parsed.missCount !== "number" ||
      typeof parsed.score !== "number" ||
      typeof parsed.accuracy !== "number"
    ) {
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      seed: typeof parsed.seed === "number" ? parsed.seed : 0,
      url: typeof parsed.url === "string" ? parsed.url : "",
      totalNotes: parsed.totalNotes,
      hitCount: parsed.hitCount,
      lateCount: parsed.lateCount,
      missCount: parsed.missCount,
      score: parsed.score,
      accuracy: parsed.accuracy,
      endedAt:
        typeof parsed.endedAt === "string"
          ? parsed.endedAt
          : new Date().toISOString(),
    } satisfies GameResultPayload;
  } catch {
    return null;
  }
}

export function clearGameResult(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(LAST_RESULT_STORAGE_KEY);
  } catch {
    // Ignore removal errors for parity with other helpers.
  }
}
