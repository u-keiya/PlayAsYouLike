import { createSeededRandom, hashStringToInt } from "../utils/random";

export type BeatmapSegment = {
  label: string;
  startSec: number;
};

export type BeatmapNote = {
  t: number;
  lane: number;
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

const SEGMENT_LABELS = ["intro", "verse", "bridge", "chorus", "outro"] as const;
const KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab"];

export type GenerateBeatmapInput = {
  url: string;
  seed: number;
};

export async function generateBeatmap({
  url,
  seed,
}: GenerateBeatmapInput): Promise<Beatmap> {
  const seedOffset = hashStringToInt(url);
  const rng = createSeededRandom(seed ^ seedOffset);

  const bpm = Math.max(80, Math.round(60 + rng() * 120));
  const durationSec = 90 + Math.round(rng() * 150);
  const beatIntervalMs = Math.round((60_000 / bpm) * (0.9 + rng() * 0.2));
  const beatCount = Math.min(
    128,
    Math.max(48, Math.round((durationSec * 1000) / beatIntervalMs)),
  );

  const energyEnvelope = Array.from({ length: 32 }, () =>
    Number((rng() * 1.0).toFixed(3)),
  );

  const spectralCentroidSeq = Array.from({ length: 32 }, () =>
    Number((rng() * 0.9 + 0.1).toFixed(3)),
  );

  const keyProgression = Array.from(
    { length: 4 + Math.floor(rng() * 3) },
    () => KEYS[Math.floor(rng() * KEYS.length)],
  );

  const segments: BeatmapSegment[] = [];
  let elapsed = 0;
  const segmentCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < segmentCount; i += 1) {
    segments.push({
      label: SEGMENT_LABELS[i % SEGMENT_LABELS.length],
      startSec: Math.round(elapsed * 10) / 10,
    });
    elapsed += durationSec / segmentCount;
  }

  const notes: BeatmapNote[] = Array.from({ length: beatCount }, (_, index) => {
    const baseTime = index * beatIntervalMs;
    const jitter = Math.round((rng() - 0.5) * beatIntervalMs * 0.2);
    return {
      t: Math.max(0, baseTime + jitter),
      lane: Math.floor(rng() * 4),
    };
  });

  const beatTimeline = notes.map((note) => note.t);

  return {
    bpm,
    energyEnvelope,
    beatTimeline,
    spectralCentroidSeq,
    keyProgression,
    segments,
    notes,
  };
}
