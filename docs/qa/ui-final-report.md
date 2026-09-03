# Final UI/UX QA — 2026-09-03

## Design system

公式ロゴ・公式アート・公式UIを使わず、paper/leaf/sunlight/waterを抽象化したoriginal CSS/SVG languageを実装しました。

- Cream background、leaf green primary、warm yellow accent、soft blue secondary。
- 12/18/26/34px rounded scale、soft elevation、domain別accentとfallback motif。
- 44px以上のtouch target、明確なfocus ring、reduced-motion対応。
- 320px、375px、390px、430px、desktopで横overflowなし。
- 実画像0件を隠さず、10 domain別のoriginal fallbackと「画像未登録」altを表示。

## Screen coverage

- Home: greeting、museum progress、universal search、6 quick actions、today/smart recommendation dashboard。
- Search: 1,767件の横断検索、domain tiles、filters、recent search、friendly zero-result。
- Lists: Critters、Sell、Museum、Calendarへpage hierarchyとresponsive cardsを適用。
- Collection: 10 domain、item category、collected/missing/favorite/catalog/acquisition/event/price filters、実state更新。
- Detail: quick answers、acquisition/services/conditions/rewards/table、state controls、folded provenance、visible CONFLICT。
- Backup/Settings: clock/weather、export/import feedback、local privacy、data audit。
- Fallback: loading、load error/retry、not found、zero result、missing imageを人向け文言で実装。

## Evidence

- Before: `artifacts/ui-final/before-home-desktop.png`
- Desktop: `final-home-desktop.png`, `final-search-desktop.png`, `final-collection-desktop.png`, `final-detail-desktop.png`
- Mobile: `final-home-mobile-390.png`, `final-search-mobile-390.png`
- Chrome/Edge/managed WebKit E2E各22/22。320px axe serious/critical 0、44px target、375/390/430px overflowを自動検証。
- Lighthouse: Performance 94、Accessibility 100、Best Practices 100、SEO 100。

実screen reader、physical Safari/iOS/Androidは未実行であり、automated accessibilityを実機PASSとは扱いません。
