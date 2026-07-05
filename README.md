# 47都道府県 主催・運営マップ（応援AI共創クエスト トラッカー）

Fandyプロジェクト4797に貼る「47都道府県 主催・運営マップ」を、
**西村さん自身のアカウントだけ（uyaisin / このPC）で自動更新する仕組み**。
（旧 ooentakada リポジトリには依存しない）

## 仕組み

```
Fandy決済 → (既存webhook) → Googleシート「Fandy申込」に行追加
  → シートの Apps Script が 住所→都道府県・return_title→役割 を集計し JSON公開（個人情報なし）
  → このPCの build.js が JSON取得 → 47-tracker.html 生成 → PNG化（Playwright）
  → uyaisin GitHub Pages へ公開
  → Fandy の <img>（uyaisin URL）が自動で最新化
```

- 公開PNG: <https://uyaisin.github.io/ouen-quest-tracker/47-tracker.png>
- Fandyには iframe/script/style が貼れないため PNG を `<img>` で表示

## ファイル

- `template.html` … トラッカーの見た目（データ差し込み用プレースホルダ入り）
- `data.json` … 都道府県ごとの主催/運営人数（源泉。空なら全県ゼロ）
- `build.js` … data.json → 47-tracker.html / index.html を生成（残り日数も自動計算）
- `scripts/render_png.js` … html?embed=1 をヘッドレスChromeでPNG化
- `scripts/pull_data.js` … Apps Script のJSONを取得して data.json を更新
- `scripts/update_and_publish.sh` … 取得→生成→PNG→公開 を一括実行（自動更新の本体）

## 手動更新

```bash
npm install && npx playwright install chromium   # 初回のみ
bash scripts/update_and_publish.sh
```

## Fandyに貼るタグ

```html
<img src="https://uyaisin.github.io/ouen-quest-tracker/47-tracker.png"
     alt="47都道府県 主催・運営マップ" loading="lazy"
     style="width:100%;height:auto;border-radius:5px;display:block;border:1px solid #ecd8da">
```
