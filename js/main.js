// The GHL booking widget (iframe + resize script) is only built and
// loaded when a visitor clicks a booking button, so no third-party
// script runs (or sets cookies) before they choose to book.
var GHL_BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/27P6d1yTArwfaSCHipBM";

var ghlScriptLoading = null;
var bookingModal = null;
var lastFocusedElement = null;

function loadGhlEmbedScript() {
  if (ghlScriptLoading) { return ghlScriptLoading; }
  ghlScriptLoading = new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = "https://link.msgsndr.com/js/form_embed.js";
    script.onload = resolve;
    script.onerror = function (err) { ghlScriptLoading = null; reject(err); };
    document.head.appendChild(script);
  });
  return ghlScriptLoading;
}

function buildBookingModal() {
  var overlay = document.createElement("div");
  overlay.className = "booking-modal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Book a call");

  var dialog = document.createElement("div");
  dialog.className = "booking-modal__dialog";

  var closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "booking-modal__close";
  closeButton.setAttribute("aria-label", "Close booking dialog");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", closeBookingModal);

  var frameWrap = document.createElement("div");
  frameWrap.className = "booking-modal__frame-wrap";

  var iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "payment");
  iframe.setAttribute("scrolling", "no");
  iframe.id = "27P6d1yTArwfaSCHipBM_" + Date.now();

  frameWrap.appendChild(iframe);
  dialog.appendChild(closeButton);
  dialog.appendChild(frameWrap);
  overlay.appendChild(dialog);

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) { closeBookingModal(); }
  });

  document.body.appendChild(overlay);
  return { overlay: overlay, iframe: iframe, closeButton: closeButton };
}

function openBookingModal(event) {
  if (event) { event.preventDefault(); }
  lastFocusedElement = document.activeElement;

  if (!bookingModal) { bookingModal = buildBookingModal(); }
  if (!bookingModal.iframe.src) { bookingModal.iframe.src = GHL_BOOKING_URL; }

  loadGhlEmbedScript().catch(function () {});

  document.body.classList.add("has-modal-open");
  bookingModal.overlay.classList.add("is-open");
  bookingModal.closeButton.focus();
  document.addEventListener("keydown", onBookingModalKeydown);
}

function closeBookingModal() {
  if (!bookingModal) { return; }
  bookingModal.overlay.classList.remove("is-open");
  document.body.classList.remove("has-modal-open");
  document.removeEventListener("keydown", onBookingModalKeydown);
  if (lastFocusedElement) { lastFocusedElement.focus(); }
}

function onBookingModalKeydown(event) {
  if (event.key === "Escape") { closeBookingModal(); }
}

document.querySelectorAll(".js-book").forEach(function (button) {
  button.setAttribute("href", GHL_BOOKING_URL);
  button.addEventListener("click", openBookingModal);
});
