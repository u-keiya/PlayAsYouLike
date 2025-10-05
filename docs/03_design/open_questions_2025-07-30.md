# 2025-07-30 詳細設計レビュー・整合性チェックまとめ

## 1. 主要な設計決定（ADR-0004反映）

- **リプレイAPI**: `/replay/{id}` のレスポンスに `beatmapSeed: string` を追加し、同一譜面再現を保証
- **Session State統合**: `PATCH /sessions/{id}/state` で `state: running|paused|ended` を一元管理。RESTで更新、WebSocketでPush
- **曲解析方針**: MVPでは「プレイ開始前」に全曲解析(≤300秒)を完了し、Beatmap生成・初期FXプリセット決定まで保証。リアルタイム追跡は将来拡張
- **用語統一**: Beatmapを正式用語とし、ScoreSheet等は全てBeatmapへ統一
- **基調色API**: `/effects/presets/select` の `presetId` に `color-<hex>` 形式を許可し、Preset拡張で基調色適用
- **エラーカタログ**: `BEATMAP_SEED_NOT_FOUND`, `INVALID_SESSION_STATE` を追加

## 2. 不足している詳細設計成果物リスト

- `diagrams/class/seed_management.puml` — BeatmapSeedRepository, ReplayService
- `diagrams/sequence/replay_same_seed.puml`
- `diagrams/class/session_state.puml` — Session, SessionState enum
- `diagrams/sequence/section_fx_switch.puml`
- `diagrams/sequence/color_personalize.puml`
- `api/openapi.yaml` 改訂（ReplayData・state統合）
- `api/error_catalog.md` 追記

## 3. 今後の設計タスク

- 上記成果物の新規作成・既存設計への反映
- 用語統一の徹底（Beatmap/ScoreSheet混在箇所の修正）
- ADR-0004の内容を各設計成果物に反映

---

## 参考: 主要な議論・決定の経緯

- リプレイ時のSeed返却要否 → 必須（PO指示）
- SessionStateはREST/WS統合が望ましい（PO指示）
- 曲途中セクション解析はMVPでは事前解析のみ、将来リアルタイム補完
- 基調色APIはPreset拡張で十分、専用エンドポイント不要
- 用語はBeatmapで統一
