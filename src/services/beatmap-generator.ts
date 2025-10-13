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
const ENERGY_RESOLUTION = 32;
const LANES = 4;

export type GenerateBeatmapInput = {
  url: string;
  seed: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(list: readonly T[], rng: () => number) {
  return list[Math.floor(rng() * list.length)];
}

class BeatmapGenerator {
  generate({ url, seed }: GenerateBeatmapInput): Beatmap {
    const rng = this.createRng(url, seed);
    const bpm = this.selectBpm(rng);
    const durationSec = this.selectDuration(rng);
    const beatIntervalMs = this.computeBeatIntervalMs(bpm, rng);
    const beatCount = this.computeBeatCount(durationSec, beatIntervalMs);

    const energyEnvelope = this.buildEnergyEnvelope(rng);
    const spectralCentroidSeq = this.buildSpectralCentroidSeq(
      rng,
      energyEnvelope,
    );
    const keyProgression = this.buildKeyProgression(rng);
    const segments = this.buildSegments(rng, durationSec);
    const { notes, beatTimeline } = this.buildNotes(
      rng,
      beatIntervalMs,
      beatCount,
      energyEnvelope,
    );

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

  private createRng(url: string, seed: number) {
    const seedOffset = hashStringToInt(url);
    return createSeededRandom(seed ^ seedOffset);
  }

  private selectBpm(rng: () => number) {
    // Favor mid-tempo tracks (110-150) while allowing wider range.
    const base = 80 + rng() * 100;
    const accent = rng() * 40;
    return Math.round(clamp(base + accent, 80, 180));
  }

  private selectDuration(rng: () => number) {
    // Between 90s and 240s (1.5 min to 4 min) to match doc expectations.
    return 90 + Math.round(rng() * 150);
  }

  private computeBeatIntervalMs(bpm: number, rng: () => number) {
    const idealInterval = 60_000 / bpm;
    const swing = 0.9 + rng() * 0.2; // introduce slight groove variation
    return Math.round(idealInterval * swing);
  }

  private computeBeatCount(durationSec: number, beatIntervalMs: number) {
    const durationMs = durationSec * 1000;
    const estimated = Math.round(durationMs / beatIntervalMs);
    return clamp(estimated, 48, 192);
  }

  private buildEnergyEnvelope(rng: () => number) {
    const envelope: number[] = [];
    for (let index = 0; index < ENERGY_RESOLUTION; index += 1) {
      const progress =
        ENERGY_RESOLUTION === 1 ? 0 : index / (ENERGY_RESOLUTION - 1);
      const baseWave = 0.45 + 0.4 * Math.sin(progress * Math.PI);
      const accentWave =
        0.15 * Math.sin(progress * 2 * Math.PI + rng() * Math.PI);
      const noise = (rng() - 0.5) * 0.12;
      const value = clamp(baseWave + accentWave + noise, 0.05, 1);
      envelope.push(Number(value.toFixed(3)));
    }

    // Emphasize climaxes randomly to simulate chorus lifts.
    for (let i = 0; i < envelope.length; i += 1) {
      if (rng() > 0.82) {
        envelope[i] = Number(
          clamp(envelope[i] + 0.2 + rng() * 0.15, 0.1, 1).toFixed(3),
        );
      }
    }

    return envelope;
  }

  private buildSpectralCentroidSeq(
    rng: () => number,
    energyEnvelope: number[],
  ) {
    return energyEnvelope.map((energy, index) => {
      const progress =
        energyEnvelope.length === 1 ? 0 : index / (energyEnvelope.length - 1);
      const base = 0.25 + energy * 0.55;
      const drift = (rng() - 0.5) * 0.1;
      const harmonicBump = 0.1 * Math.sin(progress * Math.PI * 1.5);
      const value = clamp(base + drift + harmonicBump, 0.1, 0.95);
      return Number(value.toFixed(3));
    });
  }

  private buildKeyProgression(rng: () => number) {
    const length = 4 + Math.floor(rng() * 3); // 4 to 6 chords
    const startIndex = Math.floor(rng() * KEYS.length);
    const progression: string[] = [];
    let currentIndex = startIndex;

    for (let i = 0; i < length; i += 1) {
      progression.push(KEYS[currentIndex]);
      const step = pick([-2, -1, 1, 2] as const, rng);
      currentIndex = (currentIndex + step + KEYS.length) % KEYS.length;
    }

    return progression;
  }

  private buildSegments(rng: () => number, durationSec: number) {
    const segmentCount = 4 + Math.floor(rng() * 3); // 4 to 6 segments
    const weights = Array.from({ length: segmentCount }, () => 0.6 + rng());
    const total = weights.reduce((sum, weight) => sum + weight, 0);

    const segments: BeatmapSegment[] = [];
    let elapsed = 0;
    for (let i = 0; i < segmentCount; i += 1) {
      segments.push({
        label: SEGMENT_LABELS[i % SEGMENT_LABELS.length],
        startSec: Number(elapsed.toFixed(1)),
      });
      const portion = (durationSec * weights[i]) / total;
      elapsed += portion;
    }

    return segments;
  }

  private buildNotes(
    rng: () => number,
    beatIntervalMs: number,
    beatCount: number,
    energyEnvelope: number[],
  ) {
    const beatTimeline = Array.from({ length: beatCount }, (_, index) =>
      Math.round(index * beatIntervalMs),
    );

    const notes: BeatmapNote[] = [];
    for (let index = 0; index < beatTimeline.length; index += 1) {
      const beatTime = beatTimeline[index];
      const envelopeIdx =
        energyEnvelope.length === 0
          ? 0
          : Math.min(
              energyEnvelope.length - 1,
              Math.floor(
                (index / Math.max(beatTimeline.length - 1, 1)) *
                  energyEnvelope.length,
              ),
            );
      const energy = energyEnvelope[envelopeIdx] ?? 0.5;

      const jitter = Math.round((rng() - 0.5) * beatIntervalMs * 0.25);
      const laneBase = Math.floor((energy * LANES + rng()) % LANES);
      notes.push({
        t: Math.max(0, beatTime + jitter),
        lane: clamp(laneBase, 0, LANES - 1),
      });

      const extraChance = energy > 0.75 ? 0.55 : energy > 0.55 ? 0.3 : 0.12;
      if (rng() < extraChance) {
        const offset = Math.round(beatIntervalMs * (0.3 + rng() * 0.35));
        const laneOffset =
          (laneBase + 1 + Math.floor(rng() * (LANES - 1))) % LANES;
        notes.push({
          t: Math.max(0, beatTime + offset),
          lane: clamp(laneOffset, 0, LANES - 1),
        });
      }
    }

    notes.sort((a, b) => a.t - b.t);

    return { notes, beatTimeline };
  }
}

const generator = new BeatmapGenerator();

export async function generateBeatmap(
  input: GenerateBeatmapInput,
): Promise<Beatmap> {
  return generator.generate(input);
}

export { BeatmapGenerator };
