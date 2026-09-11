# Responsive and iPhone viewport QA report

更新日: 2026-09-11
対象: iPhone-first responsive shell、全主要画面、入力・navigation
状態: ローカル自動検証および screenshot capture 完了。physical iPhone は未実施。

## 結論

専用 layout contract は 7 viewport × 9画面群、合計63の route / viewport 組合せで PASS した。全組合せで horizontal overflow は 1 CSS px 以下、可視操作要素は 44×44 CSS px 以上、可視 form control は 16px 以上、bottom navigation は通常時に viewport 内、最終 content は navigation に覆われないことを確認した。

390×844 と 430×932 はさらに主要導線を通し、各13画面の screenshot を生成した。390×500 の1枚は software keyboard 表示後の visual viewport 相当を検証するもので、実 iPhone keyboard screenshot ではない。

## Baseline → after

| 項目 | Baseline | After |
| --- | --- | --- |
| 390px long recent searches | document width 1085px を再現 | horizontal delta `<= 1px` |
| 短い Collection chip | 43×44 CSS px を再現 | 最小 44×44 CSS px |
| form control font | iOS zoom 防止の明示契約なし | 可視 input / select / textarea は 16px 以上 |
| safe-area | top / bottom 中心 | 四辺を shell、page、notice、bottom nav に反映 |
| viewport height | `100vh` 中心 | `100svh`、`100dvh`、JS 更新の `--visual-viewport-height` |
| keyboard と nav | fixed nav が keyboard と競合し得た | 編集中の 120px 超の viewport 縮小で nav を非表示・操作不能化 |
| list return | search scroll `14400 → 0` | query / filter / anchor / scroll を復元、差 `<= 2px` |
| exact viewport regression | 専用 matrix なし | 7/7 viewport tests PASS |
| dedicated screenshots | manifest なし | 27/27、PNG dimensions / route / SHA-256 検証済み |

## Viewport matrix

| viewport | 想定範囲 | 結果 |
| --- | --- | --- |
| 375×812 | 小型 iPhone portrait | PASS |
| 390×844 | primary iPhone portrait | PASS |
| 393×852 | 近接幅・高さ差 | PASS |
| 428×926 | 大型 iPhone 近接幅 | PASS |
| 430×932 | primary large iPhone portrait | PASS |
| 768×1024 | tablet / wide responsive boundary | PASS |
| 1280×900 | desktop regression | PASS |

各 viewport で Home、Universal Search、Item detail、Critters、Museum、Sell、Calendar、Collection、Settings / Backup を巡回した。390×844 と 430×932 ではさらに Search → detail → back、Collection search、Calendar、Settings / Backup の主要導線を通し、bottom navigation の位置と高さが遷移前後で 1px 以内であることを確認した。

## Layout contract

自動検証は各画面の下端まで scroll した状態でも次を満たすことを要求する。

- `max(documentElement.scrollWidth, body.scrollWidth) - clientWidth <= 1`。
- 可視 `button`、`summary`、file button、form control の width / height がそれぞれ 44 CSS px 以上。
- 可視 `input`、`select`、`textarea` の computed font size が 16px 以上。
- bottom navigation が存在し、keyboard 非表示時に visible。
- navigation の left / right / bottom が viewport 内。
- main の最終可視 child が bottom navigation に隠れない。
- page heading、cards、notice、長い日本語 text が min-content width で document を押し広げない。

recent searches は document 全体を広げず、自身の中だけを横 scroll する。各 chip は幅を制限し、ellipsis で表示する。検索欄は `minmax(0, 1fr)` と 44px clear button の2列構成にした。

## Safe-area

CSS custom property は以下の4値を `env()` から受ける。

- `--safe-area-top: env(safe-area-inset-top)`
- `--safe-area-right: env(safe-area-inset-right)`
- `--safe-area-bottom: env(safe-area-inset-bottom)`
- `--safe-area-left: env(safe-area-inset-left)`

合成 test では 390×844 に top 47px、right 11px、bottom 34px、left 9px を注入し、brand、first page content、offline notice、bottom navigation が各 inset 内に収まることを確認した。この test は Safari の `env()` 実装そのものを検証するものではない。

## Keyboard と日本語入力

