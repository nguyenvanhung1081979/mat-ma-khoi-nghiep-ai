async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID — bỏ qua gửi thông báo Telegram");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Gửi Telegram thất bại:", res.status, body);
  }
}

module.exports = { notifyTelegram };
