// Calendly is loaded only when a visitor clicks a booking button,
// so no third-party script runs (or sets cookies) before they choose to book.
var CALENDLY_URL = "REPLACE_CALENDLY_URL";

var calendlyLoading = null;

function loadCalendly() {
  if (calendlyLoading) { return calendlyLoading; }
  calendlyLoading = new Promise(function (resolve, reject) {
    if (window.Calendly) { resolve(); return; }
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);
    var script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.onload = resolve;
    script.onerror = function (err) { calendlyLoading = null; reject(err); };
    document.head.appendChild(script);
  });
  return calendlyLoading;
}

// Until the real link is set, buttons keep their default #final-cta behaviour.
if (CALENDLY_URL.indexOf("REPLACE_") !== 0) {
  document.querySelectorAll(".js-book").forEach(function (button) {
    button.setAttribute("href", CALENDLY_URL);
    button.addEventListener("click", function (event) {
      event.preventDefault();
      loadCalendly()
        .then(function () { window.Calendly.initPopupWidget({ url: CALENDLY_URL }); })
        .catch(function () { window.location.href = CALENDLY_URL; });
    });
  });
}
