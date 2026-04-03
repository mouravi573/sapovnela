"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../../components/MapView"), {
  ssr: false,
});

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
    cheapestLabel: "💰 Cheapest",
    nearestLabel: "📍 Nearest",
    independent: "Independent",
    directions: "Directions",
    searching: "Searching pharmacies near you...",
    otherOptions: "Other options",
    results: (n) => `${n} result${n !== 1 ? "s" : ""} · sorted by price`,
    stats: [
      { val: "474", label: "Medicines tracked" },
      { val: "124", label: "Pharmacies listed" },
      { val: "Free", label: "No registration" },
    ],
    portal: "For Pharmacies",
    generic: "Generic",
    location: "Location",
    locating: "Locating...",
    yourLocation: "Your location",
    tagline: "Georgia's medicine price finder",
    askPlaceholder: "Ask about this medicine...",
    askBtn: "Ask →",
    showMap: "Show map",
    hideMap: "Hide map",
    backHome: "← Home",
    championsLink: "See best prices by category →",
  },
  ge: {
    find: "იპოვე",
    affordable: "ხელმისაწვდომი წამალი",
    nearYou: "შენს მახლობლად",
    subtitle: "მიმდინარე ფასები საქართველოს აფთიაქებიდან",
    placeholder: "წამლის სახელი, აქტიური ინგრედიენტი...",
    search: "ძებნა",
    aiName: "MedAI ასისტენტი",
    aiDefault:
      "გამარჯობა! მოძებნე ნებისმიერი წამალი და გიპოვი ყველაზე იაფ არჩევანს მახლობლად.",
    aiResult: (count, name, price) =>
      `ვიპოვე ${count} წამალი ${name}-ისთვის. ყველაზე იაფი ${price} ₾-დან. იხ. ქვემოთ შედარებისთვის!`,
    pharmaciesInStock: (n) => `${n} აფთიაქში მარაგშია`,
    from: "დან",
    cheapest: "ყველაზე იაფი",
    cheapestLabel: "💰 ყველაზე იაფი",
    nearestLabel: "📍 ყველაზე ახლო",
    independent: "დამოუკიდებელი",
    directions: "მარშრუტი",
    searching: "ვეძებ მახლობელ აფთიაქებს ...",
    otherOptions: "სხვა ვარიანტები",
    results: (n) => `${n} შედეგი · ფასით დალაგებული`,
    stats: [
      { val: "474", label: "წამალი" },
      { val: "124", label: "აფთიაქი" },
      { val: "უფასო", label: "დაურეგისტრირებელი" },
    ],
    portal: "აფთიაქებისთვის",
    generic: "გენერიკული",
    location: "მდებარეობა",
    locating: "მდებარეობა...",
    yourLocation: "შენი მდებარეობა",
    tagline: "წამლების ფასების საძიებო საქართველოში",
    askPlaceholder: "გაიგე მეტი წამლის შესახებ...",
    askBtn: "კითხვა →",
    showMap: "რუკის ჩვენება",
    hideMap: "რუკის დამალვა",
    backHome: "← მთავარი",
    championsLink: "იხილე საუკეთესო ფასები კატეგორიების მიხედვით →",
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

function ZeroResults({ query, lang, district }) {
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleNotify() {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, phone, district }),
      });
    } catch {}
    setSent(true);
    setLoading(false);
  }

  if (sent)
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #D0EBE7",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "480px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>✅</div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#1A3A35",
            marginBottom: "8px",
          }}
        >
          {lang === "ge" ? "დარეგისტრირებულია!" : "Registered!"}
        </div>
        <div style={{ fontSize: "13px", color: "#7AABA5", lineHeight: 1.6 }}>
          {lang === "ge"
            ? "შეგატყობინებთ, როგორც კი ხელმისაწვდომი გახდება."
            : "We'll notify you as soon as it becomes available."}
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #D0EBE7",
        borderRadius: "16px",
        padding: "28px",
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
      <div
        style={{
          display: "inline-block",
          background: "#EBF6F4",
          color: "#2A7A6E",
          border: "1px solid #A8D9D0",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "14px",
        }}
      >
        {query}
      </div>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "#1A3A35",
          marginBottom: "8px",
        }}
      >
        {lang === "ge" ? "ამ მომენტში ვერ ვიპოვეთ" : "Not found right now"}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#7AABA5",
          lineHeight: 1.6,
          marginBottom: "20px",
        }}
      >
        {lang === "ge"
          ? "საპოვნელა მუდმივად ფართოვდება. ჩვენ დავარეგისტრირეთ თქვენი მოთხოვნა და ვმუშაობთ ამ წამლის მომარაგებაზე."
          : "Sapovnela is constantly expanding. We've registered your request and are working to source this medicine."}
      </div>
      <div
        style={{ height: "1px", background: "#F0F9F6", marginBottom: "20px" }}
      ></div>
      <div
        style={{
          fontSize: "13px",
          color: "#1A3A35",
          fontWeight: 500,
          marginBottom: "12px",
          lineHeight: 1.5,
        }}
      >
        {lang === "ge"
          ? "თუ გსურთ შეგატყობინოთ როცა ხელმისაწვდომი გახდება, დაგვიტოვეთ ნომერი."
          : "If you'd like to be notified when it becomes available, leave your number."}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleNotify()}
          placeholder="+995 5XX XXX XXX"
          style={{
            flex: 1,
            border: "1.5px solid #D0EBE7",
            borderRadius: "10px",
            padding: "9px 14px",
            fontSize: "13px",
            outline: "none",
            color: "#1A3A35",
          }}
        />
        <button
          onClick={handleNotify}
          disabled={loading}
          style={{
            background: loading ? "#9ABFBB" : "#2A7A6E",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {lang === "ge" ? "შემატყობინე" : "Notify me"}
        </button>
      </div>
      <div
        onClick={() => setSent(true)}
        style={{
          fontSize: "11px",
          color: "#9ABFBB",
          marginTop: "12px",
          cursor: "pointer",
        }}
      >
        {lang === "ge" ? "გამოტოვება →" : "Skip →"}
      </div>
    </div>
  );
}

