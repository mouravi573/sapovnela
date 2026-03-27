import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

const client = new Anthropic();
const LIMIT = 10;
const WINDOW_HOURS = 24;

async function checkRateLimit(ip) {
  const windowStart = new Date(
    Date.now() - WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data: existing } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("ip", ip)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("rate_limits")
      .insert({ ip, count: 1, window_start: new Date().toISOString() });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  // Reset window if it has expired
  if (existing.window_start < windowStart) {
    await supabase
      .from("rate_limits")
      .update({ count: 1, window_start: new Date().toISOString() })
      .eq("ip", ip);
    return { allowed: true, remaining: LIMIT - 1 };
  }

  // Within window — check count
  if (existing.count >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("rate_limits")
    .update({ count: existing.count + 1 })
    .eq("ip", ip);
  return { allowed: true, remaining: LIMIT - existing.count - 1 };
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { allowed, remaining } = await checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Try again tomorrow.", remaining: 0 },
        { status: 429 },
      );
    }

    const { message, context } = await request.json();

    if (!message || message.length > 500) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: `You are MedAI, a helpful pharmacy assistant for საპოვნელა (Sapovnela), Georgia's medicine price finder. 
You help patients find affordable medicines in Tbilisi pharmacies. 
Keep answers short, practical and friendly. 
If asked about specific prices, remind users to search on the platform.
Never provide medical diagnosis or prescriptions.
${context ? `Context: ${context}` : ""}`,
      messages: [{ role: "user", content: message }],
    });

    const reply =
      response.content[0]?.text || "Sorry, I could not answer that.";
    return NextResponse.json({ reply, remaining });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
