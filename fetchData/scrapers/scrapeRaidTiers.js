const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

(async () => {
  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

  const url = "https://db.pokemongohub.net/best/raid-attackers";
  console.log("🌍 Navigating to:", url);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

  console.log("⏳ Waiting for full render...");
  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log("🔍 Extracting tier data...");
  const results = await page.evaluate(() => {
    const tiers = {};
    const tierCards = document.querySelectorAll("article[class^='Card_card']");

    tierCards.forEach((tierCard) => {
      const header = tierCard.querySelector("h1")?.textContent?.trim();
      const names = Array.from(tierCard.querySelectorAll("a[title]")).map((el) => el.textContent.trim());

      if (header && names.length > 0) {
        tiers[header] = names;
      }
    });

    return tiers;
  });

  console.log("📋 Tiers found:", Object.keys(results));
  console.log("👀 Example:", Object.entries(results)[0]);

  const outPath = path.join(__dirname, "../outputs/raid-tiers.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log("✅ Scraped and saved raid tiers to", outPath);

  await browser.close();
})();
