## Summary
TEからの設計確認(OQ1/OQ2)に対し、/ws/hit-judge のメッセージスキーマ(PlayerInput, HitResult, Warning)と、EffectPresetMessage のプリセット固有パラメータ(例: rainbow.hueShift)を OpenAPI に正式追加する方針で合意。openapi.yaml を更新し、WebSocketメッセージスキーマの定義を追補、EffectPresetMessage は discriminator+oneOf 方式へ再設計。PR #9 で CodeRabbit の指摘に対応し、discriminator の位置修正と colorPalette の maxItems を追加。

### Key Decisions
- /ws/hit-judge の PlayerInput, HitResult, Warning を components.schemas に正式定義する(US-004, ADR-0004) ([docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)).
- EffectPresetMessage を presetId による discriminator + oneOf 分岐へ変更し、各プリセット(Rainbow/Flash/Wave/Sparkle/Blur)の型・必須/任意・範囲・デフォルト値を明記(US-005, ADR-0005).
- CodeRabbit 指摘対応:
  - discriminator を params 内ではなくルートスキーマ(EffectPresetMessage)での分岐に修正。
  - SparkleParams.colorPalette に maxItems: 10 を追加。

### Action Items
- [x] openapi.yaml: /ws/hit-judge のスキーマ(PlayerInput/HitResult/Warning)追記 (DD)
- [x] openapi.yaml: EffectPresetMessage を discriminator+oneOf 方式に再設計 (DD)
- [x] CodeRabbit #9 指摘修正: discriminator 配置修正、colorPalette.maxItems 追加 (DD)
- [ ] 契約テストの更新: tests/contract/test_websocket_contract.py で新スキーマのバリデーションを追加 (TE)
- [ ] docs/03_design/open_questions_2025-07-31.md の該当OQをクローズまたは解決記録追記(DS/SA)

### References
- USDM: US-004, US-005 (docs/02_requirements/usdm/US-004.yaml, docs/02_requirements/usdm/US-005.yaml)
- ADR: [0004-beatmap-seed-replay-and-session-state](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md), [0005-effect-preset-message-schema](docs/03_design/adr/0005-effect-preset-message-schema.md)
- API: [openapi.yaml](docs/03_design/api/openapi.yaml)
- PR: #9 (CodeRabbit 指摘: discriminator の位置、colorPalette の maxItems)