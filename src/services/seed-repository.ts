import type { Redis } from "ioredis";

export type SeedRepositoryOptions = {
  /**
   * TTL in seconds for cached seeds.
   * Defaults to 15 minutes per ADR-0004 / US-003.
   */
  ttlSeconds?: number;
  /**
   * Optional namespace prefix for cache keys.
   * Allows isolating multiple environments sharing the same Redis instance.
   */
  namespace?: string;
};

export class SeedRepository {
  private readonly ttlSeconds: number;
  private readonly namespace: string;

  constructor(
    private readonly redis: Redis,
    options: SeedRepositoryOptions = {},
  ) {
    this.ttlSeconds = options.ttlSeconds ?? 15 * 60;
    this.namespace = options.namespace ?? "playasul:beatmap-seed";
  }

  async persistSeed(sessionId: string, seed: number): Promise<void> {
    const key = this.buildSessionKey(sessionId);
    await this.redis.set(key, seed.toString(10), "EX", this.ttlSeconds);
  }

  async fetchSeed(sessionId: string): Promise<number | null> {
    const value = await this.redis.get(this.buildSessionKey(sessionId));
    if (value === null) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  async deleteSeed(sessionId: string): Promise<void> {
    await this.redis.del(this.buildSessionKey(sessionId));
  }

  private buildSessionKey(sessionId: string) {
    return `${this.namespace}:session:${sessionId}`;
  }
}
