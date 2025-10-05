# ADR-0005: EffectPreset Push スキーマ設計方針

- Status: Accepted
- Date: 2025-07-31
- Deciders: Detail Designer, Solution Architect
- Related USDM: #US-005, #US-006
- Supersedes: None
- References: [openapi.yaml](../api/openapi.yaml), [dynamic_fx.puml](../diagrams/sequence/dynamic_fx.puml)

---

## Context

WebSocket `/ws/effectPreset` で Push される effectPreset メッセージのスキーマが未定義であり、テスト自動化・契約整合性の観点から明確な仕様化が求められていた。

- 既存の VisualEffectPreset は拡張性を重視し、presetId ごとに異なるパラメータを許容する必要がある。
- intensity, durationMs など共通パラメータの型・範囲も明示することで、クライアント・サーバ双方の実装・テスト容易性を高める。

## Decision

- effectPreset Push メッセージは `EffectPresetMessage` スキーマ（OpenAPI components/schemas）で定義する。
    - 必須: `presetId` (string), `params` (object)
    - `params` は intensity (0〜1, float), durationMs (int, ms) を必須とし、preset 固有の追加プロパティは `additionalProperties: true` で許容
- 例:
    ```json
    {
      "presetId": "rainbow",
      "params": {
        "intensity": 0.8,
        "durationMs": 5000,
        "hueShift": 120
      }
    }
    ```
- 後方互換性維持のため、`params` の追加プロパティは breaking change としない。
- スキーマは OpenAPI 3.1 の components/schemas に記載し、contract テストでバリデーション可能とする。
- 仕様の不明点（preset 固有パラメータ一覧、デフォルト値等）は Open Questions に記載し、PO/SA へエスカレーション。
- schemaVersion (string, SemVer, default "1.0") プロパティを EffectPresetMessage のルートに追加し、互換性運用はSA決定方針に従う。

## Consequences

- effectPreset Push の契約が明確化され、テスト自動化・実装の一貫性が向上。
- 今後のプリセット追加時も、後方互換性を維持しつつ柔軟な拡張が可能。
- 追加パラメータの仕様変更時は、OpenAPI スキーマ・テスト・ドキュメントの同時更新が必須。

---