# PWA lifecycle QA report

更新日: 2026-09-11
対象: Service Worker v15 と iPhone-first lifecycle / persistence 変更
状態: ローカル自動検証済み。実 iOS と再配備後の公開検証は未完了。

## 解決した failure mode

| failure mode | Baseline | 実装後 |
| --- | --- | --- |
| resume event storm | `visibilitychange`、`pageshow`、`focus`、`online` の調停なし | 250ms window で reason を集約し、single-flight で回復。実行中の追加 event は1回の follow-up にまとめる |
| resume 後の古い表示 | 時計や別ページ保存値の再同期なし | 永続 state、online 状態、visual viewport、時計、Service Worker update を再同期 |
| offline → online | lazy module failure 後の promise が拒否状態で固定され得た | 拒否 promise を解放。online 時だけ session guard 付きで1回 reloadし、UI context を復元 |
| SW 世代混在 | v14 は install 中に無条件 `skipWaiting` | v15 worker は waiting のまま維持。旧v14 clientをすべて終了した次回起動でv15へ移行し、v15以降の更新はv15画面の操作から `SKIP_WAITING` を送る |
| update reload loop | `controllerchange` の一回性と context 復元契約なし | v15で制御済みの画面に対する将来のhandoffでは、UI sessionを保存し、10秒の`sessionStorage` guardでreloadを1回に制限 |
| navigation cache growth | query 付き URL が navigation cache key になり得た | scope 相対の canonical `index.html` のみを shell key とし、query URL を cache へ追加しない |
| QuotaExceeded | memory を先に変え、永続値と画面が分岐し得た | state draft の保存成功後だけ memory commit。失敗時は旧値を維持し notice を表示 |
| Backup import failure | import state を先に memory へ入れる可能性 | normalize / validate / save 成功後だけ state を差し替え。import は single-flight |
| multi-tab overwrite | 古いin-memory snapshotを単一keyへ全量保存し、別fieldの同時書込が後勝ちで消え得た | 同一originのexclusive Web Lock内でstrict latest-read → mutation → saveを実行。`storage` eventは通知に限定し、現在値を再読込 |

## Resume coordinator

`src/lifecycle.js` の `createResumeCoordinator` は以下を保証する。

- default delay は 250ms。
- 同じ burst に含まれる reason を `Set` で重複排除する。
- recovery を同時に複数実行しない。
- recovery 中の event は捨てず、1回の後続 batch にまとめる。
- recovery failure は利用中の画面を破棄せず error callback へ渡す。
- test 用の `whenIdle()` と teardown 用の `dispose()` を持つ。

画面側は `visibilitychange`（visible 時）、`pageshow`、`focus`、`online` を coordinator へ渡す。`offline` は即時に状態表示を変え、`pagehide` では transient UI session を保存する。回復時は state の安全な再読込、visual viewport、minute clock、lazy expansion recovery、Service Worker update check を同期する。

E2E では4 event を連続発火し、recovery count がちょうど +1、render 増分が1以下、header / main / nav が各1個、LocalStorage と scrollY の差が 2px 以内であることを確認した。

## Service Worker v15

### Install と更新

- cache name は `wild-world-companion-v15`。
- `icon-180.png` と `src/lifecycle.js` を含む current shell を `cache.addAll` で precache する。
- install handler は `skipWaiting()` を呼ばない。precaching に失敗した worker は current client を置換しない。
- v15の画面コードが制御中にwaiting workerを検出すると、画面に更新noticeを出す。
- ユーザーが更新を選んだ場合のみ `{ type: "SKIP_WAITING" }` を送る。この経路はv15→v16以降の更新用であり、旧v14画面にはこのUIコードがない。
- v15の画面から開始する`controllerchange`の前に、route、query / filter、detail return anchor、recent searches、scrollをsession snapshotへ保存する。
- そのcontroller handoff後は1回reloadし、10秒guard内の追加`controllerchange`はreloadしない。

### v14 → v15の初回移行境界

- v15のinstallは`skipWaiting()`を呼ばないため、旧v14 clientが1つでも残る間はv15 workerがwaitingに留まる。
- 旧v14画面にはv15の更新notice / `SKIP_WAITING` UIが存在しない。したがって、v14セッション内で明示通知を出して切り替えるとは主張しない。
- 安全な人手順は、先にBackupを書き出し、同じoriginを開いているSafari tabとホーム画面PWAをすべて終了し、その後オンラインで再起動すること。全旧client終了後にv15がactivateし、次回起動はv15 shellを使用する。
- durable LocalStorage `wildWorldCompanionState.v1`とschemaVersion 3は保持対象である。旧v14セッションのroute / query / scrollは、旧画面側に移行snapshot機構がないため保証しない。
- この手順のphysical iPhone Safari / Home Screen PWAでの実行は`NOT_RUN`であり、ローカル自動試験を実機PASSへ読み替えない。

### Fetch と cache mismatch

- navigation request は `new URL("./index.html", self.location.href)` で得た scope 相対 shell key を読む。
- `?resume=3` などの query 付き navigation URL を cache key にしない。
- static asset は cache-first。安全な 200 / basic response のみ runtime cache へ入れる。
- Cache Storage の open / match / put failure は network 成功を妨げない。
- network も使えない static asset は明示的な 503 を返す。
- activate は同 prefix の旧 app / image cache のみ削除し、無関係な cache を削除しない。

