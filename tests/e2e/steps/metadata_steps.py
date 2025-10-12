from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict
from urllib.parse import unquote

from behave import given, then, when
from playwright.sync_api import Page, Route, expect


@dataclass
class MetadataStub:
    status: int
    body: Dict[str, Any]
    last_request_url: str | None = None


def _install_metadata_stub(context, stub: MetadataStub) -> Page:
    page = context.tutorial_world.new_page()

    page.add_init_script(
        "window.localStorage.setItem('play-as-you-like:tutorial-seen:v1', 'true');",
    )

    def handler(route: Route) -> None:
        stub.last_request_url = route.request.url
        route.fulfill(
            status=stub.status,
            content_type="application/json",
            body=json.dumps(stub.body),
        )

    page.route("**/api/metadata?*", handler)
    page.goto(context.tutorial_world.base_url, wait_until="networkidle")

    context.page = page
    context.metadata_stub = stub
    return page


@given("メタデータ API が成功レスポンスを返す")
def given_metadata_api_success(context) -> None:
    stub = MetadataStub(
        status=200,
        body={
            "title": "Never Gonna Give You Up",
            "durationSec": 213,
            "trimmed": False,
        },
    )

    _install_metadata_stub(context, stub)


@given("メタデータ API が 503 エラーを返す")
def given_metadata_api_service_error(context) -> None:
    stub = MetadataStub(
        status=503,
        body={
            "code": "TIMEOUT",
            "message": "Upstream timeout. Please try again.",
        },
    )

    _install_metadata_stub(context, stub)


@when('URL "{target_url}" を入力して Fetch を押す')
def when_input_url_and_fetch(context, target_url: str) -> None:
    page: Page = context.page
    page.fill("#youtube-url", target_url)

    fetch_button = page.get_by_role("button", name="Fetch")
    with page.expect_response(
        lambda response: response.url.startswith(
            f"{context.tutorial_world.base_url}/api/metadata?",
        ),
    ):
        fetch_button.click()

    stub: MetadataStub = context.metadata_stub
    assert stub.last_request_url is not None, "Metadata API was not called"

    request_query = stub.last_request_url.split("?", 1)[-1]
    decoded_query = unquote(request_query)
    assert (
        target_url in decoded_query
    ), "Metadata API request did not contain expected URL query"


def _expect_metadata_row(page: Page, label: str, value: str) -> None:
    row = page.locator(".app__metadata-row").filter(
        has=page.locator("dt", has_text=label),
    )
    expect(row.locator("dd")).to_have_text(value)


@then('メタデータのタイトルに "{expected}" が表示される')
def then_metadata_title_displayed(context, expected: str) -> None:
    page: Page = context.page
    _expect_metadata_row(page, "タイトル", expected)


@then('メタデータの長さに "{expected}" が表示される')
def then_metadata_duration_displayed(context, expected: str) -> None:
    page: Page = context.page
    _expect_metadata_row(page, "長さ", expected)


@then('メタデータのトリミング状態に "{expected}" が表示される')
def then_metadata_trimmed_displayed(context, expected: str) -> None:
    page: Page = context.page
    _expect_metadata_row(page, "トリミング", expected)


@then("Play ボタンが有効になる")
def then_play_button_enabled(context) -> None:
    page: Page = context.page
    play_button = page.get_by_role("button", name="Play")
    expect(play_button).to_be_enabled()


@then("エラーメッセージ \"{message}\" が表示される")
def then_error_message_displayed(context, message: str) -> None:
    page: Page = context.page
    error = page.locator(".app__error")
    expect(error).to_have_text(message)


@then("Play ボタンが無効のまま")
def then_play_button_disabled(context) -> None:
    page: Page = context.page
    play_button = page.get_by_role("button", name="Play")
    expect(play_button).to_be_disabled()
