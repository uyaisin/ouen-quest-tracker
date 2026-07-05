#!/usr/bin/env bash
# シート集計JSON取得 → HTML生成 → PNG化 → 変化があれば GitHub Pages へ公開。
# 自動更新(launchd)からも手動からも、これ1本で回る。
set -euo pipefail
cd "$(dirname "$0")/.."

# 初回だけ playwright が無ければ入れる
if [ ! -d node_modules/playwright ]; then
  npm install --no-save playwright >/dev/null 2>&1 || true
  npx playwright install chromium >/dev/null 2>&1 || true
fi

node scripts/pull_data.js
node build.js
node scripts/render_png.js

# 47-tracker.png / html に差分があるときだけコミット&プッシュ
if ! git diff --quiet -- 47-tracker.png 47-tracker.html index.html data.json 2>/dev/null; then
  git add 47-tracker.png 47-tracker.html index.html data.json
  git commit -m "auto: トラッカー更新 $(date '+%Y-%m-%d %H:%M')" >/dev/null
  git push origin main
  echo "published $(date '+%Y-%m-%d %H:%M')"
else
  echo "no change $(date '+%Y-%m-%d %H:%M')"
fi