これにより、読み込み済みv14 clientがv15のlazy moduleだけを受け取る世代混在を避ける。v14→v15は全旧client終了後の次回起動で一貫したv15 shellへ移り、v15→v16以降はv15画面の明示操作でhandoffできる。

## Offline → online

focused E2E は network emulation だけでなく、最初の online load と Service Worker control 後に実際の local origin server を停止した。

1. origin 停止中に cached shell を reload。
2. オフライン表示を確認。
3. 横断検索、Collection の入手済み更新、Backup download を実行。
4. 同じ port で origin を再開。
5. `online` recovery を実行し、document identity が変わらないことを確認。
6. LocalStorage の Collection 値を確認し、さらに reload 後も同値であることを確認。

結果は PASS。これは localhost の公開 HTTPS 検証ではない一方、Service Worker の origin-stop offline fallback を network flag だけに依存せず検証している。

## Persistence と Backup

- durable key は従来どおり `wildWorldCompanionState.v1`。
- state schema は従来どおり 3。
- UI context は durable save と分離し、`wildWorldCompanion.uiSession.v1` を一回復元後に削除する。
- Collection、設定、計算機、Backup importの書込は、同一originのexclusive Web Lockとタブ内queueで直列化する。lock取得後に`wildWorldCompanionState.v1`の最新値をstrictに読み、mutation → normalize / serialize → `localStorage.setItem`の順で保存し、成功した戻り値だけをmemory stateに採用する。
- QuotaExceeded E2E は保存前後の raw LocalStorage byte が一致し、ボタンも旧状態、reload 後も旧状態であることを確認した。
- 2ページE2Eは第3ページのholderがexclusive Web Lockを保持し、page A / Bから異なる2 itemの書込を同時にpendingへ入れる。pending 2件を確認してholderを解放し、両IDが両ページとreload後のLocalStorageに残ること、key `wildWorldCompanionState.v1` / schemaVersion 3が変わらないことを確認した。対象caseはinstalled Chrome 152 / managed WebKit 26.5でPASSした。
- strict reader unitは、keyが存在しない`null`だけをdefaultとし、空文字は破損payloadとして拒否することを回帰化した。
- Backup は実 download stream を読み、filename と schema 3 を確認した。
- valid import 後の reload で profile、item acquired / cataloged、note を確認した。
- broken JSON と future schema 999 は raw LocalStorage byte を変えず、reload 後も valid import の値を保持した。
- export anchor は一時的に document body へ接続し、object URL は1秒後に revoke する。これは iOS download handling を安定させるための互換処理だが、実 iPhone での Files / Share sheet 挙動は未確認である。

## 回帰テスト結果

| 検証 | 結果 |
| --- | --- |
| Lifecycle coordinator unit | PASS — event coalescing と single-flight / queued follow-up |
| Service Worker unit | PASS — atomic precache、v15画面での将来explicit handoff契約、old-cache cleanup、canonical navigation、static cache。physical v14→v15移行は含まない |
| Focused iPhone E2E / installed Chrome 152 | 20/20 PASS — 31,769.8257ms |
| 通常 E2E / installed Chrome | 22/22 PASS |
| Pages artifact E2E | 5/5 PASS |
| Unit / contract 全体 | 128/128 PASS |
| managed WebKit screenshot render | 27/27 PASS |
| Focused iPhone E2E / managed WebKit 26.5 | 20/20 PASS — 141,474.6255ms |
| Local Lighthouse 13.4.1 | 91 / 100 / 100 / 100 |

managed WebKitの中間runは19/20（origin停止中の接続ログを通常failureとして監視）と18/20（scroll / install settle前の計測race）だった。予期ログをorigin停止期間だけに限定し、resume renderでviewportを保持し、最大scroll到達とService Worker install完了を待つよう修正した。failure assertion自体は維持したまま、最終単独フルrun 20/20を確認した。

## 変更していないもの

- save key `wildWorldCompanionState.v1`: 変更なし。
- save schema 3: 変更なし。
- game-data version: 変更なし。
- Canonical 値: 変更 0件。
- provenance / conflict registry: 変更 0件。
- Supabase / Auth / Realtime: 新規導入なし。

## 未実施と判定境界

| 対象 | 状態 |
| --- | --- |
| Physical iPhone Safari の background / resume | `NOT_RUN` |
| iOS による process eviction / memory pressure 後の cold resume | `NOT_RUN` |
| ホーム画面PWAでの実v14→v15 close/reopen移行、および将来版のupdate prompt / controller handoff | `NOT_RUN` |
| 実 iOS software keyboard / 日本語 IME | `NOT_RUN` |
| VoiceOver | `NOT_RUN` |
| Web Locks非対応browser / Safari Lockdown Modeでのcross-tab排他 | `OUT_OF_GUARANTEE` |

automated Chrome / managed WebKit / DOM event simulation の PASS を上記の実機 PASS として扱わない。

Web Locks APIが使用できない場合も単一タブ内のqueueと通常のLocalStorage保存は行うが、複数タブ間の排他は保証しない。`storage` eventやBroadcastChannelは書込のatomicityを作らないため、Web Lockの代替PASSとは扱わない。Safari Lockdown Modeもこの境界に含む。

## 公開配備

PR番号、merge SHA、GitHub Actions / Pages run、公開HTTPS上のcache name、precache URL、offline reload、v14→v15の全旧client終了後移行、v15以降のupdate handoff、Backup / Collection persistenceは本書作成時点では再配備前のため記録しない。**最終配備後に追記**する。
