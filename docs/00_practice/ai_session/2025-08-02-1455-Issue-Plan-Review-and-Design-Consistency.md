## Summary
設計(ADR-0001〜0005, OpenAPI, 図)と `docs/04_dev/issues.md` の実装プラン整合性をレビューし、粒度・依存関係・スキーマ整合の観点で不備を特定。主要な指摘はフロントの大型Issueの分割不足、EffectPreset Push(WebSocket)実装タスクの欠落、/metadata レスポンススキーマ名の不整合。修正提案と新規Issue案、Open Questionsを `docs/04_dev/tmp.md` に記録した。

### User Requirement
- US-001: URL貼付け〜即プレイ(≤300秒)、初回チュートリアル
- US-002: URLメタ取得(≤3秒)
- US-003: ランダム譜面生成＋同一Seedでリプレイ
- US-004: ポーズ/リジューム/終了(状態遷移は統合API)
- US-005: 曲調に応じた動的演出、EffectPreset Push契約
- US-006: 基調色選択・適用

### Key Decisions
- ADR-0001 Baseline構成(FE: React/TS, BE: Fastify, 解析MS: Python+librosa, Redis)
- ADR-0002 メッセージ基盤は Kafka
- ADR-0003 外部ストリーミング連携は gRPC
- ADR-0004 BeatmapSeedリプレイ保証、SessionState統合API、PresetId color-HEX 許容
- ADR-0005 EffectPresetMessage のWebSocket Push スキーマをOpenAPIに定義

### Action Items
- [ ] issues.mdの修正案反映(PO/IP) (Issue # to create)
- [ ] 新規: feat(backend): EffectPreset Push WebSocket サーバ実装追加 (US-005/006) (IP)
- [ ] 新規: test(contract): EffectPresetMessage schema validation 追加 (TE)
- [ ] 分割: feat(frontend): Play開始&譜面描画 → API呼び出し/seed保存 と 描画&判定に分割 (FE)
- [ ] 修正: /metadata レスポンススキーマ表記を UrlMetadata に統一 (DD)
- [ ] 依存整理: gRPCクライアント生成(#10)はFrontend側実装依存のみへ (IP)
- [ ] Kafka publish/consumerのContract/統合テスト強化 (BE/TE)

### References
- USDM: US-001〜006
- ADR: 0001, 0002, 0003, 0004, 0005
- OpenAPI: [`docs/03_design/api/openapi.yaml`](docs/03_design/api/openapi.yaml)
- Review diff/notes: [`docs/04_dev/tmp.md`](docs/04_dev/tmp.md)