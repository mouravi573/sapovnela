"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://sapovnela.com/portal/update-password",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
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
          Password Reset
        </span>
      </nav>

      <div
        style={{ maxWidth: "440px", margin: "60px auto", padding: "0 24px" }}
      >
        {sent ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #D0EBE7",
              borderRadius: "16px",
              padding: "36px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "10px",
              }}
            >
              Check your email
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#7AABA5",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              We sent a password reset link to <strong>{email}</strong>. Click
              the link in the email to set a new password.
            </p>
            <Link
              href="/portal/login"
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
              Back to login →
            </Link>
          </div>
        ) : (
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
              Reset your password
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#7AABA5",
                marginBottom: "28px",
              }}
            >
              Enter your email and we will send you a reset link
            </p>

            {error && (
              <div
                style={{
                  background: "#FCEBEB",
                  border: "1px solid #F09595",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#A32D2D",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

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
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="your@email.com"
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

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#9ABFBB" : "#2A7A6E",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Sending..." : "Send reset link →"}
            </button>

            <div
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "13px",
                color: "#9ABFBB",
              }}
            >
              <Link
                href="/portal/login"
                style={{ color: "#2A7A6E", fontWeight: 500 }}
              >
                ← Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
