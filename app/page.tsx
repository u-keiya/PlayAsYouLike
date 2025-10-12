"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const TUTORIAL_STORAGE_KEY = "play-as-you-like:tutorial-seen:v1";

type UrlMetadata = {
  title: string;
  durationSec: number;
  trimmed: boolean;
};

const METADATA_TIMEOUT_MS = 3000;

const tutorialSteps = [
  {
    title: "URL を貼り付け",
    description:
      "YouTube 動画の共有リンクをコピーして入力エリアにペーストします。",
  },
  {
    title: "Play を押す",
    description:
      "最大 300 秒以内に譜面が生成され、自動でプレイ画面へ遷移します。",
  },
  {
    title: "ワンキー操作で遊ぶ",
    description:
      "表示された判定ラインに合わせてキーを叩き、音楽と演出を楽しみましょう。",
  },
] as const;

export default function HomePage() {
  const [isTutorialOpen, setTutorialOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const metadataRequestControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      metadataRequestControllerRef.current?.abort();
    };
  }, []);

  const formatDuration = useCallback((durationSec: number) => {
    if (!Number.isFinite(durationSec) || durationSec < 0) {
      return "-";
    }

    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
    setErrorMessage(null);
    setMetadata(null);
  };

  const fetchMetadata = useCallback(
    async (targetUrl: string) => {
      const trimmedUrl = targetUrl.trim();

      if (!trimmedUrl) {
        setErrorMessage("YouTube の URL を入力してください。");
        setMetadata(null);
        return;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      metadataRequestControllerRef.current?.abort();

      const controller = new AbortController();
      metadataRequestControllerRef.current = controller;

      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, METADATA_TIMEOUT_MS);

      setIsFetchingMetadata(true);
      setErrorMessage(null);
      setMetadata(null);

      try {
        const response = await fetch(
          `/api/metadata?url=${encodeURIComponent(trimmedUrl)}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (!response.ok) {
          const message =
            typeof (payload as { message?: unknown })?.message === "string"
              ? (payload as { message: string }).message
              : "メタデータの取得に失敗しました。";

          setErrorMessage(message);
          return;
        }

        setMetadata(payload as UrlMetadata);
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          if (didTimeout) {
            setErrorMessage(
              "3 秒以内にメタデータを取得できませんでした。再度お試しください。",
            );
          }
          return;
        }

        setErrorMessage("メタデータの取得中にエラーが発生しました。");
      } finally {
        window.clearTimeout(timeoutId);

        if (requestId === latestRequestIdRef.current) {
          setIsFetchingMetadata(false);
          metadataRequestControllerRef.current = null;
        }
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const form = event.currentTarget;

      if (!form.reportValidity()) {
        return;
      }

      await fetchMetadata(url);
    },
    [fetchMetadata, url],
  );

  const persistTutorialSeen = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSeenTutorial =
      window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";

    if (!hasSeenTutorial) {
      setTutorialOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isTutorialOpen || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        persistTutorialSeen();
        setTutorialOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTutorialOpen, persistTutorialSeen]);

  const handleCloseTutorial = () => {
    persistTutorialSeen();
    setTutorialOpen(false);
  };

  const handleOpenTutorial = () => {
    setTutorialOpen(true);
  };

  const isPlayEnabled = Boolean(metadata) && !isFetchingMetadata;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Play As You Like</h1>
        <button
          type="button"
          onClick={handleOpenTutorial}
          className="app__help-button"
          aria-haspopup="dialog"
          aria-controls="tutorial-modal"
          aria-expanded={isTutorialOpen}
        >
          ヘルプ
        </button>
      </header>

      <main className="app__content">
        <section className="app__panel" aria-labelledby="quick-start-title">
          <div className="app__panel-header">
            <h2 id="quick-start-title">お気に入りの曲で即プレイ</h2>
            <p className="app__lead">
              YouTube の URL を貼り付けて「Play」を押すだけ。US-001
              の体験をいつでも再確認できます。
            </p>
          </div>

          <form className="app__form" onSubmit={handleSubmit} noValidate>
            <label className="app__label" htmlFor="youtube-url">
              YouTube URL
            </label>
            <input
              id="youtube-url"
              className="app__input"
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
              autoComplete="off"
              aria-describedby="url-help-text"
              value={url}
              onChange={handleUrlChange}
              required
            />
            <p id="url-help-text" className="app__hint">
              入力後に「Fetch」でメタデータを取得し、「Play」でプレイ体験に進めます。
            </p>
            <div className="app__actions">
              <button
                type="submit"
                className="app__secondary-action"
                disabled={isFetchingMetadata}
              >
                {isFetchingMetadata ? "Fetching..." : "Fetch"}
              </button>
              <button
                type="button"
                className="app__primary-action"
                disabled={!isPlayEnabled}
                aria-disabled={!isPlayEnabled}
              >
                Play
              </button>
            </div>
            <div
              className="app__status"
              aria-live="polite"
              aria-busy={isFetchingMetadata}
            >
              {isFetchingMetadata ? (
                <p className="app__status-text">メタデータを取得しています…</p>
              ) : null}
              {metadata ? (
                <dl className="app__metadata">
                  <div className="app__metadata-row">
                    <dt>タイトル</dt>
                    <dd>{metadata.title}</dd>
                  </div>
                  <div className="app__metadata-row">
                    <dt>長さ</dt>
                    <dd>{formatDuration(metadata.durationSec)}</dd>
                  </div>
                  <div className="app__metadata-row">
                    <dt>トリミング</dt>
                    <dd>{metadata.trimmed ? "あり" : "なし"}</dd>
                  </div>
                </dl>
              ) : null}
              {errorMessage ? (
                <p className="app__error" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </form>
        </section>
      </main>

      {isTutorialOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={handleCloseTutorial}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            id="tutorial-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <h2 id="tutorial-title">Play As You Like チュートリアル</h2>
              <p className="modal__subtitle">
                初めての方は以下のステップを確認してください。ヘルプからいつでも再表示できます。
              </p>
            </div>

            <ol className="modal__steps">
              {tutorialSteps.map((step, index) => (
                <li key={step.title} className="modal__step">
                  <span className="modal__step-index">{index + 1}</span>
                  <div>
                    <h3 className="modal__step-title">{step.title}</h3>
                    <p className="modal__step-description">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="modal__actions">
              <button
                type="button"
                className="modal__primary"
                onClick={handleCloseTutorial}
              >
                理解しました
              </button>
              <button
                type="button"
                className="modal__secondary"
                onClick={handleCloseTutorial}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
