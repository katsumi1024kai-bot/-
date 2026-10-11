# 53武器クエスト — バージョンアップの決まり

`53buki-quest.html` は claude.ai のアーティファクト
https://claude.ai/artifact/PLHfMxUSsxR8nqLcLiCYjr の元ソース。
（`<!doctype>` `<html>` `<head>` `<body>` は公開時に付くので、ファイルには書かない）

## いちばん大事：セーブを消さない

持ち主はゲームを遊んだあとにバージョンアップを頼む。遊んだセーブは必ず引き継ぐこと。

1. **同じURLに公開する。** 別のアーティファクトにすると localStorage が引き継がれない。
   Artifact ツールで `url: https://claude.ai/artifact/PLHfMxUSsxR8nqLcLiCYjr` を渡して更新する。
   `capabilities` は渡さない（db / user がそのまま残る）。
2. **問題データ `D` は末尾に追加だけ。** 並べ替え・削除はしない。
   セーブは `"武器番号:文番号"`（例 `"12:3"`）で記録している。
   - 文の言い回しを直すのは OK（同じ位置で書きかえる）
   - 使わない文は消さずに4番目に `1` → `["文", 1, "解説", 1]`
   - 新しい武器は `D` の最後に足す（`st` で章を指定）
3. **保存先は変えない。**
   - 今の版：localStorage `q53_save`、クラウド `data/users/<id>/save`
   - v1（旧版）：localStorage `q53_state_v1`、クラウド `data/users/<id>/progress`（読むだけ。消さない・上書きしない）
   - 予備：`q53_save_bak`（3日分）、`q53_save_broken`（読めなかったセーブの退避）
4. **セーブの形を変える時は** `SAVE_VER` を上げ、`MIGRATE[古い版]` に変換を足す。
   知らないフィールドは消さない（`normalize` と `mergeSaves` がそうしている）。
5. **`STAGES` の `id` と、セーブの `stages` のキー（`"1"`〜`"5"`, `"final"`）は変えない。**
6. クラウドとの同期・「ふっかつのじゅもん」の読みこみは `mergeSaves` で合体する。
   経験値・正解数・★は多い方、ベストタイムは速い方が残る。この性質を壊さない。

## 公開前のチェック

- `node --check` でスクリプトが読めること
- 旧セーブ（`q53_state_v1` と前の版の `q53_save`）を入れて読みこみ、
  レベル・武器・章クリアが減っていないこと
