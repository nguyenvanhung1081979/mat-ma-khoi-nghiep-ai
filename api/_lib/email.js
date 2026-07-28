const { Resend } = require("resend");

async function sendEbookEmail({ to, orderCode, downloadUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  if (!apiKey) {
    console.warn("Thiếu RESEND_API_KEY — bỏ qua gửi email giao sách");
    return;
  }
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject: "Cảm ơn bạn đã đặt mua — Mật Mã Khởi Nghiệp AI",
    html: `
      <p>Chào bạn,</p>
      <p>Cảm ơn bạn đã thanh toán đơn hàng <strong>${orderCode}</strong>.</p>
      <p>Tải sách của bạn tại đây (link có hiệu lực trong 24 giờ):</p>
      <p><a href="${downloadUrl}">${downloadUrl}</a></p>
      <p>Chúc bạn học tốt và sớm xây dựng được hệ thống của riêng mình!</p>
    `,
  });
}

module.exports = { sendEbookEmail };
