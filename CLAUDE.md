# このリポジトリについて

Claude Codeの学習・個人開発用リポジトリ。まだ本格的なプロジェクトは無く、Claude Codeの使い方を試すためのサンドボックス。

## Claude Codeの設定について

- `.claude/settings.json` にこのプロジェクト用の権限設定がある。読み取り系コマンド（`git status`/`diff`/`log`、`ls`、`cat`、`npm test`/`build` 等）は確認なしで実行でき、`git push --force`・`git reset --hard`・`rm -rf` などの破壊的な操作は必ず確認を求める設定にしてある。
- 新しいプロジェクトを始めるときは、このファイルと `.claude/settings.json` をコピーして出発点にすると良い。

## コーディング方針（今後プロジェクトが増えたら更新する）

- 特になし（このリポジトリ自体はまだ実コードを持たない）
