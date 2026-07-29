const { Resend } = require("resend");

async function sendEbookEmail({ to, orderCode, readUrl, downloadUrlEpub, downloadUrlPdf }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  if (!apiKey) {
    console.warn("Thiếu RESEND_API_KEY — bỏ qua gửi email giao sách");
    return;
  }
  const resend = new Resend(apiKey);

  const links = `
      ${readUrl ? `<p>📖 <a href="${readUrl}">Đọc trực tiếp trên web</a> — như đọc sách lật, không cần tải file gì cả.</p>` : ""}
      ${downloadUrlPdf ? `<p>📄 <a href="${downloadUrlPdf}">Tải bản PDF</a> — mở được trên mọi điện thoại/máy tính, không cần cài thêm app.</p>` : ""}
      ${downloadUrlEpub ? `<p>📚 <a href="${downloadUrlEpub}">Tải bản EPUB</a> — tối ưu cho các app đọc sách (Apple Books, Google Play Sách...).</p>` : ""}
  `;

  await resend.emails.send({
    from,
    to,
    subject: "Cảm ơn bạn đã đặt mua — Mật Mã Khởi Nghiệp AI",
    html: `
      <p>Chào bạn,</p>
      <p>Cảm ơn bạn đã thanh toán đơn hàng <strong>${orderCode}</strong>.</p>
      <p>Bạn có thể đọc hoặc tải sách theo cách tiện nhất cho mình (link tải file có hiệu lực trong 24 giờ, link đọc trên web không giới hạn thời gian):</p>
      ${links}
      <p>Nếu không chắc máy mình đọc được định dạng file nào, cứ chọn "Đọc trực tiếp trên web" hoặc tải bản PDF.</p>
      <p>🎁 <strong>Quà tặng kèm dành riêng cho bạn:</strong></p>
      <p>🤖 <a href="https://vungalishop.vercel.app/qua-tang">Trọn bộ 176+ Trợ lý AI miễn phí</a></p>
      <p>🎬 <a href="https://vungalishop.vercel.app/kho-prompt">Kho 275+ Prompt tạo video AI miễn phí</a></p>
      <p>Chúc bạn học tốt và sớm xây dựng được hệ thống của riêng mình!</p>
    `,
  });
}

module.exports = { sendEbookEmail };
