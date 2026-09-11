# Known uncertainty — iPhone-first candidate

## Current candidate status

- 現在の作業ツリーはService Worker v15の`IPHONE_FIRST_PERSONAL_FINAL_CANDIDATE`です。一般公開向けRelease Readyではありません。
- 2026-09-11の最終ローカル実測では、Unit 128/128、TypeScript checkJs、ESLint、Build、Data、Provenance、Evidence、Static、Security、ImagesがPASSしています。既存E2Eはinstalled Chrome 152.0.7977.83 22/22（16,708.4848ms）、Edge 152.0.4191.66 22/22（16,644.6033ms）、managed WebKit 26.5 22/22（32,808.9665ms）です。focused iPhone E2Eはinstalled Chrome 20/20（36,526.2435ms）、managed WebKit 26.5 20/20（76,493.9532ms）、screen captureは両engine各27/27、Pages subpathは5/5、local Lighthouse 13.4.1は91 / 100 / 100 / 100です。既存20-case内のmulti-tab試験はWeb Lock holder下の異なる2 item同時writeへ置き換え、高速2回タップの順序保持も両engineで再PASSしました。
- managed WebKitの最終20/20前には19/20の接続ログ監視失敗と18/20のscroll/計測raceがありました。origin停止期間だけのログ分類、viewport保持、最大scroll/install settle待ちを実装し、test assertionを弱めず解消しました。
- v15候補のPR、merge、GitHub Pages再配備、実公開URLのcache/offline/update/persistence検証はすべて`NOT_RUN`です。現在公開中のv14 PASSは履歴としてのみ使用します。
- Physical iPhone/Safari、ホーム画面PWA、実software keyboard / 日本語IME、実background/resume、VoiceOver、Android実機は`NOT_RUN`です。Playwright WebKit、device descriptor、composition event、viewport縮小、axeは代替PASSではありません。
- Firefoxは通常権限・権限昇格の両方でbrowser process起動前に`spawn UNKNOWN`となり、`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`です。0/22のアプリFAILでもPASSでもなく、成功件数へ数えません。
- 自動resume試験はevent burst、origin-stop、session復元を扱いますが、iOS process eviction、memory pressure、OS再起動を再現していません。
- Backup download/importはPlaywrightで実byteを確認しましたが、iOS SafariのFiles / Share sheet操作は未確認です。
- screenshotではnative/custom clearの重複なし、通知と戻るボタンの26px間隔、keyboard navigation退避を確認しました。これは実Safari描画の代替ではありません。
- v14→v15の初回移行では、旧v14画面にv15の更新noticeがありません。v15は全v14 client終了までwaitingし、次回起動でactivateします。Backup後に全Safari tab / Home Screen PWAを終了してオンライン再起動する必要があります。durable LocalStorageは保持対象ですが、旧v14 sessionのroute / query / scroll移行は保証しません。この手順のphysical iPhone Safari実行は`NOT_RUN`です。v15画面のnotice / explicit handoffはv15→v16以降の将来更新用です。

## Data

- Coreの468/468 claim coverageはverifiedを意味しません。JP audited-independent verificationは14/468、SINGLE_SOURCE 278、CORROBORATED 167、strict public data blocker metricは454です。
- Core CONFLICT 9 field instances / 6 registryは未解決です。UIは非断定表示を維持し、deploymentによるCore Canonical変更は0です。
- 住民`カルビ/カルピ`、`モモコ/ももこ`は表記不一致を解消できず、2件とも未登録の`UNKNOWN`です。確認済み148件だけを実装しています。
- Acquisition `UNKNOWN`は16→0ですが、最後の16件はcommunity 1 lineageの歴史的配布記録であり`SINGLE_SOURCE`です。独立検証済みとは表記しません。
- Acquisition 1,271件のうち866件は買値欄のみが根拠です。販売場所・販売者・catalog可否は未特定で、UIも「販売場所は未特定」と表示します。
- Event reward textは9/12、known locationは5/12です。確認できない空欄は「資料に記載なし」と表示します。
- Expansion event CONFLICTは3件です。どんぐり祭りの報酬表記と、つり大会・ムシとり大会の開始時刻を、数字を良く見せるために解消していません。

## Images and rights

- 利用可能なユーザー所有画像corpusは提供されていないため、real 0 / fallback 1,767です。
- fallbackは本実装のoriginal SVG/CSS motifです。公式ロゴ・公式アート・公式UI・外部画像はコピーしていません。
- 本アプリは任天堂の公式製品ではありません。外部法務レビューや権利者による認証は受けていません。

## Platform and external validation

- Installed Chrome 152は2026-09-04公開URLでHTTPS、SW v14、offline reload、主要UI、saved-state保持をPASSしました。これは過去配備の記録です。
- Managed WebKit 26.5+iPhone descriptorは2026-09-04公開URLでHTTPS、SW、online reload、主要UI、saved-state保持をPASSしましたが、物理iPhone/Safari PASSではなく、v15 live PASSでもありません。
- Windows版managed WebKitはhost trust storeを読めないため、Nodeとinstalled Chromeで実証明書を厳格検証した後にtoolchain内だけでTLS trust bypassを使用しました。
- 実公開URLのmanaged WebKit offline reloadはtool-internal errorとなり、live WebKit offline PASSとはしません。repository-pathのoffline動作は別のlocal WebKit E2Eで検証しています。
- Firefox managedはbrowser process起動時に`spawn UNKNOWN`となり、app assertionを開始できませんでした。`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`で、PASSにもアプリFAILにも数えません。
- 物理iPhone/Safari、Home Screen PWA、実keyboard / 日本語IME、Android実機、real screen readerは未実行です。axe、Lighthouse、device descriptorは代替PASSではありません。
- GitHub Pagesではrepository-controlled custom response headersを設定できません。実documentはCSP metaとno-referrer metaを持ち、GitHub endpointはHSTSを返します。
- `actions/configure-pages@v5`は成功していますが、run logにはaction内部Node 20から強制Node 24への移行警告が残ります。workflow failureではありませんが隠しません。
- PCとiPhoneはdevice-local stateが分かれます。進行状態は既存Backup export/importで移行します。
- 複数タブのlost update防止は、同一originのexclusive Web Lock内でstrict latest-read → mutation → saveできることが前提です。Web Locks APIがないbrowserやSafari Lockdown Modeでは単一タブ内の保存は維持しますが、cross-tab排他は保証しません。`storage` eventやBroadcastChannelは通知にとどまり、mutexの代替ではありません。この環境ではBackupを先に保管し、同一保存領域を複数画面から同時編集しないでください。
