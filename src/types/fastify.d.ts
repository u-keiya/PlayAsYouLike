import type { SessionRepository } from "../services/session-repository";

declare module "fastify" {
  interface FastifyInstance {
    sessionRepository: SessionRepository;
    appConfig: {
      beatmapTimeoutMs: number;
    };
  }
}
