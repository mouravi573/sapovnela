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
  const [tab, setTab] = useState("analytics");
  const [totalSearches, setTotalSearches] = useState(0);
  const [zeroResults, setZeroResults] = useState(0);
  const [topSearches, setTopSearches] = useState([]);
  const [zeroSearches, setZeroSearches] = useState([]);
  const [districtSearches, setDistrictSearches] = useState([]);
  const [pharmacyHealth, setPharmacyHealth] = useState([]);

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("admin_authed");
    if (saved === "true") {
      setAuthed(true);
      fetchAll();
    }
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchPharmacies(), fetchAnalytics()]);
    setLoading(false);
  }

  async function fetchPharmacies() {
    const { data } = await supabase
      .from("pharmacies")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setPending(data.filter((p) => !p.is_approved));
      setApproved(data.filter((p) => p.is_approved));
      const health = [];
      for (const ph of data.filter((p) => p.is_approved)) {
        const { count } = await supabase
          .from("inventory")
          .select("*", { count: "exact", head: true })
          .eq("pharmacy_id", ph.id);
        const { data: recent } = await supabase
          .from("inventory")
          .select("updated_at")
          .eq("pharmacy_id", ph.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const daysSince = recent
          ? Math.floor((Date.now() - new Date(recent.updated_at)) / 86400000)
          : null;
        health.push({ ...ph, medicineCount: count || 0, daysSince });
      }
      setPharmacyHealth(health);
    }
  }

  async function fetchAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(Date.now() - 7 * 86400000).toISOString();

    const [{ count: todayCount }, { count: zeroCount }] = await Promise.all([
      supabase
        .from("search_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      supabase
        .from("search_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())
        .eq("results_count", 0),
    ]);
    setTotalSearches(todayCount || 0);
    setZeroResults(zeroCount || 0);

    const [{ data: logs }, { data: zeroLogs }, { data: distLogs }] =
      await Promise.all([
        supabase
          .from("search_logs")
          .select("query")
          .gte("created_at", week)
          .gt("results_count", 0),
        supabase
          .from("search_logs")
          .select("query")
          .gte("created_at", week)
          .eq("results_count", 0),
        supabase
          .from("search_logs")
          .select("district")
          .gte("created_at", week)
          .not("district", "is", null),
      ]);

    if (logs) {
      const counts = {};
      logs.forEach((l) => {
        const q = l.query.toLowerCase().trim();
        counts[q] = (counts[q] || 0) + 1;
      });
      setTopSearches(
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      );
    }
    if (zeroLogs) {
      const counts = {};
      zeroLogs.forEach((l) => {
        const q = l.query.toLowerCase().trim();
        counts[q] = (counts[q] || 0) + 1;
      });
      setZeroSearches(
        Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      );
    }
    if (distLogs) {
      const counts = {};
      distLogs.forEach((l) => {
        if (l.district) counts[l.district] = (counts[l.district] || 0) + 1;
      });
      setDistrictSearches(Object.entries(counts).sort((a, b) => b[1] - a[1]));
    }
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem("admin_authed", "true");
      fetchAll();
    } else {
      setError("Wrong password");
    }
  }

  async function approvePharmacy(id) {
    await supabase
      .from("pharmacies")
      .update({ is_approved: true })
      .eq("id", id);
    fetchAll();
  }

  async function rejectPharmacy(id) {
    if (!confirm("Delete this pharmacy permanently?")) return;
    await supabase.from("pharmacies").delete().eq("id", id);
    fetchAll();
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

  const maxSearch = topSearches[0]?.[1] || 1;

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
          padding: "0 clamp(16px,4vw,40px)",
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
        style={{
          background: "#fff",
          borderBottom: "1px solid #D0EBE7",
          padding: "0 clamp(16px,4vw,40px)",
          display: "flex",
          gap: "4px",
        }}
      >
        {[
          { key: "analytics", label: "📊 Analytics" },
          {
            key: "pharmacies",
            label: `🏥 Pharmacies${pending.length > 0 ? ` (${pending.length} pending)` : ""}`,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "none",
              border: "none",
              padding: "16px 16px 14px",
              fontSize: "13px",
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? "#2A7A6E" : "#9ABFBB",
              cursor: "pointer",
              borderBottom:
                tab === t.key ? "2px solid #2A7A6E" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "32px clamp(16px,4vw,40px)",
        }}
      >
        {tab === "analytics" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              {[
                {
                  val: totalSearches,
                  label: "Searches today",
                  color: "#2A7A6E",
                  bg: "#EBF6F4",
                },
                {
                  val: zeroResults,
                  label: "Zero results today",
                  color: "#C47D00",
                  bg: "#FFF3E0",
                },
                {
                  val: approved.length,
                  label: "Active pharmacies",
                  color: "#2A7A6E",
                  bg: "#EBF6F4",
                },
                {
                  val: pending.length,
                  label: "Pending approval",
                  color: "#7B52C8",
                  bg: "#F0EBF8",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: s.bg,
                    border: "1px solid #D0EBE7",
                    borderRadius: "12px",
                    padding: "18px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: s.color,
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A3A35",
                    marginBottom: "16px",
                  }}
                >
                  🔍 Top searched — last 7 days
                </div>
                {topSearches.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ABFBB",
                      fontSize: "13px",
                      padding: "20px 0",
                    }}
                  >
                    No data yet — searches will appear here
                  </div>
                ) : (
                  topSearches.map(([q, count]) => (
                    <div
                      key={q}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#1A3A35",
                          width: "130px",
                          flexShrink: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textTransform: "capitalize",
                        }}
                      >
                        {q}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: "8px",
                          background: "#F0F9F6",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "4px",
                            background: "#2A7A6E",
                            width: `${(count / maxSearch) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9ABFBB",
                          width: "30px",
                          textAlign: "right",
                        }}
                      >
                        {count}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A3A35",
                    marginBottom: "16px",
                  }}
                >
                  🚨 Zero results — call pharmacies!
                </div>
                {zeroSearches.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ABFBB",
                      fontSize: "13px",
                      padding: "20px 0",
                    }}
                  >
                    No zero-result searches 🎉
                  </div>
                ) : (
                  zeroSearches.map(([q, count]) => (
                    <div
                      key={q}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#FFF3E0",
                        border: "1px solid #FFD97A",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1A3A35",
                          textTransform: "capitalize",
                        }}
                      >
                        {q}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#C47D00",
                          fontWeight: 600,
                        }}
                      >
                        {count} searches
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A3A35",
                    marginBottom: "16px",
                  }}
                >
                  📍 Searches by district — last 7 days
                </div>
                {districtSearches.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ABFBB",
                      fontSize: "13px",
                      padding: "20px 0",
                    }}
                  >
                    No district data yet
                  </div>
                ) : (
                  districtSearches.map(([district, count]) => {
                    const hasPharmacy = approved.some(
                      (p) => p.district === district,
                    );
                    return (
                      <div
                        key={district}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: "1px solid #F0F9F6",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#1A3A35" }}>
                          {district}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#2A7A6E",
                            }}
                          >
                            {count}
                          </span>
                          {hasPharmacy ? (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#EBF6F4",
                                color: "#2A7A6E",
                                border: "1px solid #A8D9D0",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              covered
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#FCEBEB",
                                color: "#A32D2D",
                                border: "1px solid #F09595",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              no pharmacy
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #D0EBE7",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1A3A35",
                    marginBottom: "16px",
                  }}
                >
                  💊 Pharmacy health
                </div>
                {pharmacyHealth.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#9ABFBB",
                      fontSize: "13px",
                      padding: "20px 0",
                    }}
                  >
                    No approved pharmacies yet
                  </div>
                ) : (
                  pharmacyHealth.map((ph) => {
                    const isThin = ph.medicineCount < 5;
                    const isInactive =
                      ph.daysSince !== null && ph.daysSince > 30;
                    return (
                      <div
                        key={ph.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: "1px solid #F0F9F6",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1A3A35",
                            }}
                          >
                            {ph.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                            {ph.district}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#9ABFBB" }}>
                            {ph.medicineCount} medicines
                          </span>
                          {isInactive && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#FCEBEB",
                                color: "#A32D2D",
                                border: "1px solid #F09595",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {ph.daysSince}d inactive
                            </span>
                          )}
                          {isThin && !isInactive && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#FFF3E0",
                                color: "#C47D00",
                                border: "1px solid #FFD97A",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              thin
                            </span>
                          )}
                          {!isThin && !isInactive && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#EBF6F4",
                                color: "#2A7A6E",
                                border: "1px solid #A8D9D0",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              healthy
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {tab === "pharmacies" && (
          <>
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
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#9ABFBB",
                  }}
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
                        Registered:{" "}
                        {new Date(p.created_at).toLocaleDateString()}
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
          </>
        )}
      </div>
    </main>
  );
}
