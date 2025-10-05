## Summary
US-001〜006 の要求と既存 C4 図に基づき、詳細設計を作成・更新した。コア領域は Gameplay Core、Track Acquisition、Audio Analysis。クラス図（core_domain）と主要シーケンス図（URL取得／即時プレイ／ポーズ再開）を作成し、OpenAPI 3.1 スケルトンを提供。PlantUML の色指定誤解釈（#US-xxx）等の不具合を修正。譜面生成の解析指標は BPM に加え、RMS、ビート位置、スペクトル重心、キー／コード、曲構造セグメントを採用する方針で合意。演出はユーザ選択色を基調に動的エフェクトへ反映する方向で設計反映を開始。

### Key Decisions
- ランダム譜面とリプレイ同一シード（US-003）: セッションキャッシュ(Redis)にシード保持（TTL≤15m）（参考: [`docs/03_design/diagrams/sequence/replay_same_seed.puml`](docs/03_design/diagrams/sequence/replay_same_seed.puml:1)）
- ポーズ／リジューム（US-004）: 内部タイマー停止と再開時の同期補正を明示（[`pause_resume.puml`](docs/03_design/diagrams/sequence/pause_resume.puml:1)）
- OpenAPI スケルトン定義（/metadata, /sessions*, 3xx/4xx エラー雛形）（[`openapi.yaml`](docs/03_design/api/openapi.yaml:1)）
- 解析指標の追加方針: BPM に加え RMS/ビート/スペクトル重心/キー・コード/構造セグメントを譜面生成へ採用
- PlantUML 記法修正: 「#US-xxx」を色として解釈される問題を排除（[`core_domain.puml`](docs/03_design/diagrams/class/core_domain.puml:1), [`play_start.puml`](docs/03_design/diagrams/sequence/play_start.puml:1)）

### Action Items
- [ ] クラス図(core_domain)へ解析指標 VO と Beatmap プロパティを追加（DD）[#US-005]
- [ ] OpenAPI: Beatmap スキーマに energyEnvelope/beatTimeline/spectralCentroidSeq/keyProgression/segments を追加（DD）[#US-005]
- [ ] OpenAPI: SessionCreateRequest に colorHex を必須追加（DD）
- [ ] Audio Analysis MS 仕様を整理（gRPC `AnalyzeTrack` I/F、性能要件、キャッシュ戦略）（SA/DD）
- [ ] develop から `feat/detail-design-initial` を切り、今回の設計成果をコミット＆Push（Dev/PM）

### References
- USDM: [`US-001`](docs/02_requirements/usdm/US-001.yaml), [`US-002`](docs/02_requirements/usdm/US-002.yaml), [`US-003`](docs/02_requirements/usdm/US-003.yaml), [`US-004`](docs/02_requirements/usdm/US-004.yaml), [`US-005`](docs/02_requirements/usdm/US-005.yaml), [`US-006`](docs/02_requirements/usdm/US-006.yaml)
- C4: コンテキスト（[`context.puml`](docs/03_design/diagrams/c4/context.puml:1)）, コンテナ（[`container.puml`](docs/03_design/diagrams/c4/container.puml:1)）
- クラス図: [`core_domain.puml`](docs/03_design/diagrams/class/core_domain.puml:1)
- シーケンス図: URL取得（[`url_fetch.puml`](docs/03_design/diagrams/sequence/url_fetch.puml:1)）, 即時プレイ（[`play_start.puml`](docs/03_design/diagrams/sequence/play_start.puml:1)）, ポーズ再開（[`pause_resume.puml`](docs/03_design/diagrams/sequence/pause_resume.puml:1)）
- ADR: アーキテクチャ基線（[`0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md:1)）, シード/セッション（[`0004-beatmap-seed-replay-and-session-state.md`](docs/03_design/adr/0004-beatmap-seed-replay-and-session-state.md:1)）, 演出メッセージ（[`0005-effect-preset-message-schema.md`](docs/03_design/adr/0005-effect-preset-message-schema.md:1)）

### Notes
- 解析の現実性: librosa/Essentia/Spleeter 等の OSS により BPM/RMS/ビート/Spectral/キー・コード/セグメントは現実的に抽出可能。4分曲で CPU 3〜10秒想定（キャッシュ/スムージング前提）。
- PlantUML 不具合対応: `#` を含む注記はコメント化（`//`）またはステレオタイプ記法へ移行。
