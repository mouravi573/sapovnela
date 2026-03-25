const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const medicines = [
  "amoxicillin",
  "ibuprofen",
  "paracetamol",
  "metformin",
  "omeprazole",
  "aspirin",
  "lisinopril",
  "ciprofloxacin",
  "azithromycin",
  "cetirizine",
  "diclofenac",
  "atorvastatin",
];

async function scrapePSP() {
  console.log("Starting PSP scraper...");

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "ka-GE",
    timezoneId: "Asia/Tbilisi",
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const { data: pharmacy } = await supabase
    .from("pharmacies")
    .select("id")
    .eq("name", "PSP Pharmacy")
    .single();

  if (!pharmacy) {
    console.log("PSP Pharmacy not found in DB");
    await browser.close();
    return;
  }

  // Open homepage once
  await page.goto("https://psp.ge", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  console.log("PSP homepage loaded");

  let total = 0;

  for (const medicine of medicines) {
    try {
      console.log(`\nSearching PSP for: ${medicine}`);

      // Click the search icon to open the search bar
      await page.click('.search-icon, [class*="search"] svg, [icon*="Search"]');
      await page.waitForTimeout(1000);

      // Now fill the revealed input
      await page.fill('input[name="header-search"]', medicine);
      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(5000);

      const url = page.url();
      console.log("URL:", url);

      const preview = await page.evaluate(() =>
        document.body.innerText.substring(0, 200),
      );
      console.log("Preview:", preview.replace(/\n/g, " ").substring(0, 120));

      const items = await page.evaluate(() => {
        const results = [];
        const selectors = [
          '[class*="product"]',
          '[class*="item"]',
          '[class*="card"]',
          "article",
        ];
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          els.forEach((el) => {
            const text = el.innerText || "";
            const priceMatch = text.match(/(\d+[.,]\d+)\s*₾/);
            const lines = text.split("\n").filter((l) => l.trim());
            if (priceMatch && lines.length > 0) {
              const price = parseFloat(priceMatch[1].replace(",", "."));
              const name = lines[0].trim();
              if (name && price > 0 && price < 1000 && name.length > 3) {
                results.push({ name, price });
              }
            }
          });
          if (results.length > 0) break;
        }
        return results.slice(0, 20);
      });

      console.log(`Found ${items.length} items`);

      for (const item of items) {
        const { data: medData } = await supabase
          .from("medicines")
          .select("id")
          .ilike("name", `%${medicine}%`)
          .single();

        if (medData) {
          await supabase.from("inventory").upsert(
            {
              pharmacy_id: pharmacy.id,
              medicine_id: medData.id,
              price: item.price,
              in_stock: true,
              stock_count: 99,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "pharmacy_id,medicine_id" },
          );

          console.log(`✓ ${item.name} — ${item.price} ₾`);
          total++;
        }
      }

      await page.waitForTimeout(2000);
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone! Saved ${total} items from PSP`);
}

scrapePSP();
