# INFINITAS Records

Vite、React、TypeScript、Tailwind CSS を使った INFINITAS のプレー記録サイトです。

## ローカル開発

```sh
npm install
npm run dev
```

コマンドは `infinitas-records` フォルダーで実行し、Vite が端末に表示する `Local` の URL をブラウザで開きます。Tailwind CSS は Vite プラグインで処理されるため、HTML ファイルを直接開くとスタイルは適用されません。

`npm run build` で型チェックと本番用ビルドを実行します。
`npm test` で CSV の判定、保存データの移行、ZIP 再取り込みとビルドの再現性を確認できます。

## アイコンとロゴのフォント

Material Symbols とロゴ用の Anton は、使用する文字だけを含む WOFF2 を `public/fonts/` に置いています。アイコンやロゴの文字を追加した場合は `scripts/update-local-fonts.mjs` の対象リストを更新し、`node scripts/update-local-fonts.mjs` を実行してください。

## SEO と SNS 共有プレビュー

ページごとのタイトルと説明文は `src/navigation.ts` で管理します。本番ビルド時に `.env.production` の `VITE_SITE_URL` を使い、正規 URL、OGP・X カード、サイトマップ、robots.txt を `dist/` に出力します。別の公開 URL を使う場合は、ホスティング側のビルド環境変数か `.env.production.local` で上書きできます。

Cloudflare Workers では `dist/` を静的アセットとして配信してください。既定の HTML ルーティングで `search.html` と `data.html` がそれぞれ `/search` と `/data` に対応します。
