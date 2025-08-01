# Open Questions — 2025-07-29

| # | 項目 | 質問内容 | 関連 USDM |
|---|------|---------|-----------|
| 1 | YouTube API 利用制限 | IFrame Player API のクォータや広告表示ポリシーにより、平均 15 分セッションに影響する制限はあるか。法務確認の進捗と制限内容を共有してほしい。 | US-001, US-002 |
| 2 | 譜面自動生成アルゴリズムの精度目標 | MVP α 時点で許容ミス判定率や譜面生成時間 (秒) に定量目標を設定するか。設定する場合は目標値を提示してほしい。 | US-001 |
| 3 | 長尺動画 (>15 分) のハンドリング方針 | 15 分を超える動画は警告のみで許可するのか、強制的に 15 分でカットするのか。方針決定をお願いしたい。 | US-002 |

> PO で方針確定後、該当 USDM と受入基準を更新します。

---

## 調査メモ 2025-07-29

### 1) YouTube IFrame API / Data API クォータ
- **IFrame Player API 再生自体はクォータ対象外**  
  ‑ 埋め込み再生は視聴回数制限なし。
- メタデータ取得で **YouTube Data API を 1 リクエスト使用**  
  ‑ デフォルト割当 10 000 units/日 → 1 曲1回呼び出しなら **1 万曲/日** まで。
  ‑ それ以上は [Quota Extension Form](https://support.google.com/youtube/contact/yt_api_form?hl=en) で拡張可。
- **広告ブロック禁止**、再生コントロールは YouTube UI に準拠。  
- 動画長 15 分超でも API 制限なし。  

参考:  
- [YouTube Data API Overview](https://developers.google.com/youtube/v3/getting-started)  
- [YouTube IFrame API Reference](https://developers.google.com/youtube/iframe_api_reference)

### 2) 譜面自動生成に要する時間
| ソース | 曲長 | 生成時間 | 備考 |
|-------|------|----------|------|
| aisu.sh 公開プロトタイプ | 3–4 分 | **5–10 分** | <https://osu.ppy.sh/community/forums/topics/792388> |
| osu-syncflow / osumapper (GitHub) | 4 分 | **≤2 分** | ローカル推論・C++/Python |
| librosa onset detection (参考) | 4 分 | **≈実時間以下** | 特徴量抽出のみ |

**MVP α 目標案**  
- 4 分曲あたり生成完了 **≤60 秒**  
- 失敗率 **<5 %**

---

# 回答
| # | 項目 | 回答内容 |
|---|------|---------|
| 1 | YouTube API 利用制限 | 調査内容を参考にすること |
| 2 | 譜面自動生成アルゴリズムの精度目標 | 5分以下を目標とし，今後の課題として生成時間の短縮を掲げる |
| 3 | 長尺動画 (>15 分) のハンドリング方針 | 10分を超える動画は警告を出したのち，10分でカットする．プレイ時間15分は，複数曲遊んでもらうことで目標達成を目指す． |