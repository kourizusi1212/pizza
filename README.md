# 🍕 Pizzeria Online

みんなで焼いて売る、協力プレイのオンライン3Dピザ屋ゲーム（Node.js + WebSocket + three.js）。

## 遊び方
1. 名前と色を決めて **ルームを作る** → 表示された4文字コードを友達に伝える
2. 友達は **コードで参加** → ホスト（👑）が **ゲーム開始**
3. `WASD` / 矢印で移動、`Space` / `E` で操作
   **生地 → トッピング → オーブン（8秒で完成・14秒で焦げる）→ カウンターのお客さんへ**
   焦げたピザはゴミ箱へ。お客さんは待たせるほど怒ります。

## セーブ / ロード
- 💾 セーブ: ブラウザに保存 / ⬇ 書き出し: JSONファイルとしてダウンロード
- 📂 ロード・📁 ファイル: ゲーム中はホストのみ。ロビーでは「ルームを作る」前に読み込むと、そのデータで開始
- セーブはプレイヤー側（ブラウザ/ファイル）に保存されるので、Renderの無料プランでサーバーが再起動しても消えません

## ローカル起動
```
npm install
npm start      # http://localhost:3000
```

## GitHub
```
git init && git add . && git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<you>/pizzeria-online.git
git push -u origin main
```

## Render
1. Render で **New + → Web Service**（`render.yaml` があるので **Blueprint** でも可）→ このリポジトリを選択
2. Build Command: `npm install` / Start Command: `npm start`
3. 発行されたURLを開けばOK（WebSocketは同じドメインでそのまま動きます）

無料プランは無操作で休止し、復帰に1分ほどかかります。
