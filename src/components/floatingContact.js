// Mobile one-hand floating bottom contact menu
(function () {
  function init() {
    const wrapper = document.createElement("div");
    wrapper.id = "rb-floating-contact";
    wrapper.className = "rb-floating-contact";
    wrapper.innerHTML = `
      <div class="fc-inner">
        <a href="https://wa.me/923001234567" target="_blank" rel="noopener" class="fc-btn fc-whatsapp" aria-label="WhatsApp">
          <i class="fab fa-whatsapp"></i>
          <span>WhatsApp</span>
        </a>
        <a href="mailto:info@rbstore.com.pk" class="fc-btn fc-email" aria-label="Email">
          <i class="fas fa-envelope"></i>
          <span>Email</span>
        </a>
        <button class="fc-btn fc-quote" id="fc-quick-quote" aria-label="Quick Quote">
          <i class="fas fa-file-invoice"></i>
          <span>Quote</span>
        </button>
      </div>
    `;
    document.body.appendChild(wrapper);
    document.getElementById("fc-quick-quote").addEventListener("click", () => {
      document.getElementById("quote-overlay").classList.add("opacity-100");
      document.getElementById("quote-overlay").style.pointerEvents = "auto";
      const modal = document.getElementById("quote-modal");
      modal.classList.remove("opacity-0");
      modal.style.pointerEvents = "auto";
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  window.RBFloatingContact = { init };
})();
