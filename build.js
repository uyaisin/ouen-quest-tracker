// data.json（都道府県ごとの主催/運営人数）から 47-tracker.html を生成する。
// data.json が無ければ全県ゼロで生成（初期状態）。
// 使い方: node build.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

// 地方→都道府県の並び（表示順。トラッカーの見た目を固定）
const REGIONS = {
  "北海道・東北": ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島"],
  "関東": ["茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川"],
  "中部": ["新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知"],
  "近畿": ["三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"],
  "中国・四国": ["鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知"],
  "九州・沖縄": ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"],
  "オンライン": ["オンライン"],
};

function loadData() {
  const p = path.join(ROOT, "data.json");
  if (!fs.existsSync(p)) return { prefs: {} };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("data.json の読み込みに失敗:", e.message, "→ 全県ゼロで生成します");
    return { prefs: {} };
  }
}

function daysUntil(deadlineISO) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(deadlineISO + "T00:00:00");
  return Math.max(0, Math.round((d - today) / 86400000));
}

function todayISO() {
  const n = new Date();
  const z = (x) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${z(n.getMonth() + 1)}-${z(n.getDate())}`;
}

function main() {
  const data = loadData();
  const prefs = data.prefs || {};
  const deadline = data.deadline || "2026-09-02";
  const deadlineLabel = data.deadlineLabel || deadline.replace(/-0?/g, ".").replace(/^\./, "");
  const updated = data.updated && data.updated !== "auto" ? data.updated : todayISO();

  // DATA オブジェクトを組み立て
  const DATA = {};
  for (const [region, names] of Object.entries(REGIONS)) {
    DATA[region] = names.map((name) => {
      const e = prefs[name] || {};
      const host = e.host || 0;
      const mgr = e.mgr || 0;
      const hostNames = Array.isArray(e.hostNames) ? e.hostNames : [];
      const mgrNames = Array.isArray(e.mgrNames) ? e.mgrNames : [];
      return [name, host, mgr, hostNames, mgrNames];
    });
  }

  const template = fs.readFileSync(path.join(ROOT, "template.html"), "utf8");
  const html = template
    .replace("__DATA__", JSON.stringify(DATA))
    .replace("__DAYS__", String(daysUntil(deadline)))
    .replace("__DEADLINE_LABEL__", deadlineLabel)
    .replace("__UPDATED__", updated);

  fs.writeFileSync(path.join(ROOT, "47-tracker.html"), html);
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  console.log(`built 47-tracker.html (更新 ${updated} / 残り${daysUntil(deadline)}日)`);
}

main();
