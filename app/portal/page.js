"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const pt = {
  en: {
    portalTitle: "Pharmacy Partner Portal",
    badge: "Free for independent pharmacies",
    title: "Reach thousands of patients",
    titleGreen: "searching for medicine near you",
    subtitle:
      "List your pharmacy on საპოვნელა for free. Patients searching for medicines will find your prices and get directions to your door.",
    cta: "Register your pharmacy — free",
    alreadyReg: "Already registered?",
    signIn: "Sign in →",
    b1title: "Get discovered",
    b1desc: "Join the platform and appear in thousands of patient searches",
    b1stat1: "Registered pharmacies",
    b1stat2: "Medicines in database",
    b2title: "Compete on price",
    b2desc: "These are the current best prices on the platform",
    b2badge: "Cheapest",
    b3title: "Drive foot traffic",
    b3desc: "Patients see your location and come easily",
    statPharmacies: "Registered pharmacies",
    statMedicines: "Medicines in database",
    statListings: "Active listings",
    registerTitle: "Register your pharmacy",
    registerSub: "Free listing — takes 2 minutes",
    fields: [
      {
        label: "Pharmacy name",
        field: "name",
        placeholder: "e.g. Green Valley Pharmacy",
      },
      {
        label: "Street address",
        field: "address",
        placeholder: "e.g. Rustaveli Ave 22",
      },
      { label: "Phone number", field: "phone", placeholder: "+995 32 ..." },
      {
        label: "Opening hours",
        field: "hours",
        placeholder: "e.g. 09:00–22:00 or 24/7",
      },
      { label: "Email address", field: "email", placeholder: "your@email.com" },
      {
        label: "Password",
        field: "password",
        placeholder: "Min 8 characters",
        type: "password",
      },
    ],
    districtLabel: "District",
    districtPlaceholder: "Select district...",
    submit: "Register pharmacy →",
    terms: "By registering you agree to our terms of service",
    successTitle: "You are registered!",
    successMsg:
      "Welcome to საპოვნელა. Your pharmacy will appear in search results within 24 hours. Check your email to verify your account.",
    backHome: "Back to home →",
  },
  ge: {
    portalTitle: "პარტნიორი აფთიაქის პორტალი",
    badge: "უფასოდ დამოუკიდებელი აფთიაქებისთვის",
    title: "წვდომა ათასობით პაციენტზე",
    titleGreen: "რომლებიც ეძებენ წამალს შენს მახლობლად",
    subtitle:
      "დაარეგისტრირე შენი აფთიაქი საპოვნელაზე უფასოდ. პაციენტები იპოვიან შენს ფასებს და დაგიკავშირდებიან.",
    cta: "დაარეგისტრირე აფთიაქი — უფასოდ",
    alreadyReg: "უკვე დარეგისტრირებული ხარ?",
    signIn: "შესვლა →",
    b1title: "გახდი ხილული",
    b1desc: "შეუერთდი პლატფორმას და გამოჩნდი ათასობით პაციენტის ძიებაში",
    b1stat1: "დარეგისტრირებული აფთიაქი",
    b1stat2: "წამალი ბაზაში",
    b2title: "აჯობე ფასით",
    b2desc: "ეს არის ამჟამინდელი საუკეთესო ფასები პლატფორმაზე",
    b2badge: "იაფი",
    b3title: "მოიზიდე მომხმარებლები",
    b3desc: "პაციენტები ხედავენ შენს მდებარეობას და მარტივად მოდიან",
    statPharmacies: "დარეგისტრირებული აფთიაქი",
    statMedicines: "წამალი ბაზაში",
    statListings: "აქტიური განცხადება",
    registerTitle: "დაარეგისტრირე შენი აფთიაქი",
    registerSub: "უფასო განთავსება — 2 წუთი გჭირდება",
    fields: [
      {
        label: "აფთიაქის სახელი",
        field: "name",
        placeholder: "მაგ. მწვანე ველის აფთიაქი",
      },
      {
        label: "მისამართი",
        field: "address",
        placeholder: "მაგ. რუსთაველის გამზ. 22",
      },
      { label: "ტელეფონი", field: "phone", placeholder: "+995 32 ..." },
      {
        label: "სამუშაო საათები",
        field: "hours",
        placeholder: "მაგ. 09:00–22:00 ან 24/7",
      },
      { label: "ელ-ფოსტა", field: "email", placeholder: "your@email.com" },
      {
        label: "პაროლი",
        field: "password",
        placeholder: "მინ. 8 სიმბოლო",
        type: "password",
      },
    ],
    districtLabel: "რაიონი",
    districtPlaceholder: "აირჩიე რაიონი...",
    submit: "დარეგისტრირება →",
    terms: "რეგისტრაციით ეთანხმები ჩვენი მომსახურების პირობებს",
    successTitle: "დარეგისტრირებული ხარ!",
    successMsg:
      "კეთილი იყოს შენი მობრძანება საპოვნელაზე. შენი აფთიაქი 24 საათში გამოჩნდება ძიების შედეგებში. შეამოწმე შენი ელ-ფოსტა.",
    backHome: "მთავარ გვერდზე დაბრუნება →",
  },
};

