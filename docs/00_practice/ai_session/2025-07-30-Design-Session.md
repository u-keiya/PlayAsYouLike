## Summary
MVP α の基本設計を US-001〜006 の要求に基づき確定。C4 Context/Container 図、ADR-0001 を作成し、音声解析の性能スパイク、YouTube ストリーミング/ダウンロード方針、Three.js を用いた動的演出の実現可能性を整理。PO 回答を反映して同時プレイ目標を10に更新。ユーザ指定色を基調に演出する仕様、譜面生成の特徴量（BPM/RMS/オン/オフビート/スペクトル中心/キー・コード/曲構造セグメント）を設計に反映。Git は feature ブランチから develop へプッシュし、以後の変更もコミット済み。

### Key Decisions
- Web SPA(React/TS) + WebAudio、描画は Canvas2D(将来WebGL/WebGPU移行可)（[`docs/03_design/adr/0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md)）
- 音声解析は Python+librosa マイクロサービス（gRPC）。WASM フォールバックは待機戦略付き（重複解析防止）（[`0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md)）
- C4 図を作成。Context/Container ともに最新ヘッダ `!includeurl .../master` に更新（[`context.puml`](docs/03_design/diagrams/c4/context.puml), [`container.puml`](docs/03_design/diagrams/c4/container.puml)）
- 同時プレイ目標を「10/コンテナ」に更新（PO 回答反映）（[`0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md)）
- YouTube はストリーミングのみでは CORS/リアルタイム制約により譜面生成(≤300s)が困難。先頭120秒の一時キャッシュ解析案を推奨（[`yt-dlp-risk.md`](docs/03_design/spike/yt-dlp-risk.md)）
- Three.js AudioAnalyser での動的演出は実現可能。曲ごとに Scene 再構築でオブジェクトを動的に切替可能（[`dynamic-fx-ai.md`](docs/03_design/spike/dynamic-fx-ai.md)）
- 新仕様反映：ユーザ選択色を FX Engine に反映、解析特徴量を拡張（RMS/センタロイド/キー/構造）（[`container.puml`](docs/03_design/diagrams/c4/container.puml), [`0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md)）

### Action Items
- [ ] PR 作成: feat/arch-baseline-20250729 → develop（PM）
- [ ] 法務確認: YouTube 一時キャッシュ解析の可否（RM/PO）
- [ ] Spike 実行: audio-analysis-perf（TE/Dev）（[`audio-analysis-perf.md`](docs/03_design/spike/audio-analysis-perf.md)）
- [ ] Spike 実行: Three.js で FX 動的再生成 PoC（Dev）（[`dynamic-fx-ai.md`](docs/03_design/spike/dynamic-fx-ai.md)）
- [ ] API スキーマ拡張: 解析特徴量の JSON/gRPC 定義（DD/Dev）（[`docs/03_design/api/openapi.yaml`](docs/03_design/api/openapi.yaml)）

### References
- USDM: US-001〜US-006（`docs/02_requirements/usdm/`）
- Story Map: [`docs/02_requirements/story_map.yaml`](docs/02_requirements/story_map.yaml)
- ADR: [`docs/03_design/adr/0001-architecture-baseline.md`](docs/03_design/adr/0001-architecture-baseline.md)
- C4: Context [`docs/03_design/diagrams/c4/context.puml`](docs/03_design/diagrams/c4/context.puml), Container [`docs/03_design/diagrams/c4/container.puml`](docs/03_design/diagrams/c4/container.puml)
- Spikes: 音声解析 [`docs/03_design/spike/audio-analysis-perf.md`](docs/03_design/spike/audio-analysis-perf.md), YouTube リスク [`docs/03_design/spike/yt-dlp-risk.md`](docs/03_design/spike/yt-dlp-risk.md), 動的演出/AI [`docs/03_design/spike/dynamic-fx-ai.md`](docs/03_design/spike/dynamic-fx-ai.md)
- Open Questions & 回答: [`docs/03_design/open_questions_2025-07-29.md`](docs/03_design/open_questions_2025-07-29.md)
