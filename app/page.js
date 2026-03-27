"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const translations = {
  en: {
    tagline: "Georgia's Medicine Price Finder",
    title: "Portal for Buying and Selling of Medicines",
    find: "Find or Buy Medicine",
    findDesc: "Search prices across pharmacies near you",
    sell: "Sell Medicine",
    sellDesc: "Register your pharmacy and list your prices",
  },
  ge: {
    tagline: "საქართველოს წამლების ფასების საძიებო",
    title: "პორტალი წამლების ყიდვა-გაყიდვისთვის",
    find: "წამლის პოვნა და ყიდვა",
    findDesc: "შეადარე ფასები მახლობელ აფთიაქებში",
    sell: "წამლის გაყიდვა",
    sellDesc: "დაარეგისტრირე შენი აფთიაქი და განათავსე ფასები",
  },
};

export default function Landing() {
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);
  }, []);

  const t = translations[lang];

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          padding: "0 clamp(16px, 4vw, 40px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
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
          <div
            style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
          >
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

        {/* Language toggle */}
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
              onClick={() => {
                setLang(l);
                localStorage.setItem("lang", l);
              }}
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
      </nav>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px clamp(16px, 4vw, 40px)",
          textAlign: "center",
        }}
      >
        {/* Tagline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
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
          <span style={{ fontSize: "13px", color: "#6BA89E", fontWeight: 500 }}>
            {t.tagline}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(22px, 5vw, 36px)",
            fontWeight: 700,
            color: "#1A3A35",
            marginBottom: "56px",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
            maxWidth: "600px",
          }}
        >
          {t.title}
        </h1>

        {/* Two big buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            width: "100%",
            maxWidth: "640px",
          }}
        >
          {/* Find Medicine */}
          <button
            onClick={() => router.push("/search")}
            style={{
              background: "#2A7A6E",
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              padding: "36px 28px",
              cursor: "pointer",
              textAlign: "left",
              transition: "transform .15s, box-shadow .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(42,122,110,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>💊</div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
                lineHeight: 1.2,
              }}
            >
              {t.find}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
              }}
            >
              {t.findDesc}
            </div>
          </button>

          {/* Sell Medicine */}
          <button
            onClick={() => router.push("/portal")}
            style={{
              background: "#fff",
              color: "#1A3A35",
              border: "2px solid #D0EBE7",
              borderRadius: "20px",
              padding: "36px 28px",
              cursor: "pointer",
              textAlign: "left",
              transition: "transform .15s, box-shadow .15s, border-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#2A7A6E";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#D0EBE7";
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "14px" }}>🏥</div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#2A7A6E",
                lineHeight: 1.2,
              }}
            >
              {t.sell}
            </div>
            <div
              style={{ fontSize: "13px", color: "#7AABA5", lineHeight: 1.5 }}
            >
              {t.sellDesc}
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #D0EBE7",
          padding: "16px clamp(16px, 4vw, 40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <span style={{ fontSize: "12px", color: "#9ABFBB" }}>
          © 2025 საპოვნელა · Georgia&apos;s medicine price finder
        </span>
      </div>
    </main>
  );
}
