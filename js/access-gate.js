(function () {
  var params = new URLSearchParams(window.location.search);
  var code = params.get("code");

  var loadingEl = document.getElementById("gate-loading");
  var errorEl = document.getElementById("gate-error");
  var errorMsgEl = document.getElementById("gate-error-msg");
  var bookShell = document.getElementById("book-shell");
  var controlsBar = document.getElementById("controls-bar");
  var audioBar = document.getElementById("audio-bar");

  function showError(message) {
    loadingEl.style.display = "none";
    errorMsgEl.textContent = message;
    errorEl.style.display = "flex";
  }

  function showBook() {
    loadingEl.style.display = "none";
    bookShell.style.display = "flex";
    controlsBar.style.display = "";
    audioBar.style.display = "";
  }

  if (!code) {
    showError("Thiếu mã đơn hàng trong đường link. Vui lòng dùng đúng link được gửi qua email sau khi thanh toán.");
    return;
  }

  fetch("/api/order-status?code=" + encodeURIComponent(code))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.status === "paid") {
        showBook();
      } else {
        showError("Không tìm thấy đơn hàng đã thanh toán với mã này. Vui lòng kiểm tra lại đường link hoặc liên hệ hỗ trợ.");
      }
    })
    .catch(function () {
      showError("Không kết nối được máy chủ để xác minh đơn hàng. Vui lòng thử lại sau ít phút.");
    });
})();
