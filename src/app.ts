import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import IORedis from "ioredis";
import type { Redis as RedisClient } from "ioredis";
import { sessionRoutes } from "./routes/sessions";
import { SessionRepository } from "./services/session-repository";
import { SeedRepository } from "./services/seed-repository";
import { ReplayService } from "./services/replay-service";

export type BuildAppOptions = {
  /**
   * Beatmap generation timeout in milliseconds.
   * Defaults to 300s per #US-003 SLA.
   */
  beatmapTimeoutMs?: number;
  /**
   * Optional Redis client override. Useful for tests or external lifecycle management.
   */
  redisClient?: RedisClient;
  /**
   * When true, the Fastify instance will close the Redis connection on shutdown.
   * Defaults to true when the client is created internally, false otherwise.
   */
  manageRedisLifecycle?: boolean;
  seedCache?: {
    ttlSeconds?: number;
    namespace?: string;
  };
};

export function buildApp(options: BuildAppOptions = {}) {
  const beatmapTimeoutMs = options.beatmapTimeoutMs ?? 300_000;
  const ownsRedis = options.redisClient === undefined;
  const redisClient =
    options.redisClient ??
    new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      lazyConnect: true,
    });
  const seedRepository = new SeedRepository(redisClient, {
    ttlSeconds: options.seedCache?.ttlSeconds,
    namespace: options.seedCache?.namespace,
  });
  const replayService = new ReplayService(seedRepository);

  const base = Fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "error" : "info",
    },
  });

  const app = base.withTypeProvider<TypeBoxTypeProvider>();

  const sessionRepository = new SessionRepository();
  app.decorate("sessionRepository", sessionRepository);
  app.decorate("seedRepository", seedRepository);
  app.decorate("replayService", replayService);
  app.decorate("appConfig", { beatmapTimeoutMs });

  const shouldManageRedis =
    options.manageRedisLifecycle ?? (ownsRedis ? true : false);
  if (shouldManageRedis) {
    app.addHook("onClose", async () => {
      try {
        await redisClient.quit();
      } catch (error) {
        app.log.warn(
          { err: error },
          "Failed to close Redis connection cleanly",
        );
      }
    });
  }

  app.setErrorHandler((error, request, reply) => {
    if ((error as { validation?: unknown }).validation) {
      reply.status(422).send({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        detail: error.message,
      });
      return;
    }

    request.log.error({ err: error }, "Unhandled error");
    reply.status(500).send({
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
    });
  });

  app.register(sessionRoutes);

  return app;
}

export type AppInstance = ReturnType<typeof buildApp>;
