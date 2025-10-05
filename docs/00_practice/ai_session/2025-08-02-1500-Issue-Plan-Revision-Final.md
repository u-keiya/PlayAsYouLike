## Summary
Issue プランをレビュー結果に基づき全面改訂。過大粒度の分割、API スキーマ名修正、WS/Kafka 連携の契約テスト補完、依存関係の簡素化を実施。docs/04_dev/issues.md を新基準に更新し、Summary Table も再生成した。

### User Requirement
- レビュー結果 docs/04_dev/tmp.md を反映し issues.md を修正
- 粒度 2 ideal-day 以下、トレーサビリティ整合、依存関係閉路回避、テスト駆動を満たす

### Key Decisions
- Play開始&譜面描画(3pt) を分割（API呼び出し&seed保存 2pt／Canvas描画&判定 2pt） [PR: docs/04_dev/issues.md]
- Pause/Resume/Quit UI(3pt) を UI実装 2pt／タイマー同期テスト 1pt に分離 [PR: docs/04_dev/issues.md]
- EffectPresetMessage は “schema+docs” と実装 Issue を分離（サーバ Push 実装を新規起票） [ADR-0005, PR: docs/04_dev/issues.md]
- MetadataResponse → UrlMetadata にスキーマ参照を修正 [docs/03_design/api/openapi.yaml リンク参照, PR: docs/04_dev/issues.md]
- gRPC クライアント生成は Frontend 実装のみ依存に限定 (#10 → FE のみ) [PR: docs/04_dev/issues.md]
- Kafka publish はセッション状態管理 Issue 内 Acceptance に包含し、NF-01 から切り離し [ADR-0002/0004, PR: docs/04_dev/issues.md]

### Action Items
- [ ] docs: openapi.yaml のスキーマ名参照確認と不足分の差分反映（US-002） (Issue Planner → SA/DD)
- [ ] test(contract): WebSocket EffectPresetMessage schema validation 追加の具体テストケース設計 (TE)
- [ ] backend: EffectPreset Push WebSocket サーバ実装 (/ws/effectPreset) (Dev)
- [ ] frontend: 分割後の US-003 E2E のシナリオ更新 (TE)
- [ ] ci: integration/e2e ワークフローの依存行列更新 (DevOps)

### References
- USDM: US-001, US-002, US-003, US-004, US-005, US-006
- ADR: 0002, 0004, 0005
- PR (doc patch): docs/04_dev/issues.md