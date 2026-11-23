export const navigation = [
  {
    path: "/",
    title: "ダッシュボード",
    icon: "equalizer",
    seoTitle: "INFINITAS Records | beatmania IIDX INFINITAS プレーデータ管理",
    description:
      "beatmania IIDX INFINITAS のプレーデータを記録・比較できる非公式サイトです。SP・DP 別のスコア更新やクリアランプの推移を確認できます。",
  },
  {
    path: "/search",
    title: "楽曲検索",
    icon: "search",
    seoTitle: "beatmania IIDX INFINITAS 楽曲検索 | INFINITAS Records",
    description:
      "INFINITAS の収録楽曲を曲名・アーティスト・収録バージョン・譜面レベルなどで検索できます。CSV を登録すると、譜面ごとのスコアやプレー履歴を確認できます。",
  },
  {
    path: "/data",
    title: "データ管理",
    icon: "database",
    seoTitle: "プレーデータ CSV の取り込み・管理 | INFINITAS Records",
    description:
      "beatmania IIDX INFINITAS の公式プレーデータ CSV を SP・DP 別にブラウザへ保存できます。取り込んだ記録のダウンロードや ZIP エクスポートもできます。",
  },
] as const;

export type PagePath = (typeof navigation)[number]["path"];
