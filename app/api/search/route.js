import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") || "";
  const district = searchParams.get("district") || null;

  // Reject empty or suspiciously long queries
  if (!raw.trim() || raw.length > 100) {
    return NextResponse.json({ data: [] });
  }

  // Strip special characters, keep letters, numbers, spaces, Georgian script
  const query = raw.replace(/[^\w\s\u10D0-\u10FF\-]/g, "").trim();

  if (!query) return NextResponse.json({ data: [] });

  const { data: medicines } = await supabase
    .from("medicines")
    .select("id")
    .or(
      `name.ilike.%${query}%,name_ge.ilike.%${query}%,generic_name.ilike.%${query}%`,
    );

  if (!medicines || medicines.length === 0) {
    // Log zero-result search
    await supabase.from("search_logs").insert({
      query,
      results_count: 0,
      district,
    });
    return NextResponse.json({ data: [] });
  }

  const medicineIds = medicines.map((m) => m.id);

  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      price,
      stock_count,
      in_stock,
      medicines (id, name, name_ge, generic_name, category, dosage, form),
      pharmacies (id, name, address, district, lat, lng, hours, is_independent, rating)
    `,
    )
    .in("medicine_id", medicineIds)
    .eq("in_stock", true)
    .eq("pharmacies.is_approved", true)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error }, { status: 500 });

  // Log successful search
  await supabase.from("search_logs").insert({
    query,
    results_count: data?.length || 0,
    district,
  });

  return NextResponse.json({ data });
}
