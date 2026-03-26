const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const batches = [
  "antibiotics and antivirals",
  "painkillers and anti-inflammatories",
  "cardiovascular and blood pressure",
  "diabetes and metabolic",
  "gastro and digestive",
  "respiratory and allergy",
  "vitamins and supplements",
  "dermatology and topical",
  "neurology and mental health",
  "hormones and endocrine",
];

async function generateMedicines(category) {
  console.log(`\nGenerating: ${category}...`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: `Generate a list of 50 commonly used medicines in Georgia (country) in the category: ${category}.

Return ONLY a JSON array with no explanation, no markdown, no code blocks. Just raw JSON like this:
[
  {
    "name": "Amoxicillin 500mg",
    "name_ge": "ამოქსიცილინი 500მგ",
    "generic_name": "Amoxicillin",
    "category": "Antibiotic",
    "dosage": "500mg",
    "form": "Capsules",
    "manufacturer": "Generic"
  }
]

Rules:
- name: English brand/generic name with dosage
- name_ge: Georgian script translation
- generic_name: active ingredient in English
- category: one of Antibiotic, Painkiller, Cardiology, Diabetes, Gastro, Respiratory, Allergy, Vitamin, Dermatology, Neurology, Hormone, Other
- dosage: just the dose like 500mg, 10mg, 1g
- form: Tablets, Capsules, Syrup, Injection, Cream, Drops, Spray, Gel
- manufacturer: Generic, Bayer, Pfizer, Novartis, Teva, Sanofi, GSK, Roche, or other real manufacturer
- Only include medicines actually available and used in Georgia
- No duplicates`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text.trim();

  try {
    const medicines = JSON.parse(text);
    return medicines;
  } catch {
    console.log("Parse error, trying to extract JSON...");
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}

async function insertMedicines(medicines) {
  let inserted = 0;
  let skipped = 0;

  for (const med of medicines) {
    const { data: existing } = await supabase
      .from("medicines")
      .select("id")
      .ilike("name", med.name)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("medicines").insert({
      name: med.name,
      name_ge: med.name_ge,
      generic_name: med.generic_name,
      category: med.category,
      dosage: med.dosage,
      form: med.form,
      manufacturer: med.manufacturer,
    });

    if (!error) inserted++;
    else console.log("Insert error:", error.message);
  }

  return { inserted, skipped };
}

async function main() {
  console.log("Starting medicine seed with Claude AI...");
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const batch of batches) {
    const medicines = await generateMedicines(batch);
    console.log(`  Got ${medicines.length} medicines`);

    const { inserted, skipped } = await insertMedicines(medicines);
    console.log(`  Inserted: ${inserted}, Skipped: ${skipped}`);
    totalInserted += inserted;
    totalSkipped += skipped;

    // Polite delay between API calls
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(
    `\n✓ Done! Total inserted: ${totalInserted}, Skipped: ${totalSkipped}`,
  );

  // Final count
  const { count } = await supabase
    .from("medicines")
    .select("*", { count: "exact", head: true });
  console.log(`✓ Total medicines in database: ${count}`);
}

main();
