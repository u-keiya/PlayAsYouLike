import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

const YOUTUBE_SAMPLE_URL =
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("GET /api/metadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses string duration values returned by upstream API", async () => {
    const mockedResponseBody = {
      title: "Never Gonna Give You Up",
      duration: "213",
    };

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(mockedResponseBody), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest(
      `http://localhost/api/metadata?url=${encodeURIComponent(
        YOUTUBE_SAMPLE_URL,
      )}`,
    );

    const response = await GET(request);
    const payload = (await response.json()) as {
      title: string;
      durationSec: number;
      trimmed: boolean;
    };

    expect(response.status).toBe(200);
    expect(payload.durationSec).toBe(213);
    expect(payload.title).toBe(mockedResponseBody.title);
    expect(payload.trimmed).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
