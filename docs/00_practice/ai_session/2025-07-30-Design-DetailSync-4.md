## Summary
PR #7 のレビューコメント（CodeRabbit）に基づき、設計・API・図面の不整合/不足点を一括是正。曲解析300秒上限の根拠明記、PresetId の正規表現パターン導入、OpenAPI に Bearer/JWT のグローバルセキュリティ枠組み、セッション状態遷移の条件付きバリデーション、PlantUML 図の構文・分岐修正などを実施し、USDM 要件と ADR の整合を強化。

### Key Decisions
- 曲解析の上限300秒の根拠を ADR に追記（一般的な曲長分布・最悪ケース解析・UX上限）（[docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)）
- 基調色適用 API の PresetId を `^color-([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$` に統一し、命名衝突回避ルールを ADR と OpenAPI に明記（[docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md), [docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)）
- OpenAPI にグローバル認証定義（Bearer/JWT）と `security` を追加（[docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)）
- PATCH /sessions/{id}/state の RequestBody を oneOf で分岐（`state=paused` の場合のみ `pausedAt` を必須）（[docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)）
- クラス図の重複関連（GameSession→Track）削除と実装詳細の note 退避（[docs/03_design/diagrams/class/core_domain.puml](docs/03_design/diagrams/class/core_domain.puml)）
- インフラ図で gRPC の参照 ADR を修正し、RetryHandler スタブを追加（[docs/03_design/diagrams/class/infrastructure.puml](docs/03_design/diagrams/class/infrastructure.puml)）
- VisualEffects 図の名称 typo 修正、presets 上限 0..10 と根拠の note 追加（[docs/03_design/diagrams/class/visual_effects.puml](docs/03_design/diagrams/class/visual_effects.puml)）
- Sequence 図の修正（failover の alt/else/end、pause_resume のタイムアウト分岐強化、replay_same_seed の ID 統一、replay の alt に else 追加、section_fx_switch の `...` をコメント化、color_personalize のエラーパス追加）
  - [docs/03_design/diagrams/sequence/failover.puml](docs/03_design/diagrams/sequence/failover.puml)
  - [docs/03_design/diagrams/sequence/pause_resume.puml](docs/03_design/diagrams/sequence/pause_resume.puml)
  - [docs/03_design/diagrams/sequence/replay_same_seed.puml](docs/03_design/diagrams/sequence/replay_same_seed.puml)
  - [docs/03_design/diagrams/sequence/replay.puml](docs/03_design/diagrams/sequence/replay.puml)
  - [docs/03_design/diagrams/sequence/section_fx_switch.puml](docs/03_design/diagrams/sequence/section_fx_switch.puml)
  - [docs/03_design/diagrams/sequence/color_personalize.puml](docs/03_design/diagrams/sequence/color_personalize.puml)

### Action Items
- [ ] OpenAPI のグローバル認証定義周りのスキーマ重複キー/未設定パラメータの Lint 警告解消（yaml構造精査）（Issue: API/Schema, 担当: DD）
- [ ] エラーカタログ（`error_catalog.md`）へ `BEATMAP_SEED_NOT_FOUND`, `INVALID_SESSION_STATE` を追加（Issue: Docs, 担当: SA/DD）
- [ ] API 契約の変更に伴う契約テスト補強（JWT 必須化、state 分岐）（tests/contract/*）（Issue: TE）
- [ ] フロント側の `presetId: color-<hex>` バリデーション同期（UI/送信前チェック）（Issue: FE）

### References
- USDM: US-001, US-002, US-003, US-004, US-005, US-006
- ADR: [0004](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md), [0002](docs/03_design/adr/0002-message-broker-kafka.md), [0003](docs/03_design/adr/0003-external-streaming-grpc.md)
- API: [openapi.yaml](docs/03_design/api/openapi.yaml)
- PR: #7