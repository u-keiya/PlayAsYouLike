"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GameResultPayload,
  clearGameResult,
  loadGameResult,
} from "../../lib/game-result-storage";
import {
  buildStoredSession,
  loadStoredSession,
  saveStoredSession,
} from "../../lib/session-storage";
import { saveActiveSession } from "../../lib/active-session-storage";
import { SessionCreateResponse } from "../../../types/session";

const REQUEST_TIMEOUT_MS = 30_000;

type ReplayState = "idle" | "pending" | "error";

type ReplayError = "missing-session" | "request" | "invalid-response";

export default function ResultPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const [result, setResult] = useState<GameResultPayload | null>(null);
  const [replayState, setReplayState] = useState<ReplayState>("idle");
  const [replayError, setReplayError] = useState<ReplayError | null>(null);

  useEffect(() => {
    const stored = loadGameResult(params.sessionId);
    if (!stored) {
      router.replace("/");
      return;
    }

    setResult(stored);
    clearGameResult();
  }, [params.sessionId, router]);

  const accuracyPercent = useMemo(() => {
    if (!result) {
      return "0.0";
    }

    const rounded = Math.round(result.accuracy * 1000) / 10;
    return rounded.toFixed(1);
  }, [result]);

  const handleReplay = useCallback(async () => {
    if (!result) {
      return;
    }

    const stored = loadStoredSession();
    if (!stored || stored.sessionId !== result.sessionId) {
      setReplayState("error");
      setReplayError("missing-session");
      return;
    }

    const payload = {
      url: stored.url,
      colorHex: stored.colorHex,
      seed: stored.seed,
    };

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    setReplayState("pending");
    setReplayError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        setReplayState("error");
        setReplayError("request");
        return;
      }

      const body = (await response.json()) as SessionCreateResponse;
      if (!body?.sessionId) {
        setReplayState("error");
        setReplayError("invalid-response");
        return;
      }

      saveStoredSession(
        buildStoredSession(body, {
          url: payload.url,
          colorHex: payload.colorHex,
        }),
      );
      saveActiveSession(body);
      setReplayState("idle");
      router.replace(`/play/${body.sessionId}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setReplayError("request");
      } else {
        setReplayError("request");
      }
      setReplayState("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [result, router]);

  const handleBackHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  if (!result) {
    return null;
  }

  return (
    <div className="result">
      <header className="result__header">
        <div>
          <p className="result__label">Session</p>
          <h1 className="result__title">#{params.sessionId.slice(0, 8)}</h1>
        </div>
        <div className="result__summary">
          <div>
            <p className="result__label">Score</p>
            <p className="result__value" data-testid="result-score">
              {result.score}
            </p>
          </div>
          <div>
            <p className="result__label">Accuracy</p>
            <p className="result__value" data-testid="result-accuracy">
              {accuracyPercent}%
            </p>
          </div>
        </div>
      </header>

      <main className="result__main">
        <section className="result__panel">
          <h2>Judgement</h2>
          <dl className="result__stats">
            <div>
              <dt>Hit</dt>
              <dd className="result__stats-hit" data-testid="result-hit-count">
                {result.hitCount}
              </dd>
            </div>
            <div>
              <dt>Late</dt>
              <dd
                className="result__stats-late"
                data-testid="result-late-count"
              >
                {result.lateCount}
              </dd>
            </div>
            <div>
              <dt>Miss</dt>
              <dd
                className="result__stats-miss"
                data-testid="result-miss-count"
              >
                {result.missCount}
              </dd>
            </div>
          </dl>
          <p className="result__meta">
            Seed <code>{result.seed}</code> · Notes {result.totalNotes}
          </p>
          {result.url ? (
            <p className="result__url" title={result.url}>
              {result.url}
            </p>
          ) : null}
        </section>

        <aside className="result__actions">
          <button
            type="button"
            className="result__primary"
            onClick={handleReplay}
            disabled={replayState === "pending"}
          >
            {replayState === "pending" ? "Replaying..." : "Replay"}
          </button>
          <button
            type="button"
            className="result__secondary"
            onClick={handleBackHome}
          >
            Back to Home
          </button>
          {replayState === "error" ? (
            <p className="result__error" role="alert">
              {replayError === "missing-session"
                ? "リプレイ元のセッション情報を復元できませんでした。トップへ戻って再取得してください。"
                : "リプレイの開始に失敗しました。時間を置いて再試行してください。"}
            </p>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
