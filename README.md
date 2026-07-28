# Mật Mã Khởi Nghiệp AI — Website + Backend giao hàng tự động

Đã deploy: https://web-seven-pied-61.vercel.app
Repo: https://github.com/nguyenvanhung1081979/mat-ma-khoi-nghiep-ai

## Kiến trúc

```
Khách hàng nhập email (thanh-toan.html)
        │
        ▼
POST /api/create-order  ──►  Supabase: tạo dòng "orders" (status=pending) + sinh mã QR VietQR
        │
        ▼
Khách chuyển khoản đúng nội dung (mã đơn hàng)
        │
        ▼
SePay phát hiện giao dịch  ──►  POST /api/sepay-webhook
        │
        ├─► Supabase: cập nhật order status = paid
        ├─► Telegram Bot: báo "ting ting" cho bạn
        └─► Resend: gửi email kèm link tải sách (signed URL từ Supabase Storage)
        │
        ▼
Trình duyệt khách (đang poll /api/order-status) tự chuyển sang màn hình "Tải sách ngay"
```

Không dùng Make.com làm bộ điều phối — toàn bộ logic nằm trong 3 Vercel serverless
functions (`api/create-order.js`, `api/order-status.js`, `api/sepay-webhook.js`) để đơn
giản, miễn phí hoàn toàn, và dễ debug qua Vercel Logs.

## Việc BẠN cần tự làm (cần tài khoản cá nhân, tôi không thể làm thay)

### 1. Supabase (database + lưu file ebook)
1. Đăng ký tại https://supabase.com (miễn phí) → **New Project** (chọn region Singapore).
2. Vào **SQL Editor** → dán toàn bộ nội dung file `../supabase/schema.sql` → **Run**.
3. Vào **Storage** → **New bucket** → đặt tên `ebooks`, để **Private** (không public).
4. Upload file `book.epub` (từ `../build/book.epub` sau khi bạn build xong bản đầy đủ) vào bucket đó.
5. Vào **Project Settings → API** → lấy `Project URL` và `service_role` key (giữ bí mật tuyệt đối).

### 2. SePay (nhận diện chuyển khoản tự động)
1. Đăng ký tại https://sepay.vn, liên kết tài khoản ngân hàng thật (cần OTP ngân hàng).
2. Vào phần **Webhooks** → tạo webhook mới, URL trỏ tới:
   `https://<domain-của-bạn>/api/sepay-webhook`
3. Chọn phương thức xác thực **API Key** → tự đặt một chuỗi bí mật bất kỳ → đây là `SEPAY_API_KEY`.
4. Ghi lại mã BIN ngân hàng + số tài khoản (tra cứu chính xác tại https://api.vietqr.io/v2/banks
   nếu không chắc, một vài mã phổ biến: Vietcombank `970436`, MB Bank `970422`,
   Techcombank `970407`, ACB `970416`, BIDV `970418`).

### 3. Telegram Bot (báo "ting ting" khi có đơn)
1. Mở Telegram, chat với **@BotFather** → gõ `/newbot` → đặt tên và username (phải kết thúc `bot`).
2. BotFather trả về **Bot Token** dạng `123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxx` → đây là `TELEGRAM_BOT_TOKEN`.
3. Gửi bất kỳ tin nhắn nào cho bot vừa tạo, sau đó mở trình duyệt vào:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Tìm số trong `"chat":{"id": ...}` — đó là `TELEGRAM_CHAT_ID` của bạn.

### 4. Resend (gửi email giao sách)
1. Đăng ký tại https://resend.com (free, 3.000 email/tháng).
2. Vào **API Keys** → tạo key mới → đây là `RESEND_API_KEY`.
3. Dùng tạm `RESEND_FROM=onboarding@resend.dev` để test; sau này xác minh domain riêng nếu muốn gửi từ email của bạn.

## Khai báo biến môi trường trên Vercel

Sau khi có đủ thông tin ở trên, xem mẫu đầy đủ trong `.env.example`, rồi thêm từng biến:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add EBOOK_PRICE_VND production
vercel env add BANK_BIN production
vercel env add BANK_ACCOUNT_NO production
vercel env add BANK_ACCOUNT_NAME production
vercel env add SEPAY_API_KEY production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add TELEGRAM_CHAT_ID production
vercel env add RESEND_API_KEY production
```

Sau khi thêm xong, deploy lại để áp dụng biến môi trường mới:

```bash
vercel --prod
```

## Kiểm tra hệ thống hoạt động thật

1. Vào `/thanh-toan.html`, nhập email test, lấy mã QR.
2. Chuyển khoản **số tiền nhỏ thật** (đúng bằng `EBOOK_PRICE_VND`) với đúng nội dung mã đơn hàng hiển thị.
3. Trong vòng vài giây: Telegram phải báo, email phải tới, trang web phải tự chuyển sang "Tải sách ngay".
4. Nếu không thấy gì xảy ra: xem log tại Vercel Dashboard → Project → **Logs**, và kiểm tra trong SePay Dashboard xem webhook đã được gọi và trả về `200`/`{"success":true}` chưa.

## Test logic không cần tài khoản thật

Toàn bộ logic nghiệp vụ (tạo đơn, parse mã đơn hàng từ nội dung chuyển khoản, khớp số tiền,
chống xử lý trùng giao dịch, cập nhật trạng thái) đã được kiểm tra bằng bộ test giả lập
Supabase trong bộ nhớ — 21/21 test pass. Việc còn lại chỉ là nối các tài khoản thật ở trên.
