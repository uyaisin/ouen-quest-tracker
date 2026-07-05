// Apps Script（シート集計）のJSONを取得して data.json を更新する。
// 取得先URLは scripts/config.json の dataEndpoint、または環境変数 DATA_ENDPOINT。
// 未設定/取得失敗のときは既存の data.json を保持して静かに終了（パイプラインは止めない）。
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");

function getEndpoint() {
  if (process.env.DATA_ENDPOINT) return process.env.DATA_ENDPOINT;
  const cfgPath = path.join(__dirname, "config.json");
  if (fs.existsSync(cfgPath)) {
    try { return JSON.parse(fs.readFileSync(cfgPath, "utf8")).dataEndpoint || ""; } catch {}
  }
  return "";
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      // Apps Script はリダイレクトする
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error("JSONではない応答: " + body.slice(0, 120))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
  });
}

(async () => {
  const endpoint = getEndpoint();
  if (!endpoint) {
    console.log("dataEndpoint 未設定 → 既存 data.json を保持");
    return;
  }
  try {
    const remote = await fetchJson(endpoint);
    if (!remote || typeof remote !== "object" || !remote.prefs) {
      throw new Error("prefs が無い応答");
    }
    const dataPath = path.join(ROOT, "data.json");
    let base = {};
    if (fs.existsSync(dataPath)) { try { base = JSON.parse(fs.readFileSync(dataPath, "utf8")); } catch {} }
    const merged = { ...base, ...remote, updated: "auto" };
    fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2) + "\n");
    const n = Object.keys(remote.prefs).length;
    console.log(`data.json 更新: ${n} 県分のデータを取得`);
  } catch (e) {
    console.error("取得失敗（既存 data.json を保持）:", e.message);
    process.exitCode = 0; // パイプラインは止めない
  }
})();
