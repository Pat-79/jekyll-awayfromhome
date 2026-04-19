(function () {
  var body = document.body;
  var hero = document.querySelector(".post-hero");
  var target = document.querySelector(".post-body");
  var touchStartY = null;
  var isSnapping = false;

  if (!hero || !target) {
    return;
  }

  function headerOffset() {
    var header = document.querySelector(".site-header");
    return header ? header.offsetHeight : 0;
  }

  function isNearTop() {
    return (window.scrollY || 0) < 24 && !body.classList.contains("menu-open");
  }

  function snapToContent() {
    if (isSnapping) {
      return;
    }

    isSnapping = true;

    var targetY = target.getBoundingClientRect().top + (window.scrollY || 0) - headerOffset() - 6;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth"
    });

    window.setTimeout(function () {
      isSnapping = false;
    }, 900);
  }

  window.addEventListener("wheel", function (event) {
    if (!isNearTop() || event.deltaY <= 8) {
      return;
    }

    event.preventDefault();
    snapToContent();
  }, { passive: false });

  window.addEventListener("touchstart", function (event) {
    if (!event.touches || event.touches.length === 0) {
      return;
    }

    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", function (event) {
    if (!isNearTop() || touchStartY === null || !event.touches || event.touches.length === 0) {
      return;
    }

    var deltaY = touchStartY - event.touches[0].clientY;

    if (deltaY <= 18) {
      return;
    }

    event.preventDefault();
    touchStartY = null;
    snapToContent();
  }, { passive: false });

  window.addEventListener("keydown", function (event) {
    if (document.body.classList.contains("menu-open")) {
      return;
    }

    var activeElement = document.activeElement;
    var activeTag = activeElement ? activeElement.tagName : "";
    var isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT" || (activeElement && activeElement.isContentEditable);
    var shouldSnap =
      event.key === "ArrowDown" ||
      event.key === "Down" ||
      event.key === "PageDown" ||
      event.key === " " ||
      event.key === "Spacebar";

    if (!isNearTop() || isTyping || !shouldSnap) {
      return;
    }

    event.preventDefault();
    snapToContent();
  });
}());
