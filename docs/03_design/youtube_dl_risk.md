以下は **YouTube 動画から音声ストリームを取得する目的で `youtube‑dl` を使う際の “契約上・ライセンス上の懸念点”** を整理した Markdown ドキュメントです。必要に応じてコピーして `.md` ファイルとして保存してください。

---

## 概要

`youtube‑dl` 自体は _OSS（Unlicense／一部 GPLv3）_ で自由に利用できますが、**YouTube 側の規約が「動画・音声のダウンロードや技術的保護手段の回避」を明示的に禁止**しています。また、過去には RIAA が DMCA §1201 を根拠に `youtube‑dl` を GitHub から削除させようとした事例もあり、「著作権侵害を助長するツール」としての扱いが争点になりました。結果として、**ソフトウェアを所持・配布すること自体は違法でない**一方、**実際にダウンロードして利用すると “契約違反” となりうる**点が最大のリスクです。([YouTube][1], [Google for Developers][2], [The GitHub Blog][3])

---

## 1. `youtube‑dl` の基本情報とライセンス

| 項目           | 内容                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------- |
| 本体ライセンス | **Unlicense（パブリックドメイン相当）** ([GitHub][4])                                             |
| 代表的フォーク | `yt‑dlp`（同じく Unlicense）や各種 GUI ラッパー（多くは **GPLv3**） ([GitHub][5], [GitHub][6])    |
| 主な機能       | 直接 Web リクエストを行い DASH/HLS マニフェストを解析、動画・音声ファイルを取得してローカルへ保存 |

> **注意** : Unlicense なので _自社プロダクトへの組み込み制限は基本的に無し_。しかし GPL で配布されている派生 GUI とソースを混在させると **GPL のコピーレフト義務**が生じる可能性があります。([GitHub][5])

---

## 2. YouTube 利用規約上の制限

### 2‑1 YouTube Terms of Service (2025‑03‑17 版)

- 「視聴者は _個人かつ非商用目的_ での視聴に限定される」
- **禁止行為 #1** : _“access, reproduce, **download** … any Content except as specifically permitted by the Service”_
- **禁止行為 #2** : _“circumvent … features that prevent or restrict the copying of Content”_ ([YouTube][1])

→ `youtube‑dl` で音声を保存すると **TOS § “Permissions and Restrictions”** に反する。

### 2‑2 YouTube API Services Terms & Developer Policies

- API 経由でも **「ダウンロードや回避を目的とするクライアントは禁止」** と明記 ([Google for Developers][2], [Google for Developers][7])
- 公式 API キーを用いても「動画本体データを取得して保存する」動作は _サービス仕様外_。

> **結果** : `youtube‑dl` は公式 API を用いないスクレイピング方式であり、
> API 利用許諾を得ているわけではない。

---

## 3. DMCA §1201 と過去の法的紛争

| 年            | 主体         | 概要                                                                                                                                  |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **2020/10**   | RIAA         | GitHub へ DMCA 1201 通知を送り `youtube‑dl` レポジトリを一時削除 ([ソフトウェア自由保護団体][8], [Electronic Frontier Foundation][9]) |
| **2020/11**   | GitHub + EFF | 「暗号化を回避していない」「正当用途が多数ある」と反論し復活 ([The GitHub Blog][3], [Electronic Frontier Foundation][9])              |
| **2022‑2024** | 音楽出版社   | ドイツなどで類似訴訟（stream‑ripping サイトやツールを対象） ([Electronic Frontier Foundation][10])                                    |

> **ポイント** :
> _ツールの公開_ は適法と判断されたが、**“DRM を回避して実際に取得する行為”** が
> DMCA §1201 違反になり得る、という立場は維持。

---

## 4. 代表的な訴訟・摘発事例

- **YouTube‑mp3.org（2016 米国訴訟）** — RIAA 等が stream‑ripping を提訴し最終的に和解・閉鎖 ([ipwatchdog.com][11])
- その他、類似サイト閉鎖・ドメイン差押さえ多数（UK Music / IFPI など）
  → 商用サービスが標的になりやすい。

