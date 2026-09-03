# Source Independence audit — 2026-09-01

`pnpm run report:evidence-warroom` は15 source body、693 live claims、全105 unordered source pairをstable queueへ展開します。URLや `independenceGroup` が異なるだけでは独立としません。

| Metric | Result |
|---|---:|
| Source bodies read | 15/15 |
| Source claims audited | 693/693 |
| Source pairs audited | 105/105 |
| Qualified independent pairs | 1 |
| Distinct-group agreeing fields | 181 |
| Audited-independent agreeing fields | 14 |
| JP independent two-source fields | 14/468 |

Nookipedia内ページは同じ編集系統として重複計上しません。Super-Famicom.jpの魚・虫表も同じgroupです。Nookipedia Forgeryは外部FAQ参照のため `dependent`、出典不明の攻略表は共通攻略本由来を排除できず `possibly_dependent` のままです。

唯一のqualified pairはLandscapeとhot*cocoaです。別domainだからではなく、両本文が本人の日本版プレイから作った部分表であることを明示し、運営者・掲載基盤が別、相互引用なしであるためです。Landscapeには2006-01-16からのWayback履歴があります。hot*cocoaの静的ページ初回公開日は確定できず、2007-01-12の同サイトRSS日付以前という限定を保持します。このペアが同じ値を直接載せる14 sellPriceだけを検証済みにしました。

機械可読な正本は `artifacts/data-audit/source-independence-report.json` です。
