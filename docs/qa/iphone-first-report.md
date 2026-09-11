# iPhone-first QA report

更新日: 2026-09-11
対象: merge commit `aa91a5462694831941c17e4856fb12916a9b2d8f` のGitHub Pages v15
判定範囲: iPhone向け実装、自動回帰検証、公開Pages検証。physical device検証は含めない。

## 結論

390px / 430px を中心とする iPhone-first の実装は、installed Chrome 152 と managed WebKit 26.5 の focused suite 各20/20、および両engineの画面証跡各27/27を通過した。入力中の日本語 IME、safe-area、software keyboard 相当の viewport 縮小、background / resume のイベント集中、offline から online への復帰、Service Worker 更新、Backup、Collection 永続化、list → detail → back の状態復元に専用回帰テストを追加した。

PR #3のmerge、main CI、GitHub Pages再配備、公開URL再検証まで完了したため、個人用途の最終分類は`IPHONE_FIRST_PERSONAL_FINAL_COMPLETE`とする。証拠区分は`EMULATED_VERIFIED` / `LIVE_PAGES_VERIFIED`である。ただしphysical iPhone Safari / Home Screen PWA / 実software keyboard / 日本語IME / safe-area / resume / offline / Backup / VoiceOver / macOS Safari / Androidは`PHYSICAL_NOT_RUN` / NOT CLAIMEDであり、この最終分類はphysical device verifiedを意味しない。

## Merge / public deployment evidence

- PR #3は2026-09-11T08:45:02Zにmerge。merge commitは`aa91a5462694831941c17e4856fb12916a9b2d8f`。
- main CI run `34580717627`とPages run `34580717646`はいずれも`success`。main CIのUnitはdeployment時点の128/128で、live/public validator回帰2件を加えた現行branchの130/130と区別する。
- 公開live verifierは2026-09-11T09:14:43Zに13/13 PASS。installed Chrome 152とmanaged WebKit 26.5を390×844 / 430×932で使用し、horizontal overflow 0px、undersized control / input 0、precache 22/22 HTTP 200、非公開5 path HTTP 404を確認した。
- installed Chromeではoffline Service Worker shellとschema 3 state保持を確認した。managed WebKit 26.5はSafariではない。
- HTTPS validatorは2026-09-11T09:17:33Zに5/5 `PASS_HTTP_CONTRACT`。meta CSPと`no-referrer`を確認した。GitHub Pagesのresponse headerはhost-managedである。
- 公開v15 Lighthouse 13.4.1は97 / 100 / 100 / 100。ローカルv15の91 / 100 / 100 / 100、および2026-09-04公開v14の100 / 100 / 100 / 100は別の履歴として保持する。
- staged v14→v15は`PASS_WITH_HARNESS_RECOVERY`。旧v14 clientが安定し、v14 / v15 cacheが共存することを観測した。元harnessは再openが早すぎてtimeoutしたが、同じpersistent profileで回復を続け、v15 active、v15 cacheのみ、raw state byte-identical、無関係sentinel保持を確認した。timeoutを隠した無条件PASSではない。

## Baseline → after

| 項目 | Baseline | After（ローカル候補） | 証拠 |
| --- | --- | --- | --- |
| iPhone 専用回帰 suite | 専用 suite なし | Chrome 152 / managed WebKit 26.5: 各20/20 PASS | `pnpm test:iphone`、2026-09-08 最終単独run |
| viewport coverage | 390 / 430 の厳密な全画面契約なし | 390×844、393×852、430×932、375×812、428×926、768×1024、1280×900 の 7/7 PASS | `tests/iphone-e2e.mjs` |
| 画面証跡 | iPhone-first 専用 manifest なし | 27/27。390×844 と 430×932 が各13画面、390×500 が1画面 | `artifacts/qa/iphone-first/manifest.json` |
| 横方向 overflow | 390px で長い recent searches 5件時に document width 1085px を再現 | 全7 viewport・主要画面で `scrollWidth - clientWidth <= 1px` | layout contract |
| touch target | Collection の短い chip に 43×44 CSS px を再現 | 可視操作要素は幅・高さとも 44 CSS px 以上 | layout contract |
| input zoom | 入力欄の 16px 契約なし | 可視 `input` / `select` / `textarea` は 16px 以上 | CSS contract + browser geometry |
| safe-area | top / bottom 中心で左右の契約なし | top / right / bottom / left を反映。47 / 11 / 34 / 9px の合成 inset で containment PASS | safe-area geometry case |
| keyboard | fixed bottom navigation の退避制御なし | visual viewport が縮んだ編集中は nav を非表示・操作不能化し、入力欄を viewport 内に維持 | 390×500 keyboard-space case |
| 日本語 IME | composition 中の再描画で input node が切り離され得た | composition 中は node を維持し、確定値を1回だけ反映 | IME composition case |
| list → detail → back | 検索一覧の実測 `scrollY 14400 → 0` | query / filter / route と card anchor・scroll を復元、差は 2px 以内 | search / collection return case |
| resume storm | `visibilitychange` / `pageshow` / `focus` / `online` ごとの回復調停なし | 250ms で集約し single-flight。1回の回復、shell は各1個、保存値と scroll を維持 | lifecycle unit + E2E |
| offline → online | 接続復帰時の専用回復契約なし | origin-stop 中も検索・Collection 更新・Backup が動作し、同一 origin 復帰後も document reload なしで保存継続 | offline origin-stop case |
| 保存失敗 | memory を先に更新するため QuotaExceeded 時に表示と永続値が不一致になり得た | clone → normalize → `localStorage.setItem` 成功後にのみ memory commit | QuotaExceeded atomicity case |
| 複数タブ | 各ページの古い state を全量上書きし、異なる書込の一方が消え得た | 同一originのexclusive Web Lock内でstrict latest-read → mutation → save。古い`storage` eventも現在値の再読込で吸収 | lock holder待機中に異なる2 itemを同時writeし、解放後に両方保持 |
| Service Worker 更新 | v14 が install 時に即 `skipWaiting` | v14→v15は全旧client終了後の次回起動で移行。v15画面から始まる将来更新はnoticeと`SKIP_WAITING`で明示handoff | SW unit / controllerchange E2E、公開staged `PASS_WITH_HARNESS_RECOVERY`。physical v14→v15は`NOT_RUN` |
| cache mismatch | query 付き navigation が個別 cache key になり得た | navigation は scope 相対の canonical `index.html` だけを参照し、query URL を保存しない | SW fetch unit |