---

## 5. リスク整理

| 観点                | リスク内容                     | 想定される結果                                  |
| ------------------- | ------------------------------ | ----------------------------------------------- |
| **契約（TOS）違反** | 規約 §2‑1 で禁じるダウンロード | Google アカウント停止、API キー無効化、民事請求 |
| **DMCA §1201**      | 技術的保護手段を回避した場合   | 損害賠償または刑事罰（米国）                    |
| **著作権侵害**      | 楽曲を公衆送信・再配布         | 音楽出版社からの請求・訴訟                      |
| **OSS ライセンス**  | GPLv3 派生物を自社アプリに混入 | ソース公開義務が派生する可能性                  |

---

## 6. 実務的な対処・代替策

1. **公式埋め込みプレーヤー** / YouTube Iframe API を利用し、音声のみ再生する
   （ただし広告・ UI を排除できない）。
2. **YouTube Premium「オフライン再生」機能** を社内端末で使う（個人利用限定）。
3. 音声素材が欲しい場合は \*_YouTube Audio Library_ や **ライセンスフリー楽曲サイト** を利用。
4. どうしても抽出する場合は
   _権利者の明示許諾_ を取得し、別経路（例: 直接提供されたマスター音源）を受領。
5. OSS 組み込み時は **Unlicense と GPL の混在**に注意し、派生物のライセンス整合を確認。

---

## 7. まとめ

- `youtube‑dl` の使用自体は OSS ライセンスで自由だが、**YouTube との契約を優先**する必要がある。
- **ダウンロード行為は TOS・API 規約に違反**し、アカウント停止等のリスク。
- RIAA の DMCA 事例が示す通り、**著作権団体が法的圧力を掛ける前例**も存在。
- 事業で利用するなら **公式 API か正規ライセンス音源を使う**のが安全。([Lifewire][12], [Law Stack Exchange][13])

---

## 参考文献

1. YouTube Terms of Service (Mar 17 2025) ([YouTube][1])
2. YouTube API Services Terms of Service ([Google for Developers][2])
3. YouTube API Developer Policies ([Google for Developers][7])
4. GitHub Blog 「Standing up for developers: youtube‑dl is back」 ([The GitHub Blog][3])
5. EFF 「GitHub Reinstates youtube‑dl After RIAA’s Abuse of the DMCA」 ([Electronic Frontier Foundation][9])
6. Software Freedom Conservancy ブログ (DMCA 1201 と youtube‑dl) ([ソフトウェア自由保護団体][8])
7. IPWatchdog 「RIAA vs. YouTube‑mp3 stream‑ripping」 ([ipwatchdog.com][11])
8. Law StackExchange Q\&A on legality of YouTube downloads ([Law Stack Exchange][13])
9. Lifewire 「Is It Legal to Download YouTube Videos?」 ([Lifewire][12])
10. `ytdl‑org/youtube‑dl` README（Unlicense 表記） ([GitHub][4])
11. GUI フロントエンド例 (`youtube‑dl‑batch`, GPLv3) ([GitHub][5])
12. GPLv3 ラッパー例 (`PowerShell‑youtube‑dl`) ([GitHub][14])
13. ライセンス変更議論 Issue #10581 (ytdl‑org) ([GitHub][15])
14. EFF 「ドイツでの youtube‑dl 関連訴訟」 ([Electronic Frontier Foundation][10])
15. Developer Policies (再記載: 回避禁止条項) ([Google for Developers][16])

---

> **免責** : 本資料は 2025‑07‑29 時点の公開情報を元に作成しました。実際の運用前には最新の規約改訂や法改正を必ず確認してください。

