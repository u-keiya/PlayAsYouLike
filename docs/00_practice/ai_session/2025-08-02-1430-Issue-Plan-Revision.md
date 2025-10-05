## Summary
Issue プラン（docs/04_dev/issues.md）を USDM・設計（ADR/シーケンス図）・テスト戦略と突き合わせて精査し、欠落・粒度・依存関係・設計齟齬を是正する改訂を実施した。主な変更は US-001 の追加、肥大 Issue の分割、Pause/Replay/Session の実装順序の修正、Kafka publish や gRPC→FX メッセージスキーマ、WebSocket JSON schema の明記、E2E/CI の補強。全タスクを 2 ideal-days 以下の粒度に整え、Summary Table を再構成した。

### User Requirement
- US-001: 初回チュートリアルとヘルプ再表示
- US-002: YouTube メタデータ取得（3秒内表示）
- US-003: 譜面生成・リプレイ（同一シード）
- US-004: Pause/Resume/Quit と状態保持
- US-005: BPM/Energy に基づく動的演出
- US-006: 基調色パーソナライズ

### Key Decisions
- US-001 を新規追加（フロント＋E2E）。設計トレース: docs/02_requirements/usdm/US-001.yaml
- 肥大 Issue を分割
  - 譜面生成 (#3 旧) → 「ロジック API (3pt)」と「seed↔Redis (2pt)」
  - audio-svc (#4 旧) → 「proto&雛形 (3pt)」「BPM/Energy 実装 (3pt)」
  - FX プリセット (#10 旧) → 「プリセット切替 (3pt)」「彩度/輝度合成 (2pt)」
  - セッション管理 (#16 旧) → 見積り圧縮 (3pt) と依存の前倒し
- 依存関係の修正
  - Session (#12 新番号) を Pause/Replay (#11/#10) より先に配置（ADR-0004 準拠）
- 設計齟齬の解消
  - Kafka topic session.state publish をセッション管理 Issue に明記（ADR-0004）
  - gRPC→FX メッセージスキーマ統合の独立 Issue 追加（ADR-0005）
  - WebSocket ヒット判定の JSON schema と統計 API を backend 側 Issue として定義
  - Pause Resume の音声フェードインを Acceptance Criteria に追記
  - openapi で HTTP 422/400 バリデーション系も更新対象に追加
- テスト/CI の補強
  - US-006 の「色選択のみ」E2E を追加
  - CI に Redis/gRPC/WebGPU の起動手順を明記するサブタスクを追加

### Action Items
- [x] docs/04_dev/issues.md を改訂（USDM・設計と整合／粒度再編）
- [ ] docs/03_design/api/openapi.yaml を更新（US-002/003 の 422/400/429 反映）(Issue #18, role: DD/SA)
- [ ] CI ワークフローに Redis/gRPC/WebGPU 起動を組み込み（Issue #22, role: Dev/TE）
- [ ] Kafka topic 設計（session.state/fx.preset）の Issue 化（新規、role: SA）
- [ ] audio-svc と FX 間の message schema の実装とテスト（Issue #16, role: Dev/DD）
- [ ] WebSocket JSON schema の docs 追補（新規、role: DD）

### References
- USDM: US-001, US-002, US-003, US-004, US-005, US-006
- ADR: docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md, docs/03_design/adr/0005-effect-preset-message-schema.md
- PR/Files: docs/04_dev/issues.md（本セッションで改訂）
- Sequence: pause_resume.puml, hit_judge_ws.puml, section_fx_switch.puml, url_fetch.puml
