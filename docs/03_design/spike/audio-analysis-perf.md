# Spike – Audio Analysis Performance

Date Started: 2025-07-29  
Status: In Progress

## Problem

US-001 要件「譜面生成 ≤300 秒」を守るには、YouTube 音源から BPM・エネルギー・スペクトラムを抽出する音声解析処理の性能が鍵になる。Python + librosa サービスでサーバ側解析を行う案を採用したが、負荷次第では水平分割や WASM 版へのフォールバックが必要となる。

## Hypothesis

1. **1 曲 5 分以内** の音声ファイルを librosa で解析する場合、並列 4 core 環境なら **≤30 秒** で完了し、全体 300 秒以内に十分余裕を残せる。
2. ミドル層（BPM 90–140）では演出スイッチング用特徴量更新を **1 秒周期** でストリーム処理できる（フロント WASM 実装）。

## Experiment Plan

| #   | 検証項目                           | 方法                                                           | 計測指標                   |
| --- | ---------------------------------- | -------------------------------------------------------------- | -------------------------- |
| 1   | オフライン全曲解析時間             | 5 分/10 分/15 分のサンプル音源を librosa.load + onset/BPM 推定 | wall-time / CPU 使用率     |
| 2   | ストリーム解析レイテンシ           | 128 frame チャンクを連続入力し STFT+BPM 更新                   | 1 秒以内に特徴量更新可否   |
| 3   | 同時 10 リクエスト時のスケール     | locust で gRPC リクエストを平行生成                            | P95 レイテンシ / エラー率  |
| 4   | WASM 版 (essentia.js) ブラウザ実行 | 同サンプル音源を WebWorker + WASM 解析                         | 処理完了時間 / UI FPS 影響 |

環境:

- VM 2 vCPU / 4 GB RAM (MVP 提供想定最低構成)
- Python 3.12, librosa 0.10
- Node 20 + essentia.js 0.6 (WASM)

## Result (TBD)

- 実験実施後に記載

## Recommendation (TBD)

- 実験結果に基づき、サービス側スレッドプール拡張 or フロント fallback の閾値を定義
