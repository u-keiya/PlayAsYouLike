## Summary
USDM と詳細設計の突合せを実施し、設計ギャップの是正を進めた。US-003（リプレイ同一譜面）・US-005（動的演出）の設計を補完。OpenAPI には SLA 拡張と新リソースを追加し、クラス図・シーケンス図を新設して要件との整合を確保した。Open Questions は PO 回答により確定し、それに合わせて API 設計を更新した。

### Key Decisions
- リプレイ時のシード受け渡しは「クライアントが seed を POST」に統一（US-003）［docs/03_design/diagrams/sequence/replay.puml］(#US-003)
- 動的演出はバックエンド生成（Preset 選択・配信はサーバ側）［docs/03_design/diagrams/sequence/dynamic_fx.puml］(#US-005)
- SLA 記述は OpenAPI の `x-latency-ms` で明示（US-001/002/004/005）［docs/03_design/api/openapi.yaml:76-104,131-159,174-188］
- 長尺動画の上限 10 分は固定（設定変更不可）。OpenAPI description と設計図へ反映
- 新 API 追加: `/effects/presets` GET（VisualEffectPreset 一覧返却、SLA=10分）［docs/03_design/api/openapi.yaml:104-131］
- SessionCreateResponse に `effectsPreset` を追加（実行時に選択されたプリセットを返却）［docs/03_design/api/openapi.yaml:198-209 → VisualEffectPreset スキーマ連携］

### Action Items
- [ ] 契約テストに `/effects/presets` 正常/503 系のケースを追加（TE, tests/contract）
- [ ] E2E テストに動的演出の 1 秒以内切替を検証するシナリオを追加（TE, tests/e2e/US-005.feature）
- [ ] API エラー体系の詳細（error_catalog.md）に 503 タイムアウト理由（YouTube, Beatmap, Preset）を明記（DD, docs/03_design/api/error_catalog.md）
- [ ] クライアント側の Replay フローで seed POST を徹底（Dev, src/）
- [ ] Contract/E2E テストに colorHex の必須化を反映（TE）

### References
- USDM: US-001, US-002, US-004（docs/02_requirements/usdm/US-001.yaml 他）
- Class Diagram: docs/03_design/diagrams/class/core_domain.puml
- API Spec: docs/03_design/api/openapi.yaml
- ADR: ADR-0001（docs/03_design/adr/0001-architecture-baseline.md）