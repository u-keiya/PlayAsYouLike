@US-002 @issue-13
Feature: URL メタデータ取得シナリオ
  YouTube URL を入力したプレイヤーとして
  素早くタイトルと長さを確認し Play ボタンで譜面生成に進みたい
  なぜなら意図した楽曲で即プレイ体験を開始したいからだ

  Background:
    Given アプリが起動している

  Scenario: URL 入力後にメタデータ取得が成功する
    Given メタデータ API が成功レスポンスを返す
    When URL "https://www.youtube.com/watch?v=dQw4w9WgXcQ" を入力して Fetch を押す
    Then メタデータのタイトルに "Never Gonna Give You Up" が表示される
    And メタデータの長さに "3:33" が表示される
    And メタデータのトリミング状態に "なし" が表示される
    And Play ボタンが有効になる

  Scenario: メタデータ取得が失敗した場合にエラーメッセージを表示する
    Given メタデータ API が 503 エラーを返す
    When URL "https://www.youtube.com/watch?v=tVj0ZTS4WF4" を入力して Fetch を押す
    Then エラーメッセージ "Upstream timeout. Please try again." が表示される
    And Play ボタンが無効のまま
