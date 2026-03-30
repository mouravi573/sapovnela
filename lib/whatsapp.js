import twilio from "twilio";

export async function sendWhatsAppNotification({
  name,
  address,
  district,
  phone,
  email,
}) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  const message = `🏥 *New Pharmacy Registered on საპოვნელა!*

📋 *Name:* ${name}
📍 *Address:* ${address}
🏘 *District:* ${district || "Not specified"}
📞 *Phone:* ${phone || "Not provided"}
📧 *Email:* ${email}

👉 Approve in Supabase to make them live.`;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: process.env.TWILIO_WHATSAPP_TO,
    body: message,
  });
}
