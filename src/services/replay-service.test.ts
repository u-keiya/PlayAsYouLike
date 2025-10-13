import { afterEach, describe, expect, it, vi } from "vitest";
import RedisMock from "ioredis-mock";
import type { Redis as RedisClient } from "ioredis";
import { SeedRepository } from "./seed-repository";
import { ReplayService } from "./replay-service";

describe("ReplayService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists and retrieves seeds via Redis with TTL enforcement", async () => {
    vi.useFakeTimers();
    const redis = new RedisMock();
    const redisClient = redis as unknown as RedisClient;
    const repository = new SeedRepository(redisClient, {
      ttlSeconds: 1,
      namespace: "test",
    });
    const service = new ReplayService(repository);
    const sessionId = "f21ba8c3-ffbe-4d3b-8617-c7962621db4b";

    await service.persistSeed(sessionId, 1234);
    await expect(service.getSeed(sessionId)).resolves.toBe(1234);

    await vi.advanceTimersByTimeAsync(1_500);
    await expect(service.getSeed(sessionId)).resolves.toBeNull();

    await redisClient.quit();
  });
});
