# AI Session — 2025-07-31 — Design Q&amp;A: EffectPreset Push スキーマ

## Summary
Detail Designer からの未確定事項（EffectPreset Push スキーマ）に対し、ADR-0005 と OpenAPI を根拠に回答を確定。プリセット固有パラメータ例、intensity/durationMs のデフォルト・許容範囲、後方互換性とバージョニング運用を定義し、オープン質問ファイルに追記した。

### Key Decisions
- EffectPresetMessage.params に共通項目（intensity: 0–1, durationMs: ≥1ms）を必須とし、preset 固有は additionalProperties: true で許容（[ADR-0005](../03_design/adr/0005-effect-preset-message-schema.md:21)).
- 推奨デフォルト: intensity=0.7, durationMs=5000ms（UXと視認性のバランス）（[openapi.yaml](../03_design/api/openapi.yaml:433)).
- 後方互換性: optional プロパティ追加は non-breaking（minor）、型変更・削除は breaking（major）。schemaVersion 追加を推奨（設計運用方針）。
- プリセット固有パラメータ例を提示（rainbow/flash/wave/sparkle/blur）し、今後の拡張手順を定義（オープン質問ファイルへ追記済み）。

### Action Items
- [ ] OpenAPI components/schemas に `schemaVersion` の導入提案（minor追加）を PR（SA） (#Docs)
- [ ] tests/contract/ に EffectPresetMessage の例を拡充（rainbow/flash/wave）と境界値テストを追加（TE） (#US-005, #US-006)
- [ ] UI 側で durationMs 上限超過時の進行表示・キャンセル UI を設計（DD/FE） (#US-006)
- [ ] プリセット定義表の継続更新ルールを docs/04_dev/coding_guidelines.md に追記（DS/DD） (#Docs)

### References
- ADR: [0005-effect-preset-message-schema.md](../03_design/adr/0005-effect-preset-message-schema.md:1)
- API: [openapi.yaml](../03_design/api/openapi.yaml:409)
- Sequence: [dynamic_fx.puml](../03_design/diagrams/sequence/dynamic_fx.puml:17)
- USDM: #US-005, #US-006
- Session Patch: [open_questions_2025-07-31.md](../03_design/open_questions_2025-07-31.md)

## Notes
- 実装影響: 旧クライアントは未知プロパティ無視方針で影響限定。サーバは schemaVersion を受理しても必須化しない（初期はデフォルト "1.0" 扱い）。
- モニタリング: 主要プリセットの利用比率と params 分布をメトリクス化し、デフォルト見直しの判断材料にする。