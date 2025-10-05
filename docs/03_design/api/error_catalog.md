# Error Catalog

PlayAsYouLike API — Error Catalog  
(USDMトレーサビリティ付)

| Code         | HTTP | Message                                    | Detail/Condition                        | USDM ID   |
|--------------|------|--------------------------------------------|-----------------------------------------|-----------|
| INVALID_URL  | 400  | Invalid or unsupported URL                 | URL形式不正/未対応サービス              | #RQ01-2   |
| NOT_FOUND    | 404  | Session or resource not found              | セッション/リソース未存在               | #RQ01-3   |
| TIMEOUT      | 503  | Beatmap generation timed out               | 外部API/内部処理タイムアウト            | #RQ01-4   |
| RATE_LIMIT   | 429  | Too many requests. Please try again later. | レートリミット超過                      | #NF-01    |
| VALIDATION_ERROR | 422 | Invalid input                           | パラメータ検証エラー                    | #RQ01-2   |
| INTERNAL_ERROR   | 500 | Unexpected server error                 | サーバ内部例外                          | #NF-01    |
| REPLAY_GONE     | 410 | Replay deleted                           | リプレイデータ削除済                    | #RQ04-3   |
| REPLAY_LEGAL    | 451 | Replay unavailable due to copyright restriction | 著作権制限でリプレイ不可         | #RQ04-4   |
| JUDGE_LAG       | 200 | Hit judge delayed                        | judgeLag > 200ms                        | #RQ03-2   |

| BEATMAP_SEED_NOT_FOUND | 404  | Beatmap seed not found for replay         | リプレイIDに対応するBeatmapSeedが見つからない | #US-003   |
| INVALID_SESSION_STATE  | 422  | Invalid session state transition         | 不正な状態遷移要求 (例: ended→running)         | #US-004   |

- 各エラーは `components/schemas/Error` で $ref され、OpenAPI 仕様と連携。
- 追加エラーは本カタログに追記し、USDM IDで要件トレーサビリティを担保。
