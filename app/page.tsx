"use client";

import { useCallback, useEffect, useState } from "react";

export const TUTORIAL_STORAGE_KEY = "play-as-you-like:tutorial-seen:v1";

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

          <div className="app__form">
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
            />
            <p id="url-help-text" className="app__hint">
              300 秒以内に譜面生成が完了し、自動でプレイ画面に切り替わります。
            </p>
            <button type="button" className="app__primary-action">
              Play
            </button>
          </div>
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
