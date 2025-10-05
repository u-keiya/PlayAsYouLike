# 2025-07-30 Design Detail Sync #3

## Summary
US-001〜US-006 の要求に対し、詳細設計（API/クラス/シーケンス図）と仕様の整合性を精査・補完。ADR-0004 方針（beatmapSeed による同一譜面リプレイ、Session State の一元管理）を API/図へ反映。OpenAPI を v1.0.0 として stable マークし、実装フェーズ移行のボトルネックを除去。

### Key Decisions
- /replay/{id} レスポンスへ beatmapSeed を追加（同一譜面再現の契約化）(ADR: [`0004-beatmap-seed-replay-and-session-state`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md))
- Session 状態遷移を PATCH `/sessions/{id}/state` に集約し、WS push を伴う統合仕様に確定（state: running|paused|ended, pausedAt, colorHex）
- エフェクトプリセット選択 API POST `/effects/presets/select` を確定（presetId with color-XXXXXX, colorHex, bpm）
- OpenAPI を v1.0.0/stable として凍結（後方互換ポリシー: 破壊的変更は 1.1.0+）
- エラーカタログに BEATMAP_SEED_NOT_FOUND / INVALID_SESSION_STATE を追加

### Action Items
- [x] openapi.yaml 更新（/replay, /effects/presets/select, /sessions/{id}/state, WebSocket event schema）(DD)
- [x] error_catalog.md 追記（BEATMAP_SEED_NOT_FOUND, INVALID_SESSION_STATE）(DD)
- [x] シーケンス: section_fx_switch に Actor/制約注記、color_personalize の API 注記更新、pause_resume/url_fetch へ SLA 制約注記 (DD)
- [x] クラス: seed_management に BeatmapSeedRepository#getLatest 追加、session_state に SessionStateMachine/transition() 追加 (DD)
- [x] OpenAPI info.version を 1.0.0、x-release-status: stable に設定 (DD)
- [ ] tests/contract/* の最新契約に追随（既存スイートの確認・不足追加）(TE)

### References
- USDM: [`US-001`](docs/02_requirements/usdm/US-001.yaml), [`US-002`](docs/02_requirements/usdm/US-002.yaml), [`US-003`](docs/02_requirements/usdm/US-003.yaml), [`US-004`](docs/02_requirements/usdm/US-004.yaml), [`US-005`](docs/02_requirements/usdm/US-005.yaml), [`US-006`](docs/02_requirements/usdm/US-006.yaml)
- ADR: [`0004-beatmap-seed-replay-and-session-state`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
- API: [`openapi.yaml`](docs/03_design/api/openapi.yaml), [`error_catalog.md`](docs/03_design/api/error_catalog.md)
- 図: C4 [`container`](docs/03_design/diagrams/c4/container.puml), クラス [`seed_management`](docs/03_design/diagrams/class/seed_management.puml), [`session_state`](docs/03_design/diagrams/class/session_state.puml), 演出 [`visual_effects`](docs/03_design/diagrams/class/visual_effects.puml)
- シーケンス: [`replay`](docs/03_design/diagrams/sequence/replay.puml), [`replay_same_seed`](docs/03_design/diagrams/sequence/replay_same_seed.puml), [`pause_resume`](docs/03_design/diagrams/sequence/pause_resume.puml), [`url_fetch`](docs/03_design/diagrams/sequence/url_fetch.puml), [`section_fx_switch`](docs/03_design/diagrams/sequence/section_fx_switch.puml), [`color_personalize`](docs/03_design/diagrams/sequence/color_personalize.puml), [`dynamic_fx`](docs/03_design/diagrams/sequence/dynamic_fx.puml)

---

## Detail Log (Trace)
- 要求レビュー: US-001〜006 の AC を確認（URL メタ/トリミング、300s/3s SLA、リプレイ同一譜面、ポーズ/リジューム、動的演出、基調色）
- 整合性チェック:
  - 図/ADR ↔ API の齟齬（beatmapSeed 未返却、state 統合不足、preset 選択の契約不足）を特定
  - 影響範囲: Session Lifecycle, Replay, Effects, WS push
- 修正:
  - OpenAPI
    - /replay/{id} に beatmapSeed, beatmap, score/accuracy, colorHex, createdAt を定義
    - /sessions/{id}/state に pausedAt, colorHex を定義、422 エラー整備
    - components.schemas に SessionStateChangedEvent 追加
    - /effects/presets/select に bpm, colorHex を追加
    - info.version=1.0.0, x-release-status=stable を付与
  - Error Catalog: BEATMAP_SEED_NOT_FOUND, INVALID_SESSION_STATE を追記
  - 図: seed_management に getLatest(userId,url)、session_state に StateMachine、sequence に SLA/注記の追記
- 結論: 後方互換ポリシーの下、v1.0.0 の API は安定と判断。実装開始可能。
