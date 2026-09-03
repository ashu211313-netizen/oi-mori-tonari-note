# Known uncertainty — GitHub Pages deployment

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

- Installed Chrome 152は実公開URLでHTTPS、SW v14、offline reload、主要UI、saved-state保持をPASSしました。
- Managed WebKit 26.5+iPhone descriptorは実公開URLでHTTPS、SW、online reload、主要UI、saved-state保持をPASSしましたが、物理iPhone/Safari PASSではありません。
- Windows版managed WebKitはhost trust storeを読めないため、Nodeとinstalled Chromeで実証明書を厳格検証した後にtoolchain内だけでTLS trust bypassを使用しました。
- 実公開URLのmanaged WebKit offline reloadはtool-internal errorとなり、live WebKit offline PASSとはしません。repository-pathのoffline動作は別のlocal WebKit E2Eで検証しています。
- Firefox managedはbrowser process起動時に`spawn UNKNOWN`となり、app assertionを開始できませんでした。`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`で、PASSにもアプリFAILにも数えません。
- 物理iPhone/Safari、Android実機、real screen readerは未実行です。axe、Lighthouse、device descriptorは代替PASSではありません。
- GitHub Pagesではrepository-controlled custom response headersを設定できません。実documentはCSP metaとno-referrer metaを持ち、GitHub endpointはHSTSを返します。
- `actions/configure-pages@v5`は成功していますが、run logにはaction内部Node 20から強制Node 24への移行警告が残ります。workflow failureではありませんが隠しません。
- PCとiPhoneはdevice-local stateが分かれます。進行状態は既存Backup export/importで移行します。
