import { NextRequest, NextResponse } from "next/server";

type UrlMetadata = {
  title: string;
  durationSec: number;
  trimmed: boolean;
};

type ErrorBody = {
  code: "INVALID_URL" | "TIMEOUT" | "INTERNAL_ERROR";
  message: string;
  detail?: string;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const FALLBACK_METADATA: Record<string, UrlMetadata> = {
  dQw4w9WgXcQ: {
    title: "Never Gonna Give You Up",
    durationSec: 213,
    trimmed: false,
  },
};

const REQUEST_TIMEOUT_MS = 2800;
const NOEMBED_ENDPOINT = "https://noembed.com/embed";

function getErrorResponse(body: ErrorBody, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function extractVideoId(inputUrl: URL): string | null {
  if (!YOUTUBE_HOSTS.has(inputUrl.hostname)) {
    return null;
  }

  if (inputUrl.hostname === "youtu.be") {
    const candidate = inputUrl.pathname.replace(/^\/+/, "").split("/")[0];
    return candidate.length > 0 ? candidate : null;
  }

  if (inputUrl.pathname.startsWith("/shorts/")) {
    const candidate = inputUrl.pathname.replace("/shorts/", "").split("/")[0];
    return candidate.length > 0 ? candidate : null;
  }

  const idFromQuery = inputUrl.searchParams.get("v");
  if (typeof idFromQuery === "string" && idFromQuery.length > 0) {
    return idFromQuery;
  }

  return null;
}

async function fetchFromNoembed(url: string, signal: AbortSignal): Promise<UrlMetadata> {
  const endpoint = `${NOEMBED_ENDPOINT}?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    signal,
    headers: {
      "User-Agent": "PlayAsYouLike/1.0 (+https://playasul.local)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`noembed responded with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    title?: string;
    duration?: unknown;
  };

  if (typeof payload.title !== "string" || payload.title.length === 0) {
    throw new Error("noembed payload did not include title");
  }

  const rawDuration = payload.duration;
  let durationSec = 0;

  if (typeof rawDuration === "number" && Number.isFinite(rawDuration)) {
    durationSec = Math.max(0, Math.round(rawDuration));
  } else if (typeof rawDuration === "string") {
    const parsed = Number(rawDuration);
    if (Number.isFinite(parsed)) {
      durationSec = Math.max(0, Math.round(parsed));
    }
  }

  return {
    title: payload.title,
    durationSec,
    trimmed: false,
  } satisfies UrlMetadata;
}

function parseDurationFromWatchHtml(html: string): number | null {
  const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"?(?<seconds>\d+)"?/);
  if (lengthMatch?.groups?.seconds) {
    const parsed = Number(lengthMatch.groups.seconds);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  } else if (lengthMatch) {
    const parsed = Number(lengthMatch[1]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const approxDurationMatch = html.match(/"approxDurationMs"\s*:\s*"?(?<millis>\d+)"?/);
  if (approxDurationMatch?.groups?.millis) {
    const parsed = Number(approxDurationMatch.groups.millis);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed / 1000);
    }
  } else if (approxDurationMatch) {
    const parsed = Number(approxDurationMatch[1]);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed / 1000);
    }
  }

  return null;
}

async function fetchDurationFromYoutube(videoId: string, signal: AbortSignal): Promise<number | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en`;

  try {
    const response = await fetch(watchUrl, {
      method: "GET",
      signal,
      headers: {
        "User-Agent": "PlayAsYouLike/1.0 (+https://playasul.local)",
        Accept: "text/html",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const duration = parseDurationFromWatchHtml(html);

    if (duration && duration > 0) {
      return duration;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    // Ignore non-abort errors: upstream watch page might be throttled, but we still have metadata.
  }

  return null;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return getErrorResponse(
      {
        code: "INVALID_URL",
        message: "YouTube URL を指定してください。",
      },
      400,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlParam);
  } catch (error) {
    return getErrorResponse(
      {
        code: "INVALID_URL",
        message: "正しい形式の YouTube URL を指定してください。",
        detail: error instanceof Error ? error.message : undefined,
      },
      400,
    );
  }

  const videoId = extractVideoId(parsedUrl);
  if (!videoId) {
    return getErrorResponse(
      {
        code: "INVALID_URL",
        message: "サポートされていない YouTube URL です。",
      },
      400,
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const metadata = await fetchFromNoembed(urlParam, controller.signal);
    if (metadata.durationSec === 0) {
      const fallbackDuration = await fetchDurationFromYoutube(videoId, controller.signal);
      if (fallbackDuration && Number.isFinite(fallbackDuration) && fallbackDuration > 0) {
        metadata.durationSec = fallbackDuration;
      }
    }
    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      clearTimeout(timeoutId);
      return getErrorResponse(
        {
          code: "TIMEOUT",
          message: "上流サービスがタイムアウトしました。時間をおいて再度お試しください。",
        },
        503,
      );
    }

    const fallback = FALLBACK_METADATA[videoId];
    if (fallback) {
      clearTimeout(timeoutId);
      return NextResponse.json(fallback, {
        headers: {
          "Cache-Control": "no-store",
          "X-Metadata-Source": "fallback",
        },
      });
    }

    return getErrorResponse(
      {
        code: "INTERNAL_ERROR",
        message: "メタデータの取得に失敗しました。",
        detail: error instanceof Error ? error.message : undefined,
      },
      500,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
