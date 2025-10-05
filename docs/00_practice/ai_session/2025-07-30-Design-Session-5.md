## Summary
OpenAPI 定義の `examples` 型不整合を修正。`docs/03_design/api/openapi.yaml` の 362-376 行における `examples` のオブジェクト記述を、OpenAPI 3.1 の期待に合わせ配列形式（summary/value）へ変更。適用後、別箇所（221 行）で `required: true` のスキーマ警告が新規に検出されたが、今回の修正範囲とは無関係として未対応。

### Key Decisions
- `examples` をオブジェクトから配列（`- summary: ..., value: ...`）へ変換（[docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)）
- 型エラーの原因は `examples` フィールドの期待型（array）と実体（object）の不一致であると判定

### Action Items
- [ ] `openapi.yaml` の 221 行付近のエラー（`required: true : Value is not accepted. Valid values: true.`）を詳細調査し修正（DD）
- [ ] OpenAPI バリデーションを CI に追加し、型不整合の再発を防止（TE）
- [ ] エラーレスポンス例の整備方針（命名・summary 文言・例の最小セット）をドキュメント化（SA/DD）

### References
- PR: N/A（ローカル修正）
- Docs: [docs/03_design/api/openapi.yaml](docs/03_design/api/openapi.yaml)