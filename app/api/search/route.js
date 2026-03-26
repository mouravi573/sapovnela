import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  const { data: medicines } = await supabase
    .from("medicines")
    .select("id")
    .or(
      `name.ilike.%${query}%,name_ge.ilike.%${query}%,generic_name.ilike.%${query}%`,
    );

  if (!medicines || medicines.length === 0) {
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
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
