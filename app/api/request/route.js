import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { query, phone } = await request.json();

    if (!query || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d\+]/g, "");
    if (cleanPhone.length < 9) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    const { error } = await supabase
      .from("medicine_requests")
      .insert({ query, phone: cleanPhone });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
