const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const orderCode = String(req.query.code || "").toUpperCase();
  if (!orderCode) {
    res.status(400).json({ error: "Thiếu mã đơn hàng" });
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("order_code, status, email")
      .eq("order_code", orderCode)
      .single();

    if (error || !order) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng" });
      return;
    }

    if (order.status !== "paid") {
      res.status(200).json({ status: order.status });
      return;
    }

    const bucket = process.env.EBOOK_STORAGE_BUCKET || "ebooks";
    const epubPath = process.env.EBOOK_FILE_PATH || "book.epub";
    const pdfPath = process.env.EBOOK_FILE_PATH_PDF || "book.pdf";
    const EXPIRY = 60 * 60 * 24; // 24 giờ

    const [epubResult, pdfResult] = await Promise.all([
      supabase.storage.from(bucket).createSignedUrl(epubPath, EXPIRY),
      supabase.storage.from(bucket).createSignedUrl(pdfPath, EXPIRY),
    ]);

    if (epubResult.error) console.error("createSignedUrl (epub) error:", epubResult.error);
    if (pdfResult.error) console.error("createSignedUrl (pdf) error:", pdfResult.error);

    res.status(200).json({
      status: "paid",
      downloadUrl: epubResult.data ? epubResult.data.signedUrl : null,
      downloadUrlEpub: epubResult.data ? epubResult.data.signedUrl : null,
      downloadUrlPdf: pdfResult.data ? pdfResult.data.signedUrl : null,
    });
  } catch (err) {
    console.error("order-status error:", err);
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
};
