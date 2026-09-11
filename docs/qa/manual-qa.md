# Manual and browser QA — iPhone-first candidate

## Current automated candidate — 2026-09-11

- Unit 128/128、TypeScript `checkJs`、ESLint、Build/Data/Provenance/Evidence/Static/Security/ImagesをPASS。
- 既存E2Eはinstalled Chrome 152.0.7977.83 22/22（16,708.4848ms）、Edge 152.0.4191.66 22/22（16,644.6033ms）、managed WebKit 26.5 22/22（32,808.9665ms）PASS。
- iPhone-focused E2Eはinstalled Chrome 152が20/20（36,526.2435ms）、managed WebKit 26.5が20/20（76,493.9532ms）PASS。390×844、393×852、430×932、375×812、428×926、768×1024、1280×900を巡回し、horizontal overflow 1px以下、44px targets、16px form controls、bottom navigation containmentを確認。
- 日本語IME composition、keyboard相当の390×500 viewport、四辺safe-area、list→detail→backのquery/filter/scroll復元、`visibilitychange` / `pageshow` / `focus` / `online`のsingle-flight回復を確認。
- originを実停止したoffline状態で検索、Collection更新、Backup downloadを行い、同一origin復帰後にdocument reloadなしでstateが残ることを確認。
- Backupの実download/import、不正JSON/future schema非破壊、QuotaExceeded時のmemory/LocalStorage原子性、v15画面から始まる将来Service Worker更新のexplicit handoffとreload-loop guardを確認。複数ページ書込は同一originのexclusive Web Lock内でstrict latest-read → mutation → saveし、holderの後ろへ異なる2 itemを同時待機させて解放後に両方を保持した。この対象caseはinstalled Chrome 152 / managed WebKit 26.5でPASS。旧v14画面からの実v14→v15移行は含まない。
- screen captureはChrome 152とmanaged WebKit 26.5で各27/27。最終manifestは390×844 / 430×932の各13画面と390×500のkeyboard相当1画面を、PNG実寸・route・SHA-256付きで記録。native/custom clearの重複なし、通知と戻るボタンの26px間隔、keyboard時のnavigation退避を確認。
- managed WebKitの途中runは、origin停止中の予期された接続ログを通常failureへ数えた19/20と、scroll/install settle不足による計測raceの18/20だった。origin停止期間だけに限定したログ分類、再描画時のviewport保持、最大scroll到達とSW install settle待ちを追加し、assertionを削除・緩和せず最終20/20とした。
- GitHub Pages相当のrepository subpath gateは5/5 PASS。
- local Lighthouse 13.4.1は91 / 100 / 100 / 100。

## Existing completed browser baseline

- installed Chrome 152.0.7977.83は22/22（16,708.4848ms）、Edge 152.0.4191.66は22/22（16,644.6033ms）、managed WebKit 26.5は22/22（32,808.9665ms）。WebKitはSafariではありません。
- Core操作に加え、アイテム・住民・はにわ・NPC・施設・イベントの横断検索、domain filter、event detail、月別Calendar、住民誕生日、販売場所未特定表示、Collection状態のreload永続化を実ブラウザで確認。
- 320px、375px、390px、430pxでhorizontal overflowなし。44px targetsとaxe critical/serious 0を確認。
- localhostでmanifest、SW v14、old app cache cleanup、unrelated cacheとLocalStorage保持、origin停止後の拡張domain/event検索を確認。
- GitHub Pages実URLでinstalled ChromeによるHTTPS、SW v14、offline reload、主要UI、schema 3 state保持を確認。managed WebKit+iPhone descriptorでもonline reloadと主要UIを確認。
- Firefox managedは通常権限・権限昇格の両方でbrowser process起動前に`spawn UNKNOWN`を返したため`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`。0/22のアプリPASSにもFAILにも数えない。

## Declared scope boundary

2026-09-04のPublic GitHub Pages v14は実配備・実検証済みです。現在のService Worker v15候補のPR、merge、再配備、live検証はすべて`NOT_RUN`です。Physical iPhone/Safari、ホーム画面PWA、実software keyboard / 日本語IME、Safari desktop、iOS/Android実機、VoiceOverを含むreal screen readerも`NOT_RUN`であり、managed WebKit、device descriptor、axeを代替PASSとして扱いません。

v14→v15では旧v14画面に更新noticeがないため、Backupを書き出し、同originのSafari tabとHome Screen PWAをすべて終了してからオンラインで再起動します。durable LocalStorage保持とv15 cacheを確認し、旧sessionのroute/query/scrollは移行保証外として記録します。このphysical iPhone手順は`NOT_RUN`です。

この候補は個人用途の`IPHONE_FIRST_PERSONAL_FINAL_CANDIDATE`であり、一般公開向けRelease Readyの宣言ではありません。Data Version `2026.09.03.3`、1,767 searchable records、保存key `wildWorldCompanionState.v1`、schemaVersion 3、Canonical値は変更していません。

Web Locks APIがないbrowser、またはWeb Locksが無効になるSafari Lockdown Modeでは、複数タブ間の排他を保証しません。この条件での手動QAは、最初にBackupを書き出し、同一originの他タブとHome Screen PWAを閉じ、1画面だけで保存・reload・Backup再読込を確認します。`storage` eventやBroadcastChannelだけで同時書込が安全とは判定しません。