const districtCoords = {
  Vake: { lat: 41.701, lng: 44.7681 },
  Saburtalo: { lat: 41.721, lng: 44.753 },
  Mtatsminda: { lat: 41.6934, lng: 44.7992 },
  Isani: { lat: 41.6878, lng: 44.82 },
  Samgori: { lat: 41.672, lng: 44.848 },
  Didube: { lat: 41.738, lng: 44.785 },
  Nadzaladevi: { lat: 41.71, lng: 44.83 },
  Gldani: { lat: 41.78, lng: 44.82 },
  Chugureti: { lat: 41.695, lng: 44.805 },
  Krtsanisi: { lat: 41.675, lng: 44.81 },
};

function getDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lat2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return parseFloat(
    (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1),
  );
}

const DEFAULT_TAGS = [
  "Ibuprofen",
  "Paracetamol",
  "Metformin",
  "Omeprazole",
  "Aspirin",
  "Amoxicillin",
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [customDistrict, setCustomDistrict] = useState(null);
  const [allPharmaciesForMap, setAllPharmaciesForMap] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topTags, setTopTags] = useState(DEFAULT_TAGS);
  const debounceRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);

    import("../../lib/supabase").then(({ supabase }) => {
      // Fetch top searched medicines
      const week = new Date(Date.now() - 7 * 86400000).toISOString();
      supabase
        .from("search_logs")
        .select("query")
        .gte("created_at", week)
        .gt("results_count", 0)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const counts = {};
            data.forEach((l) => {
              const q = l.query.trim();
              counts[q] = (counts[q] || 0) + 1;
            });
            const top = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([q]) => q);
            if (top.length > 0) setTopTags(top);
          }
        });

      // Load all pharmacies if map=1
      if (window.location.search.includes("map=1")) {
        setShowMap(true);
        supabase
          .from("pharmacies")
          .select("id, name, address, lat, lng, hours, is_independent")
          .not("lat", "is", null)
          .then(({ data }) => {
            if (data) setAllPharmaciesForMap(data);
          });
      }
    });
  }, []);

  const t = translations[lang];

  async function handleSearch(searchQuery) {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    try {
      const districtParam = customDistrict ? `&district=${customDistrict}` : "";
      const res = await fetch(`/api/search?q=${q}${districtParam}`);
      const json = await res.json();
      setResults(json.data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  async function handleQueryChange(val) {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${val}`);
        const json = await res.json();
        setSuggestions(json.data || []);
        setShowSuggestions((json.data || []).length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function selectSuggestion(med) {
    setQuery(med.name);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSearch(med.name);
  }

  function getLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  async function sendChat() {
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    const context =
      searched && results.length > 0
        ? `User searched for "${query}". Found ${Object.keys(grouped).length} medicines.`
        : "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage, context }),
      });
      const data = await res.json();
      setChatReply(data.reply || "Sorry, I could not answer that.");
      setChatMessage("");
    } catch {
      setChatReply("Sorry, something went wrong.");
    }
    setChatLoading(false);
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

  const effectiveLocation =
    userLocation || (customDistrict ? districtCoords[customDistrict] : null);
  const allPharmacies = Object.values(grouped)
    .flatMap(({ pharmacies }) => pharmacies)
    .filter((ph, idx, self) => self.findIndex((p) => p.id === ph.id) === idx)
    .filter((ph) => ph.lat && ph.lng);
  const mapPharmacies =
    allPharmaciesForMap.length > 0 ? allPharmaciesForMap : allPharmacies;
  const pad = { padding: "0 clamp(16px, 4vw, 40px)" };

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        .search-wrap:focus-within { border-color: #2A7A6E !important; }
        .result-card:hover { box-shadow: 0 4px 20px rgba(42,122,110,0.1); }
      `}</style>

      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          ...pad,
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
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
              onClick={() => {
                setLang(l);
                localStorage.setItem("lang", l);
              }}
              style={{
                fontSize: "12px",
                fontWeight: lang === l ? 600 : 400,
                padding: "4px 10px",
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
        <div style={{ flex: 1 }} />
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            fontSize: "13px",
            background: "none",
            color: "#6BA89E",
            border: "1px solid #D0EBE7",
            borderRadius: "20px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {t.backHome}
        </button>
        <button
          onClick={() => (window.location.href = "/portal")}
          style={{
            fontSize: "13px",
            background: "#2A7A6E",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {t.portal}
        </button>
      </nav>

      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          ...pad,
          paddingTop: "28px",
          paddingBottom: "24px",
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
            fontSize: "clamp(20px, 5vw, 30px)",
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
        <p style={{ fontSize: "14px", color: "#7AABA5", marginBottom: "20px" }}>
          {t.subtitle}
        </p>

        <div style={{ position: "relative" }}>
          <div
            className="search-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "2px solid #D0EBE7",
              borderRadius: "16px",
              padding: "6px 6px 6px 14px",
              background: "#fff",
              flexWrap: "wrap",
              transition: "border-color .2s",
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
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={t.placeholder}
              style={{
                flex: 1,
                minWidth: "120px",
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: "#1A3A35",
                background: "transparent",
              }}
            />
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                onClick={() => setShowDistricts(!showDistricts)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: userLocation ? "#2A7A6E" : "#EBF6F4",
                  border: "1px solid #A8D9D0",
                  color: userLocation ? "#fff" : "#2A7A6E",
                  padding: "5px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: userLocation ? "#fff" : "#2A7A6E",
                  }}
                ></div>
                {locating
                  ? t.locating
                  : userLocation
                    ? t.yourLocation
                    : customDistrict
                      ? customDistrict
                      : t.location}
              </div>
              {showDistricts && (
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: 0,
                    zIndex: 100,
                    background: "#fff",
                    border: "1px solid #D0EBE7",
                    borderRadius: "12px",
                    padding: "8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    minWidth: "180px",
                  }}
                >
                  <div
                    onClick={() => {
                      getLocation();
                      setShowDistricts(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      cursor: "pointer",
                      color: "#2A7A6E",
                      fontWeight: 600,
                      borderRadius: "8px",
                      background: "#EBF6F4",
                      marginBottom: "6px",
                    }}
                  >
                    📍 {lang === "en" ? "Use my GPS" : "GPS-ის გამოყენება"}
                  </div>
                  {[
                    "Vake",
                    "Saburtalo",
                    "Mtatsminda",
                    "Isani",
                    "Samgori",
                    "Didube",
                    "Nadzaladevi",
                    "Gldani",
                    "Chugureti",
                    "Krtsanisi",
                  ].map((d) => (
                    <div
                      key={d}
                      onClick={() => {
                        setUserLocation(null);
                        setCustomDistrict(d);
                        setShowDistricts(false);
                      }}
                      style={{
                        padding: "7px 12px",
                        fontSize: "13px",
                        cursor: "pointer",
                        color: "#1A3A35",
                        borderRadius: "8px",
                        background:
                          customDistrict === d ? "#EBF6F4" : "transparent",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              style={{
                background: "#2A7A6E",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {t.search}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #D0EBE7",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                zIndex: 200,
                marginTop: "4px",
                overflow: "hidden",
              }}
            >
              {suggestions.map((med) => (
                <div
                  key={med.id}
                  onMouseDown={() => selectSuggestion(med)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #F4FBFA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#fff",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#EBF6F4")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1A3A35",
                      }}
                    >
                      {med.name}
                    </div>
                    {med.name_ge && (
                      <div style={{ fontSize: "11px", color: "#2A7A6E" }}>
                        {med.name_ge}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                    {med.dosage} · {med.form}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic tags + champions link */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "12px",
            flexWrap: "wrap",
          }}
        >
          {topTags.map((tag) => (
            <span
              key={tag}
              onClick={() => {
                setQuery(tag);
                handleSearch(tag);
              }}
              style={{
                background: "#EBF6F4",
                color: "#2A7A6E",
                border: "1px solid #A8D9D0",
                padding: "5px 12px",
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
        <div style={{ marginTop: "10px" }}>
          <a
            href="/champions"
            style={{
              fontSize: "12px",
              color: "#2A7A6E",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            🏆 {t.championsLink}
          </a>
        </div>
      </div>

      <div
        style={{
          margin: "16px clamp(16px, 4vw, 40px) 0",
          background: "#F0EBF8",
          border: "1px solid #C8B8ED",
          borderRadius: "12px",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
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
          <div style={{ flex: 1, minWidth: 0 }}>
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
            <p
              style={{
                fontSize: "13px",
                color: "#3D2070",
                lineHeight: 1.6,
                marginBottom: "10px",
              }}
            >
              {chatReply ||
                (searched && results.length > 0
                  ? t.aiResult(
                      Object.keys(grouped).length,
                      query,
                      Math.min(...results.map((r) => r.price)).toFixed(2),
                    )
                  : t.aiDefault)}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") await sendChat();
                }}
                placeholder={t.askPlaceholder}
                style={{
                  flex: 1,
                  border: "1.5px solid #C8B8ED",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fff",
                  color: "#1A3A35",
                  minWidth: 0,
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatLoading}
                style={{
                  background: chatLoading ? "#C8B8ED" : "#7B52C8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: chatLoading ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {chatLoading ? "..." : t.askBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px clamp(16px, 4vw, 40px) 48px" }}>
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
          <ZeroResults query={query} lang={lang} district={customDistrict} />
        )}

        {!loading && !searched && mapPharmacies.length === 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "26px",
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

        {(allPharmacies.length > 0 || mapPharmacies.length > 0) && (
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={() => setShowMap(!showMap)}
              style={{
                background: showMap ? "#2A7A6E" : "#EBF6F4",
                color: showMap ? "#fff" : "#2A7A6E",
                border: "1px solid #A8D9D0",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              🗺 {showMap ? t.hideMap : t.showMap}
            </button>
          </div>
        )}

        {showMap && mapPharmacies.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #D0EBE7",
              height: "420px",
            }}
          >
            <MapView
              pharmacies={mapPharmacies}
              userLocation={effectiveLocation}
            />
          </div>
        )}

        {!loading && searched && Object.keys(grouped).length > 0 && (
          <div
            style={{
              fontSize: "12px",
              color: "#9ABFBB",
              marginBottom: "14px",
              fontWeight: 500,
            }}
          >
            {t.results(Object.keys(grouped).length)}
          </div>
        )}

        {!loading &&
          Object.values(grouped).map(({ medicine, pharmacies }) => {
            const byPrice = [...pharmacies].sort((a, b) => a.price - b.price);
            const byDistance = effectiveLocation
              ? [...pharmacies].sort(
                  (a, b) =>
                    (getDistance(
                      effectiveLocation.lat,
                      effectiveLocation.lng,
                      a.lat,
                      a.lng,
                    ) || 999) -
                    (getDistance(
                      effectiveLocation.lat,
                      effectiveLocation.lng,
                      b.lat,
                      b.lng,
                    ) || 999),
                )
              : null;
            const cheapest = byPrice[0];
            const nearest = byDistance?.[0];
            const showDualChampion =
              byDistance && nearest && cheapest && nearest.id !== cheapest.id;
            const champIds = new Set(
              [cheapest?.id, showDualChampion ? nearest?.id : null].filter(
                Boolean,
              ),
            );
            const others = byPrice.filter((ph) => !champIds.has(ph.id));

            return (
              <div
                key={medicine.id}
                className="result-card"
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "12px",
                  transition: "box-shadow .2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                    gap: "12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h2
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "#1A3A35",
                        marginBottom: "4px",
                      }}
                    >
                      {medicine.name}
                    </h2>
                    {medicine.name_ge && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#2A7A6E",
                          marginBottom: "2px",
                        }}
                      >
                        {medicine.name_ge}
                      </p>
                    )}
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
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                      {t.from}
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#2A7A6E",
                        lineHeight: 1.1,
                      }}
                    >
                      {Math.min(...pharmacies.map((p) => p.price)).toFixed(2)} ₾
                    </div>
                  </div>
                </div>

                {showDualChampion ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          background: "#EBF6F4",
                          border: "1.5px solid #2A7A6E",
                          borderRadius: "12px",
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#2A7A6E",
                            letterSpacing: "0.4px",
                            marginBottom: "6px",
                          }}
                        >
                          {t.cheapestLabel}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1A3A35",
                            marginBottom: "2px",
                          }}
                        >
                          {cheapest.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#7AABA5",
                            marginBottom: "8px",
                          }}
                        >
                          {cheapest.address}
                          {effectiveLocation && cheapest.lat && (
                            <span>
                              {" "}
                              · 📍{" "}
                              {getDistance(
                                effectiveLocation.lat,
                                effectiveLocation.lng,
                                cheapest.lat,
                                cheapest.lng,
                              )}{" "}
                              km
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#2A7A6E",
                            }}
                          >
                            {cheapest.price.toFixed(2)} ₾
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${cheapest.lat},${cheapest.lng}`,
                                "_blank",
                              )
                            }
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
                            {t.directions}
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#EAF4FD",
                          border: "1.5px solid #4A90D9",
                          borderRadius: "12px",
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#1E6091",
                            letterSpacing: "0.4px",
                            marginBottom: "6px",
                          }}
                        >
                          {t.nearestLabel}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1A3A35",
                            marginBottom: "2px",
                          }}
                        >
                          {nearest.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#7AABA5",
                            marginBottom: "8px",
                          }}
                        >
                          {nearest.address}
                          {effectiveLocation && nearest.lat && (
                            <span>
                              {" "}
                              · 📍{" "}
                              {getDistance(
                                effectiveLocation.lat,
                                effectiveLocation.lng,
                                nearest.lat,
                                nearest.lng,
                              )}{" "}
                              km
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#1E6091",
                            }}
                          >
                            {nearest.price.toFixed(2)} ₾
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${nearest.lat},${nearest.lng}`,
                                "_blank",
                              )
                            }
                            style={{
                              background: "#4A90D9",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "5px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {t.directions}
                          </button>
                        </div>
                      </div>
                    </div>
                    {others.length > 0 && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: "#F0F9F6",
                            }}
                          ></div>
                          <span style={{ fontSize: "11px", color: "#9ABFBB" }}>
                            {t.otherOptions}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "1px",
                              background: "#F0F9F6",
                            }}
                          ></div>
                        </div>
                        {others.map((ph) => {
                          const dist = effectiveLocation
                            ? getDistance(
                                effectiveLocation.lat,
                                effectiveLocation.lng,
                                ph.lat,
                                ph.lng,
                              )
                            : null;
                          return (
                            <div
                              key={ph.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 10px",
                                borderRadius: "10px",
                                background: "#F8FDFC",
                                marginBottom: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  background: "#C0DDD9",
                                }}
                              ></div>
                              <div style={{ flex: 1, minWidth: "120px" }}>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#1A3A35",
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
                                  {dist && (
                                    <span
                                      style={{
                                        marginLeft: "6px",
                                        color: "#2A7A6E",
                                        fontWeight: 500,
                                      }}
                                    >
                                      📍 {dist} km
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {ph.is_independent && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      background: "#EBF6F4",
                                      color: "#2A7A6E",
                                      border: "1px solid #A8D9D0",
                                      padding: "3px 8px",
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
                                  }}
                                >
                                  {ph.price.toFixed(2)} ₾
                                </div>
                                <button
                                  onClick={() =>
                                    window.open(
                                      `https://www.google.com/maps/search/?api=1&query=${ph.lat},${ph.lng}`,
                                      "_blank",
                                    )
                                  }
                                  style={{
                                    background: "#EBF6F4",
                                    color: "#2A7A6E",
                                    border: "1px solid #A8D9D0",
                                    borderRadius: "8px",
                                    padding: "5px 10px",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                  }}
                                >
                                  {t.directions}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                ) : (
                  byPrice.map((ph, i) => {
                    const dist = effectiveLocation
                      ? getDistance(
                          effectiveLocation.lat,
                          effectiveLocation.lng,
                          ph.lat,
                          ph.lng,
                        )
                      : null;
                    return (
                      <div
                        key={ph.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          background: i === 0 ? "#EBF6F4" : "#F8FDFC",
                          marginBottom: "6px",
                          flexWrap: "wrap",
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
                        <div style={{ flex: 1, minWidth: "120px" }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1A3A35",
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
                            {dist && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  color: "#2A7A6E",
                                  fontWeight: 500,
                                }}
                              >
                                📍 {dist} km
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {i === 0 && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#FFF3E0",
                                color: "#C47D00",
                                border: "1px solid #FFD97A",
                                padding: "3px 8px",
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
                                padding: "3px 8px",
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
                            }}
                          >
                            {ph.price.toFixed(2)} ₾
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${ph.lat},${ph.lng}`,
                                "_blank",
                              )
                            }
                            style={{
                              background: "#2A7A6E",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 500,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {t.directions}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
      </div>

      <div
        style={{
          borderTop: "1px solid #D0EBE7",
          ...pad,
          paddingTop: "20px",
          paddingBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          flexWrap: "wrap",
          gap: "12px",
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
