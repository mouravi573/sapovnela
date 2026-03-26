"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function Dashboard() {
  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    medicine_id: "",
    price: "",
    stock_count: 10,
  });
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/portal/login");
      return;
    }

    const { data: pharmacyData, error: pharmError } = await supabase
      .from("pharmacies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pharmacyData) {
      setPharmacy(pharmacyData);
      const { data: inv } = await supabase
        .from("inventory")
        .select("*, medicines(name, dosage, form)")
        .eq("pharmacy_id", pharmacyData.id);
      setInventory(inv || []);
    }

    const { data: meds } = await supabase
      .from("medicines")
      .select("*")
      .order("name");
    setMedicines(meds || []);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function toggleStock(item) {
    await supabase
      .from("inventory")
      .update({
        in_stock: !item.in_stock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    loadDashboard();
  }

  async function updatePrice(item, price) {
    await supabase
      .from("inventory")
      .update({
        price: parseFloat(price),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  async function addMedicine() {
    if (!newMedicine.medicine_id || !newMedicine.price) {
      alert("Please select a medicine and enter a price");
      return;
    }

    const { data, error } = await supabase.from("inventory").insert({
      pharmacy_id: pharmacy.id,
      medicine_id: newMedicine.medicine_id,
      price: parseFloat(newMedicine.price),
      stock_count: parseInt(newMedicine.stock_count),
      in_stock: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    setNewMedicine({ medicine_id: "", price: "", stock_count: 10 });
    setShowAdd(false);
    loadDashboard();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/portal");
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4FBFA",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: "14px", color: "#9ABFBB" }}>
          Loading your dashboard...
        </div>
      </div>
    );

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
            {pharmacy?.name || "Dashboard"}
          </span>
          <button
            onClick={handleLogout}
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
        </div>
      </nav>

      <div style={{ padding: "28px 40px" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          {[
            {
              val: inventory.filter((i) => i.in_stock).length,
              label: "Medicines in stock",
            },
            { val: inventory.length, label: "Total listings" },
            { val: pharmacy?.district || "—", label: "District" },
          ].map((s) => (
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
                style={{ fontSize: "26px", fontWeight: 700, color: "#2A7A6E" }}
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

        {/* AI Insight */}
        <div
          style={{
            background: "#F0EBF8",
            border: "1px solid #C8B8ED",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
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
          <div>
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
              AI Insight
            </div>
            <p style={{ fontSize: "13px", color: "#3D2070", lineHeight: 1.6 }}>
              {inventory.length === 0
                ? "Add your first medicine to start appearing in patient searches. Patients in your area are actively searching for medicines right now."
                : `You have ${inventory.filter((i) => i.in_stock).length} medicines in stock. Make sure your prices are competitive to appear at the top of search results.`}
            </p>
          </div>
        </div>

        {/* Inventory */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1A3A35" }}>
              Your inventory
            </h2>
            <button
              onClick={() => router.push("/portal/upload")}
              style={{
                background: "none",
                border: "1px solid #2A7A6E",
                color: "#2A7A6E",
                borderRadius: "8px",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                marginLeft: "8px",
              }}
            >
              Upload CSV
            </button>
          </div>

          {/* Add medicine form */}
          {showAdd && (
            <div
              style={{
                background: "#EBF6F4",
                border: "1px solid #A8D9D0",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 2, minWidth: "200px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1A3A35",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Medicine
                </label>
                <select
                  value={newMedicine.medicine_id}
                  onChange={(e) =>
                    setNewMedicine((prev) => ({
                      ...prev,
                      medicine_id: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1.5px solid #D0EBE7",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "13px",
                    outline: "none",
                    background: "#fff",
                  }}
                >
                  <option value="">Select medicine...</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.dosage}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "100px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1A3A35",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Price (₾)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newMedicine.price}
                  onChange={(e) =>
                    setNewMedicine((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1.5px solid #D0EBE7",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "13px",
                    outline: "none",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "100px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1A3A35",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Stock count
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={newMedicine.stock_count}
                  onChange={(e) =>
                    setNewMedicine((prev) => ({
                      ...prev,
                      stock_count: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1.5px solid #D0EBE7",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "13px",
                    outline: "none",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={addMedicine}
                style={{
                  background: "#2A7A6E",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Add →
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  background: "none",
                  border: "1px solid #D0EBE7",
                  color: "#7AABA5",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {inventory.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "#9ABFBB",
                fontSize: "14px",
              }}
            >
              No medicines added yet. Click &quot;+ Add medicine&quot; to get
              started.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Medicine", "Price (₾)", "In stock", "Last updated"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#9ABFBB",
                          textAlign: "left",
                          padding: "8px",
                          borderBottom: "1px solid #D0EBE7",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #F4FBFA" }}
                  >
                    <td
                      style={{
                        padding: "10px 8px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1A3A35",
                      }}
                    >
                      {item.medicines?.name}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9ABFBB",
                          marginTop: "1px",
                        }}
                      >
                        {item.medicines?.dosage} · {item.medicines?.form}
                      </div>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <input
                        type="number"
                        defaultValue={item.price}
                        onBlur={(e) => updatePrice(item, e.target.value)}
                        style={{
                          width: "70px",
                          border: "1.5px solid #D0EBE7",
                          borderRadius: "8px",
                          padding: "5px 8px",
                          fontSize: "13px",
                          outline: "none",
                          color: "#1A3A35",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <button
                        onClick={() => toggleStock(item)}
                        style={{
                          background: item.in_stock ? "#EAF3DE" : "#FCEBEB",
                          color: item.in_stock ? "#27500A" : "#A32D2D",
                          border: `1px solid ${item.in_stock ? "#3B6D11" : "#E24B4A"}`,
                          borderRadius: "8px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {item.in_stock ? "In stock" : "Out of stock"}
                      </button>
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        fontSize: "11px",
                        color: "#9ABFBB",
                      }}
                    >
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
