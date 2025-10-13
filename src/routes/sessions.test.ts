import { afterEach, describe, expect, it, vi } from "vitest";
import RedisMock from "ioredis-mock";
import { buildApp, type BuildAppOptions } from "../app";
import type { SessionCreateResponse } from "./sessions";
import { UINT32_MAX } from "../utils/random";
import * as beatmapGenerator from "../services/beatmap-generator";

function createTestApp(overrides: Partial<BuildAppOptions> = {}) {
  const redis = new RedisMock();
  const app = buildApp({
    redisClient: redis,
    manageRedisLifecycle: true,
    seedCache: { ttlSeconds: 900, namespace: "test" },
    ...overrides,
  });

  return { app, redis };
}

describe("POST /sessions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a session with a provided seed and stores it", async () => {
    const { app } = createTestApp();
    await app.ready();

    const payload = {
      url: "https://example.com/song.mp3",
      colorHex: "#3366FF",
      seed: 123456789,
    };

    try {
      const firstResponse = await app.inject({
        method: "POST",
        url: "/sessions",
        payload,
      });

      expect(firstResponse.statusCode).toBe(201);

      const body = firstResponse.json() as SessionCreateResponse;
      expect(body.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(body.seed).toBe(payload.seed);
      expect(body.effectsPreset.baseColorHex).toBe(payload.colorHex);
      expect(body.presets.length).toBeGreaterThanOrEqual(1);

      const stored = app.sessionRepository.findById(body.sessionId);
      expect(stored).not.toBeNull();
      expect(stored?.seed).toBe(payload.seed);
      expect(stored?.url).toBe("https://example.com/song.mp3");
      await expect(app.replayService.getSeed(body.sessionId)).resolves.toBe(
        payload.seed,
      );

      const secondResponse = await app.inject({
        method: "POST",
        url: "/sessions",
        payload,
      });
      expect(secondResponse.statusCode).toBe(201);

      const secondBody = secondResponse.json() as SessionCreateResponse;
      expect(secondBody.seed).toBe(payload.seed);
      expect(secondBody.beatmap).toEqual(body.beatmap);
    } finally {
      await app.close();
    }
  });

  it("generates a random seed when omitted", async () => {
    const { app } = createTestApp();
    await app.ready();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/sessions",
        payload: {
          url: "https://example.com/track",
          colorHex: "#112233",
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json() as SessionCreateResponse;
      expect(typeof body.seed).toBe("number");
      expect(body.seed).toBeGreaterThanOrEqual(0);
      expect(body.seed).toBeLessThanOrEqual(UINT32_MAX);
      expect(app.sessionRepository.findById(body.sessionId)?.seed).toBe(
        body.seed,
      );
      await expect(app.replayService.getSeed(body.sessionId)).resolves.toBe(
        body.seed,
      );
    } finally {
      await app.close();
    }
  });

  it("returns 422 when url is invalid", async () => {
    const { app } = createTestApp();
    await app.ready();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/sessions",
        payload: {
          url: "notaurl",
          colorHex: "#abcdef",
        },
      });

      expect(response.statusCode).toBe(422);
      expect(response.json()).toMatchObject({
        code: "VALIDATION_ERROR",
      });
    } finally {
      await app.close();
    }
  });

  it("returns 503 when beatmap generation exceeds SLA", async () => {
    const { app } = createTestApp({ beatmapTimeoutMs: 5 });
    await app.ready();

    vi.spyOn(beatmapGenerator, "generateBeatmap").mockImplementation(
      () =>
        new Promise(() => {
          // intentionally never resolve to trigger timeout
        }),
    );

    try {
      const response = await app.inject({
        method: "POST",
        url: "/sessions",
        payload: {
          url: "https://example.com/slow-track",
          colorHex: "#445566",
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toMatchObject({
        code: "TIMEOUT",
      });
    } finally {
      await app.close();
    }
  });
});
