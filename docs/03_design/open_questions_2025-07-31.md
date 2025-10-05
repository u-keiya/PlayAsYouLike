# Open Questions — 2025-07-31

## EffectPreset Push スキーマに関する未確定事項

### 1. プリセット固有パラメータの網羅
- 各 VisualEffectPreset（例: "rainbow", "flash", "wave" など）ごとに `params` で許容すべき追加プロパティの一覧を提示してください。
  - 例: "rainbow" → hueShift, "flash" → flashRate など

### 2. intensity/durationMs のデフォルト値・許容範囲
- intensity（0〜1）および durationMs（ms単位）の推奨デフォルト値・最大/最小値を明確化してください。

### 3. 後方互換性ポリシー
- params の追加プロパティは `additionalProperties: true` で許容していますが、将来的な breaking change を避けるための運用ルール・バージョニング方針はありますか？

---

**回答依頼先:** PO, SA  
**関連USDM:** #US-005, #US-006  
**関連設計:** [`openapi.yaml`](./api/openapi.yaml), [`dynamic_fx.puml`](../diagrams/sequence/dynamic_fx.puml)


## 回答 — Solution Architect (2025-07-31)

### 1. プリセット固有パラメータの網羅  
| presetId | 追加プロパティ | 型 / 範囲 | デフォルト | 備考 |
|----------|---------------|-----------|-----------|------|
| rainbow  | hueShift      | integer 0-360 | 120 | 色相回転角度 |
|          | saturation    | number 0-1 | 1.0 | 彩度ブースト |
| flash    | flashRate     | integer 1-20 Hz | 8 | 点滅周波数 |
|          | colorHex      | string `^#[0-9A-Fa-f]{6}$` | `#FFFFFF` | 点滅色 |
| wave     | wavelength    | integer 10-200 px | 80 | 波長 |
|          | amplitude     | integer 1-50 px | 20 | 振幅 |
|          | speed         | integer 10-500 px/s | 120 | 進行速度 |
| sparkle  | density       | number 0-1 | 0.4 | 画面当たり粒子密度 |
|          | colorPalette  | array&lt;hex&gt; | [`#FFD700`,`#FFFFFF`] | 複数色指定可 |
| blur     | radius        | integer 1-30 px | 12 | ぼかし半径 |

> **運用:** 新規プリセットを追加する場合は上表を拡張し、`openapi.yaml#/components/schemas/EffectPresetParams` に example を追記。

### 2. intensity / durationMs のデフォルト値・許容範囲  
| パラメータ | 型 | 最小 | 最大 | デフォルト | 理由 |
|------------|----|------|------|-----------|------|
| intensity  | number (float) | 0.0 | 1.0 | **0.7** | 0: 無効化, 1: フル効果。初期は視認性重視で 0.7 |
| durationMs | integer (ms) | 100 | 10000 | **5000** | UX 調査で 5 s が平均的。<br>上限 10 s を超える場合は UI 側で progress 表示必須 |

### 3. 後方互換性ポリシー・バージョニング方針  
1. **スキーマ non-breaking ルール**  
   - `params` 内の **新規 optional プロパティ追加**は **minor** アップデート (`v1.1 → v1.2`) とみなす。  
   - 既存プロパティの型変更・削除は **major** (`v1.x → v2.0`)。  
   - `additionalProperties: true` を維持し、旧クライアントは未知プロパティを無視。  

2. **バージョン識別子**  
   - メッセージルートに `schemaVersion` (string, SemVer, default `"1.0"`) を追加。  
   - クライアントは `major` が一致しない場合 Warning を出し、自動フェイルセーフ（エフェクト無効化）へフォールバック。  

3. **運用プロセス**  
   - 変更提案 → ADR & OpenAPI PR → CI contract test通過 → `tests/contract/` 更新。  
   - デプロイ後 1 週間は両バージョンをプッシュ可能とし段階的ロールアウト。  

4. **Breaking change 回避策**  
   - 旧プロパティを非推奨 (`deprecated:true` メタ) で残し、2 リリース後に削除。  
   - プリセットごとのパラメータ変更は presetId の suffix (`rainbow_v2`) で区別し、旧版は維持。  

以上により、柔軟な拡張とクライアント互換性を両立させます。
