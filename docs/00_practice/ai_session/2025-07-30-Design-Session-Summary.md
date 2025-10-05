## Summary
USDM (US-001〜US-006) と詳細設計の整合確認を実施。特に US-003 (リプレイ同一譜面) と US-005 (動的演出) の設計ギャップを補完した。PO 回答により Open Questions を解決し、設計資産へ反映。OpenAPI には SLA 記述 (x-latency-ms) と新パスを追記し、クラス図/シーケンス図を追加して仕様と詳細設計の一貫性を確保した。

### Key Decisions
- シード受け渡し方式: クライアントが seed を POST (US-003) → [replay フロー図](docs/03_design/diagrams/sequence/replay.puml:1)
- 動的演出はバックエンド生成 (サーバ側で解析・プリセット選択・配信) (US-005) → [dynamic_fx 図](docs/03_design/diagrams/sequence/dynamic_fx.puml:1), [visual_effects クラス図](docs/03_design/diagrams/class/visual_effects.puml:1)
- SLA 記述は OpenAPI で x-latency-ms に明示 (US-001/002/004/005) → [openapi.yaml](docs/03_design/api/openapi.yaml:75)
- 長尺動画上限は固定 10 分 (設定変更不可) → API の説明/図へ注記
- 新 API: GET /effects/presets (VisualEffectPreset 一覧、SLA ≤ 10 分) → [openapi.yaml](docs/03_design/api/openapi.yaml:104)

### Action Items
- [ ] 契約テスト: /effects/presets の 200/503 系を追加 (TE, tests/contract)
- [ ] E2E: 動的演出の 1 秒以内切替シナリオを追加 (TE, tests/e2e/US-005.feature)
- [ ] エラーカタログ更新: 503 タイムアウト理由 (YouTube, Beatmap, Preset) の明記 (DD, docs/03_design/api/error_catalog.md)
- [ ] フロント実装: Replay フローで seed POST を徹底 (Dev, src/)
- [ ] UI 文言: 10 分上限固定のガイドを coding_guidelines に追記 (DD, docs/04_dev/coding_guidelines.md)

### References
- USDM: US-001, US-002, US-003, US-004, [US-005](docs/02_requirements/usdm/US-005.yaml:1), US-006
- API: [openapi.yaml](docs/03_design/api/openapi.yaml:1)
- 図面: [replay.puml](docs/03_design/diagrams/sequence/replay.puml:1), [dynamic_fx.puml](docs/03_design/diagrams/sequence/dynamic_fx.puml:1), [visual_effects.puml](docs/03_design/diagrams/class/visual_effects.puml:1)
- ADR: [0004-beatmap-seed-replay-and-session-state.md](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md:1), [0005-effect-preset-message-schema.md](docs/03_design/adr/0005-effect-preset-message-schema.md:1)