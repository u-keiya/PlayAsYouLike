# Spike – AI-Driven Dynamic FX Generation

Date Started: 2025-07-29  
Status: Planned

## Problem

Open Question #5 で「固定プリセットを持たず、曲調に合わせて演出（色彩・カメラワーク・パーティクル）をリアルタイム生成できるか。また AI を使用する場合の計算資源はどの程度か」を調査する必要が示された。

## Hypothesis

1. **軽量 DSP + ルールベース**（BPM・RMS・周波数帯域）でも十分なダイナミクスが得られる。
2. プロシージャル Shader / Three.js + GPU スプライトで描画負荷は **GTX-1050 相当 GPU で 60 FPS** を維持できる。
3. AI (小規模 LSTM/Transformer) によりセクション遷移を予測して事前プリフェッチすれば視覚遅延 <100 ms を達成できる。

## Experiment Plan

| #   | 検証項目         | 方法                                   | 指標             | 合格基準            |
| --- | ---------------- | -------------------------------------- | ---------------- | ------------------- |
| 1   | ルールベース演出 | librosa 解析値→色/エフェクトマッピング | 主観評価 (5 名)  | “動的に感じる” ≥4/5 |
| 2   | GPU 負荷         | Three.js + GLSL 水面/パーティクル      | GPU 利用率 / FPS | 60 FPS 以上         |
| 3   | AI 予測モデル    | TensorFlow.js LSTM 512 隠れ            | 推論時間         | <10 ms/step         |
| 4   | クライアント RAM | Chrome DevTools 計測                   | Peak メモリ      | <200 MB 追加        |

環境:

- ブラウザ: Chrome 126, WebGPU 対応有無比較
- ハード: i5-8250U + Intel UHD620, GTX-1050 / M1

## Deliverables

- プロトタイプソース `src/proto/dynamic-fx/`
- 計測ログ & 主観アンケート
- 結論と推奨アーキテクチャ (AI 要否、必要 GPU / WASM)

## Timeline

| Task                   | Owner | ETA   |
| ---------------------- | ----- | ----- |
| 解析パイプライン実装   | Dev   | 08-05 |
| GLSL/Three.js 演出実装 | Dev   | 08-07 |
| AI モデル学習 & 移植   | Dev   | 08-09 |
| 計測 & レポート        | TE    | 08-10 |

## Reference Implementation Notes

Three.js 公式 / OSS の Sound Visualizer 実装例を踏まえ、以下の技術スタックでプロトタイプを作成する。

1. HTML に `<canvas id="stage">` を配置
2. `new THREE.AudioLoader()` で音源ロード
3. `THREE.AudioAnalyser.getFrequencyData()` で周波数配列を取得 (512bin)
4. 取得データをシェーダ Uniform / オブジェクトスケールへバインドし、
   BPM・RMS 解析値に応じて **ジオメトリ切替/生成** を動的に行う

既存 OSS は「球体サイズ変化」など単一モデル操作が中心だが、
`Scene.clear()` + `Geometry.dispose()` を組み合わせれば曲間で
オブジェクト/マテリアルを完全再生成できることを確認済み（PoC）。

---

## Expected Outcome

ルールベース + Three.js AudioAnalyser & GPU シェーダによる演出で MVP α を実装し、
曲ごとにオブジェクトを動的再生成できる目処を得る。AI は β 向けに検討。
