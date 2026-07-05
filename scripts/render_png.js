// 47-tracker.html を埋め込みモードでヘッドレスChromeにレンダリングし、
// 47-tracker.png として書き出す。ローカルでもGitHub Actionsでも同じように動く。
// 使い方: node scripts/render_png.js
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const root = path.resolve(__dirname, "..");
  const htmlPath = path.join(root, "47-tracker.html");
  const outPath = path.join(root, "47-tracker.png");

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 780, height: 1200 },
    deviceScaleFactor: 2, // Retina相当。文字がくっきりする
  });

  // file:// でも location.search は効くが、念のためクラスも直接付ける
  await page.goto("file://" + htmlPath + "?embed=1", { waitUntil: "networkidle" });
  await page.evaluate(() => document.body.classList.add("embed"));
  await page.waitForTimeout(400); // qfill等のtransition描画待ち

  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log("wrote " + outPath);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
