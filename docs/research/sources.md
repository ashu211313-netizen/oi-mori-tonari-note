# Research sources and limits — 2026-09-01

本文を開いて確認した主な資料は以下です。検索結果スニペットだけをCanonical Evidenceにしていません。

## Content Saturation sources — 2026-09-03

- [日本版NDS索引](https://www.oi-mori.com/nds/)から非core item分類を列挙し、[果物](https://www.oi-mori.com/nds/item/fruit.html)、[花](https://www.oi-mori.com/nds/item/flower.html)、[貝](https://www.oi-mori.com/nds/item/shell.html)、[便せん](https://www.oi-mori.com/nds/item/letter.html)、[たぬきちオリジナル商品](https://www.oi-mori.com/nds/item/original.html)、[イベント・回収品](https://www.oi-mori.com/nds/item/eventitem.html)の本文表を追加抽出しました。
- [イベント表](https://www.oi-mori.com/nds/calendar/event.html)の12行を開催規則、時間規則、内容、報酬原文へ変換しました。表にない開催場所は補完していません。
- [たぬきちの店](https://www.oi-mori.com/nds/facility/store.html)と他の施設本文から営業時間、サービス表、増築条件、特典を抽出しました。
- [Wild World resident roster](https://nookipedia.com/wiki/Villager/Wild_World)の英語名・種族・性別・誕生日・性格・英語版口ぐせを、[日本語ACWW名索引](https://animalcrossing.soopoolleaf.com/ja/acna/g/acww/)で結合しました。regionは`GLOBAL_WW`であり、JP独立検証へ数えません。
- 取得HTMLはretrieval date、byte数、SHA-256とともに`expansion-extraction-report.json`へ記録します。oi-mori 54 URLはすべて一つの`oi-mori-nds` lineageです。

- Nookipedia: Fish/Bug/Fossil/Art in Wild World、Forgery、Salmon、King salmon、Oak silk moth、Honeybee
- Super-Famicom.jp: 日本語版の魚表・虫表
- どうぶつの森.com: 日本語版の化石表
- おいでよ つねきち攻略@wiki: 購入前真贋と2作品の例外主張
- SuperCheats Wild World FAQ、GameYum insect guide、Thonky bug list: CONFLICT追加調査
- 伊豆・伊東情報館: 日本語Wild World本文の魚・虫・化石売値表（独立上流は未証明）
- Landscape / sonic64.com: 2005-11-28から本人捕獲分だけを段階更新したタヌキ商店価格リスト。攻略サイト不使用を本文で明示。Wayback最古2006-01-16
- hot*cocoa / 楽天ブログ: 本人が釣った魚だけの冬季価格表。価格を忘れた捕獲魚は表から除外。静的ページ初回公開日は不明、同サイトRSSは2007-01-12
- bakera.jp「ゲームのメモ」: 2006年当時の本人プレイ記録を確認したが、個別価格の収集方法を十分に分離できないためsource claimへ未採用
- 任天堂日本語取扱説明書、角川グループ刊行資料、Wazap、Yahoo!知恵袋、当時の個人日記: source universe／guidebook lineage／conflict探索に使用。本文だけで独立Canonical Evidenceにならないものはclaimへ未採用

## Zero Blockers escalation — 2026-09-02

- 任天堂公式ADMJ日本語取扱説明書（29 pages）を全文検索し、操作・通信等の一次scopeは確認しましたが、critical fieldの価格、月、時刻、場所、名画真贋表はありませんでした。
- KADOKAWA公式刊行metadata（2005-12-28、240 pages、ISBN 9784840233170）と、Nintendo DREAM 9784839919788、Famitsu 9784757726123、小学館公式9784091062796のguidebook universeを特定しました。対象page本文を確認できないためclaimへ採用していません。
- Yahoo!知恵袋の2008年魚表、Wazapの2006年虫表／2007年名画Q&A、2026年play logを本文確認しましたが、図鑑・攻略本コピーsignal、回答間不一致、境界を証明しない単発観測のため独立Canonical Evidenceにしていません。
- Universal-TeamのACWW save researchと`acww-hax`を確認しましたが、合法に再現可能なADMJ critical-field tableはありませんでした。
- Wayback CDXはhostのTLS/取得制約で完了せず、indexed archive searchにも採用可能な結果がありませんでした。archive evidenceを取得済みとは記録していません。
- 各fieldはcurrent claims→new JP web→archive→bibliography/guidebook lineage→game-data→physical hardware→unresolved dispositionのL1〜L7を`zero-blockers-454-field-disposition.json`へ記録しました。

Nookipediaの各ページは同じ `nookipedia-community-database`、日本語魚・虫表は同じ `super-famicom-jp-guide` として数えます。Nookipedia Forgeryとその引用元も自動的に独立扱いしません。

## Result

- field claim extraction: 8/468→468/468
- source claims: 652→693（今回の追加は41）
- distinct-group agreeing fields: 181
- audited-independent agreeing fields: 14
- direct JP claim fields: 408
- JP independent verified fields: 14
- Canonical changes: 0
- Zero Blockers Evidence Sufficiency: 468 re-audited、release blocker 454→454、解除0

## Evidence still required

- 日本版実機、公式攻略本、版を特定できる一次資料による6 CONFLICTの確認
- 名画の売値・贋作売値・入手元についてJP地域を証明する独立資料
- 278 SINGLE_SOURCEと167 CORROBORATEDをJP独立検証へ昇格できる、転載・共通攻略本依存を排除した根拠

他作品の情報はspecies identity等の探索補助以外にCanonical値へ流用していません。
