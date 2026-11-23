type CsvSongCorrection = {
  csv: { version: string; title: string; artist: string };
  master: { versionId: string; title: string; artist: string };
};

// csv は公式 CSV の先頭3列をそのまま記入する。
// master には data/versions の id・曲名・アーティストを記入する。
// 曲名に二重引用符が入る場合は、下の例のようにシングルクォートで囲める。
export const csvSongCorrections: CsvSongCorrection[] = [
  {
    csv: { version: "5th style", title: "Time is money", artist: "JAZZ" },
    master: { versionId: "iidx5", title: "Time is money", artist: "good-cool" },
  },
  {
    csv: {
      version: "DJ TROOPERS",
      title: "Anisakis -somatic mutation typeForza-",
      artist: "朱雀",
    },
    master: {
      versionId: "iidx15",
      title: 'Anisakis -somatic mutation type"Forza"-',
      artist: "朱雀",
    },
  },
  {
    csv: {
      version: "DJ TROOPERS",
      title: "JOURNEY TO FANTASICA (IIDX LIMITED )",
      artist: "S.S.D.FANTASICA feat. EMI with ARATA",
    },
    master: {
      versionId: "iidx15",
      title: 'JOURNEY TO "FANTASICA" (IIDX LIMITED )',
      artist: "S.S.D.FANTASICA feat. EMI with ARATA",
    },
  },
  {
    csv: {
      version: "DJ TROOPERS",
      title: "satellite020712 from CODED ARMS",
      artist: "猫叉Master",
    },
    master: {
      versionId: "iidx15",
      title: 'satellite020712 from "CODED ARMS"',
      artist: "猫叉Master",
    },
  },
  {
    csv: {
      version: "EMPRESS",
      title: "You'll say Now!",
      artist: "BLACK STAR 幸広-YUKIHIRO-",
    },
    master: {
      versionId: "iidx16",
      title: `You'll say "Now!"`,
      artist: "BLACK STAR 幸広-YUKIHIRO-",
    },
  },
  {
    csv: {
      version: "SIRIUS",
      title: "水上の提督(Short mix from 幻想水滸伝V)",
      artist: "猫叉Master",
    },
    master: {
      versionId: "iidx17",
      title: '水上の提督(Short mix from "幻想水滸伝V")',
      artist: "猫叉Master",
    },
  },
  {
    csv: { version: "copula", title: "ギョギョっと人魚 爆婚ブライダル", artist: "海の底からマーメイド Prim by ARM×狐夢想" },
    master: { versionId: "iidx23", title: "ギョギョっと人魚♨爆婚ブライダル", artist: "海の底からマーメイド♨Prim by ARM×狐夢想" },
  },
  {
    csv: { version: "CANNON BALLERS", title: "Amor De Verao", artist: "かめりあ feat. ななひら" },
    master: { versionId: "iidx25", title: "Amor De Verão", artist: "かめりあ feat. ななひら" },
  },
  {
    csv: { version: "CANNON BALLERS", title: "うさ☆かめ 大戦争！", artist: "ARM×狐夢想 feat. I've : 柚子乃 & RIN" },
    master: { versionId: "iidx25", title: "うさ☆かめ 大戦争！", artist: "ARM×狐夢想 feat. I've : 柚子乃 & RINA" },
  },
  {
    csv: { version: "CANNON BALLERS", title: "純真可憐デザイア", artist: "BEMANI Sound Team HuΣeR feat.Fernweh" },
    master: { versionId: "iidx25", title: "純真可憐デザイア", artist: 'BEMANI Sound Team "HuΣeR" feat.Fernweh' },
  },
  {
    csv: { version: "Rootage", title: "CODE:0", artist: 'BEMANI Sound Team "HEXA"' },
    master: { versionId: "iidx26", title: "CODE:Ø", artist: 'BEMANI Sound Team "HEXA"' },
  },
  {
    csv: { version: "Rootage", title: "Geirskogul", artist: "Maozon" },
    master: { versionId: "iidx26", title: "Geirskögul", artist: "Maozon" },
  },
  {
    csv: { version: "Rootage", title: "Six String Proof", artist: "HARDROCK" },
    master: { versionId: "iidx26", title: "Six String Proof", artist: 'BEMANI Sound Team "Yvya × Mutsuhiko Izumi"' },
  },
  {
    csv: { version: "BISTROVER", title: "DENIM", artist: "SLAKE" },
    master: {
      versionId: "iidx28",
      title: "DENIM\n[A]DENIM (ELECTRO MIX)",
      artist: "SLAKE\n[A]SLAKE (another mixed by DEPROGRAM MAN)",
    },
  },
  {
    csv: { version: "BISTROVER", title: "POLꞰAMAИIA", artist: "かめりあ feat. ななひら" },
    master: { versionId: "iidx28", title: "POLꓘAMAИIA", artist: "かめりあ feat. ななひら" },
  },
];
