import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { sessionRoutes } from "./routes/sessions";
import { SessionRepository } from "./services/session-repository";

export type BuildAppOptions = {
  /**
   * Beatmap generation timeout in milliseconds.
   * Defaults to 300s per #US-003 SLA.
   */
  beatmapTimeoutMs?: number;
};

export function buildApp(options: BuildAppOptions = {}) {
  const beatmapTimeoutMs = options.beatmapTimeoutMs ?? 300_000;

  const base = Fastify({
    logger: {
      level: process.env.NODE_ENV === "test" ? "error" : "info",
    },
  });

  const app = base.withTypeProvider<TypeBoxTypeProvider>();

  const sessionRepository = new SessionRepository();
  app.decorate("sessionRepository", sessionRepository);
  app.decorate("appConfig", { beatmapTimeoutMs });

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
