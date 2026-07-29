const { Resend } = require("resend");

async function sendEbookEmail({ to, orderCode, downloadUrlEpub, downloadUrlPdf }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  if (!apiKey) {
    console.warn("Thiếu RESEND_API_KEY — bỏ qua gửi email giao sách");
    return;
  }
  const resend = new Resend(apiKey);

  const links = `
      ${downloadUrlPdf ? `<p>📄 <a href="${downloadUrlPdf}">Tải bản PDF</a> — mở được trên mọi điện thoại/máy tính, không cần cài thêm app.</p>` : ""}
      ${downloadUrlEpub ? `<p>📖 <a href="${downloadUrlEpub}">Tải bản EPUB</a> — tối ưu cho các app đọc sách (Apple Books, Google Play Sách...).</p>` : ""}
  `;

  await resend.emails.send({
    from,
    to,
    subject: "Cảm ơn bạn đã đặt mua — Mật Mã Khởi Nghiệp AI",
    html: `
      <p>Chào bạn,</p>
      <p>Cảm ơn bạn đã thanh toán đơn hàng <strong>${orderCode}</strong>.</p>
      <p>Tải sách của bạn tại đây (link có hiệu lực trong 24 giờ):</p>
      ${links}
      <p>Nếu không chắc máy mình đọc được định dạng nào, cứ tải bản PDF — mở trực tiếp bằng trình duyệt hoặc bất kỳ ứng dụng xem PDF có sẵn nào.</p>
      <p>Chúc bạn học tốt và sớm xây dựng được hệ thống của riêng mình!</p>
    `,
  });
}

module.exports = { sendEbookEmail };