[1]: https://www.youtube.com/static?gl=GB&template=terms "Terms of Service"
[2]: https://developers.google.com/youtube/terms/api-services-terms-of-service "YouTube API Services Terms of Service  |  Google for Developers"
[3]: https://github.blog/news-insights/policy-news-and-insights/page/4/?utm_source=chatgpt.com "The latest policy updates for developers - The GitHub Blog"
[4]: https://github.com/ytdl-org/youtube-dl "GitHub - ytdl-org/youtube-dl: Command-line program to download videos from YouTube.com and other video sites"
[5]: https://github.com/TheFrenchGhosty/TheFrenchGhostys-Ultimate-YouTube-DL-Scripts-Collection?utm_source=chatgpt.com "TheFrenchGhostys-Ultimate-YouTube-DL-Scripts-Collection - GitHub"
[6]: https://github.com/rrooij/youtube-dl-qt/blob/master/LICENSE?utm_source=chatgpt.com "license - rrooij/youtube-dl-qt · GitHub"
[7]: https://developers.google.com/youtube/terms/developer-policies "YouTube API Services - Developer Policies  |  Google for Developers"
[8]: https://sfconservancy.org/blog/2020/oct/26/microsoft-github-riaa-youtube-dl/?utm_source=chatgpt.com "Asking Microsoft to resign from the RIAA over youtube-dl takedown ..."
[9]: https://www.eff.org/deeplinks/2020/11/github-reinstates-youtube-dl-after-riaas-abuse-dmca?utm_source=chatgpt.com "GitHub Reinstates youtube-dl After RIAA's Abuse of the DMCA"
[10]: https://www.eff.org/deeplinks/2022/03/campaign-shut-down-crucial-documentary-tool-youtube-dl-continues-and-so-does-fight?utm_source=chatgpt.com "The Campaign to Shut Down Crucial Documentary Tool youtube-dl ..."
[11]: https://ipwatchdog.com/2016/10/19/riaa-copyright-suit-youtube-audio-converter-website/id%3D73922/?utm_source=chatgpt.com "RIAA, UK recording industry groups file copyright suit against ..."
[12]: https://www.lifewire.com/download-audio-from-youtube-8691934?utm_source=chatgpt.com "Discover How to Legally Download and Enjoy YouTube Audio"
[13]: https://law.stackexchange.com/questions/90871/what-is-the-legal-distinction-between-watching-a-youtube-video-in-a-browser-and?utm_source=chatgpt.com "What is the legal distinction between watching a YouTube video in a ..."
[14]: https://github.com/Daveazar531/PowerShell-Youtube-dl?utm_source=chatgpt.com "Daveazar531/PowerShell-Youtube-dl - GitHub"
[15]: https://github.com/ytdl-org/youtube-dl/issues/10581?utm_source=chatgpt.com "Possibility of changing the project license · Issue #10581 · ytdl-org ..."
[16]: https://developers.google.com/youtube/terms/developer-policies?utm_source=chatgpt.com "YouTube API Services - Developer Policies"

# 代替案

以下は **「YouTube 音声を抽出せずに、法的に安全な形で利用・配布できる代替策」** を整理したガイドです。直接ダウンロードを避けつつ、確実にライセンスを満たす手段をまとめました。

---

## 概要

YouTube の利用規約は動画・音声のダウンロードを禁じているため (`youtube‑dl` で取得すると規約違反)。
安全策は **(1) 公式プレーヤーでストリーミング再生のみ行う**、**(2) YouTube が提供するライセンス済み音源を使う**、**(3) 外部のロイヤルティフリー／サブスク音源を使う**、**(4) パブリックドメインや CC ライセンス音源を使う**、**(5) 他社公式 API で合法的にストリーミングする**、**(6) 権利者と直接契約する** の６パターンに大別できる。以下で具体策を解説する。

---

## 1. ストリーミング専用で完結させる

### 1‑1 YouTube IFrame Player API をそのまま使う

YouTube 公認の IFrame Player API は埋め込み再生だけを行い、ダウンロードを伴わない。
利用規約でも “コピーや保存を試みない限り埋め込み利用は許可” と明示。
**ポイント**: プレーヤーを隠したり、音声トラックだけを抽出する行為は回避手段と見なされる恐れがある。

### 1‑2 YouTube Premium のオフライン機能（社内視聴目的）

