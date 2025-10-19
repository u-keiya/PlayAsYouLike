import { NextRequest, NextResponse } from "next/server";
import {
  SessionCreatePayload,
  SessionCreateResponse,
} from "../../../types/session";

const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:3001";

function normalizeBackendOrigin(): string {
  const origin =
    process.env.PLAY_AS_YOU_LIKE_API_ORIGIN?.trim() ?? DEFAULT_BACKEND_ORIGIN;

  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

function isValidUrlCandidate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidColorHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function parseRequestBody(body: unknown): {
  payload: SessionCreatePayload;
  error?: string;
} {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("url" in body) ||
    !("colorHex" in body)
  ) {
    return {
      payload: {
        url: "",
        colorHex: "",
      },
      error: "Request body must include url and colorHex.",
    };
  }

  const candidateUrl = (body as { url: unknown }).url;
  const candidateColor = (body as { colorHex: unknown }).colorHex;

  if (!isValidUrlCandidate(candidateUrl)) {
    return {
      payload: {
        url: "",
        colorHex: "",
      },
      error: "url must be a valid http(s) URL.",
    };
  }

  if (!isValidColorHex(candidateColor)) {
    return {
      payload: {
        url: "",
        colorHex: "",
      },
      error: "colorHex must match #RRGGBB.",
    };
  }

  const candidateSeed = (body as { seed?: unknown }).seed;
  let seed: number | undefined;

  if (
    typeof candidateSeed === "number" &&
    Number.isFinite(candidateSeed) &&
    Number.isInteger(candidateSeed) &&
    candidateSeed >= 0
  ) {
    seed = candidateSeed;
  }

  return {
    payload: {
      url: new URL(candidateUrl.trim()).toString(),
      colorHex: candidateColor,
      seed,
    },
  };
}

async function forwardToBackend(
  payload: SessionCreatePayload,
): Promise<Response> {
  const origin = normalizeBackendOrigin();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    return await fetch(`${origin}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isValidSessionCreateResponse(
  payload: unknown,
): payload is SessionCreateResponse {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const candidate = payload as Partial<SessionCreateResponse>;

  if (
    typeof candidate.sessionId !== "string" ||
    typeof candidate.seed !== "number" ||
    !Number.isFinite(candidate.seed) ||
    typeof candidate.audioUrl !== "string" ||
    typeof candidate.beatmap !== "object" ||
    candidate.beatmap === null ||
    typeof candidate.effectsPreset !== "object" ||
    candidate.effectsPreset === null ||
    !Array.isArray(candidate.presets)
  ) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: "INVALID_PAYLOAD",
        message: "Request body must be valid JSON.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { payload, error } = parseRequestBody(body);

  if (error) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: error,
      },
      {
        status: 422,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let backendResponse: Response;

  try {
    backendResponse = await forwardToBackend(payload);
  } catch (error) {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Failed to reach session service.",
        detail: error instanceof Error ? error.message : undefined,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const isJsonResponse = contentType.includes("application/json");

  if (!isJsonResponse) {
    const textBody = await backendResponse.text();

    return NextResponse.json(
      {
        code: "BACKEND_PROTOCOL_ERROR",
        message: "Unexpected response format from session service.",
        detail: textBody.slice(0, 2000),
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const responsePayload = (await backendResponse.json()) as
    | SessionCreateResponse
    | { code: string; message: string; detail?: string };

  if (backendResponse.ok) {
    if (!isValidSessionCreateResponse(responsePayload)) {
      return NextResponse.json(
        {
          code: "BACKEND_PROTOCOL_ERROR",
          message: "Backend returned invalid success response shape.",
        },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }
  }

  return NextResponse.json(responsePayload, {
    status: backendResponse.status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
