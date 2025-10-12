from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path
from typing import Optional

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_BASE_URL = os.getenv("E2E_BASE_URL", "http://127.0.0.1:3100")
_STARTUP_TIMEOUT_SECONDS = 90
_POLL_INTERVAL_SECONDS = 1.0


def _wait_for_server(url: str, timeout: float) -> None:
    import urllib.request

    deadline = time.time() + timeout
    last_error: Optional[Exception] = None

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5):
                return
        except Exception as error:  # noqa: BLE001 - keep original exception for diagnostics
            last_error = error
            time.sleep(_POLL_INTERVAL_SECONDS)

    if last_error is None:
        raise TimeoutError(f"Timed out waiting for {url}")

    raise TimeoutError(f"Server at {url} did not become ready: {last_error}")


class TutorialWorld:
    def __init__(self) -> None:
        self.base_url = DEFAULT_BASE_URL
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.server_process: Optional[subprocess.Popen[str]] = None

    def start_server(self) -> None:
        if self.server_process is not None:
            return

        env = os.environ.copy()
        env.setdefault("NEXT_TELEMETRY_DISABLED", "1")

        port = int(self.base_url.rsplit(":", 1)[-1])
        command = [
            "pnpm",
            "dev",
            "--hostname",
            "127.0.0.1",
            "--port",
            str(port),
        ]

        self.server_process = subprocess.Popen(  # noqa: S603 - command is trusted project tool
            command,
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env,
        )

        _wait_for_server(self.base_url, _STARTUP_TIMEOUT_SECONDS)

    def stop_server(self) -> None:
        if self.server_process is None:
            return

        self.server_process.terminate()
        try:
            self.server_process.wait(timeout=15)
        except Exception:  # noqa: BLE001 - ensure process cleaned up even on timeout
            self.server_process.kill()
            self.server_process.wait(timeout=5)
        finally:
            self.server_process = None

    def start_browser(self) -> None:
        if self.playwright is not None:
            return

        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)

    def stop_browser(self) -> None:
        if self.context is not None:
            self.context.close()
            self.context = None
            self.page = None
        if self.browser is not None:
            self.browser.close()
            self.browser = None
        if self.playwright is not None:
            self.playwright.stop()
            self.playwright = None

    def new_page(self) -> Page:
        if self.browser is None:
            raise RuntimeError("Browser has not been started")

        if self.context is not None:
            self.context.close()

        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        return self.page

    def clean_up(self) -> None:
        self.stop_browser()
        self.stop_server()


world = TutorialWorld()


def before_all(context) -> None:  # noqa: D401 - behave hook
    """Boot Next.js dev server and Playwright browser before scenarios."""

    world.base_url = DEFAULT_BASE_URL
    world.start_server()
    world.start_browser()
    context.tutorial_world = world


def after_all(context) -> None:  # noqa: D401 - behave hook
    """Shutdown browser and dev server after tests complete."""

    world.clean_up()


def after_scenario(context, scenario) -> None:  # noqa: D401 - behave hook
    """Reset browsing context between scenarios to avoid state leakage."""

    if context.tutorial_world.context is not None:
        context.tutorial_world.context.close()
        context.tutorial_world.context = None
        context.tutorial_world.page = None
