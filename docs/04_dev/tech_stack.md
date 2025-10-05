# Tech Stack Recommendations

このドキュメントは docs の設計・要件に基づき、MVP α を成立させるために必要となる主要ライブラリ候補を整理したものです。複数候補がある場合は優先度と用途を示すので、最終判断をお願いします。

## Frontend (Next.js App)

| 要件/機能 | 推奨ライブラリ | 目的・補足 |
| --- | --- | --- |
| App Router ベースのSPA | **Next.js 15 (with React 18)** | docs/04_dev/coding_guidelines.md が App Router と TypeScript 徹底を要求しており、SSR/Server Actions を標準化できます。
| 型安全なUI実装 | **TypeScript** | 既定方針として `any` 禁止・型エラーゼロを求めているため (docs/04_dev/coding_guidelines.md)。
| 動的演出 (FX Engine) | **three** | ADR-0001で Three.js + GLSL/WebGPU と明示されているため、core ライブラリとして three を採用します。
| gRPC クライアント生成 | **@bufbuild/protoc-gen-es** | Issue「gRPC proto → TypeScript クライアント生成」に対応する採用済みオプション。Bufbuild エコシステムで gRPC-web と TypeScript 双方に対応し、Browser/Node 双方向のクライアント生成を一本化できます。
| 状態管理 (セッション/演出同期) | **zustand** | Session state 切替や gRPC/WebSocket 統合 (ADR-0004) を軽量に扱えるシンプルなストアで、Server Components とも相性が良好です。
| UI テスト | **Vitest** + **@testing-library/react** | docs/04_dev/coding_guidelines.md と docs/05_test/strategy.md で Vitest をコアユニット層と定義。

## Backend API (Fastify)

| 要件/機能 | 推奨ライブラリ | 目的・補足 |
| --- | --- | --- |
| HTTP API基盤 | **fastify** | ADR-0001が Fastify 採用を決定済。高速・プラグイン駆動で要件に一致。
| スキーマ & OpenAPI 連携 | **@fastify/swagger** + **@fastify/swagger-ui** | docs/03_design/api/openapi.yaml と Schemathesis 契約テストを同期するため。
| JSON Schema/型共有 | **@sinclair/typebox** + **@fastify/type-provider-typebox** (代替: **zod** + `fastify-zod`) | Type-safe なリクエスト検証と OpenAPI 生成を両立。既存チームの好みに合わせて選択可。
| WebSocket Push | **@fastify/websocket** | ADR-0004/0005 で定義された `/ws/effectPreset` push を実装。
| Kafka 連携 | **kafkajs** (代替: **node-rdkafka**) | ADR-0002 が Kafka を採用。kafkajs は純JSで運用容易。C/C++依存が許容されるなら node-rdkafka を検討。
| Redis キャッシュ | **ioredis** (代替: `redis`v4) | Beatmap seed TTL キャッシュ要件 (ADR-0001/0004) を満たす非同期クライアント。
| gRPC クライアント | **@grpc/grpc-js** | Python audio-svc と連携するための公式 Node gRPC 実装 (ADR-0003, issues #8/#10)。
| ロギング | **pino** | Fastify デフォルトの高速ロガー。構造化ログで解析容易。

## Audio Analysis Service (Python)

| 要件/機能 | 推奨ライブラリ | 目的・補足 |
| --- | --- | --- |
| 音響特徴量解析 | **librosa**, **numpy**, **scipy** | ADR-0001 と issue #9 が librosa による BPM/Energy 推定を要求。
| オーディオ I/O | **soundfile** + **audioread** | librosa の依存を満たし多フォーマット対応を確保。
| gRPC サーバ/IDL | **grpcio**, **grpcio-tools** | gRPC API 定義〜サーバ雛形生成 (issues #8/#9)。
| 並列処理・ジョブ管理 (任意) | **celery** + **redis** または **rq** | 解析300秒SLAを守るためのワーカー管理。負荷見込みに応じて選択。
| テスト | **pytest** + **pytest-asyncio** | docs/05_test/strategy.md の unit/integration 層を Python 側で担保。

## Cross-Service Contracts & Tooling

| 要件/機能 | 推奨ライブラリ | 目的・補足 |
| --- | --- | --- |
| OpenAPI検証 | **schemathesis** | 契約テスト層にて必須 (docs/05_test/strategy.md)。
| WebSocket スキーマ検証 | **pydantic** (Python) or **zod** (TypeScript) | ADR-0005のEffectPresetMessageスキーマを双方で厳格化するため。既存スタックに合わせて選択。
| Infrastructure as Code | **docker-compose**, **Terraform** (任意) | 単一VM構成(ADR-0001)と将来の水平展開に備えた一貫デプロイ。
| CI ユーティリティ | **testcontainers** (Node/Python) | Kafka/Redis/gRPC の統合テストをローカルCIで再現 (docs/05_test/strategy.md WebSocket/Kafka要件)。

## Testing & QA

| レイヤー | 推奨ツール | 目的・補足 |
| --- | --- | --- |
| Acceptance (E2E) | **Behave** | USDM シナリオ追跡 (docs/05_test/strategy.md)。
| Contract | **Schemathesis**, **pytest** | HTTP/WebSocket スキーマ検証。
| Integration | **pytest**, **testcontainers**, **Vitest** | Kafka/Redis/gRPC を含む組み合わせ試験。
| Unit | **Vitest**, **pytest** | 迅速なフィードバックループ。

## Next Steps
1. ライブラリ候補の中で環境制約 (C/C++依存、CI 実行時間等) を評価し、最終採用を決定。
2. 採用ライブラリが決まったら `package.json` / `pyproject.toml` へ追加し、docs/03_design/api や関連ADRの更新を行ってください。
