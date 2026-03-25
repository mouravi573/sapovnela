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
  "atorvastatin",
  "amlodipine",
  "losartan",
  "metoprolol",
  "ciprofloxacin",
  "azithromycin",
  "doxycycline",
  "cetirizine",
  "loratadine",
  "pantoprazole",
  "diclofenac",
  "naproxen",
  "tramadol",
];

async function scrapeAversi() {
  console.log("Starting Aversi scraper...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  });

  // Get Aversi pharmacy ID from our DB
  const { data: pharmacy } = await supabase
    .from("pharmacies")
    .select("id")
    .eq("name", "Aversi Pharma")
    .single();

  if (!pharmacy) {
    console.log("Aversi pharmacy not found in DB");
    await browser.close();
    return;
  }

  let totalScraped = 0;

  for (const medicineName of medicines) {
    try {
      console.log(`Searching for: ${medicineName}`);

      await page.goto(
        `https://www.aversi.ge/en/aversi/act/search/?q=${medicineName}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        },
      );
      await page.waitForTimeout(3000);
      const pageText = await page.evaluate(() =>
        document.body.innerText.substring(0, 500),
      );
      console.log("Page preview:", pageText);

      // Extract medicine items from search results
      const items = await page.evaluate(() => {
        const results = [];
        const priceRegex = /(\d+[\.,]\d+)\s*(gel|₾|lari)/i;
        document.body.innerText.split("\n").forEach((line) => {
          const priceMatch = line.match(priceRegex);
          if (priceMatch && line.length < 100) {
            results.push({
              name: line.replace(priceMatch[0], "").trim(),
              price: parseFloat(priceMatch[1].replace(",", ".")),
            });
          }
        });
        return results;
      });

      console.log(`  Found ${items.length} items for "${medicineName}"`);

      for (const item of items) {
        // Try to find matching medicine in our DB
        const { data: medData } = await supabase
          .from("medicines")
          .select("id")
          .ilike("name", `%${medicineName}%`)
          .single();

        if (medData) {
          // Upsert into inventory
          const { error } = await supabase.from("inventory").upsert(
            {
              pharmacy_id: pharmacy.id,
              medicine_id: medData.id,
              price: item.price,
              in_stock: true,
              stock_count: 10,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "pharmacy_id,medicine_id",
            },
          );

          if (!error) {
            console.log(`  ✓ Saved: ${item.name} — ${item.price} ₾`);
            totalScraped++;
          }
        }
      }

      // Polite delay between requests
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log(`  ✗ Error scraping ${medicineName}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\nDone! Scraped ${totalScraped} items from Aversi`);
}

scrapeAversi();
