"use client";
import { useState } from "react";

const translations = {
  en: {
    find: "Find",
    affordable: "affordable medicine",
    nearYou: "near you",
    subtitle: "Real-time prices from pharmacies across Georgia",
    placeholder: "Medicine name, active ingredient...",
    search: "Search",
    aiName: "MedAI Assistant",
    aiDefault:
      "Hello! Search for any medicine above and I will find the cheapest options near you in Tbilisi.",
    aiResult: (count, name, price) =>
      `I found ${count} medicine(s) matching ${name}. Cheapest option from ${price} ₾. Scroll down to compare!`,
    pharmaciesInStock: (n) => `${n} pharmacies in stock`,
    from: "from",
    cheapest: "Cheapest",
    independent: "Independent",
    directions: "Directions",
    searching: "Searching pharmacies near you...",
    noResults: (q) => `No results found for ${q}`,
    stats: [
      { val: "847", label: "Medicines tracked" },
      { val: "124", label: "Pharmacies listed" },
      { val: "Free", label: "No registration" },
    ],
    findMedicine: "Find Medicine",
    portal: "Pharmacy Portal",
    generic: "Generic",
    location: "Vake, Tbilisi",
    tagline: "Georgia's medicine price finder",
  },
  ge: {
    find: "იპოვე",
    affordable: "ხელმისაწვდომი წამალი",
    nearYou: "შენთან ახლოს",
    subtitle: "რეალური ფასები საქართველოს აფთიაქებიდან",
    placeholder: "წამლის სახელი, აქტიური ინგრედიენტი...",
    search: "ძებნა",
    aiName: "MedAI ასისტენტი",
    aiDefault:
      "გამარჯობა! მოძებნე ნებისმიერი წამალი და ვიპოვი ყველაზე იაფ ვარიანტს შენთან ახლოს.",
    aiResult: (count, name, price) =>
      `ვიპოვე ${count} წამალი ${name}-ისთვის. ყველაზე იაფი ${price} ₾-დან. გადაახვიე შედარებისთვის!`,
    pharmaciesInStock: (n) => `${n} აფთიაქში მარაგშია`,
    from: "დან",
    cheapest: "ყველაზე იაფი",
    independent: "დამოუკიდებელი",
    directions: "მარშრუტი",
    searching: "ვეძებ აფთიაქებს შენთან ახლოს...",
    noResults: (q) => `ვერ ვიპოვე: ${q}`,
    stats: [
      { val: "847", label: "წამალი" },
      { val: "124", label: "აფთიაქი" },
      { val: "უფასო", label: "რეგისტრაციის გარეშე" },
    ],
    findMedicine: "წამლის პოვნა",
    portal: "აფთიაქის პორტალი",
    generic: "გენერიკი",
    location: "ვაკე, თბილისი",
    tagline: "საქართველოს წამლების ფასების საძიებო",
  },
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          background: "#2A7A6E",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="9" y="3" width="4" height="16" rx="2" fill="white" />
          <rect x="3" y="9" width="16" height="4" rx="2" fill="white" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            color: "#1A3A35",
            fontFamily: "Georgia, serif",
          }}
        >
          საპოვ<span style={{ color: "#2A7A6E" }}>ნელა</span>
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "#6BA89E",
            letterSpacing: "0.3px",
            marginTop: "2px",
          }}
        >
          sapovnela.com
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lang, setLang] = useState("en");
  const t = translations[lang];

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${query}`);
    const json = await res.json();
    setResults(json.data || []);
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  const grouped = results.reduce((acc, item) => {
    if (!item.medicines) return acc;
    const key = item.medicines.id;
    if (!acc[key]) acc[key] = { medicine: item.medicines, pharmacies: [] };
    if (item.pharmacies)
      acc[key].pharmacies.push({
        ...item.pharmacies,
        price: item.price,
        stock_count: item.stock_count,
      });
    return acc;
  }, {});

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
          padding: "0 40px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Logo />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#EBF6F4",
            borderRadius: "20px",
            padding: "3px",
            gap: "2px",
            marginLeft: "8px",
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
                transition: "all .2s",
              }}
            >
              {l === "en" ? "EN" : "ქარ"}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button
          style={{
            fontSize: "13px",
            color: "#4A7A74",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t.findMedicine}
        </button>
        <button
          onClick={() => (window.location.href = "/portal")}
          style={{
            fontSize: "13px",
            background: "#2A7A6E",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "8px 20px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {t.portal}
        </button>
      </nav>

      {/* Hero */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          padding: "36px 40px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#2A7A6E",
            }}
          ></div>
          <span style={{ fontSize: "12px", color: "#6BA89E", fontWeight: 500 }}>
            {t.tagline}
          </span>
        </div>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: 700,
            color: "#1A3A35",
            marginBottom: "6px",
            letterSpacing: "-0.5px",
            lineHeight: 1.3,
          }}
        >
          {t.find} <span style={{ color: "#2A7A6E" }}>{t.affordable}</span>{" "}
          {t.nearYou}
        </h1>
        <p style={{ fontSize: "14px", color: "#7AABA5", marginBottom: "22px" }}>
          {t.subtitle}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "2px solid #D0EBE7",
            borderRadius: "16px",
            padding: "6px 6px 6px 16px",
            background: "#fff",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <circle cx="7" cy="7" r="5" stroke="#9ABFBB" strokeWidth="1.5" />
            <path
              d="M11 11l2.5 2.5"
              stroke="#9ABFBB"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "#1A3A35",
              background: "transparent",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#EBF6F4",
              border: "1px solid #A8D9D0",
              color: "#2A7A6E",
              padding: "5px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#2A7A6E",
              }}
            ></div>
            {t.location}
          </div>
          <button
            onClick={handleSearch}
            style={{
              background: "#2A7A6E",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "10px 22px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t.search}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "14px",
            flexWrap: "wrap",
          }}
        >
          {[
            "Ibuprofen",
            "Paracetamol",
            "Metformin",
            "Omeprazole",
            "Aspirin",
            "Amoxicillin",
          ].map((tag) => (
            <span
              key={tag}
              onClick={() => setQuery(tag)}
              style={{
                background: "#EBF6F4",
                color: "#2A7A6E",
                border: "1px solid #A8D9D0",
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* AI Bar */}
      <div
        style={{
          margin: "16px 40px 0",
          background: "#F0EBF8",
          border: "1px solid #C8B8ED",
          borderRadius: "12px",
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            background: "#7B52C8",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "17px",
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#7B52C8",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {t.aiName}
          </div>
          <p style={{ fontSize: "13px", color: "#3D2070", lineHeight: 1.6 }}>
            {searched && results.length > 0
              ? t.aiResult(
                  Object.keys(grouped).length,
                  query,
                  Math.min(...results.map((r) => r.price)).toFixed(2),
                )
              : t.aiDefault}
          </p>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: "20px 40px 48px" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#9ABFBB",
              fontSize: "14px",
            }}
          >
            {t.searching}
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#9ABFBB",
              fontSize: "14px",
            }}
          >
            {t.noResults(query)}
          </div>
        )}
        {!loading && !searched && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "12px",
            }}
          >
            {t.stats.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "12px",
                  padding: "22px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#2A7A6E",
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ABFBB",
                    marginTop: "4px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading &&
          Object.values(grouped).map(({ medicine, pharmacies }) => (
            <div
              key={medicine.id}
              style={{
                background: "#fff",
                border: "1px solid #D0EBE7",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#1A3A35",
                      marginBottom: "4px",
                    }}
                  >
                    {medicine.name}
                  </h2>
                  <p style={{ fontSize: "12px", color: "#9ABFBB" }}>
                    {medicine.form} · {medicine.category} · {t.generic}:{" "}
                    {medicine.generic_name}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      background: "#EBF6F4",
                      color: "#2A7A6E",
                      border: "1px solid #A8D9D0",
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: "10px",
                    }}
                  >
                    {t.pharmaciesInStock(pharmacies.length)}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                    {t.from}
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#2A7A6E",
                      lineHeight: 1.1,
                    }}
                  >
                    {Math.min(...pharmacies.map((p) => p.price)).toFixed(2)} ₾
                  </div>
                </div>
              </div>
              {pharmacies
                .sort((a, b) => a.price - b.price)
                .map((ph, i) => (
                  <div
                    key={ph.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: i === 0 ? "#EBF6F4" : "#F8FDFC",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: i === 0 ? "#2A7A6E" : "#C0DDD9",
                      }}
                    ></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1A3A35",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ph.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9ABFBB",
                          marginTop: "2px",
                        }}
                      >
                        {ph.address} · {ph.hours}
                      </div>
                    </div>
                    {i === 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#FFF3E0",
                          color: "#C47D00",
                          border: "1px solid #FFD97A",
                          padding: "3px 9px",
                          borderRadius: "8px",
                        }}
                      >
                        {t.cheapest}
                      </span>
                    )}
                    {ph.is_independent && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          background: "#EBF6F4",
                          color: "#2A7A6E",
                          border: "1px solid #A8D9D0",
                          padding: "3px 9px",
                          borderRadius: "8px",
                        }}
                      >
                        {t.independent}
                      </span>
                    )}
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1A3A35",
                        minWidth: "48px",
                        textAlign: "right",
                      }}
                    >
                      {ph.price.toFixed(2)} ₾
                    </div>
                    <button
                      style={{
                        background: "#2A7A6E",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {t.directions}
                    </button>
                  </div>
                ))}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #D0EBE7",
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
        }}
      >
        <Logo />
        <span style={{ fontSize: "12px", color: "#9ABFBB" }}>
          © 2025 საპოვნელა · Georgia&apos;s medicine price finder
        </span>
      </div>
    </main>
  );
}
