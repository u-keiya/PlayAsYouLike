"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BeatmapNote } from "../../../types/session";
import {
  ActiveSessionRecord,
  clearActiveSession,
  loadActiveSession,
} from "../../lib/active-session-storage";
import { loadStoredSession } from "../../lib/session-storage";
import {
  GameResultPayload,
  clearGameResult,
  saveGameResult,
} from "../../lib/game-result-storage";
import {
  HIT_WINDOW_MS,
  LATE_WINDOW_MS,
  Judgement,
  evaluateTiming,
  scoreForJudgement,
} from "../judgement";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 720;
const LANE_COUNT = 4;
const NOTE_WIDTH = 84;
const NOTE_HEIGHT = 24;
const JUDGE_LINE_Y = CANVAS_HEIGHT - 120;
const NOTE_TRAVEL_MS = 2200;

const KEY_BINDINGS = ["Space", "Enter", "KeyF"];
const TAP_BUTTON_LABEL = "Tap";

type Stats = {
  hitCount: number;
  lateCount: number;
  missCount: number;
  score: number;
  combo: number;
  bestCombo: number;
};

type NoteState = {
  note: BeatmapNote;
  judged: boolean;
  judgement?: Judgement;
};

type GameStatus = "loading" | "ready" | "running" | "ended" | "error";

function drawScene(
  context: CanvasRenderingContext2D,
  notes: NoteState[],
  elapsedMs: number,
  baseColor: string,
) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#020617");
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const laneWidth = CANVAS_WIDTH / LANE_COUNT;

  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    context.fillStyle =
      lane % 2 === 0 ? "rgba(15,23,42,0.25)" : "rgba(30,41,59,0.25)";
    context.fillRect(lane * laneWidth, 0, laneWidth, CANVAS_HEIGHT);
  }

  // Judge line
  context.fillStyle = "rgba(148, 163, 184, 0.8)";
  context.fillRect(0, JUDGE_LINE_Y, CANVAS_WIDTH, 4);

  // Notes
  notes.forEach((state) => {
    const { note, judged, judgement } = state;
    const timeUntilJudge = note.t - elapsedMs;
    const progress = 1 - timeUntilJudge / NOTE_TRAVEL_MS;

    if (progress < 0) {
      return;
    }

    // Once the note has fully passed the judge line, stop drawing it.
    if (progress > 1.3) {
      return;
    }

    const lane = Math.max(0, Math.min(note.lane, LANE_COUNT - 1));
    const laneCenter = lane * laneWidth + laneWidth / 2;
    const travelHeight = JUDGE_LINE_Y - 60;
    const clampedProgress = Math.max(0, Math.min(progress, 1));
    const y = JUDGE_LINE_Y - clampedProgress * travelHeight;

    if (judged) {
      switch (judgement) {
        case "hit":
          context.fillStyle = "rgba(34, 197, 94, 0.9)";
          break;
        case "late":
          context.fillStyle = "rgba(250, 204, 21, 0.85)";
          break;
        case "miss":
        default:
          context.fillStyle = "rgba(248, 113, 113, 0.8)";
          break;
      }
    } else {
      context.fillStyle = baseColor;
    }

    context.fillRect(
      laneCenter - NOTE_WIDTH / 2,
      y - NOTE_HEIGHT / 2,
      NOTE_WIDTH,
      NOTE_HEIGHT,
    );
  });
}

function computeAccuracy(stats: Stats, totalNotes: number) {
  if (totalNotes === 0) {
    return 0;
  }

  const weighted = stats.hitCount + stats.lateCount * 0.7;
  return Math.round((weighted / totalNotes) * 1000) / 1000;
}