## 実装内容

- `viewport-fit=cover`、180×180 の Apple touch icon、standalone manifest を揃えた。
- `100svh` / `100dvh` と四辺の safe-area を使い、notch、横向き、home indicator の余白を shell・notice・bottom navigation に反映した。
- `visualViewport` の resize / scroll と focus を監視し、software keyboard 相当の縮小時は bottom navigation を退避した。
- 検索欄へ明示 label、16px font、44px clear control、`enterkeyhint="search"` を追加した。
- 日本語 composition 中は再描画を保留し、`compositionend` 後の重複 input event を抑制した。
- route ごとの scroll と detail 元 card の位置を記録し、検索条件・Collection filter と一緒に復元した。
- `visibilitychange`、`pageshow`、`focus`、`online` を一括回復へ集約し、時計・永続 state・viewport・更新確認を同期した。
- `pagehide` 前と Service Worker / expansion recovery 前に transient UI session を `sessionStorage` へ保存した。
- 永続 state の全書込を同一originのexclusive Web Lockとタブ内queueに通し、lock取得後にstrictな最新値を再読込してからmutation、normalize、saveする。保存成功後だけmemoryへcommitし、QuotaExceeded、破損保存、future schema、不正importで既存stateを上書きしない。
- `storage` eventは排他ではなく変更通知として使う。eventが遅延しても古い`event.newValue`を採用せず、ローカルwrite queue完了後に現在の保存値をstrictに再読込する。
- Backup download は一時 anchor を DOM に接続してから click し、object URL の revoke を遅延した。
- Service Worker v15は新workerを待機させる。旧v14画面にはv15の更新noticeコードがないため、v14→v15はBackup後に全Safari tab / Home Screen PWAを終了して再起動する。v15画面から始まるv15→v16以降の更新ではnoticeから明示適用し、`controllerchange`前にUI contextを保存して1回だけreloadし、10秒guardでloopを防ぐ。

## 自動検証結果

| 検証 | 結果 | 備考 |
| --- | --- | --- |
| Current branch Unit / contract | 130/130 PASS | strict readerのabsent / empty区別とlive/public validator回帰2件を含む全Node test。main CI deployment時点は128/128 |
| TypeScript `checkJs` | PASS | `pnpm typecheck` |
| ESLint | PASS | `pnpm lint` |
| 通常 browser E2E | 22/22 PASS | installed Chrome。既存機能回帰を含む |
| Pages artifact | 5/5 PASS | build、validator、subpath、offline reload、保存 |
| Focused iPhone E2E — Chrome | 20/20 PASS | installed Chrome 152、31,769.8257ms |
| Focused iPhone E2E — managed WebKit | 20/20 PASS | managed WebKit 26.5、141,474.6255ms、最終単独フルrun |
| Screenshot capture | Chrome 27/27 PASS、managed WebKit 26.5 27/27 PASS | 最終 manifest / PNG は managed WebKit 版 |
| Local Lighthouse 13.4.1 | 91 / 100 / 100 / 100 | Performance / Accessibility / Best Practices / SEO |
| Public v15 live verifier | 13/13 PASS | 2026-09-11T09:14:43Z、Chrome 152 / managed WebKit 26.5、390×844 / 430×932 |
| Public v15 HTTPS validator | 5/5 `PASS_HTTP_CONTRACT` | 2026-09-11T09:17:33Z、meta CSP / `no-referrer` |
| Public v15 Lighthouse 13.4.1 | 97 / 100 / 100 / 100 | Performance / Accessibility / Best Practices / SEO |
| CI / Pages gate definition | PASS（static） | Chromium / managed WebKit各20件。CI captureはengine別27枚artifact |

