## Summary
TE から「/ws/effectPreset で Push される effectPreset {presetId, params} のスキーマ未記載」の指摘を受け、OpenAPI へ EffectPresetMessage/EffectPresetParams を追加。sequence 図で Push フローを明示し、未確定事項は Open Questions に整理。SA 回答に基づき schemaVersion の導入、params の既定値と許容範囲、preset 固有パラメータ例を反映。意思決定は ADR-0005 に追記。

### Key Decisions
- WebSocket push を OpenAPI components/schemas で定義（EffectPresetMessage, EffectPresetParams）（docs/03_design/api/openapi.yaml）
- params は additionalProperties: true（後方互換）。共通必須は intensity(0..1), durationMs(100..10000ms)
- schemaVersion(string, SemVer, default "1.0") を EffectPresetMessage のルートに追加（SA 決定）
- Sequence 図に EffectPresetMessage(presetId, params) とサンプル JSON を追記（docs/03_design/diagrams/sequence/dynamic_fx.puml）
- ADR-0005 に schemaVersion 追記と互換運用方針を明記（docs/03_design/adr/0005-effect-preset-message-schema.md）

### Action Items
- [ ] Contract: WebSocket メッセージ検証を追加（TE）(tests/contract/test_websocket_contract.py)
- [ ] 新規 preset 追加手順（OpenAPI example 更新）の運用をドキュメント化（SA/DD）
- [ ] UI: schemaVersion major 不一致時のフェイルセーフ（効果無効化）仕様化（DD/FE）

### References
- USDM: US-005, US-006
- ADR: [0005-effect-preset-message-schema.md](../03_design/adr/0005-effect-preset-message-schema.md)
- API: [openapi.yaml](../03_design/api/openapi.yaml)
- Sequence: [dynamic_fx.puml](../03_design/diagrams/sequence/dynamic_fx.puml)
- Open Questions: [open_questions_2025-07-31.md](../03_design/open_questions_2025-07-31.md)