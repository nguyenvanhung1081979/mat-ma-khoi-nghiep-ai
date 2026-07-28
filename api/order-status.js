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
    const filePath = process.env.EBOOK_FILE_PATH || "book.epub";
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 giờ

    if (signError) {
      console.error("createSignedUrl error:", signError);
      res.status(200).json({ status: "paid", downloadUrl: null });
      return;
    }

    res.status(200).json({ status: "paid", downloadUrl: signed.signedUrl });
  } catch (err) {
    console.error("order-status error:", err);
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
};
