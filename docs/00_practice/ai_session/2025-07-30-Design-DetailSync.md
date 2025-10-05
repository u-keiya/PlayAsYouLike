## Summary
USDM要件と基本設計（C4/ADR）に対し、詳細設計（クラス図/シーケンス図/OpenAPI）でのすれ違いを調査・補正。再同期・警告・タイムアウト・フェイルオーバー等の振る舞いを追加し、APIとエラーカタログを拡充。技術選定（Kafka・gRPC）は独立ADRとして記録し、トレーサビリティを確保した。

### Key Decisions
- Dynamic FX: ネットワーク遅延時の再同期フローを追加（<<#RQ02-3>>）([docs/03_design/diagrams/sequence/dynamic_fx.puml](docs/03_design/diagrams/sequence/dynamic_fx.puml))
- Hit Judge: judgeLag>200ms の Warning 分岐を追加（<<#RQ03-2>>）([docs/03_design/diagrams/sequence/hit_judge_ws.puml](docs/03_design/diagrams/sequence/hit_judge_ws.puml))
- Pause/Resume: 10分無操作で自動終了遷移を追加（<<#RQ05-2>>）([docs/03_design/diagrams/sequence/pause_resume.puml](docs/03_design/diagrams/sequence/pause_resume.puml))
- Failover/Retry: フェイルオーバー・リトライ方針のシーケンス新設（<<#NF-01>>）([docs/03_design/diagrams/sequence/failover.puml](docs/03_design/diagrams/sequence/failover.puml))
- Core Domain: RetryHandler サービス追加（<<#NF-01>>）([docs/03_design/diagrams/class/core_domain.puml](docs/03_design/diagrams/class/core_domain.puml))
- Infrastructure 図新設: Repository/Cache/MessageBroker/Gateway を整理（Kafka/gRPC 前提）([docs/03_design/diagrams/class/infrastructure.puml](docs/03_design/diagrams/class/infrastructure.puml))
- OpenAPI 更新: 410/451/200(JUDGE_LAG) 追加、WSエンドポイント定義、/effects/sync 追加、Error拡張（required警告は無視方針）([docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml))
- Error Catalog 新設: エラーコードとUSDM対応を一覧化([docs/03_design/api/error_catalog.md](docs/03_design/api/error_catalog.md))
- 技術選定ADRを分離:
  - Kafka 採用理由 [docs/03_design/adr/0002-message-broker-kafka.md](docs/03_design/adr/0002-message-broker-kafka.md)
  - gRPC 採用理由 [docs/03_design/adr/0003-external-streaming-grpc.md](docs/03_design/adr/0003-external-streaming-grpc.md)

### Action Items
- [ ] OpenAPI lintエラー（required表記）を後日ルール化・自動修正（TE/Dev）
- [ ] ErrorCatalogとOpenAPIのコード列挙をスキーマ生成で同期（Dev）
- [ ] 図へのUSDMタグ付与ルールを docs/04_dev/coding_guidelines.md に追記（DD/DS）

### References
- USDM: US-001〜006（[docs/02_requirements/usdm/](docs/02_requirements/usdm/)）
- ADR: 
  - 0001 ベースライン [docs/03_design/adr/0001-architecture-baseline.md](docs/03_design/adr/0001-architecture-baseline.md)
  - 0002 Kafka [docs/03_design/adr/0002-message-broker-kafka.md](docs/03_design/adr/0002-message-broker-kafka.md)
  - 0003 gRPC [docs/03_design/adr/0003-external-streaming-grpc.md](docs/03_design/adr/0003-external-streaming-grpc.md)
- API: [docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml), [docs/03_design/api/error_catalog.md](docs/03_design/api/error_catalog.md)
- 図面: sequence/class/c4（各パス参照）
