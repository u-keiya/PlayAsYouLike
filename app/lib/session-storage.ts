import { SessionCreateResponse } from "../../types/session";

export const LAST_SESSION_STORAGE_KEY =
  "play-as-you-like:last-session:v1:session";

export type StoredSession = {
  sessionId: string;
  seed: number;
  colorHex: string;
  url: string;
  storedAt: string;
};

export function buildStoredSession(
  payload: SessionCreateResponse,
  request: { url: string; colorHex: string },
): StoredSession {
  return {
    sessionId: payload.sessionId,
    seed: payload.seed,
    colorHex: request.colorHex,
    url: request.url,
    storedAt: new Date().toISOString(),
  };
}

export function saveStoredSession(session: StoredSession): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LAST_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  } catch {
    // localStorage might be unavailable or full; fail silently per UX guidelines.
  }
}

export function loadStoredSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSession>;

    if (
      typeof parsed.sessionId === "string" &&
      typeof parsed.seed === "number" &&
      Number.isFinite(parsed.seed) &&
      typeof parsed.colorHex === "string" &&
      typeof parsed.url === "string"
    ) {
      return {
        sessionId: parsed.sessionId,
        seed: parsed.seed,
        colorHex: parsed.colorHex,
        url: parsed.url,
        storedAt:
          typeof parsed.storedAt === "string"
            ? parsed.storedAt
            : new Date().toISOString(),
      };
    }
  } catch {
    // Ignore malformed data and proceed as if no session exists.
  }

  return null;
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LAST_SESSION_STORAGE_KEY);
  } catch {
    // Ignore removal errors for consistent UX.
  }
}
