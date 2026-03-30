"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "sapovnela2025";

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("admin_authed");
    if (saved === "true") {
      setAuthed(true);
      fetchPharmacies();
    }
  }, []);

  async function fetchPharmacies() {
    setLoading(true);
    const { data } = await supabase
      .from("pharmacies")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setPending(data.filter((p) => !p.is_approved));
      setApproved(data.filter((p) => p.is_approved));
    }
    setLoading(false);
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("admin_authed", "true");
      fetchPharmacies();
    } else {
      setError("Wrong password");
    }
  }

  async function approvePharmacy(id) {
    await supabase
      .from("pharmacies")
      .update({ is_approved: true })
      .eq("id", id);
    fetchPharmacies();
  }

  async function rejectPharmacy(id) {
    if (!confirm("Delete this pharmacy permanently?")) return;
    await supabase.from("pharmacies").delete().eq("id", id);
    fetchPharmacies();
  }

  if (!mounted) return null;

  if (!authed)
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F4FBFA",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #D0EBE7",
            borderRadius: "16px",
            padding: "40px",
            width: "340px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#2A7A6E",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: "22px",
              }}
            >
              🔐
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1A3A35" }}>
              Admin Panel
            </h1>
            <p style={{ fontSize: "13px", color: "#7AABA5", marginTop: "4px" }}>
              საპოვნელა · Sapovnela
            </p>
          </div>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter admin password"
            style={{
              width: "100%",
              border: "1.5px solid #D0EBE7",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "14px",
              outline: "none",
              color: "#1A3A35",
              boxSizing: "border-box",
              marginBottom: "12px",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              background: "#2A7A6E",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign in →
          </button>
        </div>
      </main>
    );

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              fontSize: "18px",
              fontWeight: 700,
              color: "#1A3A35",
              fontFamily: "Georgia, serif",
            }}
          >
            საპოვ<span style={{ color: "#2A7A6E" }}>ნელა</span> · Admin
          </span>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("admin_authed");
            setAuthed(false);
          }}
          style={{
            background: "none",
            border: "1px solid #D0EBE7",
            color: "#7AABA5",
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </nav>

      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}
      >
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              val: pending.length,
              label: "Pending approval",
              color: "#C47D00",
              bg: "#FFF3E0",
            },
            {
              val: approved.length,
              label: "Approved & live",
              color: "#2A7A6E",
              bg: "#EBF6F4",
            },
            {
              val: pending.length + approved.length,
              label: "Total registered",
              color: "#1A3A35",
              bg: "#fff",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                border: "1px solid #D0EBE7",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "28px", fontWeight: 700, color: s.color }}
              >
                {s.val}
              </div>
              <div
                style={{ fontSize: "12px", color: "#9ABFBB", marginTop: "4px" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pending */}
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1A3A35",
              marginBottom: "16px",
            }}
          >
            ⏳ Pending Approval ({pending.length})
          </h2>
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "32px", color: "#9ABFBB" }}
            >
              Loading...
            </div>
          ) : pending.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #D0EBE7",
                borderRadius: "12px",
                padding: "32px",
                textAlign: "center",
                color: "#9ABFBB",
                fontSize: "14px",
              }}
            >
              No pending pharmacies 🎉
            </div>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid #FFD97A",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1A3A35",
                      marginBottom: "4px",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#7AABA5" }}>
                    📍 {p.address} · {p.district}
                    {p.phone && <span> · 📞 {p.phone}</span>}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#9ABFBB",
                      marginTop: "3px",
                    }}
                  >
                    Registered: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => approvePharmacy(p.id)}
                    style={{
                      background: "#2A7A6E",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 20px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => rejectPharmacy(p.id)}
                    style={{
                      background: "#FCEBEB",
                      color: "#A32D2D",
                      border: "1px solid #F09595",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approved */}
        <div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1A3A35",
              marginBottom: "16px",
            }}
          >
            ✅ Approved & Live ({approved.length})
          </h2>
          {approved.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #D0EBE7",
                borderRadius: "12px",
                padding: "32px",
                textAlign: "center",
                color: "#9ABFBB",
                fontSize: "14px",
              }}
            >
              No approved pharmacies yet
            </div>
          ) : (
            approved.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1A3A35",
                      marginBottom: "4px",
                    }}
                  >
                    {p.name}
                    <span
                      style={{
                        fontSize: "11px",
                        background: "#EBF6F4",
                        color: "#2A7A6E",
                        border: "1px solid #A8D9D0",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        marginLeft: "8px",
                        fontWeight: 500,
                      }}
                    >
                      Live
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#7AABA5" }}>
                    📍 {p.address} · {p.district}
                    {p.phone && <span> · 📞 {p.phone}</span>}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#9ABFBB",
                      marginTop: "3px",
                    }}
                  >
                    Approved: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => rejectPharmacy(p.id)}
                  style={{
                    background: "#FCEBEB",
                    color: "#A32D2D",
                    border: "1px solid #F09595",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
