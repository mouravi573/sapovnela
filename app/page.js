"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const translations = {
  en: {
    title: "Portal for Buying and Selling of Medicines",
    find: "Find or Buy Medicine",
    findDesc: "Search prices across pharmacies near you",
    sell: "Sell Medicine",
    sellDesc: "Register your pharmacy and list your prices",
  },
  ge: {
    title: "სამკურნალო საშუალებების ყიდვა - გაყიდვის პორტალი",
    find: "წამლის პოვნა და ყიდვა",
    findDesc: "შეადარე ფასები მახლობელ აფთიაქებში",
    sell: "წამლის გაყიდვა",
    sellDesc: "დაარეგისტრირე შენი აფთიაქი და განათავსე ფასები",
  },
};

const floatingIcons = ["💊", "🧬", "⚕️", "🏥", "💉", "🩺", "💊", "🧬"];
const iconPositions = [
  { top: "8%", left: "5%", size: "44px", delay: "0s", duration: "6s" },
  { top: "14%", right: "7%", size: "30px", delay: "1s", duration: "7s" },
  { top: "55%", left: "4%", size: "38px", delay: "2s", duration: "5.5s" },
  { bottom: "14%", right: "8%", size: "34px", delay: "0.5s", duration: "6.5s" },
  { top: "38%", left: "8%", size: "26px", delay: "1.5s", duration: "7.5s" },
  { top: "32%", right: "5%", size: "28px", delay: "2.5s", duration: "6s" },
  { bottom: "28%", left: "13%", size: "22px", delay: "3s", duration: "8s" },
  { top: "68%", right: "14%", size: "24px", delay: "0.8s", duration: "7s" },
];

export default function Landing() {
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);
    setTimeout(() => setVisible(true), 50);
  }, []);

  const t = translations[lang];

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(6deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-buy:hover { transform: scale(1.06) !important; }
        .card-sell:hover { transform: scale(1.06) !important; }
        .lang-btn:hover { transform: scale(1.12) !important; }
        .card-buy, .card-sell, .lang-btn {
          transition: transform 0.8s cubic-bezier(0.25, 1.4, 0.5, 1) !important;
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#F0F9F6",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.9s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating background icons */}
        {floatingIcons.map((icon, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              fontSize: iconPositions[i].size,
              opacity: 0.07,
              pointerEvents: "none",
              animation: `floatIcon ${iconPositions[i].duration} ease-in-out infinite`,
              animationDelay: iconPositions[i].delay,
              ...iconPositions[i],
            }}
          >
            {icon}
          </div>
        ))}

        {/* Navbar */}
        <nav
          style={{
            background: "rgba(255,255,255,0.88)",
            borderBottom: "1px solid #D0EBE7",
            padding: "0 clamp(16px, 4vw, 40px)",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 10,
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
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1,
              }}
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
              background: "#C5E4F5",
              borderRadius: "20px",
              padding: "4px",
              gap: "3px",
            }}
          >
            {["en", "ge"].map((l) => (
              <button
                key={l}
                className="lang-btn"
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
                  WebkitAppearance: "none",
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
            position: "relative",
            zIndex: 10,
            animation: visible ? "fadeIn 0.9s ease forwards" : "none",
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(22px, 5vw, 38px)",
              fontWeight: 700,
              color: "#1A3A35",
              marginBottom: "56px",
              letterSpacing: "-0.5px",
              lineHeight: 1.3,
              maxWidth: "600px",
            }}
          >
            {t.title}
          </h1>

          {/* Two big buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              width: "100%",
              maxWidth: "600px",
            }}
          >
            {/* Find Medicine */}
            <button
              className="card-buy"
              onClick={() => router.push("/search")}
              style={{
                background: "#2A7A6E",
                border: "none",
                borderRadius: "20px",
                padding: "36px 28px",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                WebkitAppearance: "none",
              }}
            >
              <span style={{ fontSize: "40px", lineHeight: 1 }}>💊</span>
              <div
                style={{
                  fontSize: "clamp(16px, 3vw, 20px)",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                {t.find}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.5,
                }}
              >
                {t.findDesc}
              </div>
            </button>

            {/* Sell Medicine */}
            <button
              className="card-sell"
              onClick={() => router.push("/portal")}
              style={{
                background: "#C5E4F5",
                border: "none",
                borderRadius: "20px",
                padding: "36px 28px",
                cursor: "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                WebkitAppearance: "none",
              }}
            >
              <span style={{ fontSize: "40px", lineHeight: 1 }}>🏥</span>
              <div
                style={{
                  fontSize: "clamp(16px, 3vw, 20px)",
                  fontWeight: 700,
                  color: "#0F4D3A",
                  lineHeight: 1.2,
                }}
              >
                {t.sell}
              </div>
              <div
                style={{ fontSize: "13px", color: "#1A5C47", lineHeight: 1.5 }}
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
            background: "rgba(255,255,255,0.7)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: "12px", color: "#9ABFBB" }}>
            © 2025 საპოვნელა · Georgia&apos;s medicine price finder
          </span>
        </div>
      </main>
    </>
  );
}