const districts = [
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
];
const TOP_MEDICINES = ["Ibuprofen", "Paracetamol", "Amoxicillin", "Metformin"];

function toSVG(lat, lng) {
  const minLat = 41.65,
    maxLat = 41.8,
    minLng = 44.73,
    maxLng = 44.88;
  const x = ((lng - minLng) / (maxLng - minLng)) * 260 + 20;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 130 + 15;
  return { x, y };
}

export default function PharmacyPortal() {
  const [step, setStep] = useState("landing");
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    phone: "",
    hours: "",
    email: "",
    password: "",
  });
  const [liveStats, setLiveStats] = useState({
    pharmacies: 0,
    medicines: 0,
    listings: 0,
  });
  const [cheapestPrices, setCheapestPrices] = useState([]);
  const [pharmacyCoords, setPharmacyCoords] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);

    async function fetchData() {
      const [{ count: pharmacies }, { count: medicines }, { count: listings }] =
        await Promise.all([
          supabase
            .from("pharmacies")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("medicines")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("inventory")
            .select("*", { count: "exact", head: true }),
        ]);
      setLiveStats({
        pharmacies: pharmacies || 0,
        medicines: medicines || 0,
        listings: listings || 0,
      });

      const prices = [];
      for (const name of TOP_MEDICINES) {
        const { data: med } = await supabase
          .from("medicines")
          .select("id, name, dosage, form")
          .ilike("name", `%${name}%`)
          .limit(1)
          .maybeSingle();
        if (med) {
          const { data: inv } = await supabase
            .from("inventory")
            .select("price")
            .eq("medicine_id", med.id)
            .eq("in_stock", true)
            .order("price", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (inv)
            prices.push({
              name: med.name,
              dosage: med.dosage,
              form: med.form,
              price: inv.price,
            });
        }
      }
      setCheapestPrices(prices);

      const { data: coords } = await supabase
        .from("pharmacies")
        .select("lat, lng")
        .not("lat", "is", null)
        .limit(20);
      setPharmacyCoords(coords || []);
    }
    fetchData();
  }, []);

  const t = pt[lang];
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.email || !form.password || !form.name) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;
      const { error: dbError } = await supabase.from("pharmacies").insert({
        name: form.name,
        address: form.address,
        district: form.district,
        phone: form.phone,
        hours: form.hours,
        is_independent: true,
        rating: 0,
        user_id: authData.user.id,
        is_approved: false,
      });
      if (dbError) throw dbError;
      // Send WhatsApp notification
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          district: form.district,
          phone: form.phone,
          email: form.email,
        }),
      });
      setStep("success");
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  }

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`.benefit-card:hover{transform:scale(1.03);box-shadow:0 16px 40px rgba(0,0,0,0.1)}`}</style>

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
          <span style={{ fontSize: "13px", color: "#6BA89E" }}>
            {t.portalTitle}
          </span>
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
                  transition: "transform 0.8s cubic-bezier(0.25,1.4,0.5,1)",
                }}
              >
                {l === "en" ? "EN" : "ქარ"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {step === "landing" && (
        <div
          style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-block",
                background: "#EBF6F4",
                border: "1px solid #A8D9D0",
                color: "#2A7A6E",
                fontSize: "12px",
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: "20px",
                marginBottom: "16px",
              }}
            >
              {t.badge}
            </div>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "12px",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              {t.title}
              <br />
              <span style={{ color: "#2A7A6E" }}>{t.titleGreen}</span>
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#7AABA5",
                maxWidth: "500px",
                margin: "0 auto 32px",
              }}
            >
              {t.subtitle}
            </p>
            <button
              onClick={() => setStep("register")}
              style={{
                background: "#2A7A6E",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "14px 36px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.cta}
            </button>
            <div
              style={{ marginTop: "12px", fontSize: "13px", color: "#9ABFBB" }}
            >
              {t.alreadyReg}{" "}
              <a
                href="/portal/login"
                style={{
                  color: "#2A7A6E",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {t.signIn}
              </a>
            </div>
          </div>

          {/* Benefit cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "48px",
            }}
          >
            {/* Card 1 */}
            <div
              className="benefit-card"
              onClick={() => setStep("register")}
              style={{
                background: "#E8F8F2",
                border: "1px solid #A8D9D0",
                borderRadius: "20px",
                padding: "24px",
                cursor: "pointer",
                transition:
                  "transform 0.8s cubic-bezier(0.25,1.4,0.5,1), box-shadow 0.8s cubic-bezier(0.25,1.4,0.5,1)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#C5EEE1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "16px",
                }}
              >
                👁
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "6px",
                }}
              >
                {t.b1title}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#5A8A82",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                {t.b1desc}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#5A8A82" }}>
                  {t.b1stat1}
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#2A7A6E",
                  }}
                >
                  {liveStats.pharmacies}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.7)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#5A8A82" }}>
                  {t.b1stat2}
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#2A7A6E",
                  }}
                >
                  {liveStats.medicines}
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="benefit-card"
              onClick={() => (window.location.href = "/champions")}
              style={{
                background: "#FEF9EC",
                border: "1px solid #FFD97A",
                borderRadius: "20px",
                padding: "24px",
                cursor: "pointer",
                transition:
                  "transform 0.8s cubic-bezier(0.25,1.4,0.5,1), box-shadow 0.8s cubic-bezier(0.25,1.4,0.5,1)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "16px",
                }}
              >
                💰
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "6px",
                }}
              >
                {t.b2title}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#92740A",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                {t.b2desc}
              </div>
              {cheapestPrices.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: "12px",
                    color: "#9ABFBB",
                  }}
                >
                  {lang === "ge"
                    ? "ჯერ ფასები არ არის"
                    : "No prices listed yet"}
                </div>
              ) : (
                cheapestPrices.map((m, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid rgba(0,0,0,0.06)"
                          : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#1A3A35",
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                        {m.dosage} · {m.form}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#B45309",
                        }}
                      >
                        {m.price.toFixed(2)} ₾
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          background: "#FFF3E0",
                          color: "#C47D00",
                          border: "1px solid #FFD97A",
                          padding: "2px 7px",
                          borderRadius: "6px",
                        }}
                      >
                        {t.b2badge}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Card 3 */}
            <div
              className="benefit-card"
              onClick={() => (window.location.href = "/search?map=1")}
              style={{
                background: "#EAF4FD",
                border: "1px solid #90CAF9",
                borderRadius: "20px",
                padding: "24px",
                cursor: "pointer",
                transition:
                  "transform 0.8s cubic-bezier(0.25,1.4,0.5,1), box-shadow 0.8s cubic-bezier(0.25,1.4,0.5,1)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#BFDFFA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  marginBottom: "16px",
                }}
              >
                📍
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "6px",
                }}
              >
                {t.b3title}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#1E6091",
                  marginBottom: "12px",
                  lineHeight: 1.5,
                }}
              >
                {t.b3desc}
              </div>
              <svg
                width="100%"
                height="150"
                viewBox="0 0 300 150"
                style={{ borderRadius: "12px", background: "#D6EEF8" }}
              >
                <path
                  d="M50 75 Q150 55 250 75"
                  stroke="#90CAF9"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M150 15 Q140 75 150 135"
                  stroke="#90CAF9"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M80 35 Q150 75 220 115"
                  stroke="#90CAF9"
                  strokeWidth="2"
                  fill="none"
                />
                {pharmacyCoords.map((ph, i) => {
                  const { x, y } = toSVG(ph.lat, ph.lng);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="7"
                      fill="#2A7A6E"
                      stroke="#fff"
                      strokeWidth="2.5"
                    />
                  );
                })}
                <circle
                  cx="240"
                  cy="100"
                  r="7"
                  fill="none"
                  stroke="#90CAF9"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
                <text
                  x="240"
                  y="118"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#7AABA5"
                >
                  Gldani?
                </text>
                <text x="10" y="145" fontSize="9" fill="#7AABA5">
                  თბილისი · Tbilisi
                </text>
              </svg>
            </div>
          </div>

          {/* Stats ribbon */}
          <div
            style={{
              background: "#2A7A6E",
              borderRadius: "16px",
              padding: "28px 32px",
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "16px",
              textAlign: "center",
            }}
          >
            {[
              { val: liveStats.pharmacies, label: t.statPharmacies },
              { val: liveStats.medicines, label: t.statMedicines },
              { val: liveStats.listings, label: t.statListings },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.7)",
                    marginTop: "4px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "register" && (
        <div
          style={{ maxWidth: "560px", margin: "40px auto", padding: "0 24px" }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #D0EBE7",
              borderRadius: "16px",
              padding: "36px",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "6px",
              }}
            >
              {t.registerTitle}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#7AABA5",
                marginBottom: "28px",
              }}
            >
              {t.registerSub}
            </p>
            {t.fields.map((f) => (
              <div key={f.field} style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1A3A35",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  value={form[f.field]}
                  onChange={(e) => update(f.field, e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: "100%",
                    border: "1.5px solid #D0EBE7",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    outline: "none",
                    color: "#1A3A35",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1A3A35",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {t.districtLabel}
              </label>
              <select
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                style={{
                  width: "100%",
                  border: "1.5px solid #D0EBE7",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "14px",
                  outline: "none",
                  color: "#1A3A35",
                  background: "#fff",
                }}
              >
                <option value="">{t.districtPlaceholder}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRegister}
              style={{
                width: "100%",
                background: "#2A7A6E",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.submit}
            </button>
            <div
              style={{
                textAlign: "center",
                marginTop: "14px",
                fontSize: "12px",
                color: "#9ABFBB",
              }}
            >
              {t.terms}
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div
          style={{
            maxWidth: "480px",
            margin: "80px auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#1A3A35",
              marginBottom: "10px",
            }}
          >
            {t.successTitle}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#7AABA5",
              marginBottom: "28px",
              lineHeight: 1.6,
            }}
          >
            {t.successMsg}
          </p>
          <Link
            href="/"
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
            {t.backHome}
          </Link>
        </div>
      )}
    </main>
  );
}
