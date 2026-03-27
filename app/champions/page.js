"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const SECTORS = [
  {
    key: "pain",
    icon: "💊",
    bg: "#FFEAEA",
    nameEn: "Pain Relief",
    nameGe: "ტკივილგამაყუჩებელი",
    medicines: ["Ibuprofen", "Paracetamol", "Aspirin", "Diclofenac"],
  },
  {
    key: "antibiotic",
    icon: "🦠",
    bg: "#E8F5E9",
    nameEn: "Antibiotics",
    nameGe: "ანტიბიოტიკი",
    medicines: [
      "Amoxicillin",
      "Azithromycin",
      "Ciprofloxacin",
      "Metronidazole",
    ],
  },
  {
    key: "heart",
    icon: "🫀",
    bg: "#FFF3E0",
    nameEn: "Heart & Blood",
    nameGe: "გული და სისხლი",
    medicines: ["Atorvastatin", "Amlodipine", "Lisinopril", "Bisoprolol"],
  },
  {
    key: "allergy",
    icon: "🤧",
    bg: "#E3F2FD",
    nameEn: "Allergy & Cold",
    nameGe: "ალერგია და გაციება",
    medicines: [
      "Cetirizine",
      "Loratadine",
      "Pseudoephedrine",
      "Chlorphenamine",
    ],
  },
  {
    key: "respiratory",
    icon: "🫁",
    bg: "#F3E5F5",
    nameEn: "Respiratory",
    nameGe: "სასუნთქი სისტემა",
    medicines: ["Salbutamol", "Budesonide", "Montelukast", "Bromhexine"],
  },
  {
    key: "vitamins",
    icon: "💊",
    bg: "#E8F5E9",
    nameEn: "Vitamins",
    nameGe: "ვიტამინები",
    medicines: ["Vitamin C", "Vitamin D3", "Vitamin B12", "Folic Acid"],
  },
  {
    key: "neuro",
    icon: "🧠",
    bg: "#FFF8E1",
    nameEn: "Neurology",
    nameGe: "ნევროლოგია",
    medicines: ["Sertraline", "Fluoxetine", "Diazepam", "Carbamazepine"],
  },
  {
    key: "diabetes",
    icon: "🩺",
    bg: "#FCE4EC",
    nameEn: "Diabetes",
    nameGe: "დიაბეტი",
    medicines: ["Metformin", "Glibenclamide", "Gliclazide", "Sitagliptin"],
  },
  {
    key: "dental",
    icon: "🦷",
    bg: "#E8EAF6",
    nameEn: "Dental",
    nameGe: "სტომატოლოგია",
    medicines: ["Metronidazole", "Amoxicillin", "Ibuprofen", "Clindamycin"],
  },
  {
    key: "eye",
    icon: "👁",
    bg: "#E0F7FA",
    nameEn: "Eye & Ear",
    nameGe: "თვალი და ყური",
    medicines: [
      "Chloramphenicol",
      "Tobramycin",
      "Ciprofloxacin",
      "Dexamethasone",
    ],
  },
  {
    key: "womens",
    icon: "🌸",
    bg: "#FCE4EC",
    nameEn: "Women's Health",
    nameGe: "ქალის ჯანმრთელობა",
    medicines: ["Folic Acid", "Iron", "Progesterone", "Clotrimazole"],
  },
  {
    key: "children",
    icon: "👶",
    bg: "#E8F5E9",
    nameEn: "Children",
    nameGe: "ბავშვები",
    medicines: ["Paracetamol", "Ibuprofen", "Amoxicillin", "Cetirizine"],
  },
  {
    key: "bones",
    icon: "🦴",
    bg: "#FFF3E0",
    nameEn: "Bones & Joints",
    nameGe: "ძვლები და სახსრები",
    medicines: ["Diclofenac", "Calcium", "Vitamin D3", "Glucosamine"],
  },
  {
    key: "bp",
    icon: "🩸",
    bg: "#FFEAEA",
    nameEn: "Blood Pressure",
    nameGe: "არტერიული წნევა",
    medicines: ["Amlodipine", "Lisinopril", "Losartan", "Bisoprolol"],
  },
  {
    key: "skin",
    icon: "🧴",
    bg: "#F3E5F5",
    nameEn: "Skin & Dermatology",
    nameGe: "კანი და დერმატოლოგია",
    medicines: ["Clotrimazole", "Hydrocortisone", "Tretinoin", "Miconazole"],
  },
];

