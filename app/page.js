"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/search?q=${query}`);
    const json = await res.json();
    setResults(json.data || []);
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  const grouped = results.reduce((acc, item) => {
    if (!item.medicines) return acc;
    const key = item.medicines.id;
    if (!acc[key]) acc[key] = { medicine: item.medicines, pharmacies: [] };
    if (item.pharmacies)
      acc[key].pharmacies.push({
        ...item.pharmacies,
        price: item.price,
        stock_count: item.stock_count,
      });
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#F7FBF9]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-16 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2E7D5E] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            +
          </div>
          <span className="text-lg font-semibold text-gray-800">
            Sap<span className="text-[#2E7D5E]">ovnela</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-500 hover:text-gray-800">
            Find Medicine
          </button>
          <button className="text-sm bg-[#2E7D5E] text-white px-4 py-1.5 rounded-full hover:bg-[#1B5C42]">
            Pharmacy Portal
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 px-16 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Find <span className="text-[#2E7D5E]">affordable medicine</span> near
          you
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Real-time prices from pharmacies across Georgia
        </p>

        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-2xl px-4 py-2 bg-white focus-within:border-[#2E7D5E] transition-colors">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Medicine name, active ingredient..."
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
          />
          <div className="flex items-center gap-1 bg-sky-50 border border-sky-200 text-sky-600 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-sky-400 rounded-full inline-block"></span>
            Vake, Tbilisi
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#2E7D5E] text-white text-sm px-4 py-1.5 rounded-xl hover:bg-[#1B5C42] transition-colors"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            "Ibuprofen",
            "Paracetamol",
            "Metformin",
            "Omeprazole",
            "Aspirin",
          ].map((tag) => (
            <span
              key={tag}
              onClick={() => {
                setQuery(tag);
              }}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* AI Bar */}
      <div className="mx-16 mt-4 bg-violet-50 border border-violet-200 rounded-xl p-3 flex gap-3">
        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">
          🤖
        </div>
        <div>
          <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-1">
            MedAI Assistant
          </div>
          <p className="text-sm text-violet-900">
            {searched && results.length > 0
              ? `I found ${Object.keys(grouped).length} medicine(s) matching ${query}. Cheapest option from ${Math.min(...results.map((r) => r.price)).toFixed(2)} ₾. Scroll down to compare!`
              : `Hello! Search for any medicine above and I will find the cheapest options near you in Tbilisi.`}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="px-16 py-6">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            Searching pharmacies near you...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No results found for {query}
          </div>
        )}

        {!loading && !searched && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: "847", label: "Medicines tracked" },
              { val: "124", label: "Pharmacies listed" },
              { val: "Free", label: "No registration" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-semibold text-[#2E7D5E]">
                  {s.val}
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {!loading &&
          Object.values(grouped).map(({ medicine, pharmacies }) => (
            <div
              key={medicine.id}
              className="bg-white border border-gray-100 rounded-xl p-5 mb-4 hover:border-emerald-200 transition-colors"
            >
              {/* Medicine header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    {medicine.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {medicine.form} · {medicine.category} · Generic:{" "}
                    {medicine.generic_name}
                  </p>
                  <span className="inline-block mt-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full">
                    {pharmacies.length} pharmacies in stock
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">from</div>
                  <div className="text-2xl font-bold text-[#2E7D5E]">
                    {Math.min(...pharmacies.map((p) => p.price)).toFixed(2)} ₾
                  </div>
                </div>
              </div>

              {/* Pharmacy rows */}
              {pharmacies
                .sort((a, b) => a.price - b.price)
                .map((ph, i) => (
                  <div
                    key={ph.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-emerald-50 transition-colors mb-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-emerald-500" : "bg-gray-300"}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {ph.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ph.address} · {ph.hours}
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Cheapest
                      </span>
                    )}
                    {ph.is_independent && (
                      <span className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">
                        Independent
                      </span>
                    )}
                    <div className="text-sm font-bold text-gray-800">
                      {ph.price.toFixed(2)} ₾
                    </div>
                    <button className="bg-[#2E7D5E] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#1B5C42] transition-colors">
                      Directions
                    </button>
                  </div>
                ))}
            </div>
          ))}
      </div>
    </main>
  );
}
