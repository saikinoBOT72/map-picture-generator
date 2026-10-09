# Tabitica（タビチカ）

旅の写真を、都道府県のかたちに。
写真を都道府県の形に切り抜いて、コンビニなどで印刷できる画像にするツールです。〜tica シリーズの2作目（1作目は Pictica）。

## できること

- **どこの地図をつくるか選ぶ**: 地方（東北・関東・中部・近畿・中国・四国・九州）、1つの県、地図で好きな県を選ぶ、日本全国。
  - 同じ地図の県はみんな同じ縮尺で切り抜くので、並べて貼るとその地図になります。
  - 1つの県だけにすれば、旅のページ用に大きく切り抜けます。
  - 地図はいくつでも作れます（下の一覧で切り替え）。
- **大きさ**: 地図全体の長い辺を、スライダーか数字で自由に決められます。はがき・A5・B5・A4・30cm角・A3 のボタンは「その台紙に収まる大きさ」。
  - 全体の大きさ、各県が何 mm/cm になるか、印刷すると用紙が何枚になるかをその場で表示します。小さすぎる県には注意が出ます。
- **形**: 「かんたん」（最初の設定）は細かいでこぼこ・湾・小さな島を省いて丸くし、はさみで切りやすくします。「ふつう」「リアル」も選べます。丸め方は印刷サイズの mm で決まり、隣の県とは同じ境目を使うので並べてもすき間ができません。
- 写真は指で動かす・ピンチで拡大・回転（90°ごとに引っかかる）。
- フチは内側に入るので、外側は県の形のまま。並べるとぴったり合います。
- 写真を入れた県を L判・2L判・はがき・A4・A3 にまとめて並べて書き出します（350dpi の JPEG。複数枚は ZIP）。
- 用紙の下に 3cm の目盛り。印刷して測った長さを入れると、次から大きさのずれを直します（用紙ごと）。
- 戻る / やり直す、前回の続きから（端末の中に自動保存）、ダークモード。外部とは通信しません。

## ファイル

```
index.html              アプリ本体（HTML ファイル1つで動く）
privacy.html            プライバシーポリシー
version.json            バージョン番号（アップデートの確認に使う）
manifest.webmanifest    ホーム画面に追加したときの設定
logo.png, icon-*.png    ロゴとアイコン（仮）
tools/prep-map.mjs      都道府県の形のデータを作って index.html に書き込むスクリプト
.claude/skills/tica-series/  シリーズのルール
```

## 地図データ

「国土数値情報（行政区域データ）」（国土交通省）を加工して作成しました。
スマートニュース メディア研究所の [japan-topography](https://github.com/smartnews-smri/japan-topography)（都道府県・簡略化1％）を元に、`tools/prep-map.mjs` で同じ縮尺の座標（km）に変換し、小さな島を省いて詰めています。

作り直すとき:

```
curl -LO https://raw.githubusercontent.com/smartnews-smri/japan-topography/b403e71eb97f1fdf32f63d16bd485129f703855e/data/municipality/geojson/s0010/prefectures.json
node tools/prep-map.mjs prefectures.json
```

## 公開

- GitHub Pages: リポジトリの「Settings → Pages → Build and deployment」で、Source を「Deploy from a branch」、ブランチを選び、フォルダは `/ (root)` → Save。
- 新しいバージョンを出すときは、`index.html` の `APP_VERSION` と `version.json` の `version` を同じ番号に上げます。
