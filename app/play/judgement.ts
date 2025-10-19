export type Judgement = "hit" | "late" | "miss";

export const HIT_WINDOW_MS = 90;
export const LATE_WINDOW_MS = 180;

export function evaluateTiming(diffMs: number): Judgement {
  if (Math.abs(diffMs) <= HIT_WINDOW_MS) {
    return "hit";
  }

  if (diffMs > 0 && diffMs <= LATE_WINDOW_MS) {
    return "late";
  }

  return "miss";
}

export function scoreForJudgement(judgement: Judgement): number {
  switch (judgement) {
    case "hit":
      return 100;
    case "late":
      return 70;
    case "miss":
    default:
      return 0;
  }
}
