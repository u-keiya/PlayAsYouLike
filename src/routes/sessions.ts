import { randomUUID } from "node:crypto";
import type { FastifyReply } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import {
  TypeBoxTypeProvider,
  type FastifyPluginAsyncTypebox,
} from "@fastify/type-provider-typebox";
import { normalizePlayableUrl } from "../utils/url";
import { randomUint32 } from "../utils/random";
import { generateBeatmap } from "../services/beatmap-generator";
import { buildPresets } from "../services/preset-service";

const BeatmapSchema = Type.Object({
  bpm: Type.Integer(),
  energyEnvelope: Type.Array(Type.Number({ format: "float" })),
  beatTimeline: Type.Array(
    Type.Integer({ description: "Beat timestamps in ms" }),
  ),
  spectralCentroidSeq: Type.Array(Type.Number({ format: "float" })),
  keyProgression: Type.Array(Type.String()),
  segments: Type.Array(
    Type.Object({
      label: Type.String(),
      startSec: Type.Number({ format: "float" }),
    }),
  ),
  notes: Type.Array(
    Type.Object({
      t: Type.Integer(),
      lane: Type.Integer(),
    }),
  ),
});

const VisualEffectPresetSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  baseColorHex: Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" }),
  particleIntensity: Type.Number({ format: "float" }),
  cameraShake: Type.Number({ format: "float" }),
  bgShader: Type.String(),
});

const SessionCreateRequestSchema = Type.Object({
  url: Type.String({ format: "uri" }),
  colorHex: Type.String({ pattern: "^#[0-9A-Fa-f]{6}$" }),
  seed: Type.Optional(Type.Integer({ minimum: 0 })),
});

const SessionCreateResponseSchema = Type.Object({
  sessionId: Type.String({ format: "uuid" }),
  seed: Type.Integer({ minimum: 0 }),
  beatmap: BeatmapSchema,
  audioUrl: Type.String({ format: "uri" }),
  effectsPreset: VisualEffectPresetSchema,
  presets: Type.Array(VisualEffectPresetSchema, { maxItems: 10 }),
});

const ErrorSchema = Type.Object({
  code: Type.Union([
    Type.Literal("VALIDATION_ERROR"),
    Type.Literal("TIMEOUT"),
    Type.Literal("INTERNAL_ERROR"),
  ]),
  message: Type.String(),
  detail: Type.Optional(Type.String()),
});

type SessionCreateBody = Static<typeof SessionCreateRequestSchema>;
export type SessionCreateResponse = Static<typeof SessionCreateResponseSchema>;

class BeatmapGenerationTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super("Beatmap generation timed out");
  }
}

async function runWithTimeout<T>(
  timeoutMs: number,
  task: () => Promise<T>,
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new BeatmapGenerationTimeoutError(timeoutMs)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([task(), timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function buildAudioUrl(sourceUrl: string, sessionId: string) {
  const encodedSource = Buffer.from(sourceUrl).toString("base64url");
  return `https://cdn.playasul.local/audio/${sessionId}?source=${encodedSource}`;
}

function sendValidationError(
  reply: FastifyReply<TypeBoxTypeProvider>,
  detail: string,
) {
  reply.status(422).send({
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    detail,
  });
}

export const sessionRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/sessions",
    {
      schema: {
        tags: ["sessions"],
        body: SessionCreateRequestSchema,
        response: {
          201: SessionCreateResponseSchema,
          422: ErrorSchema,
          503: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as SessionCreateBody;

      const normalizedUrl = normalizePlayableUrl(body.url);
      if (!normalizedUrl) {
        sendValidationError(reply, "url must be a valid http(s) URL");
        return;
      }

      const seed =
        typeof body.seed === "number" && Number.isFinite(body.seed)
          ? body.seed >>> 0
          : randomUint32();

      try {
        const beatmap = await runWithTimeout(
          fastify.appConfig.beatmapTimeoutMs,
          () =>
            generateBeatmap({
              url: normalizedUrl,
              seed,
            }),
        );

        const { selected, list } = buildPresets(body.colorHex, seed);
        const sessionId = randomUUID();
        const response: SessionCreateResponse = {
          sessionId,
          seed,
          beatmap,
          audioUrl: buildAudioUrl(normalizedUrl, sessionId),
          effectsPreset: selected,
          presets: list,
        };

        fastify.sessionRepository.save({
          sessionId,
          url: normalizedUrl,
          colorHex: body.colorHex,
          seed,
          createdAt: new Date(),
          payload: response,
        });
        await fastify.replayService.persistSeed(sessionId, seed);

        reply.status(201).send(response);
      } catch (error) {
        if (error instanceof BeatmapGenerationTimeoutError) {
          reply.status(503).send({
            code: "TIMEOUT",
            message: error.message,
            detail: `Exceeded ${error.timeoutMs}ms SLA`,
          });
          return;
        }

        throw error;
      }
    },
  );
};
