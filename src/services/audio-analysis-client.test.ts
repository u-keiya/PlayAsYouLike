import { describe, expect, it } from "vitest";
import { createRouterTransport } from "@connectrpc/connect";

import { AudioAnalysisService } from "../gen/audio/audio_analysis_connect.ts";
import {
  AnalysisSummary,
  AnalyzeTrackResponse,
  BeatPosition,
  KeyEstimate,
  SectionBreakdown,
  createAudioAnalysisClient,
} from "./audio-analysis-client";

describe("createAudioAnalysisClient", () => {
  it("performs a sample AnalyzeTrack call using an in-memory transport", async () => {
    const transport = createRouterTransport(({ service }) => {
      service(AudioAnalysisService, {
        async analyzeTrack(request) {
          expect(request.audioUrl).toBe(
            "https://cdn.playasul.local/audio/sample.mp3",
          );

          return new AnalyzeTrackResponse({
            summary: new AnalysisSummary({
              bpm: 128,
              energy: 0.72,
              beatPosition: BeatPosition.ON_BEAT,
              spectralCentroid: 345.6,
              key: new KeyEstimate({
                tonic: "A",
                mode: "minor",
                confidence: 0.87,
                chordProgression: ["Am", "F", "C", "G"],
              }),
            }),
            sections: [
              new SectionBreakdown({
                label: "chorus",
                startSec: 60,
                endSec: 90,
                averageEnergy: 0.82,
              }),
            ],
          });
        },
      });
    });

    const client = createAudioAnalysisClient({ transport });

    const response = await client.analyzeTrack({
      audioUrl: "https://cdn.playasul.local/audio/sample.mp3",
    });

    expect(response.summary?.bpm).toBe(128);
    expect(response.summary?.beatPosition).toBe(BeatPosition.ON_BEAT);
    expect(response.sections).toHaveLength(1);
    expect(response.sections[0]?.label).toBe("chorus");
  });
});
