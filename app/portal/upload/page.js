"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const t = {
  en: {
    backDashboard: "← Dashboard",
    title: "Upload price list",
    subtitle:
      "Upload a CSV file with your medicines and prices. We will match them to our database automatically.",
    formatTitle: "CSV format (first row is header):",
    downloadTemplate: "⬇ Download template",
    dropTitle: "Drop your CSV here or click to browse",
    dropSub: "Only .csv files accepted",
    issuesFound: (n) => `${n} issue(s) found:`,
    previewTitle: (n) => `Preview — ${n} medicines ready`,
    uploadBtn: (n) => `Upload ${n} medicines →`,
    uploading: "Uploading...",
    medicine: "Medicine",
    price: "Price",
    stock: "Stock",
    moreRows: (n) => `...and ${n} more rows`,
    doneTitle: "Upload complete!",
    doneMsg: (saved, total) =>
      `Successfully saved ${saved} medicines to your inventory out of ${total} rows in the CSV.`,
    viewInventory: "View inventory →",
    wrongFile: "Please upload a .csv file",
    missingCols: (row) => `Row ${row}: not enough columns`,
    missingName: (row) => `Row ${row}: missing medicine name`,
    invalidPrice: (row, val) => `Row ${row}: invalid price "${val}"`,
  },
  ge: {
    backDashboard: "← დაფაზე დაბრუნება",
    title: "ფასების სიის ატვირთვა",
    subtitle:
      "ატვირთე CSV ფაილი შენი წამლებით და ფასებით. ავტომატურად შევუსაბამებთ ჩვენს ბაზას.",
    formatTitle: "CSV ფორმატი (პირველი სტრიქონი სათაურია):",
    downloadTemplate: "⬇ შაბლონის გადმოწერა",
    dropTitle: "ჩააგდე CSV ან დააჭირე დასათვალიერებლად",
    dropSub: "მხოლოდ .csv ფაილები",
    issuesFound: (n) => `${n} პრობლემა აღმოჩნდა:`,
    previewTitle: (n) => `გადახედვა — ${n} წამალი მზადაა`,
    uploadBtn: (n) => `${n} წამლის ატვირთვა →`,
    uploading: "იტვირთება...",
    medicine: "წამალი",
    price: "ფასი",
    stock: "მარაგი",
    moreRows: (n) => `...და კიდევ ${n} სტრიქონი`,
    doneTitle: "ატვირთვა დასრულდა!",
    doneMsg: (saved, total) =>
      `წარმატებით შეინახა ${saved} წამალი ${total} სტრიქონიდან.`,
    viewInventory: "ინვენტარის ნახვა →",
    wrongFile: "გთხოვთ ატვირთოთ .csv ფაილი",
    missingCols: (row) => `სტრიქონი ${row}: არ არის საკმარისი სვეტები`,
    missingName: (row) => `სტრიქონი ${row}: წამლის სახელი აკლია`,
    invalidPrice: (row, val) => `სტრიქონი ${row}: არასწორი ფასი "${val}"`,
  },
};

export default function UploadCSV() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [lang, setLang] = useState("en");
  const tr = t[lang];
  const router = useRouter();

  function downloadTemplate() {
    const csv =
      lang === "en"
        ? `medicine_name,price,stock_count\nAmoxicillin 500mg,,\nIbuprofen 400mg,,\nParacetamol 500mg,,\nAspirin 100mg,,\nOmeprazole 20mg,,\nMetformin 850mg,,\nAzithromycin 250mg,,\nCetirizine 10mg,,\nVitamin C 500mg,,\nVitamin D3 1000IU,,`
        : `წამლის_სახელი,ფასი,მარაგი\nამოქსიცილინი 500მგ,,\nიბუპროფენი 400მგ,,\nპარაცეტამოლი 500მგ,,\nასპირინი 100მგ,,\nომეპრაზოლი 20მგ,,\nმეტფორმინი 850მგ,,\nაზითრომიცინი 250მგ,,\nცეტირიზინი 10მგ,,\nვიტამინი C 500მგ,,\nვიტამინი D3 1000IU,,`;

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      lang === "en" ? "sapovnela-template.csv" : "საპოვნელა-შაბლონი.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const rows = [];
    const errs = [];
    lines.slice(1).forEach((line, i) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      if (cols.length < 2) {
        errs.push(tr.missingCols(i + 2));
        return;
      }
      const [name, priceRaw, stockRaw] = cols;
      const price = parseFloat(priceRaw);
      const stock = parseInt(stockRaw) || 10;
      if (!name) {
        errs.push(tr.missingName(i + 2));
        return;
      }
      if (isNaN(price) || price <= 0) {
        errs.push(tr.invalidPrice(i + 2, priceRaw));
        return;
      }
      rows.push({ name: name.trim(), price, stock, in_stock: true });
    });
    return { rows, errs };
  }

  async function aiParseCSV(rawText) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are a pharmacy data parser. Convert this CSV data into a standardized format.