20-case focused suiteは、7 viewportのlayout contract、390 / 430の主要導線、日本語IME、検索 / Collectionの戻り、resume event storm、origin-stop offline、Backup round trip、不正 / future import非破壊、Web Lock holderの後ろへ異なる2 itemの書込を同時待機させる2ページ競合、keyboard viewport、safe-area、lazy module recovery、QuotaExceeded、v15画面での将来Service Worker controller handoffを検証する。holder解放後は両IDが両ページとreload後の保存に残り、保存keyとschemaVersion 3も不変である。対象caseはinstalled Chrome 152 / managed WebKit 26.5で再PASSした。旧v14画面からの物理端末移行は検証対象外である。

managed WebKitでは最終PASS前に2回の失敗を記録した。19/20は意図的なorigin停止中の既知接続ログを通常failureへ分類した監視上の問題、18/20はscrollとService Worker installのsettle不足による計測raceだった。既知ログの許容範囲をorigin停止期間だけに限定し、回復renderでviewportを保持し、最大scroll到達とinstall完了を明示待機した。操作assertionや合格閾値は削除・緩和せず、最終20/20を得た。

## スクリーンショット証跡

`artifacts/qa/iphone-first/manifest.json` は schemaVersion 1、result `PASS`、captureCount 27 / expectedCaptureCount 27。すべて PNG 実寸、期待 route、実 route、必要な entity ID、SHA-256 を持つ。

- 390×844: Home、Search、Fish detail、Item detail、Resident detail、NPC detail、Facility detail、Event detail、Museum、Collection、Calendar、Settings、Backup の13枚。
- 430×932: 同じ13画面。
- 390×500: `Search with keyboard space` 1枚。
- locale `ja-JP`、timezone `Asia/Tokyo`、game datetime `2026-08-08T19:30`、state schema 3、device scale factor 3、reduced motion で固定した。
- 最終成果物は managed WebKit 26.5 headless による描画である。390×500 は実 iOS keyboard の撮影ではなく、keyboard 表示後の visual viewport 相当である。
- 画面確認ではnative search clearとcustom clearの重複がなく、通知と戻るボタンの間隔は26px、keyboard相当画面ではbottom navigationが退避している。

## 不変条件

- 永続保存 key: `wildWorldCompanionState.v1`（変更なし）。
- state schema: 3（変更なし）。
- data version: 変更なし。
- Canonical game-data: 変更 0件。
- data record / provenance / conflict classification: 変更 0件。
- Supabase / Auth / Realtime: 導入なし。

## 実機・公開環境の境界

| 対象 | 状態 | この結果から言えること |
| --- | --- | --- |
| Physical iPhone Safari | `NOT_RUN` | Chrome / managed WebKit の結果から PASS を推定しない |
| ホーム画面に追加した実 PWA | `NOT_RUN` | standalone manifest と shell は自動検証済みだが、実端末 UX は未確認 |
| 実 iOS software keyboard / 日本語 IME | `NOT_RUN` | composition event と viewport 縮小は自動検証済み。実 keyboard PASS ではない |
| 実iOS safe-area / 回転 | `NOT_RUN` | 合成insetとviewport classのPASSを実端末PASSにしない |
| 実 background / resume / memory pressure | `NOT_RUN` | lifecycle event 合成は自動検証済み。iOS process eviction は未確認 |
| 実offline cold start / OS再起動 | `NOT_RUN` | Chromeの公開offline shell PASSをiOS実機へ外挿しない |
| 実Safari Files UIでのBackup | `NOT_RUN` | 自動download/import PASSを実SafariのShare / Files UI PASSにしない |
| VoiceOver | `NOT_RUN` | DOM / focus の自動回帰を real screen reader PASS と扱わない |
| macOS Safari | `NOT_RUN` | managed WebKit 26.5はSafariではない |
| Android実機 | `NOT_RUN` | desktop Chrome / device viewportの結果からPASSを推定しない |
| v14→v15の実Safari / Home Screen PWA移行 | `NOT_RUN` | LocalStorage保持は設計対象だが、旧sessionのroute / query / scroll保持は保証しない |
| Web Locks非対応 / Safari Lockdown Modeの複数タブ | `OUT_OF_GUARANTEE` | 単一タブの保存は維持するが、`storage` event / BroadcastChannelのみでcross-tab排他を保証しない |

## 最終判定

`IPHONE_FIRST_PERSONAL_FINAL_COMPLETE`（`EMULATED_VERIFIED` / `LIVE_PAGES_VERIFIED`）。公開v15のmerge、CI、deployment、responsive geometry、precache、公開除外、offline shell、schema 3 persistence、HTTPS contractは上記の実測で完了した。physical iPhone / Safari / Home Screen / real keyboard / IME / safe-area / resume / offline / Backup / VoiceOver / macOS Safari / Androidは`PHYSICAL_NOT_RUN` / NOT CLAIMEDのままである。
