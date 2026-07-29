(function () {
  var stepEmail = document.getElementById("step-email");
  var stepPay = document.getElementById("step-pay");
  var stepDone = document.getElementById("step-done");
  var form = document.getElementById("order-form");
  var msg = document.getElementById("order-msg");

  var pollTimer = null;

  function formatVND(amount) {
    return amount.toLocaleString("vi-VN") + "đ";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = document.getElementById("order-email").value.trim();
    if (!email) return;

    msg.textContent = "Đang tạo đơn hàng...";
    try {
      var res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      var data = await res.json();

      if (!res.ok) {
        msg.textContent = data.error || "Có lỗi xảy ra, vui lòng thử lại.";
        return;
      }

      msg.textContent = "";
      document.getElementById("qr-image").src = data.qrUrl || "";
      document.getElementById("qr-amount").textContent = formatVND(data.amount);
      document.getElementById("qr-content").textContent = data.transferContent;

      stepEmail.hidden = true;
      stepPay.hidden = false;

      startPolling(data.orderCode);
    } catch (err) {
      msg.textContent = "Không kết nối được máy chủ, vui lòng thử lại.";
    }
  });

  function startPolling(orderCode) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async function () {
      try {
        var res = await fetch("/api/order-status?code=" + encodeURIComponent(orderCode));
        var data = await res.json();
        if (data.status === "paid") {
          clearInterval(pollTimer);
          stepPay.hidden = true;
          stepDone.hidden = false;
          if (data.downloadUrlPdf) {
            document.getElementById("download-link-pdf").href = data.downloadUrlPdf;
          }
          if (data.downloadUrlEpub) {
            document.getElementById("download-link-epub").href = data.downloadUrlEpub;
          }
        }
      } catch (err) {
        // im lặng bỏ qua, sẽ thử lại ở lần poll tiếp theo
      }
    }, 3000);
  }
})();
