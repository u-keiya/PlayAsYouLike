# AI Session Log — Requirements Consolidation (2025-07-29)

## Summary
YouTube URL を用いたブラウザ音ゲーの MVP 要求を具体化。USDM を US-001〜US-006 まで拡充し、色入力による演出パーソナライズ、ランダム譜面とリプレイ同一シード、ポーズ/再開、曲調連動演出、長尺動画の自動トリミング（10分）を確定。共有機能は MVP α のスコープ外に明記。YouTube API と譜面生成時間の調査を反映し、受入基準と Story Map、用語集も更新。全変更は Git にコミット済み。

### Key Decisions
- MVP α の結果共有は実装しない（法務リスク回避のため） ([`story_map.yaml`](docs/02_requirements/story_map.yaml))
- 長尺動画は 10 分で自動カット・警告表示（US-002） ([`US-002.yaml`](docs/02_requirements/usdm/US-002.yaml))
- 譜面生成は 300 秒以内を目標（US-001） ([`US-001.yaml`](docs/02_requirements/usdm/US-001.yaml))
- ランダム譜面＋リプレイは同一シードで再挑戦（US-003） ([`US-003.yaml`](docs/02_requirements/usdm/US-003.yaml))
- 一時中断と再開（US-004） ([`US-004.yaml`](docs/02_requirements/usdm/US-004.yaml))
- 曲調連動演出を採用（US-005）＋解析指標を明記（BPM/RMS/オンオフビート/スペクトル重心/キー・コード進行/曲構造セグメント） ([`US-005.yaml`](docs/02_requirements/usdm/US-005.yaml:25))
- ユーザが基調色を選択し演出に反映（US-006） ([`US-006.yaml`](docs/02_requirements/usdm/US-006.yaml))

### Action Items
- [ ] 受入テストの更新（US-003〜US-006 の E2E/契約テスト具体化）(TE)
- [ ] 解析指標に対応する API/イベント定義の設計詳細（OpenAPI/WS）(DD/SA) ([`openapi.yaml`](docs/03_design/api/openapi.yaml))
- [ ] 演出プリセットとカラー合成規則のパラメタ JSON 草案作成 (DD) 
- [ ] ランダムシード管理とセッション状態モデルの詳細化 (DD/Dev)

### References
- USDM: [`US-001`](docs/02_requirements/usdm/US-001.yaml), [`US-002`](docs/02_requirements/usdm/US-002.yaml), [`US-003`](docs/02_requirements/usdm/US-003.yaml), [`US-004`](docs/02_requirements/usdm/US-004.yaml), [`US-005`](docs/02_requirements/usdm/US-005.yaml), [`US-006`](docs/02_requirements/usdm/US-006.yaml)
- Story Map: [`story_map.yaml`](docs/02_requirements/story_map.yaml)
- Glossary: [`glossary.yaml`](docs/02_requirements/glossary.yaml)
- Open Questions (調査・回答反映済): [`open_questions_2025-07-29.md`](docs/02_requirements/open_questions_2025-07-29.md:41)

## Session Details

1) ビジョン確認
- 15 分の没入リズム体験（URL 一発/ワンキー/WebGPU）
- 北極星指標: 平均セッション 15 分以上の DAU

2) USDM 初期整備
- US-001 即時リズム体験（譜面生成 ≤300 秒）
- US-002 曲情報取得＆10分超の自動トリミング
- US-003 ランダム譜面＆直後リプレイの同一シード
- US-004 プレイの一時中断と再開/終了
- US-005 曲調連動演出（解析指標の採用を明記）
- US-006 基調色選択で演出パーソナライズ

3) 調査結果反映
- YouTube IFrame API 自体はクォータ非対象。Data API は 1 リクエスト=1 unit（デフォルト 10,000 units/日）
- 自動譜面生成の所要時間は実装・モデル依存。MVP では 300 秒目標に設定

4) スコープ整理
- 結果共有（録音/録画を伴う）は MVP α スコープ外に明記

5) アーティファクト更新
- Story Map に US-003〜US-006 反映（結果共有セルはスコープ外注記）
- Glossary に リプレイ/シード/ポーズ/演出/基調色/カラーイメージ を追加

## Commit Log
- docs(requirements): add US-001, US-002, story map, glossary; update open questions answers and acceptance criteria
- docs(requirements): add US-003〜US-005, update story map and glossary
- docs(requirements): clarify that sharing feature is out-of-scope for MVP α
- docs(requirements): add US-006 to story map and glossary terms for 基調色/カラーイメージ
