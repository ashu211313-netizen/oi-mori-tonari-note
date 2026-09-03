# Canonical data policy

対象はNintendo DS日本版『おいでよ どうぶつの森』です。別作品・別地域・リメイクの値を、同一と確認せず流用しません。

## Adoption rules

1. critical fieldはCanonical、Raw、Normalized、Source Claim、Source Type、Independence Group、Region、Confidenceを分離する。
2. mirror、転載、同一データセット、引用元と引用先を独立2資料として数えない。
3. 地域不明資料はJP値の独立検証として数えない。
4. 資料が一致しなければ `CONFLICT` とし、平均・補間・多数決で解消しない。
5. UI文言は証拠を超えない。CONFLICTは常時警告し、SINGLE_SOURCEとCORROBORATEDも追加確認が必要と表示する。
6. Canonical変更時は旧値・新値・根拠・status・UI・test・Data Version・SW cache・release noteを同時更新する。

## Status meanings

- `OFFICIAL_VERIFIED`: 対象版の公式・一次資料で確認。
- `MULTI_SOURCE_VERIFIED`: JPまたはmulti-region verifiedの独立2資料以上が一致。
- `CORROBORATED`: 独立資料は一致するが、地域未確定等によりJP独立検証ではない。
- `SINGLE_SOURCE`: 独立資料が1グループのみ。
- `REGION_SPECIFIC`: 対象地域が限定され、JPへの流用不可。
- `CONFLICT`: 正規化後も資料間不一致。
- `UNKNOWN`: 適用可能な根拠なし。
- `FALSE`: 主張が反証済み。
- `BLOCKER`: 必須だが解決不能な状態。

Confidence A/B/C/D/BLOCKERはstatusとは別軸です。現在のCanonical変更は0件です。
