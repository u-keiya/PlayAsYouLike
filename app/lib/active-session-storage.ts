import { SessionCreateResponse } from "../../types/session";

export const ACTIVE_SESSION_STORAGE_KEY = "play-as-you-like:active-session:v1";

export type ActiveSessionRecord = SessionCreateResponse & {
  storedAt: string;
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

export function saveActiveSession(payload: SessionCreateResponse): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const record: ActiveSessionRecord = {
    ...payload,
    storedAt: new Date().toISOString(),
  };

  try {
    storage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore quota errors to keep UX consistent with other storage helpers (#US-003).
  }
}

export function loadActiveSession(
  sessionId?: string,
): ActiveSessionRecord | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActiveSessionRecord>;

    if (
      typeof parsed.sessionId !== "string" ||
      (sessionId && parsed.sessionId !== sessionId) ||
      typeof parsed.seed !== "number" ||
      typeof parsed.audioUrl !== "string" ||
      typeof parsed.beatmap !== "object" ||
      parsed.beatmap === null ||
      !Array.isArray(parsed.beatmap.notes)
    ) {
      return null;
    }

    return {
      ...(parsed as SessionCreateResponse),
      storedAt:
        typeof parsed.storedAt === "string"
          ? parsed.storedAt
          : new Date().toISOString(),
    } satisfies ActiveSessionRecord;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage removal failures.
  }
}
