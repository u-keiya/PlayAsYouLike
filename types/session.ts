export type SessionCreatePayload = {
  url: string;
  colorHex: string;
  seed?: number;
};

export type BeatmapNote = {
  t: number;
  lane: number;
};

export type BeatmapSegment = {
  label: string;
  startSec: number;
};

export type Beatmap = {
  bpm: number;
  energyEnvelope: number[];
  beatTimeline: number[];
  spectralCentroidSeq: number[];
  keyProgression: string[];
  segments: BeatmapSegment[];
  notes: BeatmapNote[];
};

export type VisualEffectPreset = {
  id: string;
  name: string;
  baseColorHex: string;
  particleIntensity?: number;
  cameraShake?: number;
  bgShader?: string;
};

export type SessionCreateResponse = {
  sessionId: string;
  seed: number;
  beatmap: Beatmap;
  audioUrl: string;
  effectsPreset: VisualEffectPreset;
  presets: VisualEffectPreset[];
};
