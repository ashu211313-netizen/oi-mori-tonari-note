# Manual and browser QA — Content Saturation scope

## Completed on this host

- Chrome 152、Edge 152、managed WebKit 26.5で各22/22。WebKitはSafariではありません。
- Core操作に加え、アイテム・住民・はにわ・NPC・施設・イベントの横断検索、domain filter、event detail、月別Calendar、住民誕生日、販売場所未特定表示、Collection状態のreload永続化を実ブラウザで確認。
- 320px、375px、390px、430pxでhorizontal overflowなし。44px targetsとaxe critical/serious 0を確認。
- localhostでmanifest、SW v14、old app cache cleanup、unrelated cacheとLocalStorage保持、origin停止後の拡張domain/event検索を確認。
- GitHub Pages実URLでinstalled ChromeによるHTTPS、SW v14、offline reload、主要UI、schema 3 state保持を確認。managed WebKit+iPhone descriptorでもonline reloadと主要UIを確認。
- Firefox managed 1538はWindowsがbrowser process起動前に`spawn UNKNOWN`を返したため`ENVIRONMENT_BLOCKED_BEFORE_APP_ASSERTIONS`。

## Declared scope boundary

Public GitHub Pages HTTPSは実配備・実検証済みです。ただしSafari desktop、iOS/Android実機、real screen readerは未実行であり、managed WebKitやaxeを代替PASSとして扱いません。
