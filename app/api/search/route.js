import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      price,
      stock_count,
      in_stock,
      medicines (id, name, generic_name, category, dosage, form),
      pharmacies (id, name, address, district, lat, lng, hours, is_independent, rating)
    `,
    )
    .ilike("medicines.name", `%${query}%`)
    .eq("in_stock", true)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
