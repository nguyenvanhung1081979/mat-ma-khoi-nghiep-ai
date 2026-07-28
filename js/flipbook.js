(function () {
  var stage = document.getElementById("stage");
  var pages = Array.prototype.slice.call(stage.querySelectorAll(".page"));
  var indicator = document.getElementById("page-indicator");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");

  var current = 0;
  var animating = false;
  var DURATION = 600;

  function updateControls() {
    indicator.textContent = (current + 1) + " / " + pages.length;
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === pages.length - 1;
  }

  function resetPageStyle(el) {
    el.style.transform = "";
    el.style.opacity = "";
    el.style.zIndex = "";
  }

  function goNext() {
    if (animating || current >= pages.length - 1) return;
    animating = true;

    var curEl = pages[current];
    var nextEl = pages[current + 1];

    nextEl.classList.remove("hidden");
    nextEl.style.zIndex = "3";
    nextEl.style.transform = "rotateY(90deg)";
    nextEl.style.opacity = "0";
    curEl.style.zIndex = "2";

    // force reflow so the initial transform is applied before animating
    void nextEl.offsetHeight;

    requestAnimationFrame(function () {
      curEl.style.transform = "rotateY(-90deg)";
      curEl.style.opacity = "0";
      nextEl.style.transform = "rotateY(0deg)";
      nextEl.style.opacity = "1";
    });

    setTimeout(function () {
      curEl.classList.add("hidden");
      resetPageStyle(curEl);
      resetPageStyle(nextEl);
      current += 1;
      animating = false;
      updateControls();
    }, DURATION);
  }

  function goPrev() {
    if (animating || current <= 0) return;
    animating = true;

    var curEl = pages[current];
    var prevEl = pages[current - 1];

    prevEl.classList.remove("hidden");
    prevEl.style.zIndex = "3";
    prevEl.style.transform = "rotateY(-90deg)";
    prevEl.style.opacity = "0";
    curEl.style.zIndex = "2";

    void prevEl.offsetHeight;

    requestAnimationFrame(function () {
      curEl.style.transform = "rotateY(90deg)";
      curEl.style.opacity = "0";
      prevEl.style.transform = "rotateY(0deg)";
      prevEl.style.opacity = "1";
    });

    setTimeout(function () {
      curEl.classList.add("hidden");
      resetPageStyle(curEl);
      resetPageStyle(prevEl);
      current -= 1;
      animating = false;
      updateControls();
    }, DURATION);
  }

  btnNext.addEventListener("click", goNext);
  btnPrev.addEventListener("click", goPrev);

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });

  // Swipe support (touch)
  var touchStartX = null;
  stage.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
    touchStartX = null;
  });

  updateControls();
})();
