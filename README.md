# おい森 となりノート — GITHUB_PAGES_DEPLOYED_AND_VERIFIED

Nintendo DS日本版『おいでよ どうぶつの森』向けの、単一ユーザー・端末内保存型PWAです。サカナ・ムシ・化石・名画に加え、アイテム、住民、はにわ、NPC、施設、イベントを横断検索し、出現判定、博物館記録、売値判断、取得方法、Collection、月別イベント・住民誕生日、バックアップを扱います。

現在の配備分類は **`GITHUB_PAGES_DEPLOYED_AND_VERIFIED`** です。`PERSONAL_FINAL_COMPLETE`の実データ、検索・Collection・Calendar、保存、offline動作、Design Systemを維持したまま、public GitHub repository、PR gate、CI、GitHub Pages HTTPS、repository-path PWA、実公開URLの検証を完走しました。これはApp Store配布、外部法務レビュー、全データ検証済み、物理iPhone/Safari検証済みを意味しません。

468/468 claim coverageは468/468 verifiedではありません。JP audited-independent verificationは14/468、従来の厳格な公開向けblocker指標は454、CONFLICTは9 field instances / 6 registryです。未確認値を推測で確定せず、CONFLICTはUI上でも「未解決・確認済みとして扱わない」と表示します。

## 公開版

**[おい森 となりノートを開く](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)**

iPhoneではSafariで公開版を開き、共有から「ホーム画面に追加」を選びます。初回取得には通信が必要ですが、その後の通常利用はPC、PowerShell、Node server、tunnel、同一LANを必要としません。保存状態は各端末のブラウザ内にあるため、PCとiPhoneの間で移す場合は既存のBackup書き出し／読み込みを使います。

## ローカル開発

Node.js 22以上とpnpm 11.19.0を使用します。

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

ブラウザで `http://127.0.0.1:8765/` を開きます。保存キーは既存の `wildWorldCompanionState.v1` のままです。schemaVersion 3はv1/v2保存を移行し、アイテムの入手済み・カタログ済み、はにわの収集済み、各拡張domainのお気に入りを保存します。

## 実装済みデータ

| Domain | 実records | 検索可能 | 状態管理 |
|---|---:|---:|---|
| サカナ / ムシ / 化石 / 名画 | 56 / 56 / 52 / 20 | 184 | 捕獲・所持・鑑定・真贋・寄贈 |
| アイテム | 1,271 | 1,271 | 入手済み・カタログ済み・お気に入り |
| 住民 | 148 | 148 | お気に入り |
| はにわ | 127 | 127 | 収集済み・お気に入り |
| NPC / 施設 | 17 / 8 | 25 | お気に入り |
| イベント | 12 | 12 | お気に入り・月別カレンダー |

合計1,767件が横断検索・detail・Collection表示に対応します。拡張実recordsは1,583件です。根拠付き取得edgeは前回1,255→1,271、完全UNKNOWNは16→0、明示・分類付き取得文は389→405です。最後の16件は歴史的キャンペーン配布本文に基づき、終了済み配布・カタログ不可として実装しました。ただし単一community lineageのため`SINGLE_SOURCE`を維持しています。866件は買値欄だけが根拠で、販売店・カタログ可否を特定していません。住民は資料間で表記が一致しない2件（カルビ/カルピ、モモコ/ももこ）を未登録の`UNKNOWN`として残します。

イベントは12件のまま、既知の場所0→5件、報酬item link 2→7イベント（3→19 item IDs）へ改善しました。報酬文は証拠のない3イベントを埋めず9/12です。どんぐり祭りの報酬説明、つり大会・ムシとり大会の開始時刻に資料差分が見つかったため、3件を新規`CONFLICT`としてUIとprovenanceへ明示しました。

## ローカル画像

画像は外部から自動取得しません。個人保有の利用可能な画像を、stable entity idをファイル名にして `assets/fish/`、`assets/bugs/`、`assets/fossils/`、`assets/art/` 等へ置きます。例: `assets/fish/fish-shark.webp`。

```powershell
pnpm run sync:images
pnpm run validate:images
```

現時点の登録画像は0件で、1,767エンティティすべてが明示的な「画像未登録」fallbackを使います。偽のパスや外部画像はなく、外部から画像を取得していません。詳しくは [画像README](assets/README.md) を参照してください。

## 検証

```powershell
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run report:migration-matrix
pnpm run report:security-release
pnpm run report:expansion
pnpm run report:saturation
pnpm run report:final-personal
pnpm run lighthouse
pnpm run report:ultimate-gate
```

Unitは118/118 PASSです。`test:e2e:report` は `WW_BROWSER_EXECUTABLE`、`WW_BROWSER_TYPE`、`WW_DEVICE` で対象を選べ、Chrome、Edge、managed WebKitで各22/22 PASSです。GitHub Pages相当のrepository subpath gateは5/5 PASS、実公開URLはinstalled ChromeでHTTPS／SW v14／offline／主要UI／保存保持を検証済みです。managed WebKit+iPhone descriptorは実URLのonline reloadと主要UIを検証しましたが、物理iPhone/Safari PASSではありません。FirefoxはこのWindows hostでアプリassertion開始前に`spawn UNKNOWN`となり、環境BLOCKEDとして残しています。

## 出典と再生成

拡張recordsは日本版Wild Worldを明示する取得済みHTML本文から抽出し、source claim、region、lineage、content SHA-256を保持します。source registry 58件、lineage 5件です。`oi-mori.com/nds/`配下54 URLはURL数にかかわらず単一lineageとして扱い、独立資料数を水増ししていません。住民の英語名・種族・性別はWild World明示名簿を日本語名索引で結合し、JP専用事実とは表記しません。検索snippetはCanonical Evidenceに使わず、別作品の値も流用していません。再取得が必要な場合だけ`pnpm run research:expansion`を実行します（networkが必要で、通常buildには含めません）。詳細は [拡張Provenance](docs/data/expansion-provenance.md) を参照してください。

## ドキュメント

- [個人利用判定](docs/release/readiness.md)
- [Personal Final実行報告](PERSONAL_FINAL_REPORT.md)
- [最終UI/UX QA](docs/qa/ui-final-report.md)
- [Content Saturation実行報告](FINAL_CONTENT_SATURATION_REPORT.md)
- [機械可読なUltimateゲート](docs/qa/personal-ultimate-readiness.json)
- [検証ログ](docs/qa/verification-log.md)
- [GitHub Pages配備](docs/deployment/github-pages.md)
- [実公開URLの検証記録](docs/deployment/verification.md)
- [既知の不確実性](docs/release/known-issues.md)
- [データ採用ポリシー](docs/data/canonical-policy.md)
- [Provenance](docs/data/provenance.md)
- [アーキテクチャ](ARCHITECTURE.md)

本プロジェクトは任天堂の公式製品ではありません。ゲーム名・作品名・関連商標は各権利者に帰属します。