Premium 会員は公式アプリ内に限定して一時保存が許可されている([Lifewire](https://www.lifewire.com/download-audio-from-youtube-8691934?utm_source=chatgpt.com))。
ファイル抽出や配布は不可。

---

## 2. YouTube が公式に配布するライセンス済み音源

| 公式サービス              | 主な特徴                                                          | 典型的な用途                 |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| **YouTube Audio Library** | YouTube Studio から無償ダウンロード。著作権セーフで広告収益化も可 | 動画や配信の BGM             |
| **Creator Music**         | 曲ごとにライセンス料を支払ってフル収益化可能                      | 商用動画で市販曲を使いたい時 |
| **Shorts Audio Library**  | 60 秒以下の Shorts 用に限定してレーベル公式曲を利用可             | Shorts 制作                  |

> **ヒント**: ライブラリ音源でも“YouTube 内限定”などの条件があるため、使用前に各トラックのライセンス欄を確認する([Lifewire](https://www.lifewire.com/how-to-use-copyrighted-music-on-youtube-11695649?utm_source=chatgpt.com))。

---

## 3. ロイヤルティフリー／サブスク型音源サービス

- **Epidemic Sound** — サブスク契約で無制限に楽曲・効果音を利用でき、YouTube 以外の SNS も包括。
- **Artlist** — “Social” と “Pro” の２種ライセンス。Pro なら商用アプリやクライアント案件にも転用可能。

これらは「ダウンロード→再配布可」が契約で許諾されている点が YouTube と大きく異なる。
料金体系：Epidemic Sound 9.99 USD/月など。

---

## 4. パブリックドメイン & Creative Commons 音源

| ソース                       | 収録規模・特徴                                             | ライセンス         |
| ---------------------------- | ---------------------------------------------------------- | ------------------ |
| **Free Music Archive**       | CC ライセンス中心。トラックごとに条件異なる                | CC BY / CC0 など   |
| **Musopen**                  | クラシック中心に 10 万曲以上の公 domain/CC0 音源を無料配布 | Public Domain / CC |
| **Openverse (旧 CC Search)** | 8 億件以上の CC・PD メディアを横断検索、音源フィルタあり   | CC / PD            |

利用時は **帰属表示や同ライセンス継承義務** の有無を必ず確認する。
参考まとめ記事も便利([Lifewire](https://www.lifewire.com/free-music-downloads-1356648?utm_source=chatgpt.com))。

---

## 5. 他プラットフォーム公式 API で合法ストリーミング

- **SoundCloud API** — “stream ripping 目的での利用は禁止” と明確化。音声を保存せずプレーヤー経由で再生すれば問題なし。
- **Spotify Web API** — メタデータ取得やストリーム制御が可能だが、コピーは禁止。認証フローと DRM を維持したまま組み込む必要がある。

> **注意**: これら API でもキャッシュファイルを抜き取る行為は規約違反になる。

---

## 6. 権利者から直接ライセンス取得

完全オリジナル曲や商業楽曲を採用したい場合は、レーベル・作曲家・音楽出版社と個別契約を結ぶ方法が最も確実。
契約書で **媒体・期間・地域・改変可否** を明文化し、必要なら ISRC 管理や JASRAC 申請も併用。
米国では「フェアユース」適用もあるが用途が限定的でリスクが残る。

---

## 7. 安全利用チェックリスト

1. **ダウンロードせずにストリーミングで完結** (IFrame API 等)。
2. ダウンロードする場合は **ライセンス文面で明示的に許諾** されているか確認。
3. **CC/PD 音源は帰属表示** を忘れない。
4. サブスク型は **URL ホワイトリスト登録** やチャネル指定が必要な場合あり。
5. 商用利用時は **契約書または有料ライセンスを保管**。
6. 迷ったら **法律の専門家** に確認。

---

### まとめ

`youtube‑dl` の代わりに **公式ストリーミング API** と **ライセンス済み音源ライブラリ** を組み合わせれば、ダウンロード禁止条項や DMCA 回避規定に触れずに音声を扱える。YouTube Audio Library や CC／パブリックドメイン音源で足りない場合は、Epidemic Sound・Artlist などのサブスク型サービスを導入し、足りない分は権利者と直接契約するのが最も安全なワークフローである。
