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

  const URL = "https://db.pokemongohub.net/best/gym-defenders";
  console.log("🌍 Navigating to:", URL);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 0 });

  console.log("⏳ Waiting for full render...");
  await new Promise((resolve) => setTimeout(resolve, 8000));

  console.log("🔍 Extracting tier data...");
  const result = await page.evaluate(() => {
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

  console.log("📋 Tiers found:", Object.keys(result));
  console.log("👀 Example:", Object.entries(result)[0]);

  const outputPath = path.resolve(__dirname, "../outputs/gym-defender-tiers.json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ Scraped and saved gym defender tiers to ${outputPath}`);

  await browser.close();
})();
