# Human Verification Kit — Personal Final v13

このKitは、このWindows hostだけでは完了できない検証を別の監査者が再現し、機械結果と混同せず返却するためのものです。`PASS` は全必須stepと証拠が揃った場合だけ記入します。Emulation、axe、localhost、Playwright WebKitを、それぞれ実機、実screen reader、public HTTPS、Safariの代用にしません。

## 共通の対象固定

1. release ZIPと同梱manifestのSHA-256を再計算し、一致を記録する。
2. Node.js 22以上／pnpm 11.19.0で `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm run typecheck`、`pnpm run lint`、`pnpm run build` を実行する。
3. `sw.js` が `wild-world-companion-v13`、`src/data.js` がData Version `2026.09.03.3`、保存キーが `wildWorldCompanionState.v1`、schemaVersionが3であることを記録する。
4. 端末、OS、browser/screen-reader版、locale/timezone、実行日時、package hashを `artifacts/qa/human-verification-result-template.json` のコピーへ記録する。
5. 編集・切り抜き前のscreen recording、screenshot、console/network export、失敗も含む操作logを保存する。個人情報は収集前に除去する。

## Safari desktop / iOS / Android

各targetは別resultとして実行します。Safari desktopは現行macOS Safari、iOSは実iPhone/iPadのSafari、Androidは実端末Chromeを使用します。

1. 認可済みHTTPS URLを新しいprivate browsing/profileで開き、タイトル、主要nav、manifest、installabilityを確認する。
2. 日本語で「サメ」を1文字ずつ入力し、focusと結果が維持されることを確認する。
3. サカナで「淡水」を選びムシへ切替え、hidden filterが残らないことを確認する。
4. game日時を設定し、月calendarを切り替え、reload後もgame日時と保存状態が維持されることを確認する。
5. サメを寄贈し、捕獲が自動成立し、reload後も両方が維持されることを確認する。
6. `すてきなめいが` を偽物にし、寄贈不可と10ベル計算を確認する。
7. 検索タブでアイテム・住民・はにわ・NPC・施設・イベントを各1件検索し、detail、出典、back-queryを確認する。月Calendarでイベントと住民誕生日を確認し、アイテムの入手済み/カタログ済み、はにわの収集済み、住民のお気に入りを設定してreload後も保持されることを確認する。
8. 旧v12配布物を先にinstallしてschema v3 stateを作成し、その後v13へ更新する。v12 app cacheの除去、v13 cache、core/expansion state、無関係origin dataの保持を確認する。v1/v2 backupのv3移行は別ケースで確認する。
9. online load後にnetworkを実際に切断し、appを終了・再起動してhome、いきもの検索、拡張domain検索が使えることを確認する。automationのoffline flagだけでは不可。
10. 320 CSS px相当のportraitでhorizontal overflow、44px未満の操作target、safe-area重なりを確認する。
11. install、standalone起動、update、offline、OS再起動後の再起動をscreen recordingに含める。

Safari desktop、iOS、Androidは互いに独立したPASS/FAILです。iOS ChromeはWebKitでもSafari PWAの代用PASSにはしません。

## 実screen reader

Windows Narrator、Windows NVDA、macOS/iOS VoiceOver、Android TalkBackを別々に記録します。音声を聴取できる監査者がbrowserの実focusを操作します。

1. title→banner→main→bottom navigationのlandmark順を読み上げで確認する。
2. 見出し一覧からhome、いきもの、博物館、売却、月へ移動できることを確認する。
3. game時計、weather、filter、collection buttonの名前、role、pressed/disabled stateを確認する。
4. サメ検索、寄贈、偽物選択、未寄贈warning、CONFLICT noticeを読み上げで識別する。
5. JSON importの成功と不正JSON失敗通知をkeyboard/touch screen-reader操作だけで完了する。
6. focus消失、重複読み、unlabeled control、読み上げ不能なstate変化を全件記録する。

axeとaccessibility treeのPASSは参考添付に留め、上記の音声・focus操作が未完なら`NOT_RUN`または`FAIL`です。

## Public HTTPS / PWA

所有または明示認可されたdeployment targetだけを使用します。配備前に `deployment/_headers.example` をtargetの設定形式へ移し、ZIP hashとcommit相当IDを固定します。

1. PowerShellで `$env:WW_PUBLIC_URL='https://...'` を設定してから `pnpm run verify:public-https` を実行し、CSP/HSTS/nosniff/referrer/permissions、manifest、SW v13、iconを検証する。
2. HTTP URLがHTTPSへredirectし、final URL・certificate chain・expiry・hostname一致を保存する。
3. clean profileでinstallし、DevTools Application/Storageとnetwork HARを保存する。
4. v12→v13 update、保存state保持、offline cold start、拡張・イベント検索、再接続後updateをSafari/iOS/Androidの実targetでも実行する。
5. CDN/proxyが`sw.js`を長期cacheせず、`index.html`とunhashed assetsがrevalidationされることをresponse headerで確認する。

Quick Tunnelやlocalhostだけなら`NOT_RUN`のままです。

## 日本版ADMJ実機・CONFLICT

真正な日本版cartridgeのgame code/revision、DS本体、game内日時を連続videoで示します。改造ROM、別region、別作品、emulationは実機証拠として不採用です。各fieldの詳細planとfalsification条件は `artifacts/data-audit/zero-blockers-conflict-tribunal.json` を正本とします。

- WW-DISC-001／006: サケ・キングサーモンについて9月1日、15日、16日、30日の河口と川を各境界最低30 spawn opportunitiesで記録する。
- WW-DISC-003: ヤママユガを取得し、たぬきち売却提示値を独立saveまたは別cartridgeを含む最低2観測で記録する。
- WW-DISC-004: ヤママユガの8月末／9月初／9月末／10月初、19:00と04:00境界を各最低30 opportunitiesで記録する。
- WW-DISC-005: ミツバチの8月末／9月初／9月末／10月初、08:00と17:00境界を各最低30 opportunitiesで記録する。
- WW-DISC-002: `ゆうめいなめいが` と `たいへんなめいが` の購入店、商品枠、購入前情報、購入後の寄贈／売却結果を独立saveまたは別cartridgeで最低2観測ずつ記録する。

捕獲できなかったことだけでは不在を証明しません。試行数、失敗、reset、天候、場所、日時、観測者を欠く結果はCanonical変更に使いません。提出物はSource Claim化し、lineage、region、raw/normalized/canonical、confidence、discrepancy、adoption reason、test、Data Version、SW、release notesを同時更新してから再判定します。

## 返却と判定

結果JSON、raw evidence、SHA-256一覧を `human-results/<target>/<YYYY-MM-DD>/` に置きます。別監査者はresultをrepoへimportする前にhash、target identity、全必須step、失敗記録を確認します。一部成功は`PARTIAL`であり、Release GateのPASSではありません。