The input CSV may have:
- Columns in any order
- Georgian or English headers
- Misspelled medicine names
- Different column names (name/სახელი/დასახელება, price/ფასი/cost, quantity/რაოდენობა/stock)

Output ONLY a valid CSV with exactly these headers and nothing else:
medicine_name,price,stock_count

Rules:
- medicine_name: the medicine name as close to standard English pharmaceutical naming as possible
- price: numeric price in GEL, no currency symbols
- stock_count: numeric quantity, default to 10 if not provided
- Skip rows where price is empty or zero
- Do not include any explanation, just the CSV

Input CSV:
${rawText.substring(0, 3000)}`,
          context: "",
        }),
      });
      const data = await res.json();
      const csv = data.reply?.trim();
      if (!csv || !csv.includes("medicine_name")) {
        return {
          error:
            lang === "en"
              ? "AI could not read this file format"
              : "AI-მ ვერ წაიკითხა ეს ფაილი",
        };
      }
      return { csv };
    } catch {
      return {
        error:
          lang === "en" ? "AI parsing failed" : "AI-ის დამუშავება ვერ მოხერხდა",
      };
    }
  }

  function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) {
      setErrors([tr.wrongFile]);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const firstLine = text.split("\n")[0].toLowerCase();
      const isOurFormat =
        firstLine.includes("medicine_name") ||
        firstLine.includes("წამლის_სახელი");

      if (isOurFormat) {
        const { rows, errs } = parseCSV(text);
        setPreview(rows);
        setErrors(errs);
      } else {
        setErrors([
          lang === "en"
            ? "🤖 AI is reading your file..."
            : "🤖 AI კითხულობს შენს ფაილს...",
        ]);
        setPreview([]);
        const normalized = await aiParseCSV(text);
        if (normalized.error) {
          setErrors([normalized.error]);
        } else {
          setErrors([]);
          const { rows, errs } = parseCSV(normalized.csv);
          setPreview(rows);
          setErrors(errs);
        }
      }
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload() {
    if (preview.length === 0) return;
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/portal/login");
      return;
    }

    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pharmacy) {
      setErrors([
        lang === "en"
          ? "Pharmacy not found. Please register first."
          : "აფთიაქი ვერ მოიძებნა. გთხოვთ ჯერ დარეგისტრირდეთ.",
      ]);
      setUploading(false);
      return;
    }

    let saved = 0;
    for (const row of preview) {
      const { data: med } = await supabase
        .from("medicines")
        .select("id")
        .ilike("name", `%${row.name}%`)
        .limit(1)
        .maybeSingle();

      if (med) {
        await supabase.from("inventory").upsert(
          {
            pharmacy_id: pharmacy.id,
            medicine_id: med.id,
            price: row.price,
            stock_count: row.stock,
            in_stock: row.in_stock,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "pharmacy_id,medicine_id" },
        );
        saved++;
      }
    }

    setSavedCount(saved);
    setUploading(false);
    setDone(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          padding: "0 40px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              background: "#2A7A6E",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="9" y="3" width="4" height="16" rx="2" fill="white" />
              <rect x="3" y="9" width="16" height="4" rx="2" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1A3A35",
              fontFamily: "Georgia, serif",
            }}
          >
            საპოვ<span style={{ color: "#2A7A6E" }}>ნელა</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/portal/dashboard"
            style={{
              fontSize: "13px",
              color: "#6BA89E",
              textDecoration: "none",
            }}
          >
            {tr.backDashboard}
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#EBF6F4",
              borderRadius: "20px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {["en", "ge"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  fontSize: "12px",
                  fontWeight: lang === l ? 600 : 400,
                  padding: "4px 12px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  background: lang === l ? "#2A7A6E" : "transparent",
                  color: lang === l ? "#fff" : "#6BA89E",
                }}
              >
                {l === "en" ? "EN" : "ქარ"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div
        style={{ maxWidth: "640px", margin: "40px auto", padding: "0 24px" }}
      >
        {done ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #D0EBE7",
              borderRadius: "16px",
              padding: "36px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "10px",
              }}
            >
              {tr.doneTitle}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#7AABA5",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              {tr.doneMsg(savedCount, preview.length)}
            </p>
            <Link
              href="/portal/dashboard"
              style={{
                display: "inline-block",
                background: "#2A7A6E",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {tr.viewInventory}
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "#fff",
                border: "1px solid #D0EBE7",
                borderRadius: "16px",
                padding: "28px",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "6px",
                }}
              >
                {tr.title}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#7AABA5",
                  marginBottom: "20px",
                }}
              >
                {tr.subtitle}
              </p>

              {/* Format guide */}
              <div
                style={{
                  background: "#EBF6F4",
                  border: "1px solid #A8D9D0",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2A7A6E",
                    }}
                  >
                    {tr.formatTitle}
                  </div>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      background: "#2A7A6E",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "5px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {tr.downloadTemplate}
                  </button>
                </div>
                <pre
                  style={{
                    fontSize: "12px",
                    color: "#1A3A35",
                    lineHeight: 1.8,
                    margin: 0,
                    fontFamily: "monospace",
                  }}
                >
                  {`medicine_name,price,stock_count
