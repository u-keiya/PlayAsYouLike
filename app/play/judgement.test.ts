import { describe, expect, it } from "vitest";
import { evaluateTiming, scoreForJudgement } from "./judgement";

describe("evaluateTiming", () => {
  it("returns hit when diff is within the hit window", () => {
    expect(evaluateTiming(0)).toBe("hit");
    expect(evaluateTiming(45)).toBe("hit");
    expect(evaluateTiming(-45)).toBe("hit");
  });

  it("returns late when diff is positive but after the hit window", () => {
    expect(evaluateTiming(120)).toBe("late");
    expect(evaluateTiming(180)).toBe("late");
  });

  it("returns miss when diff is negative beyond the hit window or too late", () => {
    expect(evaluateTiming(-120)).toBe("miss");
    expect(evaluateTiming(250)).toBe("miss");
  });
});

describe("scoreForJudgement", () => {
  it("awards 100 points for hit", () => {
    expect(scoreForJudgement("hit")).toBe(100);
  });

  it("awards 70 points for late", () => {
    expect(scoreForJudgement("late")).toBe(70);
  });

  it("awards 0 points for miss", () => {
    expect(scoreForJudgement("miss")).toBe(0);
  });
});
