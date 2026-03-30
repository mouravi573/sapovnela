const twilio = require("twilio");

const client = twilio(
  "ACfe7e11e7da05e510bb943798543f10a0",
  "80b391600346d68b3687898466885373",
);

client.messages
  .create({
    from: "whatsapp:+14155238886",
    to: "whatsapp:+995577999555",
    body: "Test from საპოვნელა!",
  })
  .then((msg) => console.log("Success:", msg.sid))
  .catch((err) => console.error("Error:", err.message));
