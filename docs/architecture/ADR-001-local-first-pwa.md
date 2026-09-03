# ADR-001: Local-first static PWA

- Status: Accepted
- Date: 2026-09-01

## Decision

アプリを静的ES ModulesとService Workerで構成し、ユーザーデータをブラウザ内だけに保持する。サーバー同期、ログイン、分析SDKは導入しない。

## Rationale

収集チェックとメモは機微性が低くてもユーザー固有データであり、オフライン利用と移植可能なJSON backupが主要用途に合う。依存の少ない構成は、未確認ゲームデータの監査箇所も限定する。

## Consequences

- 端末間同期は自動ではなく、export/importを使う。
- ブラウザデータ消去前にユーザーがbackupする必要がある。
- Service Worker更新と保存schema移行には後方互換テストが必要となる。
- 本番サーバーのセキュリティヘッダーとHTTPSは配備側の責務となる。
