## Summary
USDM US-001〜US-006と設計（C4 Container）に基づき、実装プランをIssueレベルまで具体化。フロント/バック/音声解析MS/FXの分担、API契約、E2E/契約テスト、CI整備、技術スパイク（WASM vs gRPC、WebGPU性能）を含む。各タスクは≈2理想日以下で分割し、依存関係を明示。

### User Requirement
- US-001: ブラウザで即時リズム体験（300秒内譜面生成、ワンキー判定、15分以内結果表示）
- US-002: URLからメタ情報取得・検証（3秒以内、無効URLエラー、10分超カット警告）
- US-003: ランダム譜面生成と連続リプレイ同一譜面（シード保持/再利用）
- US-004: ポーズ/リジューム/終了（同期ズレ補正、複数回可）
- US-005: 曲調連動の動的演出（BPM/エネルギー/セクション等→プリセット切替、1秒内）
- US-006: 基調色選択パーソナライズ（未選択時は推奨色、自動適用、リプレイ時も同色）

### Key Decisions
- タスク分割はIssue駆動、各タスクは≤2理想日、依存を明示（C4設計準拠） ([`docs/03_design/diagrams/c4/container.puml`](docs/03_design/diagrams/c4/container.puml:11))
- 音声解析はgRPCマイクロサービスを基本路線、ブラウザWASMはフォールバック候補（Spikeで比較） ([`docs/03_design/adr/0003-external-streaming-grpc.md`](docs/03_design/adr/0003-external-streaming-grpc.md))
- 譜面のシード保持とセッションはRedis TTLで管理、15分の一時データ ([`docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md))
- FXプリセットはJSON定義で拡張可能、基調色（US-006）と合成 ([`docs/03_design/adr/0005-effect-preset-message-schema.md`](docs/03_design/adr/0005-effect-preset-message-schema.md))

### Action Items
- [ ] feat(frontend): URL入力フォームとメタデータ取得 (US-002) — Issue起票
- [ ] feat(backend): メタデータ取得 API `/api/metadata` (US-002) — Issue起票
- [ ] feat(backend): 譜面シード生成 API `/api/generate` (US-003) — Issue起票
- [ ] feat(audio-svc): BPM/Energy gRPCサービス (US-005) — Issue起票
- [ ] spike: WASM vs gRPC 解析速度比較 (US-005) — Issue起票
- [ ] feat(frontend): Play開始 & ランダム譜面描画 (US-003) — Issue起票
- [ ] feat(frontend): Replay 同一シード (US-003) — Issue起票
- [ ] feat(frontend): Pause/Resume/Quit UI (US-004) — Issue起票
- [ ] feat(fx-engine): 基調色選択 UI & 適用 (US-006) — Issue起票
- [ ] feat(fx-engine): 曲調連動演出プリセット (US-005) — Issue起票
- [ ] test(contract): metadata/generate の契約テスト拡充 — Issue起票
- [ ] docs: openapi.yaml 更新 & error_catalog 追補 — Issue起票
- [ ] risk: YouTube API クオータ・著作権確認 — Issue起票
- [ ] spike: WebGPU 性能 & fallback Three.js — Issue起票
- [ ] ci: integration & e2e パイプライン追加 — Issue起票
- [ ] feat(backend): セッション状態管理 & Redis TTL (US-004) — Issue起票
- [ ] feat(frontend): WebSocket ヒット判定送受 (stub) — Issue起票
- [ ] feat(test): US-005 動的演出 E2E — Issue起票
- [ ] refactor/docs: coding_guidelines に実装例追記 — Issue起票

### References
- USDM: US-001〜US-006 ([`docs/02_requirements/usdm/US-001.yaml`](docs/02_requirements/usdm/US-001.yaml), [`docs/02_requirements/usdm/US-002.yaml`](docs/02_requirements/usdm/US-002.yaml), [`docs/02_requirements/usdm/US-003.yaml`](docs/02_requirements/usdm/US-003.yaml), [`docs/02_requirements/usdm/US-004.yaml`](docs/02_requirements/usdm/US-004.yaml), [`docs/02_requirements/usdm/US-005.yaml`](docs/02_requirements/usdm/US-005.yaml), [`docs/02_requirements/usdm/US-006.yaml`](docs/02_requirements/usdm/US-006.yaml))
- C4 Container: [`docs/03_design/diagrams/c4/container.puml`](docs/03_design/diagrams/c4/container.puml:11)
- ADR: 0003/0004/0005（gRPC/シード/エフェクトプリセット）
- OpenAPI: [`docs/03_design/api/openapi.yaml`](docs/03_design/api/openapi.yaml)

---

## Issue Drafts

---issue
{
  "title": "feat(frontend): URL入力フォームとメタデータ取得 (US-002)",
  "body": "## Background\\nUSDM: US-002\\n\\n## Goal\\nトップページに YouTube URL 入力フォームを実装し、ユーザが入力した URL から動画タイトル・長さを 3 秒以内に表示する。\\n\\n## Acceptance Criteria\\n- [ ] 入力フォームと Fetch ボタンを実装\\n- [ ] API `/api/metadata?url=` へリクエストしタイトル・長さを取得\\n- [ ] 成功時: 3 秒以内にメタデータを表示し Play ボタンを有効化\\n- [ ] 失敗時: エラーメッセージ表示し Play ボタンは無効\\n\\n## Related Docs\\n- [`docs/03_design/api/openapi.yaml`](docs/03_design/api/openapi.yaml)",
  "labels": ["frontend", "3pt", "US-002"],
  "depends_on": []
}
---issue
{
  "title": "feat(backend): メタデータ取得 API `/metadata` 実装 (US-002)",
  "body": "## Background\\nUSDM: US-002\\n\\n## Goal\\nYouTube URL からタイトル・長さを取得し返すエンドポイント `/api/metadata` を実装。\\n\\n## Acceptance Criteria\\n- [ ] Fastify ルート `/api/metadata` を追加\\n- [ ] 入力 URL バリデーション\\n- [ ] YouTube oEmbed or Data API v3 でメタデータ取得\\n- [ ] 返却 JSON: { title, durationSec }\\n- [ ] 3 秒以内レスポンス（外部 API キャッシュ考慮）\\n- [ ] 契約テスト `tests/contract/test_api_contract.py` がパス",
  "labels": ["backend", "3pt", "US-002"],
  "depends_on": ["#1"]
}
---issue
{
  "title": "feat(backend): 譜面シード生成 API `/generate` 実装 (US-003)",
  "body": "## Background\\nUSDM: US-003\\n\\n## Goal\\nURL とランダムシードを受け取り譜面データを生成し返すエンドポイントを実装。\\n\\n## Acceptance Criteria\\n- [ ] Fastify ルート `/api/generate` (POST)\\n- [ ] リクエスト: { url, seed? }\\n- [ ] seed 指定なし→新規 randomUint32\\n- [ ] Redis に seed と一時セッション保存 (TTL 15m)\\n- [ ] レスポンス: { seed, notes[] }\\n- [ ] 300 秒以内に譜面生成完了\\n- [ ] 契約テスト追加・パス",
  "labels": ["backend", "5pt", "US-003"],
  "depends_on": ["#2"]
}
---issue
{
  "title": "feat(audio-svc): BPM & Energy gRPC サービス実装 (US-005)",
  "body": "## Background\\nUSDM: US-005, ADR-0003\\n\\n## Goal\\nPython + librosa で音声解析し BPM・エネルギー量を返す gRPC サービスを作成。\\n\\n## Acceptance Criteria\\n- [ ] Proto 定義 `audio_analysis.proto` 追加\\n- [ ] サーバ実装 (Python, grpcio)\\n- [ ] CI 上でユニットテスト通過\\n- [ ] ドキュメント更新",
  "labels": ["microservice", "5pt", "US-005"],
  "depends_on": []
}
---issue
{
  "title": "spike: WebAssembly vs gRPC 音声解析速度比較",
  "body": "## Background\\nUS-005 のリアルタイム解析要件を満たす構成を検証。\\n\\n## Tasks\\n- [ ] wasm-librosa (emscripten) ブラウザ実行\\n- [ ] 同曲で gRPC audio-svc と処理時間計測 (BPM, RMS)\\n- [ ] 50 サンプルで平均/分散取得\\n- [ ] 結論: 採用構成 & フォローアップ Issue 提出",
  "labels": ["spike", "US-005"],
  "depends_on": ["#4"]
}
---issue
{
  "title": "feat(frontend): Play 開始 & ランダム譜面描画 (US-003)",
  "body": "## Background\\nUSDM: US-003\\n\\n## Goal\\nPlay 押下で `/generate` 呼び出し→譜面を Canvas/WebGL に描画、ワンキー判定を実装。\\n\\n## Acceptance Criteria\\n- [ ] `/api/generate` 呼び出し & seed 保存\\n- [ ] ノート描画 (Canvas/WebGL)\\n- [ ] キー入力で hit/miss/late 判定\\n- [ ] リザルト画面へスコア伝搬\\n- [ ] ユニットテスト & E2E US-003 Pass",
  "labels": ["frontend", "5pt", "US-003"],
  "depends_on": ["#3"]
}
---issue
{
  "title": "feat(frontend): Replay 機能 (同一シード) (US-003)",
  "body": "## Background\\nUSDM: US-003 リプレイ同一譜面\\n\\n## Goal\\nリザルト画面の Replay ボタンで前回 seed を再利用し同一譜面で再プレイ。\\n\\n## Acceptance Criteria\\n- [ ] seed を localStorage/state に保持\\n- [ ] `/generate` に seed 指定で譜面取得\\n- [ ] E2E US-003 連続リプレイ Pass",
  "labels": ["frontend", "3pt", "US-003"],
  "depends_on": ["#6"]
}
---issue
{
  "title": "feat(frontend): Pause / Resume / Quit UI (US-004)",
  "body": "## Background\\nUSDM: US-004\\n\\n## Goal\\nプレイ中にポーズメニュー表示・再開・終了が可能な UI を実装。\\n\\n## Acceptance Criteria\\n- [ ] \"P\" キーで Pause 表示 & 再生停止\\n- [ ] Resume で 3 秒カウントダウン後再開\\n- [ ] Quit でトップへ遷移\\n- [ ] 内部タイマー同期ズレなし\\n- [ ] E2E US-004 Pass",
  "labels": ["frontend", "3pt", "US-004"],
  "depends_on": ["#6"]
}
---issue
{
  "title": "feat(fx-engine): 基調色選択 UI & 適用 (US-006)",
  "body": "## Background\\nUSDM: US-006\\n\\n## Goal\\nカラーサークル UI で基調色を選択し、プレイ画面の背景/UI 主色へ適用。\\n\\n## Acceptance Criteria\\n- [ ] カラーサークルコンポーネント実装\\n- [ ] 選択色を FX Engine に渡す\\n- [ ] デフォルト時はサーバ解析推奨色\\n- [ ] Replay 時も同色再適用\\n- [ ] E2E US-006 Pass",
  "labels": ["frontend", "fx", "3pt", "US-006"],
  "depends_on": ["#6"]
}
---issue
{
  "title": "feat(fx-engine): 曲調連動演出プリセット実装 (US-005)",
  "body": "## Background\\nUSDM: US-005\\n\\n## Goal\\nBPM/エネルギー指標に応じて演出プリセットを自動切替。\\n\\n## Acceptance Criteria\\n- [ ] バラード/アップテンポ プリセット JSON 定義\\n- [ ] audio-svc データを受信し 1 秒以内に遷移\\n- [ ] セクション変化対応\\n- [ ] 基調色 (US-006) と合成し彩度/輝度調整",
  "labels": ["fx", "5pt", "US-005"],
  "depends_on": ["#4", "#9"]
}
---issue
{
  "title": "test(contract): API コントラクトテスト拡充 (metadata & generate)",
  "body": "## Background\\nAPI 安定性確保\\n\\n## Acceptance Criteria\\n- [ ] 新テストケース追加 `tests/contract/`\\n  - 無効 URL\\n  - 長尺 URL カット警告\\n  - seed 指定生成\\n- [ ] CI で実行しパス",
  "labels": ["test", "2pt"],
  "depends_on": ["#2", "#3"]
}
---issue
{
  "title": "docs: openapi.yaml 更新 (metadata, generate, error catalog)",
  "body": "## Background\\n新エンドポイント追加のドキュメント更新\\n\\n## Acceptance Criteria\\n- [ ] `/api/metadata` `/api/generate` スキーマ追加\\n- [ ] エラーカタログ HTTP422/429 追加\\n- [ ] 必要に応じ ADR 追記 Issue 起票",
  "labels": ["docs", "1pt"],
  "depends_on": ["#2", "#3"]
}
---issue
{
  "title": "risk: YouTube API クオータ・著作権確認",
  "body": "## Background\\n外部 API 依存リスク\\n\\n## Goal\\n- API キー取得とクオータ計測\\n- 著作権ポリシー適合性確認\\n- 必要ならキャッシュ/Proxy 方針立案",
  "labels": ["risk", "US-002", "medium"],
  "depends_on": []
}
---issue
{
  "title": "spike: WebGPU 描画性能 & fallback Three.js",
  "body": "## Background\\nFX Engine の描画 API 選定\\n\\n## Tasks\\n- [ ] WebGPU 対応ブラウザ割合調査\\n- [ ] 同一シーンを WebGPU と Three.js でベンチ\\n- [ ] FPS, CPU/GPU 使用率比較\\n- [ ] 結論と Issue 提出",
  "labels": ["spike", "fx"],
  "depends_on": []
}
---issue
{
  "title": "ci: integration & e2e パイプライン追加",
  "body": "## Background\\n自動テスト拡充\\n\\n## Acceptance Criteria\\n- [ ] GitHub Actions で headless browser E2E 実行\\n- [ ] integration テスト (Redis 必要) 追加\\n- [ ] README バッジ更新",
  "labels": ["ci", "infra", "3pt"],
  "depends_on": ["#6", "#7", "#8", "#10"]
}
---issue
{
  "title": "feat(backend): セッション状態管理 & Redis TTL (US-004)",
  "body": "## Background\\nポーズ・リプレイ時の状態保持\\n\\n## Acceptance Criteria\\n- [ ] Redis で {seed, positionSec, color} を TTL15m で保存\\n- [ ] `/api/session/:id` GET/PUT 実装\\n- [ ] WebSocket broadcast (optional)\\n- [ ] Integration tests pass",
  "labels": ["backend", "5pt", "US-004"],
  "depends_on": ["#3"]
}
---issue
{
  "title": "feat(frontend): WebSocket ヒット判定結果リアルタイム送信",
  "body": "## Background\\n将来マルチプレイ拡張の基盤\\n\\n## Acceptance Criteria\\n- [ ] ws://game/{sessionId} 接続実装\\n- [ ] hit イベント送信 & self-echo 受信\\n- [ ] Backend stub handler (no persistence)",
  "labels": ["frontend", "websocket", "3pt"],
  "depends_on": ["#16"]
}
---issue
{
  "title": "feat(test): US-005 動的演出 E2E シナリオ追加",
  "body": "## Background\\n動的演出の自動テスト\\n\\n## Acceptance Criteria\\n- [ ] Play 流程で BPM 変化→プリセット切替確認\\n- [ ] カラーベース演出検証 (US-006 選択色)\\n- [ ] CI headless pass",
  "labels": ["test", "e2e", "US-005"],
  "depends_on": ["#9", "#4"]
}
---issue
{
  "title": "refactor/docs: coding_guidelines.md に実装例追記",
  "body": "## Background\\n新規コンポーネント追加に合わせスタイル例を拡充",
  "labels": ["docs", "devex"],
  "depends_on": []
}

---

## Summary Table
| # | Issue Title | Label | Est | Depends |
|---|-------------|-------|-----|---------|
| 1 | URL入力フォームとメタデータ取得 | frontend | 3pt | — |
| 2 | メタデータ取得 API | backend | 3pt | #1 |
| 3 | 譜面シード生成 API | backend | 5pt | #2 |
| 4 | BPM & Energy gRPC サービス | microservice | 5pt | — |
| 5 | Spike: WASM vs gRPC 解析 | spike | — | #4 |
| 6 | Play開始 & 譜面描画 | frontend | 5pt | #3 |
| 7 | Replay 機能 | frontend | 3pt | #6 |
| 8 | Pause/Resume/Quit UI | frontend | 3pt | #6 |
| 9 | 基調色選択 UI | fx | 3pt | #6 |
|10 | 曲調連動演出プリセット | fx | 5pt | #4,#9 |
|11 | API契約テスト拡充 | test | 2pt | #2,#3 |
|12 | openapi.yaml 更新 | docs | 1pt | #2,#3 |
|13 | YouTube API クオータ確認 | risk | — | — |
|14 | Spike: WebGPU 性能 | spike | — | — |
|15 | CI: integration & E2E | ci | 3pt | #6,#7,#8,#10 |
|16 | セッション状態管理 | backend | 5pt | #3 |
|17 | WebSocket ヒット判定送信 | websocket | 3pt | #16 |
|18 | US-005 E2E 動的演出 | test | — | #9,#4 |
|19 | coding_guidelines 更新 | docs | — | — |

### Open Questions
1. YouTube Data API キーとクオータ上限は十分か。キャッシュ戦略・レート制御の方針は。
2. 譜面のシード/難易度パラメータ詳細はどの段階で凍結するか（US-003・ADR追補要否）。
3. WebSocket は現フェーズで stub とし、永続/観戦等は次フェーズへ分割でよいか。
4. 演出プリセット JSON の配置（CDN/リポジトリ内）と編集フロー（誰が・いつ）を決める。