- form control は 16px 以上で iOS focus zoom の既知リスクを抑える。
- `visualViewport.height` を CSS custom property へ反映する。
- input / textarea / select に focus があり、安定時より viewport が 120px 超縮んだ場合だけ `keyboard-open` にする。
- `keyboard-open` 中は bottom navigation を不可視・`pointer-events: none` にし、active input を近い位置へ scroll する。
- 390×844 から 390×500 へ縮小した test で、検索欄が viewport 内、overflow が 1px 以下、nav が退避することを確認した。元の高さへ戻すと nav が復帰した。
- IME composition test は同じ input DOM node を保ち、途中値で render せず、確定した「アジアなベッド」を1回だけ検索へ反映した。

以上は Playwright による viewport / composition event の自動検証であり、実 iOS software keyboard、日本語フリック入力、予測変換、dictation の PASS ではない。

## List → detail → back

Search と Collection の両方で次を検証した。

1. query と filter / category を設定。
2. 対象 card を viewport 中央へ scroll。
3. detail を開く。
4. 元画面へ戻る。
5. query、filter / category、対象 card、scrollY を比較。

routeごとのscrollとdetail元cardのtopを保存し、戻り時にcard anchorの位置差も補正する。結果はscrollY差2px以内。v15画面から始まる将来Service Worker updateやguarded recoveryのdocument reloadをまたぐ場合はtransient UI sessionからroute / query / filter / scrollを復元する。旧v14画面にはこのsnapshot機構がないため、v14→v15初回移行のroute / query / scroll保持は保証しない。

## Screenshot manifest

`artifacts/qa/iphone-first/manifest.json` の結果は `PASS`、27/27。最終 retained capture は managed WebKit 26.5、headless、deviceScaleFactor 3、locale `ja-JP`、timezone `Asia/Tokyo`、reduced motion、state schema 3 で生成した。

| viewport | 枚数 | 画面 |
| --- | ---: | --- |
| 390×844 | 13 | Home、Search、Fish / Item / Resident / NPC / Facility / Event detail、Museum、Collection、Calendar、Settings、Backup |
| 430×932 | 13 | 同上 |
| 390×500 | 1 | Search with keyboard space |

manifest は各 file の PNG 実寸、expected / actual route、detail の entity ID、SHA-256 を検証する。capture runner は Chrome 152 と managed WebKit 26.5 の両方で 27/27 PASS し、最終 PNG / manifest は managed WebKit 版を保持した。撮影時の Service Worker は dedicated PWA QA と混同しないため block した。

CIでは同じcaptureをChromium、managed WebKitの順に実行し、`iphone-first-screenshots-chromium`と`iphone-first-screenshots-webkit`へ別々にuploadする。Pages workflowは画像artifactを配備物へ含めず、両engineのfocused 20-case gateだけをdeploy前に要求する。

目視・geometry確認では、WebKit native search clearはCSSで抑止されcustom clearとの重複がなく、通知と戻るボタンの垂直間隔は26px、390×500ではbottom navigationがkeyboard相当viewport外へ退避した。

## 検証結果と限界

| 検証 | 結果 |
| --- | --- |
| Focused iPhone layout / lifecycle suite — installed Chrome 152 | 20/20 PASS、31,769.8257ms |
| Screenshot runner — Chrome 152 | 27/27 PASS |
| Screenshot runner — managed WebKit 26.5 | 27/27 PASS |
| Focused iPhone 20-case suite — managed WebKit 26.5 | 20/20 PASS、141,474.6255ms |
| Local Lighthouse 13.4.1 | 91 / 100 / 100 / 100 |
| Physical iPhone Safari 390 / 430 class | `NOT_RUN` |
| 実 iOS safe-area / rotation | `NOT_RUN` |
| 実 iOS software keyboard / 日本語 IME | `NOT_RUN` |
| VoiceOver | `NOT_RUN` |

managed WebKitのfocused suiteは最終20/20だが、physical Safari PASSの代替ではない。最終PASS前の19/20はorigin停止中の既知接続ログ分類、18/20はscroll / install settle前の計測raceだった。ログ分類をorigin停止期間だけに限定し、viewport保持、最大scroll到達、Service Worker install settleを実装して、assertionを弱めず解消した。390 / 430というCSS viewport classの検証を、特定iPhone実機モデルのPASSとして扱わない。

## データ・保存の非変更

- save key `wildWorldCompanionState.v1`: 変更なし。
- schema version 3: 変更なし。
- data version: 変更なし。
- Canonical game-data: 変更 0件。

## 公開版

PR / merge 後の GitHub Pages で、390 / 430 geometry、console / HTTP failure、Service Worker v15、offline reload、list return、Backup / Collection persistence を再確認する必要がある。本書作成時点では結果がないため値を置かない。**最終配備後に追記**する。
