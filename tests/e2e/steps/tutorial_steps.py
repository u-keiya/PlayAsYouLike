from __future__ import annotations

from behave import given, then, when
from playwright.sync_api import Page, expect


@given("アプリが起動している")
def given_app_is_running(context) -> None:
    assert context.tutorial_world.server_process is not None, "Next.js dev server failed to start"


@when("チュートリアル状態を持たない訪問者としてトップページを開く")
def when_open_landing_page_first_time(context) -> None:
    page = context.tutorial_world.new_page()
    page.goto(context.tutorial_world.base_url, wait_until="networkidle")
    context.page = page


@then("チュートリアルモーダルが表示されている")
def then_tutorial_modal_visible(context) -> None:
    page: Page = context.page
    modal = page.get_by_role("dialog", name="Play As You Like チュートリアル")
    expect(modal).to_be_visible()


@when("チュートリアルの理解しましたボタンを押す")
def when_acknowledge_tutorial(context) -> None:
    page: Page = context.page
    page.get_by_role("button", name="理解しました").click()


@then("チュートリアルモーダルが閉じられローカルストレージに既読が保存される")
def then_modal_closed_and_persisted(context) -> None:
    page: Page = context.page
    modal = page.get_by_role("dialog", name="Play As You Like チュートリアル")
    expect(modal).not_to_be_visible()

    storage_value = page.evaluate(
        "window.localStorage.getItem('play-as-you-like:tutorial-seen:v1')",
    )
    assert storage_value == "true", "Tutorial acknowledgement not persisted"


@when("ヘルプボタンを押す")
def when_open_help_again(context) -> None:
    page: Page = context.page
    page.get_by_role("button", name="ヘルプ").click()


@then("チュートリアルモーダルが再表示される")
def then_modal_visible_again(context) -> None:
    page: Page = context.page
    modal = page.get_by_role("dialog", name="Play As You Like チュートリアル")
    expect(modal).to_be_visible()
