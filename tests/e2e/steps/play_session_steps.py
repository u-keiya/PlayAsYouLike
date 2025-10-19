from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional

from behave import given, then, when
from playwright.sync_api import Page, Route, expect


@dataclass
class SessionStub:
    status: int
    body: Dict[str, Any]
    last_request_payload: Optional[Dict[str, Any]] = None


def _ensure_page(context) -> Page:
    page: Optional[Page] = getattr(context, "page", None)
    if page is None:
        raise RuntimeError(
            "Playwright page has not been initialized. Did you call the metadata stub step first?",
        )
    return page


@given("セッション開始 API が固定譜面を返す")
def given_session_api_fixed(context) -> None:
    stub = SessionStub(
        status=201,
        body={
            "sessionId": "session-fixed-123",
            "seed": 424242,
            "audioUrl": "https://cdn.playasul.local/audio/session-fixed-123",
            "effectsPreset": {
                "id": "preset-1",
                "name": "Azure Bloom",
                "baseColorHex": "#38BDF8",
            },
            "presets": [],
            "beatmap": {
                "bpm": 120,
                "energyEnvelope": [0.2, 0.4, 0.6],
                "beatTimeline": [0, 600, 1200],
                "spectralCentroidSeq": [0.32, 0.48, 0.6],
                "keyProgression": ["C", "G"],
                "segments": [
                    {
                        "label": "intro",
                        "startSec": 0,
                    },
                ],
                "notes": [
                    {"t": 600, "lane": 0},
                    {"t": 1200, "lane": 2},
                    {"t": 1800, "lane": 1},
                ],
            },
        },
    )

    page = _ensure_page(context)

    def handler(route: Route) -> None:
        payload: Dict[str, Any]
        try:
            raw = route.request.post_data or "{}"
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {}

        stub.last_request_payload = payload
        route.fulfill(
            status=stub.status,
            content_type="application/json",
            body=json.dumps(stub.body),
        )

    page.route("**/api/sessions", handler)
    context.session_stub = stub


@when("Play ボタンを押す")
def when_press_play_button(context) -> None:
    page = _ensure_page(context)
    play_button = page.get_by_role("button", name="Play")

    with page.expect_response("**/api/sessions"):
        play_button.click()

    page.wait_for_url("**/play/*", timeout=5000)


@then("プレイ画面が表示される")
def then_play_screen_visible(context) -> None:
    page = _ensure_page(context)
    canvas = page.locator(".playground__canvas")
    expect(canvas).to_be_visible()


@when("プレイを開始する")
def when_start_play(context) -> None:
    page = _ensure_page(context)
    start_button = page.get_by_role("button", name="Start Play")
    expect(start_button).to_be_enabled()
    start_button.click()
    page.wait_for_timeout(100)


@when("{delay:d}ミリ秒待ってキー入力を送る")
def when_press_after_delay(context, delay: int) -> None:
    page = _ensure_page(context)
    page.wait_for_timeout(delay)
    page.keyboard.press("Space")


@when("リザルト画面が表示されるまで待つ")
def when_wait_for_result(context) -> None:
    page = _ensure_page(context)
    page.wait_for_url("**/result/*", timeout=8000)


@then('リザルト画面でヒット数が "{expected}" と表示される')
def then_result_hit(context, expected: str) -> None:
    page = _ensure_page(context)
    expect(page.get_by_test_id("result-hit-count")).to_have_text(expected)


@then('リザルト画面でレイト数が "{expected}" と表示される')
def then_result_late(context, expected: str) -> None:
    page = _ensure_page(context)
    expect(page.get_by_test_id("result-late-count")).to_have_text(expected)


@then('リザルト画面でミス数が "{expected}" と表示される')
def then_result_miss(context, expected: str) -> None:
    page = _ensure_page(context)
    expect(page.get_by_test_id("result-miss-count")).to_have_text(expected)


@then('リザルト画面で合計スコアが "{expected}" と表示される')
def then_result_score(context, expected: str) -> None:
    page = _ensure_page(context)
    expect(page.get_by_test_id("result-score")).to_have_text(expected)
