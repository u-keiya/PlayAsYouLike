import type { SessionRepository } from "../services/session-repository";
import type { SeedRepository } from "../services/seed-repository";
import type { ReplayService } from "../services/replay-service";

declare module "fastify" {
  interface FastifyInstance {
    sessionRepository: SessionRepository;
    seedRepository: SeedRepository;
    replayService: ReplayService;
    appConfig: {
      beatmapTimeoutMs: number;
    };
  }
}
