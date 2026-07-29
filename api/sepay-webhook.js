const { getSupabaseAdmin } = require("./_lib/supabase");
const { notifyTelegram } = require("./_lib/telegram");
const { sendEbookEmail } = require("./_lib/email");

// Định dạng payload & xác thực theo tài liệu SePay (docs.sepay.vn > Tích hợp Webhooks).
// Xác thực dùng phương thức "API Key": cấu hình trong SePay Dashboard header
//   Authorization: Apikey <SEPAY_API_KEY>
// SePay yêu cầu phản hồi HTTP 200/201 kèm body {"success": true} trong vòng 30 giây,
// nên các bước phụ (Telegram, email) không được để một lỗi nhỏ làm webhook trả lỗi.

function extractOrderCode(text) {
  if (!text) return null;
  const match = text.toUpperCase().replace(/[^A-Z0-9]/g, "").match(/MMK[A-Z0-9]{6}/);
  return match ? match[0] : null;
}

const handler = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const expectedKey = process.env.SEPAY_API_KEY;
  if (expectedKey) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Apikey ${expectedKey}`) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
  }

  const payload = req.body || {};
  const {
    id,
    content,
    description,
    transferAmount,
    transferType,
    referenceCode,
  } = payload;

  // Chỉ xử lý giao dịch tiền VÀO; bỏ qua giao dịch ra (transferType === "ra").
  if (transferType && transferType !== "in") {
    res.status(200).json({ success: true });
    return;
  }

  const orderCode = extractOrderCode(content) || extractOrderCode(description);
  const transactionId = String(id || referenceCode || "");

  try {
    const supabase = getSupabaseAdmin();

    if (!orderCode) {
      await notifyTelegram(
        `⚠️ Nhận được tiền vào nhưng KHÔNG tìm thấy mã đơn hàng trong nội dung.\n` +
        `Số tiền: ${transferAmount}đ\nNội dung: ${content || description}\n` +
        `Cần kiểm tra thủ công.`
      );
      res.status(200).json({ success: true });
      return;
    }

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .single();

    if (findError || !order) {
      await notifyTelegram(
        `⚠️ Nhận được tiền với mã đơn hàng "${orderCode}" nhưng không khớp đơn nào trong hệ thống.\n` +
        `Số tiền: ${transferAmount}đ. Cần kiểm tra thủ công.`
      );
      res.status(200).json({ success: true });
      return;
    }

    if (order.status === "paid") {
      // Đã xử lý trước đó (SePay có thể gọi lại webhook) — không gửi lại email/telegram.
      res.status(200).json({ success: true });
      return;
    }

    if (transferAmount < order.amount) {
      await notifyTelegram(
        `⚠️ Đơn hàng ${orderCode} nhận thiếu tiền: cần ${order.amount}đ, nhận được ${transferAmount}đ.\n` +
        `Cần kiểm tra thủ công với khách (email: ${order.email}).`
      );
      res.status(200).json({ success: true });
      return;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_amount: transferAmount,
        paid_at: new Date().toISOString(),
        sepay_transaction_id: transactionId || null,
      })
      .eq("id", order.id)
      .eq("status", "pending"); // tránh xử lý trùng nếu 2 webhook đến gần như cùng lúc

    if (updateError) throw updateError;

    const bucket = process.env.EBOOK_STORAGE_BUCKET || "ebooks";
    const epubPath = process.env.EBOOK_FILE_PATH || "book.epub";
    const pdfPath = process.env.EBOOK_FILE_PATH_PDF || "book.pdf";
    const EXPIRY = 60 * 60 * 24;
    const [epubResult, pdfResult] = await Promise.all([
      supabase.storage.from(bucket).createSignedUrl(epubPath, EXPIRY),
      supabase.storage.from(bucket).createSignedUrl(pdfPath, EXPIRY),
    ]);

    const siteUrl = process.env.SITE_URL || "https://web-seven-pied-61.vercel.app";
    const readUrl = `${siteUrl}/doc-sach.html?code=${encodeURIComponent(orderCode)}`;

    await Promise.allSettled([
      notifyTelegram(
        `💰 <b>Đơn hàng mới đã thanh toán!</b>\nMã: ${orderCode}\nEmail: ${order.email}\nSố tiền: ${transferAmount}đ`
      ),
      epubResult.data || pdfResult.data
        ? sendEbookEmail({
            to: order.email,
            orderCode,
            readUrl,
            downloadUrlEpub: epubResult.data ? epubResult.data.signedUrl : null,
            downloadUrlPdf: pdfResult.data ? pdfResult.data.signedUrl : null,
          })
        : Promise.resolve(),
    ]);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("sepay-webhook error:", err);
    // Vẫn trả 200 để SePay không retry liên tục gây trùng lặp; lỗi đã được log để xử lý thủ công.
    await notifyTelegram(`🚨 Lỗi xử lý webhook SePay cho mã ${orderCode || "?"}: ${err.message}`).catch(() => {});
    res.status(200).json({ success: true });
  }
};

module.exports = handler;
module.exports.extractOrderCode = extractOrderCode; // exported riêng để viết test cho logic parse nội dung
