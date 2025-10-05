# ADR-0003: 外部ストリーミング連携APIにgRPCを採用する理由

## ステータス
Accepted

## 日付
2025-07-30

## コンテキスト
本システムでは、外部音楽ストリーミングサービス（例: YouTube, Spotify等）との連携が必要。  
REST, gRPC, WebSocket等がAPI方式の候補となった。

## 決定
外部ストリーミング連携APIとして **gRPC** を採用する。

## 理由
- **双方向ストリーム**: 音声データやメタ情報のリアルタイム送受信が可能
- **低レイテンシ**: HTTP/2ベースで高速な通信が可能
- **型安全・IDL自動生成**: サーバ/クライアント双方で型安全なコード生成が容易
- **エコシステム**: 多言語対応・OSSツール群が充実
- **将来拡張性**: サービス間通信の拡張やバージョニングが容易

## 影響範囲
- `class/infrastructure.puml` の ExternalStreamingGateway
- `openapi.yaml` の設計方針
- サーバ/クライアントのAPI実装

## 代替案
- **REST**: 単純なリクエスト/レスポンスは容易だが、ストリーミングや双方向通信に不向き
- **WebSocket**: 柔軟なリアルタイム通信だが、型安全性・API管理でgRPCに劣る

## Consequences (追記)
- AudioAnalysisSvc は SectionChange イベントを双方向 gRPC stream で配信し、FXEngine の演出切替をリアルタイム補完できる (#ADR-0004)
## トレーサビリティ
- #US-006 外部ストリーミング連携
- #NF-01 パフォーマンス・拡張性
