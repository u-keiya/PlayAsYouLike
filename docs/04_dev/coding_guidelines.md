# Next.jsの原則

## コア原則
- `docs/akfm-knowledge/nextjs-basic-principle` を参考にする
- App Router を標準採用
- TypeScript 必須（ESLint／型エラーは常にゼロ）
- API Routes は使用しない。あらゆるサーバー処理は Server Actions で実装
- any型は使用しない。
    
## 開発コマンド

### コアコマンド
- `pnpm dev` - Turbopack付きの開発サーバーを起動
- `pnpm build` - 本番用ビルド
- `pnpm start` - 本番サーバーを起動
- `pnpm test:run` - Vitestでテストを実行
- `pnpm check:fix` - Biomeのチェックと自動修正を実行
- `pnpm typecheck` - TypeScriptの型チェック

### テスト
- `pnpm test:run`でVitestを使用してテスト
- テスト環境はjsdomで構成
- セットアップファイル: `vitest.setup.ts`
- テストはコンポーネントと同じ場所に配置（例：`app/page.test.tsx`）


## 参照ガイドライン

**参照タイミング**:
- 実装時には関連するドキュメントを必ず参照する
- ドキュメントを参照したら、「📖{ドキュメント名}を読み込みました」と出力すること

**機能実装時の参照優先順位**:
1. **データ取得実装** → Part 1のドキュメント群を参照
2. **コンポーネント設計** → Part 2のパターンを適用
3. **パフォーマンス最適化** → Part 3のキャッシュ戦略を活用
4. **レンダリング最適化** → Part 4のStreaming・PPR戦略を参照
5. **認証・エラーハンドリング** → Part 5の実践パターンを適用
6. **テスト実装** → `docs/akfm-knowledge/articles/frontend-unit-testing.md`を参照

**重要な設計原則**:
- **Server-First**: Server Componentsを優先し、必要時にClient Componentsを使用
- **データ取得の配置**: データを使用するコンポーネントの近くでデータ取得を実行
- **コンポジション**: 適切なコンポーネント分離とコンポジションパターンの活用
- **プログレッシブ強化**: JavaScript無効時でも機能する設計を心がける