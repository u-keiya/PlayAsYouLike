# 0001 – Baseline Architecture for MVP α  
Status: Proposed  
Date: 2025-07-29  
USDM IDs: US-001, US-002, US-003, US-004, US-005  

## Context  
ブラウザ上で 15 分以内に YouTube URL から譜面生成〜プレイを完結させる MVP α を実現する。  
要求は以下を含む。  
* US-001: URL 貼り付け～即プレイ（≤300 秒）  
* US-002: URL メタ取得と検証（≤3 秒）  
* US-003: ランダム譜面生成＋リプレイ同一譜面  
* US-004: ポーズ／リジューム  
* US-005: 曲調に応じた動的演出  

技術上の制約・非機能要件（優先度順）：  

|  属性  | 目標値 / 制約 | 根拠 |
|--------|---------------|------|
| レスポンス時間 | URL Fetch ≤3 秒、譜面生成 ≤300 秒 | US-001/002 |
| スケーラビリティ | **10 同時プレイ / 1 コンテナ** | PO 回答 (2025-07-29) |
| ポータビリティ | ブラウザのみで完結 | Persona の手軽さ |
| 保守性 | サービス境界を明確化 | ランダム譜面・解析アルゴリズムの変更頻度が高い |
| コスト | MVP 期間は最小構成 (1 VM + Redis) | 予算制約 |

## Decision  
1. **フロントエンド**: TypeScript + React の Web SPA  
   * WebAudio API で音声再生／譜面同期  
   * 描画は Canvas 2D (将来 WebGL へ置換可能)  
2. **バックエンド API**: Node.js (Fastify)  
   * 役割: YouTube メタ取得、譜面シード生成、セッション管理  
   * WebSocket による結果 Push を後方互換で追加可能  
3. **音声解析マイクロサービス**: Python + librosa
   * BPM / RMS / Spectral Centroid / Key / 曲構造セグメントなど多特徴量を抽出
   * gRPC で API コンパクト化
   * WASM 版をフロント fallback として用意 (US-005 Realtime 演出)
   * **Fallback時の重複解析防止策**:
     - Python サービスが過負荷時は「analysis-pending」ステータスと ETA（推定完了時刻）を返却し、フロントは即座に WASM へフォールバックせず待機
     - バックエンドはセッションごとにキャッシュキーを発行し、WASM 側も同じキーを利用して解析結果の一貫性を担保
4. **FX Engine**: Three.js + GLSL / WebGPU
   * ユーザ選択色と音楽特徴量を uniform にバインドし、プロシージャルシェーダでオブジェクトを動的再生成
   * `Scene.clear()`+`Geometry.dispose()` により曲間でモデルを入れ替え、リプレイでも同一演出を再現
5. **インメモリキャッシュ**: Redis
   * 直前プレイのランダムシードと 15 分以内のセッションデータを保持  
   * Persistence を持たずシンプル運用  
5. **外部サービス**: YouTube Data / Streaming  
6. **デプロイ**: コンテナ (Docker) on single VM; 将来 Kubernetes に水平拡張  

## Consequences  
+ UI/ロジックが明確に分離され、React コンポーネント単位で演出・入力を改善しやすい。  
+ 音声解析をバックエンドに置くことでブラウザ負荷を軽減し 300 秒以内を保証。  
+ Redis は単一点障害だが、TTL15 分の一時データのみのため再起動で再生成可。  
− 解析サービスが Python 依存となりデプロイ複雑度が上がる。CI パイプラインでマルチランタイム対応が必要。  
− gRPC + WebSocket など通信方式が多様化し、クライアント実装負荷が上がる。  

## Alternatives Considered  
| 代替案 | 却下理由 |
|--------|---------|
| ① クライアント完全内製 (WASM で全解析) | BPM 推定に 30-60 秒かかり UX 低下。端末性能差大 |
| ② モノリシック Node.js サーバ | librosa 相当の JS ライブラリ不足。Python 依存を切り離せない |
| ③ 解析結果を事前計算 & CDN 配信 | ユーザ独自 URL で都度解析が必要なため不適 |

## References  
* C4 Context: [`docs/03_design/diagrams/c4/context.puml`](docs/03_design/diagrams/c4/context.puml)  
* C4 Container: [`docs/03_design/diagrams/c4/container.puml`](docs/03_design/diagrams/c4/container.puml)  