export default function PlaySessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const sessionRef = useRef<ActiveSessionRecord | null>(null);
  const hasFinishedRef = useRef(false);
  const notesRef = useRef<NoteState[]>([]);
  const statsRef = useRef<Stats>({
    hitCount: 0,
    lateCount: 0,
    missCount: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
  });

  const [status, setStatus] = useState<GameStatus>("loading");
  const [stats, setStats] = useState<Stats>(statsRef.current);
  const [storedUrl, setStoredUrl] = useState<string>("");

  const activeSession = useMemo(
    () => loadActiveSession(params.sessionId),
    [params.sessionId],
  );

  useEffect(() => {
    clearGameResult();
    if (!activeSession) {
      router.replace("/");
      return;
    }

    sessionRef.current = activeSession;
    const normalizedNotes = [...activeSession.beatmap.notes].sort(
      (a, b) => a.t - b.t,
    );
    notesRef.current = normalizedNotes.map((note) => ({
      note,
      judged: false,
    }));
    statsRef.current = {
      hitCount: 0,
      lateCount: 0,
      missCount: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
    };
    setStats(statsRef.current);
    setStatus("ready");

    const stored = loadStoredSession();
    if (stored?.sessionId === activeSession.sessionId) {
      setStoredUrl(stored.url);
    }
  }, [activeSession, router]);

  const finishGame = useCallback(() => {
    const session = sessionRef.current;
    if (!session || hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;

    const totalNotes = notesRef.current.length;
    const summary = statsRef.current;
    const accuracy = computeAccuracy(summary, totalNotes);

    const payload: GameResultPayload = {
      sessionId: session.sessionId,
      seed: session.seed,
      url: storedUrl,
      totalNotes,
      hitCount: summary.hitCount,
      lateCount: summary.lateCount,
      missCount: summary.missCount,
      score: summary.score,
      accuracy,
      endedAt: new Date().toISOString(),
    };

    saveGameResult(payload);
    clearActiveSession();
    setStatus("ended");
    router.replace(`/result/${session.sessionId}`);
  }, [router, storedUrl]);

  const applyJudgement = useCallback(
    (index: number, judgement: Judgement) => {
      const target = notesRef.current[index];
      if (!target || target.judged) {
        return;
      }

      target.judged = true;
      target.judgement = judgement;

      const nextStats: Stats = { ...statsRef.current };

      switch (judgement) {
        case "hit":
          nextStats.hitCount += 1;
          nextStats.combo += 1;
          nextStats.bestCombo = Math.max(nextStats.bestCombo, nextStats.combo);
          break;
        case "late":
          nextStats.lateCount += 1;
          nextStats.combo += 1;
          nextStats.bestCombo = Math.max(nextStats.bestCombo, nextStats.combo);
          break;
        case "miss":
        default:
          nextStats.missCount += 1;
          nextStats.combo = 0;
          break;
      }

      nextStats.score += scoreForJudgement(judgement);

      statsRef.current = nextStats;
      setStats(nextStats);

      if (notesRef.current.every((note) => note.judged)) {
        setTimeout(() => {
          finishGame();
        }, 0);
      }
    },
    [finishGame],
  );

  const handleTap = useCallback(() => {
    if (status !== "running") {
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    const targetIndex = notesRef.current.findIndex((state) => {
      if (state.judged) {
        return false;
      }

      const diff = elapsed - state.note.t;
      return Math.abs(diff) <= LATE_WINDOW_MS;
    });

    if (targetIndex === -1) {
      return;
    }

    const target = notesRef.current[targetIndex];
    const diff = elapsed - target.note.t;
    const judgement = evaluateTiming(diff);
    applyJudgement(targetIndex, judgement);
  }, [applyJudgement, status]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (KEY_BINDINGS.includes(event.code)) {
        event.preventDefault();
        handleTap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTap, status]);

  useEffect(() => {
    if (status !== "running") {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const session = sessionRef.current;
    if (!canvas || !session) {
      setStatus("error");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("error");
      return;
    }

    const baseColor = session.effectsPreset.baseColorHex ?? "#38BDF8";

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;

      notesRef.current.forEach((state, index) => {
        if (!state.judged && elapsed - state.note.t > LATE_WINDOW_MS) {
          applyJudgement(index, "miss");
        }
      });

      drawScene(context, notesRef.current, elapsed, baseColor);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [applyJudgement, status]);

  const handleStart = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    hasFinishedRef.current = false;
    startTimeRef.current = performance.now();
    setStatus("running");
  }, [status]);

  const handleAbort = useCallback(() => {
    if (status === "running") {
      clearGameResult();
    }
    clearActiveSession();
    router.replace("/");
  }, [router, status]);

  const baseColor = sessionRef.current?.effectsPreset.baseColorHex ?? "#38BDF8";

  return (
    <div className="playground">
      <header className="playground__header">
        <div>
          <p className="playground__label">Session</p>
          <h1 className="playground__title">#{params.sessionId.slice(0, 8)}</h1>
        </div>
        <div className="playground__summary">
          <div>
            <p className="playground__label">Score</p>
            <p className="playground__metric">{stats.score}</p>
          </div>
          <div>
            <p className="playground__label">Combo</p>
            <p className="playground__metric">{stats.combo}</p>
          </div>
          <div>
            <p className="playground__label">Best</p>
            <p className="playground__metric">{stats.bestCombo}</p>
          </div>
        </div>
      </header>

      <main className="playground__main">
        <section className="playground__stage" aria-live="polite">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="playground__canvas"
            style={{ borderColor: baseColor }}
            onPointerDown={(event) => {
              event.preventDefault();
              handleTap();
            }}
          />
          <div className="playground__status">
            {status === "ready" ? (
              <p>
                Ready to play. Press <kbd>Space</kbd> / <kbd>Enter</kbd> or tap
                the button to hit notes.
              </p>
            ) : null}
            {status === "running" ? (
              <p>
                Windows: hit ≤ {HIT_WINDOW_MS}ms, late ≤ {LATE_WINDOW_MS}ms.
                Keep the rhythm!
              </p>
            ) : null}
            {status === "ended" ? (
              <p>Great job! Preparing result screen…</p>
            ) : null}
            {status === "error" ? (
              <p className="playground__error">
                プレイデータの読み込みに失敗しました。トップへ戻って再試行してください。
              </p>
            ) : null}
          </div>
          <div className="playground__controls">
            {status === "ready" ? (
              <button
                type="button"
                className="playground__primary"
                onClick={handleStart}
              >
                Start Play
              </button>
            ) : null}
            {status === "running" ? (
              <button
                type="button"
                className="playground__secondary"
                onClick={handleTap}
              >
                {TAP_BUTTON_LABEL}
              </button>
            ) : null}
            <button
              type="button"
              className="playground__secondary"
              onClick={handleAbort}
            >
              Quit
            </button>
          </div>
        </section>

        <aside className="playground__sidebar">
          <div className="playground__stat-block">
            <p className="playground__label">Hit</p>
            <p className="playground__metric playground__metric--hit">
              {stats.hitCount}
            </p>
          </div>
          <div className="playground__stat-block">
            <p className="playground__label">Late</p>
            <p className="playground__metric playground__metric--late">
              {stats.lateCount}
            </p>
          </div>
          <div className="playground__stat-block">
            <p className="playground__label">Miss</p>
            <p className="playground__metric playground__metric--miss">
              {stats.missCount}
            </p>
          </div>
        </aside>
      </main>

      <footer className="playground__footer">
        <p>
          Seed: <code>{sessionRef.current?.seed ?? "-"}</code>
        </p>
        {storedUrl ? (
          <p className="playground__url" title={storedUrl}>
            {storedUrl}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
