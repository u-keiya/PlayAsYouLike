# 2025-08-02 Design Detail Sync 2

## Summary
USDM（US-001〜006）と C4/ADR を突合し、詳細設計の不足と不整合を解消。重要決定を ADR-0004 に記録し、OpenAPI・図面・用語集・既存 ADR に反映。結果として Beatmap Seed リプレイ保証、Session State 統合 API、基調色適用方針、曲解析は事前解析必須（≤300s）＋リアルタイム補完は将来拡張、という方針で設計一貫性を確立。

### Key Decisions
- リプレイで同一 Beatmap 再現: `/replay/{id}` 応答で `ReplayData`（`beatmapSeed` 含む）を返却（[`ADR-0004`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)）
- セッション状態統合: `PATCH /sessions/{id}/state` に `state: running|paused|ended`、更新は REST、通知は WS Push
- 曲解析方針: プレイ開始前の全曲事前解析を必須（≤300s）。リアルタイム追跡（SectionChange）は将来拡張（Feature Flag）
- 基調色: `/effects/presets/select` の `presetId` で `color-<hex>` を許容。専用 API は追加しない
- 用語統一: Beatmap を正式採用（ScoreSheet は deprecated）
- エラーコード拡充: `BEATMAP_SEED_NOT_FOUND`, `INVALID_SESSION_STATE`

### Action Items
- [x] 新規 ADR: [`docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
- [x] OpenAPI 変更（要 Lint 確認）
  - [x] `PATCH /sessions/{id}/state` 追加（REST 更新＋WS Push 前提）
  - [x] `/effects/presets/select` の `presetId` に `^([A-Za-z0-9_-]+|color-[0-9A-Fa-f]{6})$`
  - [x] `/replay/{id}` → `ReplayData` 参照（`beatmapSeed` を含む）
  - [ ] Lint 修正（required の重複、`$ref` 解決）
- [x] Error Catalog 更新（`BEATMAP_SEED_NOT_FOUND`, `INVALID_SESSION_STATE`）
- [x] クラス図（新規）
  - [`class/seed_management.puml`](docs/03_design/diagrams/class/seed_management.puml)
  - [`class/session_state.puml`](docs/03_design/diagrams/class/session_state.puml)
- [x] シーケンス図（新規）
  - [`sequence/replay_same_seed.puml`](docs/03_design/diagrams/sequence/replay_same_seed.puml)
  - [`sequence/section_fx_switch.puml`](docs/03_design/diagrams/sequence/section_fx_switch.puml)
  - [`sequence/color_personalize.puml`](docs/03_design/diagrams/sequence/color_personalize.puml)
- [x] 既存 ADR 追記
  - [`ADR-0002`](docs/03_design/adr/0002-message-broker-kafka.md): seed-events トピック活用
  - [`ADR-0003`](docs/03_design/adr/0003-external-streaming-grpc.md): SectionChange を gRPC 双方向ストリーム配信
- [x] 用語集更新: [`glossary.yaml`](docs/02_requirements/glossary.yaml) に Beatmap 正式化／ScoreSheet 非推奨
- [ ] C4 注記に ADR-0004 の参照を追加（context/container）
- [ ] 図ビルドの CI チェック（PlantUML）、OpenAPI Lint 修正

### References
- USDM: [`US-001`](docs/02_requirements/usdm/US-001.yaml), [`US-002`](docs/02_requirements/usdm/US-002.yaml), [`US-003`](docs/02_requirements/usdm/US-003.yaml), [`US-004`](docs/02_requirements/usdm/US-004.yaml), [`US-005`](docs/02_requirements/usdm/US-005.yaml), [`US-006`](docs/02_requirements/usdm/US-006.yaml)
- ADR: [`0001`](docs/03_design/adr/0001-architecture-baseline.md), [`0002`](docs/03_design/adr/0002-message-broker-kafka.md), [`0003`](docs/03_design/adr/0003-external-streaming-grpc.md), [`0004`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
- API: [`openapi.yaml`](docs/03_design/api/openapi.yaml), [`error_catalog.md`](docs/03_design/api/error_catalog.md)
- 図面: C4 [`context`](docs/03_design/diagrams/c4/context.puml), [`container`](docs/03_design/diagrams/c4/container.puml); クラス図 [`core_domain`](docs/03_design/diagrams/class/core_domain.puml), [`infrastructure`](docs/03_design/diagrams/class/infrastructure.puml), [`seed_management`](docs/03_design/diagrams/class/seed_management.puml), [`session_state`](docs/03_design/diagrams/class/session_state.puml), [`visual_effects`](docs/03_design/diagrams/class/visual_effects.puml); シーケンス図 [`replay`](docs/03_design/diagrams/sequence/replay.puml), [`replay_same_seed`](docs/03_design/diagrams/sequence/replay_same_seed.puml), [`section_fx_switch`](docs/03_design/diagrams/sequence/section_fx_switch.puml), [`color_personalize`](docs/03_design/diagrams/sequence/color_personalize.puml)
