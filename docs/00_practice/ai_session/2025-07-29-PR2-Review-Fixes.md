## Summary
PR #2 の CodeRabbit 指摘に対応し、設計文書・図面・スパイク文書を修正。音声解析フォールバック時の重複解析防止（analysis-pending + ETA、キャッシュキー共有）を ADR に明記。C4-PlantUML の include をコミットハッシュに固定化。Open Questions の数値（50→10）・リンク不整合を解消。yt-dlp リスク表に Mitigation 列を追加し、各リスクへの対策対応付けを明確化。修正は feature ブランチ feat/arch-baseline-20250729 に push 済み。運用方針により develop への反映が必要。

### Key Decisions
- Python gRPC 過負荷時の即時 WASM フォールバック抑止。「analysis-pending（ETA 付）」返却＋「キャッシュキー共有」で二重解析と BPM/Seed 不整合を回避（[docs/03_design/adr/0001-architecture-baseline.md](../03_design/adr/0001-architecture-baseline.md)）
- C4-PlantUML include を commit hash 固定（`03c3e45`）で将来 drift を防止（[docs/03_design/diagrams/c4/context.puml](../03_design/diagrams/c4/context.puml:2)）
- Open Questions 内の同時プレイ数の前提を 10 に統一、および誤リンクを正規パスへ修正（[docs/03_design/open_questions_2025-07-29.md](../03_design/open_questions_2025-07-29.md)）
- yt-dlp リスク表に「Mitigation」列を追加し、R1〜R4 と推奨アクションの対応を明文化（[docs/03_design/spike/yt-dlp-risk.md](../03_design/spike/yt-dlp-risk.md)）

### Action Items
- [ ] feature/feat/arch-baseline-20250729 → develop に反映（PR 作成 or merge/push）（担当: Dev, Issue #tbd）
- [ ] ADR-0001 のフォールバック仕様に基づく API 契約の更新（analysis-pending レスポンス、ETA 型、キャッシュキー発行）（担当: DD、[docs/03_design/api/openapi.yaml](../03_design/api/openapi.yaml) 更新, Issue #tbd）
- [ ] フロント実装ガイドに「analysis-pending 待機と WASM 再利用キー」処理を反映（担当: Dev、[docs/04_dev/coding_guidelines.md](../04_dev/coding_guidelines.md) 追記, Issue #tbd）
- [ ] CI の PlantUML レンダリングで include 固定の動作確認（担当: Dev/TE, Issue #tbd）
- [ ] yt-dlp サーバレス POC（A3）の Spike 文書作成と法務確認 (#1, #2 に対応)（担当: SA/PO, Issue #tbd）

### References
- USDM: US-001, US-002, US-003, US-004, US-005
- ADR: ADR-0001
- PR: #2（CodeRabbit コメント IDs: 2239064888, 2239064892, 2239064905, 2239064911, 2239064922）
- 修正ファイル:
  - [docs/03_design/adr/0001-architecture-baseline.md](../03_design/adr/0001-architecture-baseline.md)
  - [docs/03_design/diagrams/c4/context.puml](../03_design/diagrams/c4/context.puml:2)
  - [docs/03_design/open_questions_2025-07-29.md](../03_design/open_questions_2025-07-29.md)
  - [docs/03_design/spike/yt-dlp-risk.md](../03_design/spike/yt-dlp-risk.md)