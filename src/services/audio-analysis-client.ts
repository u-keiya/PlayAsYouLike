import {
  createPromiseClient,
  type PromiseClient,
  type Transport,
} from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

import { AudioAnalysisService } from "../gen/audio/audio_analysis_connect.ts";

export type AudioAnalysisClient = PromiseClient<typeof AudioAnalysisService>;

export type AudioAnalysisClientOptions =
  | { transport: Transport; baseUrl?: string }
  | { baseUrl: string; transport?: undefined };

/**
 * Build a ConnectRPC promise client for the AudioAnalysisService.
 *
 * Accepts either a fully configured transport (useful for tests) or a gRPC-web
 * endpoint base URL that is converted into the default transport.
 */
export function createAudioAnalysisClient(
  options: AudioAnalysisClientOptions,
): AudioAnalysisClient {
  if ("transport" in options && options.transport) {
    return createPromiseClient(AudioAnalysisService, options.transport);
  }

  if (!("baseUrl" in options) || options.baseUrl.length === 0) {
    throw new Error(
      "baseUrl is required when transport is not provided for AudioAnalysisService",
    );
  }

  const transport = createGrpcWebTransport({
    baseUrl: options.baseUrl,
  });

  return createPromiseClient(AudioAnalysisService, transport);
}

export {
  AnalyzeTrackRequest,
  AnalyzeTrackResponse,
  AnalysisSummary,
  BeatPosition,
  KeyEstimate,
  SectionBreakdown,
} from "../gen/audio/audio_analysis_pb.ts";
