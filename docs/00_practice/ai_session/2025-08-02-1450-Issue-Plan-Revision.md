## Summary
実装プラン (docs/04_dev/issues.md) を設計/USDM/ADR と突き合わせ、粒度調整・依存関係修正・設計整合・抜け漏れ補完・ラベル/見積り統一を実施。/sessions への統合（ADR-0004）や EffectPresetMessage スキーマ（ADR-0005）に合わせ、フロント/バック/FX/CI/Schema/Spike/Risk を 2日未満のタスクに分解し、Redis フェイルオーバー・Kafka トピック・gRPC クライアント生成・追加コントラクトテストなどの不足を追補。結果、実装可能性とトレーサビリティが改善された。

### User Requirement
- US-001: 初回チュートリアル表示とヘルプ再表示
- US-002: URL メタ取得 ≤3s
- US-003: 譜面生成 ≤300s、同一シードでリプレイ
- US-004: Pause/Resume/End の一元管理（REST/WS）
- US-005: 動的演出・プリセット切替
- US-006: 基調色選択と適用

### Key Decisions
- ADR-0004に従い譜面生成は POST /sessions へ統合（`/api/generate` は不採用）
- WebSocket `/ws/hit-judge` の命名統一（openapi.yaml と整合）
- EffectPresetMessage は OpenAPI components/schemas でプリセット別 oneOf/discriminator、schemaVersion 採用（ADR-0005）
- Redis フェイルオーバーは RetryHandler により実装（sequence/failover.puml）
- Kafka topic `session.state` を発行（ADR-0002、状態変更の追跡用）

### Action Items
- [x] docs/04_dev/issues.md の修正（粒度・依存関係・設計整合・不足追補）
- [ ] 追加タスクの実装（代表）
  - [ ] POST /sessions ルート（US-003）と BeatmapGenerator 実装分割（Backend, 2pt/3pt）
  - [ ] SeedRepository/ReplayService 実装（Backend, 2pt）
  - [ ] gRPC proto → TS クライアント生成（Microservice/Frontend, 2pt）
  - [ ] Redis フェイルオーバー（NF-01、Backend/Infra, 2pt）
  - [ ] /sessions/{id}/state, /effects/presets/select コントラクトテスト追加（Test, 2pt）
  - [ ] Kafka Topic 定義 & consumer stub（Backend/Infra, 3pt）
  - [ ] FX: gRPC 受信ハンドラとプリセット切替ロジック分割（Frontend/FX, 各2pt）
- [ ] CI 分割（integration/e2e）と起動スクリプト整備（CI/Infra, 各2pt）
- [ ] openapi.yaml, error_catalog.md, ADR-0005 の同期更新（Docs, 2pt）

### References
- USDM: US-001〜US-006
- ADR: 
  - (docs/03_design/adr/0001-architecture-baseline.md)
  - (docs/03_design/adr/0002-message-broker-kafka.md)
  - (docs/03_design/adr/0003-external-streaming-grpc.md)
  - (docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
  - (docs/03_design/adr/0005-effect-preset-message-schema.md)
- API: (docs/03_design/api/openapi.yaml)
- エラーカタログ: (docs/03_design/api/error_catalog.md)
- 図: 
  - C4: (docs/03_design/diagrams/c4/context.puml), (docs/03_design/diagrams/c4/container.puml)
  - クラス: (docs/03_design/diagrams/class/seed_management.puml), (docs/03_design/diagrams/class/session_state.puml), (docs/03_design/diagrams/class/visual_effects.puml)
  - シーケンス: (docs/03_design/diagrams/sequence/play_start.puml), (docs/03_design/diagrams/sequence/pause_resume.puml), (docs/03_design/diagrams/sequence/replay_same_seed.puml), (docs/03_design/diagrams/sequence/dynamic_fx.puml), (docs/03_design/diagrams/sequence/failover.puml), (docs/03_design/diagrams/sequence/hit_judge_ws.puml), (docs/03_design/diagrams/sequence/url_fetch.puml)
- 実装プラン: (docs/04_dev/issues.md)