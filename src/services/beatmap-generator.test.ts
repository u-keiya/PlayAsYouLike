import { describe, expect, it } from "vitest";
import { generateBeatmap } from "./beatmap-generator";

const BASE_INPUT = {
  url: "https://example.com/audio.mp3",
  seed: 123456,
};

describe("BeatmapGenerator", () => {
  it("produces deterministic output for the same input", async () => {
    const first = await generateBeatmap(BASE_INPUT);
    const second = await generateBeatmap(BASE_INPUT);

    expect(second).toEqual(first);
  });

  it("varies beatmap when seed changes", async () => {
    const base = await generateBeatmap(BASE_INPUT);
    const altered = await generateBeatmap({
      ...BASE_INPUT,
      seed: BASE_INPUT.seed + 1,
    });

    expect(altered.notes).not.toEqual(base.notes);
    expect(altered.energyEnvelope).not.toEqual(base.energyEnvelope);
  });

  it("varies beatmap when URL changes", async () => {
    const base = await generateBeatmap(BASE_INPUT);
    const altUrl = await generateBeatmap({
      ...BASE_INPUT,
      url: "https://another.com/track",
    });

    expect(altUrl.keyProgression).not.toEqual(base.keyProgression);
  });

  it("generates structured musical data within expected ranges", async () => {
    const beatmap = await generateBeatmap(BASE_INPUT);

    expect(beatmap.bpm).toBeGreaterThanOrEqual(80);
    expect(beatmap.bpm).toBeLessThanOrEqual(180);
    expect(beatmap.energyEnvelope.length).toBe(32);
    beatmap.energyEnvelope.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    expect(beatmap.spectralCentroidSeq).toHaveLength(
      beatmap.energyEnvelope.length,
    );
    beatmap.spectralCentroidSeq.forEach((value) => {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    });

    expect(beatmap.keyProgression.length).toBeGreaterThanOrEqual(4);
    expect(beatmap.keyProgression.length).toBeLessThanOrEqual(6);

    expect(beatmap.segments.length).toBeGreaterThanOrEqual(4);
    expect(beatmap.segments[0]?.startSec).toBe(0);
    for (let i = 1; i < beatmap.segments.length; i += 1) {
      expect(beatmap.segments[i]!.startSec).toBeGreaterThan(
        beatmap.segments[i - 1]!.startSec,
      );
    }

    expect(beatmap.notes.length).toBeGreaterThan(0);
    const sortedTimes = [...beatmap.notes].map((note) => note.t);
    const copySorted = [...sortedTimes].sort((a, b) => a - b);
    expect(sortedTimes).toEqual(copySorted);
    beatmap.notes.forEach((note) => {
      expect(note.t).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(note.t)).toBe(true);
      expect(note.lane).toBeGreaterThanOrEqual(0);
      expect(note.lane).toBeLessThanOrEqual(3);
    });

    expect(beatmap.beatTimeline.length).toBeGreaterThan(0);
    beatmap.beatTimeline.forEach((time, index) => {
      expect(Number.isInteger(time)).toBe(true);
      if (index > 0) {
        expect(time).toBeGreaterThan(beatmap.beatTimeline[index - 1]!);
      }
    });
  });
});
