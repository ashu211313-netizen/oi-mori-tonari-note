# Changelog

## 2026-09-04 — GitHub Pages deployed and verified

- Public repository [ashu211313-netizen/oi-mori-tonari-note](https://github.com/ashu211313-netizen/oi-mori-tonari-note)を作成し、PR CIを通して`main`へmerge。GitHub Actions custom workflowから[恒久HTTPS URL](https://ashu211313-netizen.github.io/oi-mori-tonari-note/)へ配備。
- clean `dist/` builder、forbidden-file/secret/root-path validator、repository subpath Chromium E2E 5/5を追加。CIはUnit 118/118、checkJs、ESLint、Build、artifact validationを通過してからPagesへdeployする。
- iPhone用PWA metaを追加し、Service Worker v13→v14へ更新。保存key `wildWorldCompanionState.v1`、schemaVersion 3、Data Version `2026.09.03.3`、Canonical値は変更なし。
- 実公開URLでHTTPS/HSTS、manifest、icons、SW v14、21/21 precache、公開除外、installed Chrome offline、主要UI、保存保持を確認。live Lighthouseは100/100/100/100。managed WebKit+iPhone descriptorもlive online UIを確認したが、物理iPhone/Safari、Android、real screen readerは未実行でありPASSとは表記しない。

## 2026-09-03 — Personal Final UI & Evidence Finisher

- 歴史的配布本文を監査し、残存acquisition `UNKNOWN` 16→0、evidence-backed edge 1,255→1,271、explicit/categorical 389→405へ更新。16件は終了済み配布・catalog不可として実装したが、community 1 lineageのため`SINGLE_SOURCE`を維持。
- Event補足本文から場所0→5件、reward item link 2→7イベント・3→19 IDsへ拡充。報酬文は証拠のない3件を埋めず9/12を維持。
- どんぐり祭り報酬と、つり大会・ムシとり大会開始時刻の資料差分を発見。`WW-EXP-DISC-001`〜`003`を新規CONFLICTとしてsource claims、field provenance、validator、tests、UIへ同期。
- 10 domain横断Collectionを実装し、type/category/state/acquisition/event/price filters、persistent state、detail/back navigationを追加。Home search、recent search、friendly empty/error/retry、backup feedbackを追加。
- Cream、leaf green、warm yellow、soft blue、rounded cards、tactile controls、natural original SVG motifsによるDesign Systemを全画面へ適用。公式ロゴ・公式アート・外部画像は不使用。real image 0 / honest fallback 1,767。
- Data Version `2026.09.03.3`、Service Worker v13。保存key `wildWorldCompanionState.v1`、schemaVersion 3、Core Canonical変更0、Core CONFLICT 9 fields / 6 registryを維持。
- Unit 113/113、typecheck、ESLint、Build、migration 10/10、Chrome/Edge/managed WebKit各22/22、Lighthouse 94/100/100/100、dependency vulnerability 0。Firefoxは起動前`spawn UNKNOWN`で環境BLOCKED。
- 宣言済みpersonal local/offline scopeを敵対的再監査し、`PERSONAL_FINAL_COMPLETE`と判定。public Release Ready、physical devices、real screen reader、Public HTTPSは宣言しない。

## 2026-09-03 — Content Saturation Finisher

- 日本版NDSアイテム索引の未取り込み分類から果物・カブ・どんぐり13、花31、貝9、便せん63、たぬきち商品13、イベント・回収品12の計141実recordsを追加。items 1,130→1,271。
- 実イベント12件を開催規則・時間規則・内容・報酬原文・特定可能なitem link付きで追加し、横断検索・detail・月別Calendar・住民誕生日へ統合。Events 0→12。
- 根拠付き取得edgeを301→1,255、完全UNKNOWNを829→16へ改善。866件は買値欄のみの`RETAIL_OR_CATALOG_UNSPECIFIED`として販売者・catalog可否を未特定のまま表示。
- 住民148件へWild World明示名簿由来の英語名・種族・性別・英語版口ぐせを追加。日本語名索引で結合し、region `GLOBAL_WW`を維持。表記衝突2件は未登録のまま。
- はにわ127件は出典表のgroup headingをprovenance付きで保持。NPC17件へ場所・出現条件・報酬要点、施設8件へ営業時間・表・増築・条件・報酬を追加。
- 横断検索を1,614→1,767件へ拡張し、exact/prefix優先、取得・誕生日・schedule・営業時間・イベント時間のquick answerを実装。
- Data Version `2026.09.03.2`、Service Worker v12。保存key `wildWorldCompanionState.v1`、schemaVersion 3、core Canonical、CONFLICT 9 fields / 6 registryを維持。
- Unit 107/107、typecheck、ESLint、Build、migration 10/10、Chrome/Edge/managed WebKit各19/19、Lighthouse 95/100/100/100 PASS。Firefoxは起動前`spawn UNKNOWN`の環境BLOCKED。

## 2026-09-03 — Personal Ultimate real-data expansion

- 空の拡張modelを実recordsへ置換。items 1,130、residents 148、gyroids 127、NPCs 17、facilities 8の計1,430件をsource/provenance付きで追加し、coreを含む1,614件を横断検索・detail表示へ統合。
- 住民表記が一致しない2件は`UNKNOWN`として未登録。48 source URLsのoi-mori系統を単一lineageとして扱い、URL数を独立資料数へ水増しせず、検索snippet・別作品・推測値を不採用。
- アイテム301件に明記された取得方法を実装。方法が明記されない829件は`UNKNOWN`。取得edge validatorとreportを追加。
- item acquired/cataloged、gyroid collected、resident/NPC/facilityを含むfavorite stateを追加。保存keyを維持したままschema v1/v2→v3 migrationとbackup round-tripを10/10検証。
- 横断検索タブ、domain filter、detail/back-query、source/provenance表示、Collection操作を実装。拡張moduleはlazy loadし、SW v11がoffline用にprecache。
- 全1,614 recordsへhonest image metadata/fallbackを同期。real image 0、external download 0。local image投入workflowを拡張domainへ対応。
- Unit 102/102、typecheck、ESLint、Build、Chrome/Edge/managed WebKit各17/17、Lighthouse 95/100/100/100 PASS。Firefoxは起動前`spawn UNKNOWN`の環境BLOCKED。
- Data Version `2026.09.03.1`、Service Worker v11。core Canonical変更0、JP independent 14/468、CONFLICT 9 fields / 6 registryを保持。個人利用scopeを`PERSONAL_ULTIMATE_COMPLETE`と判定。

## 2026-09-02 — Personal-use completion pass

- 完了scopeを単一ユーザーのWindows local/offline利用へ限定し、Public HTTPS・App Store・収益化・外部法務reviewをgateから除外。公開向けRelease Readyは宣言せず`PERSONAL_USE_COMPLETE`を新設。
- 全184 current entitiesへtruthful image metadataを追加。local folder scan、manifest、validator、lazy loading、固定aspect ratio、missing/error fallback、same-origin image runtime cacheを実装。画像corpus未提供のためavailable 0 / fallback 184を明記。
- CONFLICT UIを「未解決・確認済みとして扱わない」へ強化。9 fields / 6 registry、Canonical変更0、Data Version `2026.09.01.4`を保持。
- items、residents、gyroids、NPCs、facilitiesへ空のprovenance-ready modelを追加。未確認値・件数は追加していない。
- Service Worker v9→v10。storage key `wildWorldCompanionState.v1`、schemaVersion 2は不変。
- Unit 89/89、typecheck、ESLint、Build、Chrome/Edge/managed WebKit各13/13、Lighthouse 97/100/100/100 PASS。Firefox 153はbinary取得後もhostで`spawn UNKNOWN`のため環境BLOCKED。

## 2026-09-02 — Zero Blockers evidence and release-gate audit

- Live Baseline 73/73、JP independent 14/468、blockers 454、claims 693、278/167/9、registry 6、SW v8を再現。
- 468 fieldsへEvidence Sufficiency class、Critical/High risk、current claims→web→archive→bibliography→game-data→hardware→unresolvedのL1〜L7、field-specific blocker rationaleを追加。blockers 454→454、解除0。
- 全6 CONFLICTをTribunalで再審理し、6 registry / 9 fields、resolved 0、Canonical変更0を保持。Data Version `2026.09.01.4`は不変。
- Migration/backupを9ケースへ拡張し、legacy/v1/v2、malformed/corrupt/future、impossible state repair、failed import non-mutation、SW-version independenceを回帰化。保存key/schemaは不変。
- CSPへframe/form制約、local-only privacy disclosure、HTTPS source-link check、credential scan、public header example、HTTPS verifierを追加。依存脆弱性0、license metadata 180/180。
- Service Worker v8→v9。Chrome/Edge/managed WebKitは各11/11。WebKit offlineはorigin実停止でPASS。Firefox current v9は4/11後に失敗しfocused isolationでも閉じられずBLOCKED。
- Safari/iOS/Android実機、real screen readers、public HTTPS、ADMJ hardware conflict検証のHuman Verification Kitとmachine result schemaを追加。
- Unit 81/81、typecheck、lint、build、Lighthouse 98/100/100/100、offline frozen clean install PASS。外部blockersを残しBeta Candidateを維持。

## 2026-09-02 — Final20 hardening pass

- Baselineを現物から再現し、73/73、TypeScript、ESLint、Build/Data/Provenance/Static/SecurityをPASS。468 fields、693 claims、JP独立2資料14/468、SINGLE_SOURCE 278、CORROBORATED 167、CONFLICT 9 fields / 6 registryを確認。
- 残る454 fieldsを安定順の `final20-field-queue.json` として生成し、verified 14 fieldsの混入を防ぐ回帰テストを追加。追加候補のSource Lineageを監査したが、独立性・JP適用性が不足するためstatus、Canonical、Conflict数を変更せず保持。
- Service Worker cacheをv8へ更新。v7以前のapp cacheだけを削除し、無関係cacheと既存LocalStorageを保持する実ブラウザupdate E2Eを追加。
- 保存backupのnormalize→serialize→re-import回帰、prototype-control key除去、security/privacy validatorを追加。保存キー `wildWorldCompanionState.v1` とschemaVersion 2、Data Version 2026.09.01.4は不変。
- 320pxのWebKit実測で44px未満だったsmall buttonを修正。Chrome 152、Edge 152、Pixel 7相当Chrome、iPhone 14相当Chromeは各11/11。WebKit 26.5は10/11、offline reloadのみrunner内部エラー。Firefox 153はlaunch timeout。
- Lighthouse 98/100/100/100、依存脆弱性0、offline frozen-lockfile clean installと全検証をPASS。
- Safari/iOS/Android実機、実screen reader完走、公開HTTPS、IP法務は未検証のまま保持し、分類をBeta Candidateに据え置き。

## 2026-09-01 — Original Source Hunt pass

- `START_HERE_CODEX_MASTER_CONTROLLER.md` と `EXECUTION_QUEUE.md` に従い、Baseline 64/64、Data Version 2026.09.01.3、SW v6、468 fields、652 claims、JP独立2資料0/468を現物から再現。
- 13 sourcesへoperator、publisher、first publication、upstream、citation、lineage signals、archive statusを追加し、全source pair監査をValidator化。
- Landscapeの本人捕獲価格24 claims、hot*cocoaの本人捕獲価格17 claimsを追加。両資料が重なる魚売値14 fieldsだけを `MULTI_SOURCE_VERIFIED` へ昇格。
- Source claims 652→693、sources 13→15、pair audits 0→105、qualified independent pair 0→1、JP独立2資料0→14。
- StatusをMULTI_SOURCE_VERIFIED 14 / CORROBORATED 167 / SINGLE_SOURCE 278 / CONFLICT 9へ更新。Canonical値、Conflict registry 6、保存key、schemaVersionは変更なし。
- Validatorを、弱い補助claimの併記を許しつつ、検証済み判定には同値のJP audited-independent pairを必須とするよう修正。回帰テストを68件へ拡張。
- Data Versionを2026.09.01.4、Service Worker cacheをv7へ更新。
- Chrome/Edge/Pixel 7相当/iPhone 14相当Chrome E2E各10/10。Firefoxはlaunch timeout、WebKitはlaunch直後exit。Lighthouse 98/100/100/100、依存脆弱性0。

## 2026-09-01 — JP Evidence War Room pass

- 468 critical fieldsと652 source claimsをlive dataのstable sortで全件ledger化。
- `distinctGroupAgreement` 181と`auditedIndependentAgreement` 0を分離し、group名だけの独立性過大評価を防止。
- 13 source bodyに `independenceStatus`、根拠、body audit statusを追加。Nookipedia Forgeryはdependent、他は独立上流未証明としてpossibly_dependent。
- 日本語Wild Worldの追加売値表を確認したが、共通攻略本由来を排除できずCanonical・Conflict数を変更せず保持。
- Unitを64件へ拡張し、War Room field/claim queue完全性と未証明独立性の非昇格を回帰検証。
- Data Versionを2026.09.01.3、Service Worker cacheをv6へ更新。Canonical値・保存key・schemaVersionは変更なし。
- Chrome/Edge/Pixel 7相当/iPhone 14相当Chrome E2E各10/10、Lighthouse 99/100/100/100。iPhone descriptorはSafari/iOS実機として数えない。
- FirefoxはSWGL launch timeout、WebKitは公式archive再取得後もhost/launch failureとしてBLOCKEDを保持。

## 2026-09-01 — hardened Beta Candidate

### Data Verification V2 audit

- critical field claimを8/468→468/468、source claimを12→652へ拡張。
- sourceType、independenceGroup、region、Raw/Normalized、historyを機械可読化。
- provenance/conflict/readiness validatorとreport commandを追加。
- StatusをCORROBORATED 181 / SINGLE_SOURCE 278 / CONFLICT 9へ再分類。JP独立検証は0/468。
- 6 CONFLICTは未解決のまま保持し、名画2作品への影響でfield instanceを8→9へ修正。
- UIでCONFLICT、単一資料、地域未確定の補強を明示。
- Lighthouseで見つかったnav contrastとclock accessible-nameを回帰テスト付きで修正。
- Service Worker cacheをv5、Data Versionを2026.09.01.2へ更新。Canonical値と保存schemaは変更なし。

### Fixed

- 同一開始・終了時刻を暗黙の終日扱いにしないよう出現判定を修正。
- 天候と特殊条件を構造化評価し、不明条件を「条件あり」として扱う。
- 検索再描画後のfocus/selection復元、かな正規化、不可視filter除去。
- カレンダー閲覧が保存済みゲーム時計を変更しないよう分離。
- 不正backup、将来schema、不正日付、非有限数量、prototype keyを拒否／修復。
- 寄贈・所持・捕獲・偽物名画の不変条件と価格計算を強化。
- 推薦から現在捕獲不可を除外し、tie-breakを決定的にした。
- Service Workerの同一origin制限、asset 503、navigation fallback、cache更新を修正。
- CSP、referrer、ARIA、44px target、秋テーマcontrastを改善。

### Added

- 機械可読な6 discrepancy / 652 source claims / 468 field provenance。
- unit/contract 62件、Chrome/Edge/Android相当E2E 10件、axe、offline/PWA test。
- TypeScript checkJs、ESLint、data/static build、Lighthouse、lockfile。
- 設計、データ監査、QA、release documentation。

### Preserved

- LocalStorage key `wildWorldCompanionState.v1`。
- 未解決データ値とCONFLICT/BLOCKERの可視性。
