const { createClient } = require("@supabase/supabase-js");

// Dùng service role key — chỉ được gọi từ server (API routes), KHÔNG BAO GIỜ
// lộ ra frontend, vì key này bỏ qua toàn bộ Row Level Security.
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { getSupabaseAdmin };
