## Summary
本セッションでは、設計一式（docs/03_design 配下）を read_file で精読後、実装プラン docs/04_dev/issues.md を USDM・ADR・OpenAPI と突き合わせてレビューし、齟齬と抜け漏れを是正した。特に Session State の API 統一、EffectPresetMessage スキーマと関連 API/WS/テストの整備、Kafka/gRPC 周りの Issue 追加、FX 周辺の粒度調整を実施。Summary Table も更新し、依存関係・見積の妥当化を行った。

### User Requirement
- US-001: 初回チュートリアル、即プレイ開始
- US-002: URL メタ取得 ≤3秒
- US-003: ランダム譜面生成＋同一シードでリプレイ
- US-004: ポーズ/リジューム/終了（状態遷移）
- US-005: 曲調に応じた動的演出（プリセット切替）
- US-006: 基調色パーソナライズ

### Key Decisions
- Session State API を ADR-0004 に合わせて PATCH /sessions/{id}/state に統一（UI/Backend/Contract Test まで反映） [ADR-0004](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
- EffectPreset Push スキーマ（EffectPresetMessage）を JSON Schema と Contract Test で明確化 [ADR-0005](docs/03_design/adr/0005-effect-preset-message-schema.md)
- /effects/presets（SLA ≤10分、最大10件）と /effects/sync（補正）をバックログへ追加し、API/テスト整備 [openapi.yaml](docs/03_design/api/openapi.yaml)
- WebSocket /ws/effectPreset サーバ stub と Schema Validation を明記（Backend 側タスク追加）
- Kafka EventBus（ADR-0002）topic 定義と producer stub を infra タスクとして追加 [ADR-0002](docs/03_design/adr/0002-message-broker-kafka.md)
- gRPC 双方向ストリーミング（ADR-0003）のクライアント（gRPC-Web）整備 [ADR-0003](docs/03_design/adr/0003-external-streaming-grpc.md)
- FX プリセット切替を「gRPC 受信」と「選択ロジック/JSON 定義」に分割し粒度調整
- docs: openapi.yaml 更新の見積を 2pt に引き上げ、対象スコープを拡充（/effects/presets, /sessions/{id}/state, Error 追加）

### Action Items
- [x] docs/04_dev/issues.md の修正適用（API 統一・新規 Issue 追加・粒度調整・依存更新） (IP)
- [ ] test(contract): `/sessions/{id}/state`、`/effects/presets`、`/ws/effectPreset` 追加 (TE)
- [ ] feat(backend): `/effects/presets` 実装＋Contract Test (Dev)
- [ ] feat(schema): EffectPresetMessage JSON Schema & Contract Test (Dev, TE)
- [ ] feat(infra): Kafka topic 定義 & producer stub (Dev)
- [ ] feat(frontend): gRPC Web client for AudioAnalysisSvc (Dev)
- [ ] docs: openapi.yaml & ADR-0005 反映（preset parameter table 同期） (DS/DD)

### References
- USDM: US-001〜US-006（docs/02_requirements/usdm/）
- ADR: 
  - [0002 Kafka 採用](docs/03_design/adr/0002-message-broker-kafka.md)
  - [0003 外部ストリーミング gRPC](docs/03_design/adr/0003-external-streaming-grpc.md)
  - [0004 Seed リプレイ保証／Session State 統合](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md)
  - [0005 EffectPresetMessage スキーマ](docs/03_design/adr/0005-effect-preset-message-schema.md)
- API 仕様: [openapi.yaml](docs/03_design/api/openapi.yaml)
- 設計図: C4/Class/Sequence (docs/03_design/diagrams/)
- 変更ファイル: [docs/04_dev/issues.md](docs/04_dev/issues.md)
