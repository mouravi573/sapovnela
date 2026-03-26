"use client";
import { useState } from "react";
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
    benefits: [
      {
        icon: "👁",
        title: "Get discovered",
        desc: "Appear in search results when patients look for medicines in your area",
      },
      {
        icon: "💰",
        title: "Compete on price",
        desc: "Show your prices and beat the big chains on generics and common medicines",
      },
      {
        icon: "📍",
        title: "Drive foot traffic",
        desc: "Patients get directions straight to your pharmacy with one tap",
      },
    ],
    stats: [
      { val: "2,400+", label: "Daily searches" },
      { val: "124", label: "Pharmacies listed" },
      { val: "Free", label: "Forever for independents" },
    ],
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
    portalTitle: "აფთიაქის პარტნიორის პორტალი",
    badge: "უფასო დამოუკიდებელი აფთიაქებისთვის",
    title: "წვდომა ათასობით პაციენტზე",
    titleGreen: "რომლებიც ეძებენ წამალს შენთან ახლოს",
    subtitle:
      "დაარეგისტრირე შენი აფთიაქი საპოვნელაზე უფასოდ. პაციენტები იპოვიან შენს ფასებს და დაგიკავშირდებიან.",
    cta: "დაარეგისტრირე აფთიაქი — უფასოდ",
    alreadyReg: "უკვე დარეგისტრირებული ხარ?",
    signIn: "შესვლა →",
    benefits: [
      {
        icon: "👁",
        title: "გახდი ხილული",
        desc: "გამოჩნდი ძიების შედეგებში, როცა პაციენტები ეძებენ წამალს შენს არეალში",
      },
      {
        icon: "💰",
        title: "იყარე ფასი",
        desc: "აჩვენე შენი ფასები და გაუსწარ დიდ ქსელებს გენერიკებსა და ჩვეულებრივ წამლებზე",
      },
      {
        icon: "📍",
        title: "მოიზიდე მომხმარებლები",
        desc: "პაციენტები მიიღებენ მარშრუტს პირდაპირ შენს აფთიაქამდე ერთი შეხებით",
      },
    ],
    stats: [
      { val: "2,400+", label: "ყოველდღიური ძიება" },
      { val: "124", label: "დარეგისტრირებული აფთიაქი" },
      { val: "უფასო", label: "მუდმივად დამოუკიდებლებისთვის" },
    ],
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
    terms: "რეგისტრაციით ეთანხმები ჩვენს მომსახურების პირობებს",
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

export default function PharmacyPortal() {
  const [step, setStep] = useState("landing");
  const [lang, setLang] = useState("en");
  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    phone: "",
    hours: "",
    email: "",
    password: "",
  });
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
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      // 2. Save pharmacy details to DB
      const { error: dbError } = await supabase.from("pharmacies").insert({
        name: form.name,
        address: form.address,
        district: form.district,
        phone: form.phone,
        hours: form.hours,
        is_independent: true,
        rating: 0,
      });

      if (dbError) throw dbError;

      setStep("success");
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  }

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

      {/* Landing */}
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
              <span
                style={{ color: "#2A7A6E", cursor: "pointer", fontWeight: 500 }}
                onClick={() => setStep("login")}
              >
                {t.signIn}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            {t.benefits.map((b) => (
              <div
                key={b.title}
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                  {b.icon}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A3A35",
                    marginBottom: "6px",
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#7AABA5",
                    lineHeight: 1.5,
                  }}
                >
                  {b.desc}
                </div>
              </div>
            ))}
          </div>

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
            {t.stats.map((s) => (
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

      {/* Register */}
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

      {/* Success */}
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
