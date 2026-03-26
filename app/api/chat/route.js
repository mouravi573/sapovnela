import { NextResponse } from "next/server";

const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxRequests = 10; // max 10 questions per user per day

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  const record = rateLimitMap.get(ip);

  if (now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) return true;

  record.count++;
  return false;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        reply:
          "You have reached the daily limit of 10 questions. Please come back tomorrow!",
      },
      { status: 429 },
    );
  }

  const { message, context } = await request.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `You are MedAI, a helpful medical assistant for საპოვნელა (Sapovnela) — Georgia's medicine price finder platform.

You help patients in Georgia find affordable medicines, understand their medications, and make informed decisions.

Your role:
- Answer questions about medicines, dosages, side effects, interactions
- Suggest generic alternatives to branded medicines
- Help users understand what medicines are used for
- Give practical advice about finding affordable medicine in Georgia
- Always recommend consulting a doctor or pharmacist for medical decisions

Keep answers concise, friendly and practical. Respond in the same language the user writes in (Georgian or English).

Current search context: ${context || "No medicine searched yet"}`,
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message || "AI error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    reply: data.content[0].text,
  });
}
