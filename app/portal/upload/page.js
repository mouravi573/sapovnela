"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function UploadCSV() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const router = useRouter();

  function parseCSV(text) {
    const lines = text.trim().split("\n");
    const rows = [];
    const errs = [];
    lines.slice(1).forEach((line, i) => {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      if (cols.length < 2) {
        errs.push(`Row ${i + 2}: not enough columns`);
        return;
      }
      const [name, priceRaw, stockRaw] = cols;
      const price = parseFloat(priceRaw);
      const stock = parseInt(stockRaw) || 10;
      if (!name) {
        errs.push(`Row ${i + 2}: missing medicine name`);
        return;
      }
      if (isNaN(price) || price <= 0) {
        errs.push(`Row ${i + 2}: invalid price "${priceRaw}"`);
        return;
      }
      rows.push({ name: name.trim(), price, stock, in_stock: true });
    });
    return { rows, errs };
  }

  function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) {
      setErrors(["Please upload a .csv file"]);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, errs } = parseCSV(e.target.result);
      setPreview(rows);
      setErrors(errs);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

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
      setErrors(["Pharmacy not found. Please register first."]);
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
            ← Dashboard
          </Link>
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
              Upload complete!
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#7AABA5",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              Successfully saved <strong>{savedCount}</strong> medicines to your
              inventory out of {preview.length} rows in the CSV.
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
              View inventory →
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
                Upload price list
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#7AABA5",
                  marginBottom: "20px",
                }}
              >
                Upload a CSV file with your medicines and prices. We will match
                them to our database automatically.
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
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#2A7A6E",
                    marginBottom: "8px",
                  }}
                >
                  CSV format (first row is header):
                </div>
                <code
                  style={{
                    fontSize: "12px",
                    color: "#1A3A35",
                    display: "block",
                    lineHeight: 1.8,
                  }}
                >
                  medicine_name,price,stock_count
                  <br />
                  Amoxicillin 500mg,1.60,50
                  <br />
                  Ibuprofen 400mg,0.90,30
                  <br />
                  Paracetamol 500mg,0.60,100
                </code>
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
                  Drop your CSV here or click to browse
                </div>
                <div style={{ fontSize: "12px", color: "#9ABFBB" }}>
                  Only .csv files accepted
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

            {/* Errors */}
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
                  ⚠️ {errors.length} issue(s) found:
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

            {/* Preview */}
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
                    Preview — {preview.length} medicines ready
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
                    {uploading
                      ? "Uploading..."
                      : `Upload ${preview.length} medicines →`}
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
                      {["Medicine", "Price", "Stock"].map((h) => (
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
                    ...and {preview.length - 10} more rows
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
