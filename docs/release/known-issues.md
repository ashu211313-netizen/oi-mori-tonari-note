# Known uncertainty — Personal Final build

## Data

- Coreの468/468 claim coverageはverifiedを意味しません。JP audited-independent verificationは14/468、SINGLE_SOURCE 278、CORROBORATED 167、公開向けstrict blocker metricは454です。
- Core CONFLICT 9 field instances / 6 registryは未解決です。UIは非断定表示を維持し、Core Canonical変更は0です。
- 住民`カルビ/カルピ`、`モモコ/ももこ`は表記不一致を解消できず、2件とも未登録の`UNKNOWN`です。確認済み148件だけを実装しています。
- Acquisition `UNKNOWN`は16→0ですが、最後の16件はcommunity 1 lineageの歴史的配布記録であり`SINGLE_SOURCE`です。独立検証済みとは表記しません。
- Acquisition 1,271件のうち866件は買値欄のみが根拠です。販売場所・販売者・catalog可否は未特定で、UIも「販売場所は未特定」と表示します。
- Event reward textは9/12、known locationは5/12です。確認できない空欄は「資料に記載なし」と表示します。
- イベント資料差分は3件です。`WW-EXP-DISC-001`はどんぐり祭りの報酬表記、`002`と`003`はつり大会・ムシとり大会の開始時刻です。数字を良く見せるために解決せずCONFLICTのまま残します。

## Images

- 利用可能なユーザー所有画像corpusは提供されていないため、real 0 / fallback 1,767です。
- fallbackは本実装のoriginal SVG/CSS motifです。公式ロゴ・公式アート・公式UI・外部画像はコピーしていません。
- 画像追加時は`assets/README.md`のlocal workflowとvalidatorを使用します。

## Platform and external validation

- Chrome、Edge、managed WebKitはSW v13で各22/22 PASSです。managed WebKitはSafariではありません。
- Firefox managedはbrowser process起動時に`spawn UNKNOWN`となり、app assertionを開始できませんでした。`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`で、PASSにもアプリFAILにも数えません。
- Safari、iOS、Android実機、real screen readerは未実行です。axeとLighthouse accessibilityは自動検証であり、real screen-reader PASSではありません。
- Public HTTPSと外部法務レビューは、宣言された個人local/offline scope外です。未実行でありPASSとは表記しません。
