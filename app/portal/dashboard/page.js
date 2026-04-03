"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const t = {
  en: {
    portal: "Dashboard",
    signOut: "Sign out",
    loading: "Loading your dashboard...",
    inStock: "Medicines in stock",
    totalListings: "Total listings",
    district: "District",
    weeklyViews: "Searches nearby this week",
    championPrice: "Champion price",
    aiTitle: "AI Insight",
    aiEmpty:
      "Add your first medicine to start appearing in patient searches. Patients in your area are actively searching for medicines right now.",
    aiHasStock: (count) =>
      `You have ${count} medicines listed. Check the zero-results section — patients in your area are searching for medicines you might have!`,
    aiZero: (med) =>
      `This week ${med} patients searched for medicines near you and found nothing. List those medicines and capture that demand!`,
    inventory: "Your inventory",
    addMedicine: "+ Add medicine",
    uploadCSV: "Upload CSV",
    noMedicines: "Add your first medicines",
    noMedicinesDesc: "Choose how you want to add your inventory",
    addManually: "Add manually",
    addManuallyDesc: "Add medicines one by one from our database",
    uploadDesc: "Upload your full price list as a spreadsheet",
    medicine: "Medicine",
    price: "Price (₾)",
    stockStatus: "In stock",
    lastUpdated: "Last updated",
    inStockBtn: "In stock",
    outOfStockBtn: "Out of stock",
    selectMedicine: "Select medicine...",
    stockCount: "Stock count",
    add: "Add →",
    cancel: "Cancel",
    profileTitle: "Profile completion",
    profileGps: "GPS coordinates",
    profileGpsSub: "Patients can't find you on the map",
    profileMeds: "medicines listed",
    profileMedsSub: "more to reach full visibility",
    profileHours: "Opening hours",
    profilePhone: "Phone number",
    lowStock: "Low stock",
    outOfStock: "Out of stock",
    champion: "🏆 Champion",
    lastUpdate: "Last updated",
    requestsTitle: "Patient Requests in Your Area",
    requestsDesc: "Medicines patients searched for but couldn't find nearby",
    requestsEmpty:
      "No patient requests yet — great news, everything is being found!",
    requestsWaiting: "patients waiting",
  },
  ge: {
    portal: "მართვის პანელი",
    signOut: "გასვლა",
    loading: "იტვირთება მართვის პანელი...",
    inStock: "წამალი მარაგშია",
    totalListings: "სულ განცხადება",
    district: "რაიონი",
    weeklyViews: "ძიება მახლობლად ამ კვირაში",
    championPrice: "საუკეთესო ფასი",
    aiTitle: "AI რჩევა",
    aiEmpty:
      "დაამატე პირველი წამალი, რომ გამოჩნდე ძიების შედეგებში. შენს მიმდებარედ ახლა ბევრი პაციენტი ეძებს წამლებს.",
    aiHasStock: (count) =>
      `შენ ${count} წამალი გაქვს განთავსებული. გადაამოწმე — პაციენტები ეძებენ წამლებს შენს მახლობლად!`,
    aiZero: (med) =>
      `ამ კვირაში ${med} პაციენტმა ვერ იპოვა წამალი შენს მახლობლად. განათავსე ეს წამლები და მოიზიდე ისინი!`,
    inventory: "შენი მარაგი",
    addMedicine: "+ წამლის დამატება",
    uploadCSV: "CSV-ის ატვირთვა",
    noMedicines: "დაამატე პირველი წამლები",
    noMedicinesDesc: "აირჩიე როგორ გინდა მარაგების დამატება",
    addManually: "ხელით დამატება",
    addManuallyDesc: "დაამატე წამლები სათითაოდ ჩვენი ბაზიდან",
    uploadDesc: "ატვირთე შენი პროდუქციის სრული სია ცხრილის სახით",
    medicine: "წამალი",
    price: "ფასი (₾)",
    stockStatus: "მარაგშია",
    lastUpdated: "ბოლო განახლება",
    inStockBtn: "მარაგშია",
    outOfStockBtn: "არ არის მარაგში",
    selectMedicine: "აირჩიე წამალი...",
    stockCount: "მარაგის რაოდენობა",
    add: "დამატება →",
    cancel: "გაუქმება",
    profileTitle: "პროფილის შევსება",
    profileGps: "GPS კოორდინატები",
    profileGpsSub: "პაციენტები ვერ გპოულობენ რუკაზე",
    profileMeds: "განთავსებული წამლები",
    profileMedsSub: "კიდევ გჭირდება სრული ხილვადობისთვის",
    profileHours: "სამუშაო საათები",
    profilePhone: "ტელეფონის ნომერი",
    lowStock: "მარაგი მცირეა",
    outOfStock: "მარაგი ამოიწურა",
    champion: "🏆 Champion",
    lastUpdate: "ბოლო განახლება",
    requestsTitle: "პაციენტების მოთხოვნები შენს მიმდებარედ",
    requestsDesc: "წამლები, რომლებიც პაციენტებმა ვერ იპოვეს შენს მახლობლად",
    requestsEmpty: "პაციენტებისგან მოთხოვნა ჯერ არ არის — ყველაფერი ნაპოვნია!",
    requestsWaiting: "პაციენტი ელოდება",
  },
};

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
  const [lang, setLang] = useState("ge");
  const [mounted, setMounted] = useState(false);
  const [weeklyViews, setWeeklyViews] = useState(0);
  const [zeroResultMeds, setZeroResultMeds] = useState([]);
  const [championItem, setChampionItem] = useState(null);
  const [patientRequests, setPatientRequests] = useState([]);
  const tr = t[lang];
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/portal/login");
      return;
    }

    const { data: pharmacyData } = await supabase
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
        .select("*, medicines(id, name, name_ge, dosage, form)")
        .eq("pharmacy_id", pharmacyData.id)
        .order("updated_at", { ascending: false });
      setInventory(inv || []);

      const inStockInv = (inv || []).filter((i) => i.in_stock);
      if (inStockInv.length > 0) {
        const champ = inStockInv.reduce(
          (min, i) => (i.price < min.price ? i : min),
          inStockInv[0],
        );
        setChampionItem(champ);
      }

      if (pharmacyData.district) {
        const week = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count } = await supabase
          .from("search_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", week)
          .eq("district", pharmacyData.district);
        setWeeklyViews(count || 0);

        const { data: zeroLogs } = await supabase
          .from("search_logs")
          .select("query")
          .gte("created_at", week)
          .eq("results_count", 0)
          .eq("district", pharmacyData.district);
        if (zeroLogs) {
          const counts = {};
          zeroLogs.forEach((l) => {
            const q = l.query.toLowerCase().trim();
            counts[q] = (counts[q] || 0) + 1;
          });
          setZeroResultMeds(
            Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3),
          );
        }

        // Patient requests in their district
        const { data: requests } = await supabase
          .from("medicine_requests")
          .select("query, created_at")
          .eq("district", pharmacyData.district)
          .order("created_at", { ascending: false });
        if (requests) {
          const counts = {};
          requests.forEach((r) => {
            const q = r.query.toLowerCase().trim();
            counts[q] = (counts[q] || 0) + 1;
          });
          setPatientRequests(
            Object.entries(counts).sort((a, b) => b[1] - a[1]),
          );
        }
      }
    }

    const { data: meds } = await supabase
      .from("medicines")
      .select("*")
      .order("name");
    setMedicines(meds || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "ge";
    setLang(saved);
    setMounted(true);
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
    if (!price || isNaN(parseFloat(price))) return;
    await supabase
      .from("inventory")
      .update({
        price: parseFloat(price),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    loadDashboard();
  }

  async function addMedicine() {
    if (!newMedicine.medicine_id || !newMedicine.price) {
      alert(
        lang === "en"
          ? "Please select a medicine and enter a price"
          : "გთხოვთ აირჩიოთ წამალი და შეიყვანოთ ფასი",
      );
      return;
    }
    const { error } = await supabase.from("inventory").insert({
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

  if (!mounted || loading)
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
        <div style={{ fontSize: "14px", color: "#9ABFBB" }}>{tr.loading}</div>
      </div>
    );

  const inStockCount = inventory.filter((i) => i.in_stock).length;
  const lowStockItems = inventory.filter(
    (i) => i.in_stock && i.stock_count <= 10,
  );
  const outOfStockItems = inventory.filter((i) => !i.in_stock);

  const profileChecks = [
    {
      done: !!pharmacy?.name,
      label: lang === "ge" ? "სახელი და მისამართი" : "Name and address",
    },
    { done: !!pharmacy?.hours, label: tr.profileHours },
    { done: !!pharmacy?.phone, label: tr.profilePhone },
    {
      done: !!(pharmacy?.lat && pharmacy?.lng),
      label: tr.profileGps,
      sub: tr.profileGpsSub,
    },
    {
      done: inventory.length >= 20,
      label: `20+ ${tr.profileMeds}`,
      sub:
        inventory.length < 20
          ? `${20 - inventory.length} ${tr.profileMedsSub}`
          : null,
    },
  ];
  const profileScore = Math.round(
    (profileChecks.filter((c) => c.done).length / profileChecks.length) * 100,
  );

  const aiInsight =
    zeroResultMeds.length > 0
      ? tr.aiZero(zeroResultMeds.map(([q, c]) => `"${q}" (${c}x)`).join(", "))
      : inventory.length === 0
        ? tr.aiEmpty
        : tr.aiHasStock(inventory.length);

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
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "13px", fontWeight: 600, color: "#1A3A35" }}
            >
              {pharmacy?.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: pharmacy?.is_approved ? "#2A7A6E" : "#C47D00",
              }}
            >
              {pharmacy?.district} ·{" "}
              {pharmacy?.is_approved
                ? lang === "ge"
                  ? "ლაივი ✓"
                  : "Live ✓"
                : lang === "ge"
                  ? "მოლოდინში"
                  : "Pending"}
            </div>
          </div>
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
            {tr.signOut}
          </button>
        </div>
      </nav>

      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "28px clamp(16px,4vw,40px)",
        }}
      >
        {/* Welcome */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A3A35",
              marginBottom: "4px",
            }}
          >
            {lang === "ge"
              ? `გამარჯობა, ${pharmacy?.name}! 👋`
              : `Welcome back, ${pharmacy?.name}! 👋`}
          </h1>
          <p style={{ fontSize: "13px", color: "#7AABA5" }}>
            {pharmacy?.district} ·{" "}
            {pharmacy?.hours ||
              (lang === "ge" ? "საათები არ არის" : "No hours set")}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              val: inStockCount,
              label: tr.inStock,
              color: "#2A7A6E",
              bg: "#EBF6F4",
            },
            {
              val: inventory.length,
              label: tr.totalListings,
              color: "#1A3A35",
              bg: "#fff",
            },
            {
              val: weeklyViews,
              label: tr.weeklyViews,
              color: "#7B52C8",
              bg: "#F0EBF8",
            },
            {
              val: championItem ? `${championItem.price.toFixed(2)} ₾` : "—",
              label: tr.championPrice,
              color: "#C47D00",
              bg: "#FFF3E0",
              sub: championItem ? championItem.medicines?.name : null,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                border: "1px solid #D0EBE7",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: s.color,
                  marginBottom: "4px",
                }}
              >
                {s.val}
              </div>
              <div style={{ fontSize: "11px", color: "#9ABFBB" }}>
                {s.label}
              </div>
              {s.sub && (
                <div
                  style={{
                    fontSize: "10px",
                    color: s.color,
                    marginTop: "3px",
                    fontWeight: 500,
                  }}
                >
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Insight + Profile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#F0EBF8",
              border: "1px solid #C8B8ED",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              gap: "12px",
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
                {tr.aiTitle}
              </div>
              <p
                style={{ fontSize: "12px", color: "#3D2070", lineHeight: 1.6 }}
              >
                {aiInsight}
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #D0EBE7",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A35" }}
              >
                {tr.profileTitle}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  background: profileScore >= 80 ? "#EBF6F4" : "#FFF3E0",
                  color: profileScore >= 80 ? "#2A7A6E" : "#C47D00",
                  border: `1px solid ${profileScore >= 80 ? "#A8D9D0" : "#FFD97A"}`,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontWeight: 600,
                }}
              >
                {profileScore}%
              </span>
            </div>
            {profileChecks.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "5px 0",
                  borderBottom:
                    i < profileChecks.length - 1 ? "1px solid #F4FBFA" : "none",
                }}
              >
                <span
                  style={{ fontSize: "12px", flexShrink: 0, marginTop: "1px" }}
                >
                  {c.done ? "✅" : "⬜"}
                </span>
                <div>
                  <div style={{ fontSize: "12px", color: "#1A3A35" }}>
                    {c.label}
                  </div>
                  {!c.done && c.sub && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9ABFBB",
                        marginTop: "1px",
                      }}
                    >
                      {c.sub}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  height: "6px",
                  background: "#F0F9F6",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "3px",
                    background: profileScore >= 80 ? "#2A7A6E" : "#C47D00",
                    width: `${profileScore}%`,
                    transition: "width .5s",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Requests */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #D0EBE7",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1A3A35",
                marginBottom: "4px",
              }}
            >
              🔔 {tr.requestsTitle}
              {patientRequests.length > 0 && (
                <span
                  style={{
                    fontSize: "12px",
                    background: "#FCEBEB",
                    color: "#A32D2D",
                    border: "1px solid #F09595",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    marginLeft: "8px",
                    fontWeight: 500,
                  }}
                >
                  {patientRequests.length}
                </span>
              )}
            </h2>
            <p style={{ fontSize: "12px", color: "#9ABFBB" }}>
              {tr.requestsDesc}
            </p>
          </div>
          {patientRequests.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                fontSize: "13px",
                color: "#9ABFBB",
              }}
            >
              {tr.requestsEmpty}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "10px",
              }}
            >
              {patientRequests.map(([query, count]) => (
                <div
                  key={query}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#FFF3E0",
                    border: "1px solid #FFD97A",
                    borderRadius: "10px",
                    padding: "10px 14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1A3A35",
                        textTransform: "capitalize",
                      }}
                    >
                      {query}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#C47D00",
                        marginTop: "2px",
                      }}
                    >
                      {count} {tr.requestsWaiting}
                    </div>
                  </div>
                  <span style={{ fontSize: "18px" }}>🔔</span>
                </div>
              ))}
            </div>
          )}
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
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "2px",
                }}
              >
                {tr.inventory}
              </h2>
              {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                <div style={{ fontSize: "11px", color: "#C47D00" }}>
                  {outOfStockItems.length > 0 &&
                    `${outOfStockItems.length} ${tr.outOfStock}`}
                  {outOfStockItems.length > 0 &&
                    lowStockItems.length > 0 &&
                    " · "}
                  {lowStockItems.length > 0 &&
                    `${lowStockItems.length} ${tr.lowStock}`}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAdd(!showAdd)}
                style={{
                  background: "#2A7A6E",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tr.addMedicine}
              </button>
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
                }}
              >
                {tr.uploadCSV}
              </button>
            </div>
          </div>

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
                  {tr.medicine}
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
                    color: "#1A3A35",
                  }}
                >
                  <option value="">{tr.selectMedicine}</option>
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
                  {tr.price}
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
                    color: "#1A3A35",
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
                  {tr.stockCount}
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
                    color: "#1A3A35",
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
                {tr.add}
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
                {tr.cancel}
              </button>
            </div>
          )}

          {inventory.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>💊</div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1A3A35",
                  marginBottom: "6px",
                }}
              >
                {tr.noMedicines}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#9ABFBB",
                  marginBottom: "24px",
                }}
              >
                {tr.noMedicinesDesc}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  onClick={() => setShowAdd(true)}
                  style={{
                    background: "#EBF6F4",
                    border: "2px solid #A8D9D0",
                    borderRadius: "14px",
                    padding: "24px",
                    cursor: "pointer",
                    width: "180px",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                    ✏️
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1A3A35",
                      marginBottom: "6px",
                    }}
                  >
                    {tr.addManually}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7AABA5",
                      lineHeight: 1.5,
                    }}
                  >
                    {tr.addManuallyDesc}
                  </div>
                </div>
                <div
                  onClick={() => router.push("/portal/upload")}
                  style={{
                    background: "#F0EBF8",
                    border: "2px solid #C8B8ED",
                    borderRadius: "14px",
                    padding: "24px",
                    cursor: "pointer",
                    width: "180px",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                    📂
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1A3A35",
                      marginBottom: "6px",
                    }}
                  >
                    {tr.uploadCSV}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7AABA5",
                      lineHeight: 1.5,
                    }}
                  >
                    {tr.uploadDesc}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F4FBFA" }}>
                  {[tr.medicine, tr.price, tr.stockStatus, tr.lastUpdated].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#9ABFBB",
                          textAlign: "left",
                          padding: "8px 10px",
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
                {inventory.map((item) => {
                  const isChampion = championItem?.id === item.id;
                  const isLowStock = item.in_stock && item.stock_count <= 10;
                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #F4FBFA" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F8FDFC")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "10px 10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: item.in_stock ? "#2A7A6E" : "#F09595",
                            }}
                          ></div>
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1A3A35",
                              }}
                            >
                              {item.medicines?.name}
                              {isChampion && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    background: "#FFF3E0",
                                    color: "#C47D00",
                                    border: "1px solid #FFD97A",
                                    padding: "1px 6px",
                                    borderRadius: "6px",
                                    marginLeft: "6px",
                                    fontWeight: 600,
                                  }}
                                >
                                  {tr.champion}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#9ABFBB",
                                marginTop: "1px",
                              }}
                            >
                              {item.medicines?.dosage} · {item.medicines?.form}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 10px" }}>
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
                            fontWeight: 600,
                            outline: "none",
                            color: "#2A7A6E",
                            background: "#fff",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => toggleStock(item)}
                            style={{
                              background: item.in_stock ? "#EAF3DE" : "#FCEBEB",
                              color: item.in_stock ? "#27500A" : "#A32D2D",
                              border: `1px solid ${item.in_stock ? "#3B6D11" : "#E24B4A"}`,
                              borderRadius: "8px",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            {item.in_stock ? tr.inStockBtn : tr.outOfStockBtn}
                          </button>
                          {isLowStock && (
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#FFF3E0",
                                color: "#C47D00",
                                border: "1px solid #FFD97A",
                                padding: "2px 6px",
                                borderRadius: "6px",
                              }}
                            >
                              {tr.lowStock}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          fontSize: "11px",
                          color: "#9ABFBB",
                        }}
                      >
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
