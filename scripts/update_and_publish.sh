#!/usr/bin/env bash
# シート集計JSON取得 → 変化があればHTML生成→PNG化→GitHub Pagesへ公開。
# 自動更新(launchd)からも手動からも、これ1本で回る。
# launchdは最小PATHなので、使うコマンドの場所を通しておく。
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
set -uo pipefail
cd "$(dirname "$0")/.."

LOG="scripts/update.log"
ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

# 初回だけ playwright が無ければ入れる
if [ ! -d node_modules/playwright ]; then
  npm install --no-save playwright >>"$LOG" 2>&1 || true
  npx playwright install chromium >>"$LOG" 2>&1 || true
fi

# シートから最新データ取得
node scripts/pull_data.js >>"$LOG" 2>&1

# データも日付も変わっていなければ何もしない（無駄なレンダリングを避ける）
DATA_CHANGED=1
git diff --quiet -- data.json 2>/dev/null && DATA_CHANGED=0
TODAY="$(date '+%Y-%m-%d')"
DATE_STALE=1
if [ -f 47-tracker.html ] && grep -q "更新 $TODAY" 47-tracker.html; then DATE_STALE=0; fi

if [ "$DATA_CHANGED" = "0" ] && [ "$DATE_STALE" = "0" ]; then
  log "no change"
  echo "no change $(ts)"
  exit 0
fi

node build.js >>"$LOG" 2>&1
node scripts/render_png.js >>"$LOG" 2>&1

if ! git diff --quiet -- 47-tracker.png 47-tracker.html index.html data.json 2>/dev/null; then
  git add 47-tracker.png 47-tracker.html index.html data.json
  git commit -m "auto: トラッカー更新 $(ts)" >>"$LOG" 2>&1
  if git push origin main >>"$LOG" 2>&1; then
    log "published"
    echo "published $(ts)"
  else
    log "push FAILED"
    echo "push failed $(ts)"
    exit 1
  fi
else
  log "built, no diff to push"
  echo "no diff $(ts)"
fi
