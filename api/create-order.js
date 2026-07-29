const { getSupabaseAdmin } = require("./_lib/supabase");
const { generateOrderCode } = require("./_lib/order-code");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Email không hợp lệ" });
      return;
    }

    const amount = parseInt(process.env.EBOOK_PRICE_VND || "99000", 10);
    const supabase = getSupabaseAdmin();

    // Thử tối đa 5 lần phòng khi trùng mã (xác suất rất thấp với 6 ký tự từ bảng 32 ký tự)
    let order = null;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const orderCode = generateOrderCode();
      const { data, error } = await supabase
        .from("orders")
        .insert({ order_code: orderCode, email, amount, status: "pending" })
        .select()
        .single();
      if (!error) order = data;
      else if (error.code !== "23505") throw error; // 23505 = unique_violation, thử lại
    }

    if (!order) {
      res.status(500).json({ error: "Không tạo được đơn hàng, vui lòng thử lại" });
      return;
    }

    const bankBin = process.env.BANK_BIN;
    const accountNo = process.env.BANK_ACCOUNT_NO;
    const accountName = process.env.BANK_ACCOUNT_NAME || "";

    let qrUrl = null;
    if (bankBin && accountNo) {
      const params = new URLSearchParams({
        amount: String(amount),
        addInfo: order.order_code,
        accountName,
      });
      qrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?${params.toString()}`;
    }

    res.status(200).json({
      orderCode: order.order_code,
      amount,
      qrUrl,
      transferContent: order.order_code,
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ error: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};