export default function Champions() {
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const [champions, setChampions] = useState({});
  const [loading, setLoading] = useState(true);

  async function fetchChampions() {
    const results = {};
    for (const sector of SECTORS) {
      for (const medName of sector.medicines) {
        const { data: med } = await supabase
          .from("medicines")
          .select("id, name, dosage, form")
          .ilike("name", `%${medName}%`)
          .limit(1)
          .maybeSingle();
        if (med) {
          const { data: inv } = await supabase
            .from("inventory")
            .select("price, pharmacies(name, district)")
            .eq("medicine_id", med.id)
            .eq("in_stock", true)
            .order("price", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (inv) {
            results[sector.key] = {
              medicine: med,
              price: inv.price,
              pharmacy: inv.pharmacies,
            };
            break;
          }
        }
      }
      if (!results[sector.key]) results[sector.key] = null;
    }
    setChampions(results);
    setLoading(false);
  }

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);
    fetchChampions();
  }, []);

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          padding: "0 clamp(16px,4vw,40px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
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
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="/search"
            style={{
              fontSize: "13px",
              color: "#6BA89E",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ← {lang === "ge" ? "ძიება" : "Search"}
          </a>
          <div
            style={{
              display: "flex",
              background: "#C5E4F5",
              borderRadius: "20px",
              padding: "4px",
              gap: "3px",
            }}
          >
            {["en", "ge"].map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  localStorage.setItem("lang", l);
                }}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "5px 14px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  background: lang === l ? "#2A7A6E" : "transparent",
                  color: lang === l ? "#fff" : "#0F4D3A",
                }}
              >
                {l === "en" ? "EN" : "ქარ"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 24px 28px" }}>
        <h1
          style={{
            fontSize: "clamp(20px,4vw,28px)",
            fontWeight: 700,
            color: "#1A3A35",
            marginBottom: "8px",
          }}
        >
          🏆{" "}
          {lang === "ge"
            ? "საუკეთესო ფასები კატეგორიების მიხედვით"
            : "Champion Prices by Category"}
        </h1>
        <p style={{ fontSize: "13px", color: "#7AABA5" }}>
          {lang === "ge"
            ? "ყველაზე იაფი წამალი თითოეულ ჯგუფში · განახლდება რეალურ დროში"
            : "Cheapest medicine in each category · Updated in real time"}
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 clamp(16px,4vw,40px) 48px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #D0EBE7",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#9ABFBB",
                fontSize: "14px",
              }}
            >
              {lang === "ge" ? "იტვირთება..." : "Loading..."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F4FBFA" }}>
                  {[
                    lang === "ge" ? "კატეგორია" : "Category",
                    lang === "ge" ? "წამალი" : "Medicine",
                    lang === "ge" ? "ფასი" : "Price",
                    lang === "ge" ? "აფთიაქი" : "Pharmacy",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#9ABFBB",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "12px 16px",
                        textAlign: "left",
                        borderBottom: "1px solid #D0EBE7",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((sector, i) => {
                  const champ = champions[sector.key];
                  return (
                    <tr
                      key={sector.key}
                      style={{
                        borderBottom:
                          i < SECTORS.length - 1 ? "1px solid #F0F9F6" : "none",
                        transition: "background .2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#EBF6F4")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {/* Category */}
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: sector.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "15px",
                              flexShrink: 0,
                            }}
                          >
                            {sector.icon}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1A3A35",
                            }}
                          >
                            {lang === "ge" ? sector.nameGe : sector.nameEn}
                          </span>
                        </div>
                      </td>

                      {/* Medicine */}
                      <td style={{ padding: "12px 16px" }}>
                        {champ ? (
                          <>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#1A3A35",
                                marginBottom: "2px",
                              }}
                            >
                              {champ.medicine.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                              {champ.medicine.dosage} · {champ.medicine.form}
                            </div>
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#C0DDD9",
                              fontStyle: "italic",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px 16px" }}>
                        {champ ? (
                          <>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "#2A7A6E",
                              }}
                            >
                              {champ.price.toFixed(2)} ₾
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#FFF3E0",
                                color: "#C47D00",
                                border: "1px solid #FFD97A",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                display: "inline-block",
                                marginTop: "3px",
                              }}
                            >
                              🏆 Champion
                            </span>
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#C0DDD9",
                              fontStyle: "italic",
                            }}
                          >
                            {lang === "ge"
                              ? "ჯერ ფასი არ არის"
                              : "No price yet"}
                          </span>
                        )}
                      </td>

                      {/* Pharmacy */}
                      <td style={{ padding: "12px 16px" }}>
                        {champ?.pharmacy ? (
                          <>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "#1A3A35",
                                marginBottom: "2px",
                              }}
                            >
                              {champ.pharmacy.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                              📍 {champ.pharmacy.district}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#C0DDD9" }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Search button */}
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() =>
                            (window.location.href = `/search?q=${champ ? champ.medicine.name : sector.medicines[0]}`)
                          }
                          style={{
                            background: "#C5E4F5",
                            color: "#0F4D3A",
                            border: "none",
                            borderRadius: "20px",
                            padding: "7px 18px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {lang === "ge" ? "ძებნა →" : "Search →"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
