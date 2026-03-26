"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    if (!password || !confirm) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/portal/login"), 3000);
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
          Set New Password
        </span>
      </nav>

      <div
        style={{ maxWidth: "440px", margin: "60px auto", padding: "0 24px" }}
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
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "10px",
              }}
            >
              Password updated!
            </h2>
            <p style={{ fontSize: "14px", color: "#7AABA5", lineHeight: 1.6 }}>
              Your password has been changed. Redirecting you to login...
            </p>
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
              Set new password
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#7AABA5",
                marginBottom: "28px",
              }}
            >
              Choose a strong password for your pharmacy account
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

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1A3A35",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
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

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1A3A35",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                placeholder="Repeat your password"
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
              onClick={handleUpdate}
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
              {loading ? "Updating..." : "Update password →"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
