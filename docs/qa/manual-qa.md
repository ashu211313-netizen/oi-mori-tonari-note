# Manual and browser QA — Content Saturation scope

## Completed on this host

- Chrome 152、Edge 152、managed WebKit 26.5で各22/22。WebKitはSafariではありません。
- Core操作に加え、アイテム・住民・はにわ・NPC・施設・イベントの横断検索、domain filter、event detail、月別Calendar、住民誕生日、販売場所未特定表示、Collection状態のreload永続化を実ブラウザで確認。
- 320px、375px、390px、430pxでhorizontal overflowなし。44px targetsとaxe critical/serious 0を確認。
- localhostでmanifest、SW v13、old app cache cleanup、unrelated cacheとLocalStorage保持、origin停止後の拡張domain/event検索を確認。
- Firefox managed 1538はWindowsがbrowser process起動前に`spawn UNKNOWN`を返したため`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`。

## Declared scope boundary

この個人利用判定の主環境はWindows/Chromeです。Safari desktop、iOS/Android実機、real screen reader、public HTTPSは未実行であり、PASS扱いしません。一般公開を行わないため完了条件からは除外します。