Amoxicillin 500mg,1.60,50
Ibuprofen 400mg,0.90,30
Paracetamol 500mg,0.60,100`}
                </pre>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragging ? "#2A7A6E" : "#D0EBE7"}`,
                  borderRadius: "12px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging ? "#EBF6F4" : "#F8FDFC",
                  transition: "all .2s",
                }}
                onClick={() => document.getElementById("csv-input").click()}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A3A35",
                    marginBottom: "4px",
                  }}
                >
                  {tr.dropTitle}
                </div>
                <div style={{ fontSize: "12px", color: "#9ABFBB" }}>
                  {tr.dropSub}
                </div>
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {errors.length > 0 && (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "1px solid #F09595",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#A32D2D",
                    marginBottom: "6px",
                  }}
                >
                  ⚠️ {tr.issuesFound(errors.length)}
                </div>
                {errors.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "12px",
                      color: "#A32D2D",
                      marginTop: "3px",
                    }}
                  >
                    • {e}
                  </div>
                ))}
              </div>
            )}

            {preview.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1A3A35",
                    }}
                  >
                    {tr.previewTitle(preview.length)}
                  </h3>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{
                      background: uploading ? "#9ABFBB" : "#2A7A6E",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 20px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: uploading ? "default" : "pointer",
                    }}
                  >
                    {uploading ? tr.uploading : tr.uploadBtn(preview.length)}
                  </button>
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr>
                      {[tr.medicine, tr.price, tr.stock].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            borderBottom: "1px solid #D0EBE7",
                            color: "#9ABFBB",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td
                          style={{
                            padding: "7px 8px",
                            color: "#1A3A35",
                            fontWeight: 500,
                          }}
                        >
                          {row.name}
                        </td>
                        <td
                          style={{
                            padding: "7px 8px",
                            color: "#2A7A6E",
                            fontWeight: 600,
                          }}
                        >
                          {row.price.toFixed(2)} ₾
                        </td>
                        <td style={{ padding: "7px 8px", color: "#9ABFBB" }}>
                          {row.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ABFBB",
                      marginTop: "8px",
                      textAlign: "center",
                    }}
                  >
                    {tr.moreRows(preview.length - 10)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
