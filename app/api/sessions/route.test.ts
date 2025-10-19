import { NextRequest } from "next/server";
import { describe, expect, it, vi, afterEach } from "vitest";
import { SessionCreateResponse } from "../../../types/session";
import { POST } from "./route";

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const MOCK_RESPONSE: SessionCreateResponse = {
  sessionId: "f50e6650-37d2-4d5a-9d8a-472af26886ee",
  seed: 13579,
  audioUrl:
    "https://cdn.playasul.local/audio/f50e6650-37d2-4d5a-9d8a-472af26886ee",
  beatmap: {
    bpm: 120,
    energyEnvelope: [0.1, 0.2],
    beatTimeline: [0, 500],
    spectralCentroidSeq: [100, 120],
    keyProgression: ["Am", "F"],
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

describe("POST /api/sessions", () => {
  const originalFetch = global.fetch;
  const originalOrigin = process.env.PLAY_AS_YOU_LIKE_API_ORIGIN;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.PLAY_AS_YOU_LIKE_API_ORIGIN = originalOrigin;
    vi.restoreAllMocks();
  });

  it("rejects invalid payloads with 422", async () => {
    const request = buildRequest({ url: "not-a-url", colorHex: "#123456" });
    const response = await POST(request);

    expect(response.status).toBe(422);
    const payload = (await response.json()) as {
      code: string;
      message: string;
    };
    expect(payload.code).toBe("INVALID_REQUEST");
  });

  it("forwards the request to the backend origin and returns its response", async () => {
    process.env.PLAY_AS_YOU_LIKE_API_ORIGIN = "https://api.playasul.local/v1/";

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    global.fetch = fetchMock;

    const request = buildRequest({
      url: " https://www.youtube.com/watch?v=dQw4w9WgXcQ ",
      colorHex: "#38BDF8",
    });

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [targetUrl, init] = fetchMock.mock.calls[0] ?? [];
    expect(targetUrl).toBe("https://api.playasul.local/v1/sessions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(init?.body).toBe(
      JSON.stringify({
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        colorHex: "#38BDF8",
      }),
    );

    expect(response.status).toBe(201);
    const payload = (await response.json()) as SessionCreateResponse;
    expect(payload.sessionId).toBe(MOCK_RESPONSE.sessionId);
  });
});
