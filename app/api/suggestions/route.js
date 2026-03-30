import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") || "";

  if (!raw.trim() || raw.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = raw.replace(/[^\w\s\u10D0-\u10FF\-]/g, "").trim();

  if (!query) return NextResponse.json({ data: [] });

  const { data, error } = await supabase
    .from("medicines")
    .select("id, name, name_ge, dosage, form")
    .or(
      `name.ilike.%${query}%,name_ge.ilike.%${query}%,generic_name.ilike.%${query}%`,
    )
    .limit(6);

  if (error) return NextResponse.json({ data: [] });
  return NextResponse.json({ data: data || [] });
}
