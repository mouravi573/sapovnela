"use client";
import { useState } from "react";
import Link from "next/link";

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

const fields = [
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
];

const benefits = [
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
];

const stats = [
  { val: "2,400+", label: "Daily searches" },
  { val: "124", label: "Pharmacies listed" },
  { val: "Free", label: "Forever for independents" },
];

function NavBar() {
  return (
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
      <span style={{ fontSize: "13px", color: "#6BA89E" }}>
        Pharmacy Partner Portal
      </span>
    </nav>
  );
}

function Landing({ onRegister, onLogin }) {
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 24px" }}>
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
          Free for independent pharmacies
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
          Reach thousands of patients
          <br />
          <span style={{ color: "#2A7A6E" }}>
            searching for medicine near you
          </span>
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#7AABA5",
            maxWidth: "500px",
            margin: "0 auto 32px",
          }}
        >
          List your pharmacy on საპოვნელა for free. Patients searching for
          medicines will find your prices and get directions to your door.
        </p>
        <button
          onClick={onRegister}
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
          Register your pharmacy — free
        </button>
        <div style={{ marginTop: "12px", fontSize: "13px", color: "#9ABFBB" }}>
          Already registered?{" "}
          <span
            style={{ color: "#2A7A6E", cursor: "pointer", fontWeight: 500 }}
            onClick={onLogin}
          >
            Sign in →
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
        {benefits.map((b) => (
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
              style={{ fontSize: "13px", color: "#7AABA5", lineHeight: 1.5 }}
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
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>
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
  );
}

function Register({ form, update, onSubmit }) {
  return (
    <div style={{ maxWidth: "560px", margin: "40px auto", padding: "0 24px" }}>
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
          Register your pharmacy
        </h2>
        <p style={{ fontSize: "13px", color: "#7AABA5", marginBottom: "28px" }}>
          Free listing — takes 2 minutes
        </p>

        {fields.map((f) => (
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
            District
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
            <option value="">Select district...</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onSubmit}
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
          Register pharmacy →
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "14px",
            fontSize: "12px",
            color: "#9ABFBB",
          }}
        >
          By registering you agree to our terms of service
        </div>
      </div>
    </div>
  );
}

function Success() {
  return (
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
        You are registered!
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: "#7AABA5",
          marginBottom: "28px",
          lineHeight: 1.6,
        }}
      >
        Welcome to საპოვნელა. Your pharmacy will appear in search results within
        24 hours. Check your email to verify your account.
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
        Back to home →
      </Link>
    </div>
  );
}

export default function PharmacyPortal() {
  const [step, setStep] = useState("landing");
  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    phone: "",
    hours: "",
    email: "",
    password: "",
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4FBFA",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <NavBar />
      {step === "landing" && (
        <Landing
          onRegister={() => setStep("register")}
          onLogin={() => setStep("login")}
        />
      )}
      {step === "register" && (
        <Register
          form={form}
          update={update}
          onSubmit={() => setStep("success")}
        />
      )}
      {step === "success" && <Success />}
    </main>
  );
}
