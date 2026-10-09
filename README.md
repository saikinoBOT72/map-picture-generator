# Tabitica（タビチカ）

旅の写真を、都道府県のかたちに。
写真を都道府県の形に切り抜いて、コンビニなどで印刷できる画像にするツールです。〜tica シリーズの2作目（1作目は Pictica）。

## できること

- **地図サイズ**: すべての県を同じ縮尺で切り抜きます。印刷して並べて貼ると日本地図になります。
  - 日本地図の大きさ（横幅）は、スライダーか数字で自由に決められます（A4・B4・A3・30cm角・A2 の目安ボタンつき）。
  - 大きさを変えると、北海道・いちばん小さい県・選んでいる県が何 mm になるか、47都道府県ぜんぶで用紙が何枚になるかをその場で表示します。
  - 編集画面では 1円玉（直径2cm）を同じ縮尺で横に出すので、実際の大きさがつかめます。
  - フチは内側に入るので、外側の形は県の形のまま。並べると県の境目が線になります。
- **大きめ**: 旅のページ用に、好きな大きさで切り抜きます（フチは外側。県名とひとことを入れられます）。
- 写真は指で動かす・ピンチで拡大・回転（90°ごとに引っかかる）。
- L判・2L判・はがき・A4・A3 に、切り抜きをまとめて並べて書き出します（350dpi の JPEG。複数枚は ZIP）。
- 用紙の下に 3cm の目盛りが入ります。印刷して測った長さを入れると、次から大きさのずれを直します（用紙ごと）。
- 離れた島（伊豆諸島・小笠原、北方領土、奄美、宮古・八重山、隠岐、対馬・壱岐など）は、県ごとに入れる/入れないを選べます。
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
