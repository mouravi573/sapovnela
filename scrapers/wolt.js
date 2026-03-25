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
  "loratadine",
  "diclofenac",
];

const woltStores = [
  {
    name: "PSP Pharmacy",
    slug: "psp-aghmashenebeli",
    dbName: "PSP Pharmacy",
  },
  {
    name: "Aversi Pharma",
    slug: "aversi-baratashvili",
    dbName: "Aversi Pharma",
  },
];

async function scrapeWolt() {
  console.log("Starting Wolt scraper...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  });

  // Set location to Tbilisi once
  console.log("Setting location to Tbilisi...");
  await page.goto("https://wolt.com/en/geo/tbilisi", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  for (const store of woltStores) {
    console.log(`\nScraping ${store.name} on Wolt...`);

    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("id")
      .eq("name", store.dbName)
      .single();

    if (!pharmacy) {
      console.log(`  Pharmacy ${store.dbName} not found in DB, skipping`);
      continue;
    }

    for (const medicine of medicines) {
      try {
        const url = `https://wolt.com/en/geo/tbilisi/venue/${store.slug}/search?q=${medicine}`;
        console.log(`  Searching: ${medicine}`);

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await page.waitForTimeout(5000);

        const preview = await page.evaluate(() =>
          document.body.innerText.substring(0, 200),
        );
        console.log(
          "    Preview:",
          preview.replace(/\n/g, " ").substring(0, 100),
        );

        const items = await page.evaluate(() => {
          const results = [];
          const allText = document.body.innerText;
          const lines = allText.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const priceMatch =
              line.match(/^(\d+[.,]\d+)\s*₾?$/) ||
              line.match(/^GEL\s*(\d+[.,]\d+)$/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(",", "."));
              const name = lines[i - 1]?.trim();
              if (
                name &&
                name.length > 2 &&
                name.length < 100 &&
                price > 0 &&
                price < 500
              ) {
                results.push({ name, price });
              }
            }
          }
          return results;
        });

        console.log(`    Found ${items.length} items`);

        for (const item of items) {
          const { data: medData } = await supabase
            .from("medicines")
            .select("id")
            .ilike("name", `%${medicine}%`)
            .single();

          if (medData) {
            const { error } = await supabase.from("inventory").upsert(
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

            if (!error) {
              console.log(`    ✓ ${item.name} — ${item.price} ₾`);
            }
          }
        }

        await page.waitForTimeout(2000);
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log("\nWolt scraping complete!");
}

scrapeWolt();
