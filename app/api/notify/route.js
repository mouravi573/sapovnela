import twilio from "twilio";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, address, district, phone, email } = await request.json();

    const message = `🏥 *New Pharmacy Registered on საპოვნელა!*

📋 *Name:* ${name}
📍 *Address:* ${address || "—"}
🏘 *District:* ${district || "—"}
📞 *Phone:* ${phone || "—"}
📧 *Email:* ${email}

👉 Approve in admin panel to make them live.`;

    // Send Twilio WhatsApp
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: process.env.TWILIO_WHATSAPP_TO,
        body: message,
      });
    } catch (twilioErr) {
      console.error("Twilio failed:", twilioErr.message);
    }

    // Send Telegram
    try {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown",
          }),
        },
      );
    } catch (telegramErr) {
      console.error("Telegram failed:", telegramErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
