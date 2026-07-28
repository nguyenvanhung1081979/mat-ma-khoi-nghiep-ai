// Mã đơn hàng ngắn, khách ghi vào nội dung chuyển khoản.
// Bỏ các ký tự dễ nhầm (0/O, 1/I) để khách gõ đúng khi chuyển khoản qua QR/thủ công.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateOrderCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return "MMK" + code;
}

module.exports = { generateOrderCode };
