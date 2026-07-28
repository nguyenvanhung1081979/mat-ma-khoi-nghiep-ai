// Form đăng ký email — hiện chưa nối backend lưu trữ.
// TODO: Khi dựng xong Supabase (Bước 3 trong lộ trình), thay đoạn dưới bằng
// một fetch() POST tới bảng "leads" trong Supabase, hoặc trỏ action của form
// sang endpoint Formspree/Make.com webhook.
(function () {
  var form = document.getElementById("capture-form");
  var msg = document.getElementById("form-msg");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!email) return;

    // Chưa có backend lưu email thật — tạm lưu local để không mất dữ liệu test.
    try {
      var saved = JSON.parse(localStorage.getItem("mkna_leads") || "[]");
      saved.push({ email: email, at: new Date().toISOString() });
      localStorage.setItem("mkna_leads", JSON.stringify(saved));
    } catch (err) {}

    msg.textContent = "Cảm ơn bạn! Email đã được ghi nhận, chúng tôi sẽ báo khi sách ra mắt.";
    form.reset();
  });
})();
