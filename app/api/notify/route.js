import twilio from "twilio";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, address, district, phone, email } = await request.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: process.env.TWILIO_WHATSAPP_TO,
      body: `🏥 *New Pharmacy Registered on საპოვნელა!*

📋 *Name:* ${name}
📍 *Address:* ${address || "—"}
🏘 *District:* ${district || "—"}
📞 *Phone:* ${phone || "—"}
📧 *Email:* ${email}

👉 Approve in Supabase to make them live.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp notification failed:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 },
    );
  }
}
