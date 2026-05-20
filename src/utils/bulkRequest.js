// Bulk Request manager: maintains a list of items for bulk procurement and handles submission
(function () {
  const items = [];

  function getContactNumber() {
    try {
      const ci = window.RBStoreData && window.RBStoreData.CONTACT_INFO;
      if (ci && ci.whatsapp) return ci.whatsapp.replace(/\D/g, "");
    } catch (e) {}
    return "923001234567"; // fallback
  }

  function addItem(p) {
    if (!p || !p.id) return;
    if (!items.find((i) => i.id === p.id)) {
      items.push({ id: p.id, title: p.title || p.id, qty: 1 });
      if (window.showToast)
        window.showToast("Added to Bulk Request", "success");
    } else {
      if (window.showToast) window.showToast("Already in Bulk Request", "info");
    }
    updateCompareBarCount();
  }

  function removeItem(id) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) items.splice(idx, 1);
    updateCompareBarCount();
  }

  function clear() {
    items.length = 0;
    updateCompareBarCount();
  }

  function list() {
    return items.slice();
  }

  function updateCompareBarCount() {
    const el = document.getElementById("compare-count");
    if (el) el.textContent = items.length;
  }

  function openBulkModal() {
    // populate the quote modal item list area
    const body = document.getElementById("quote-modal-body");
    const form = document.getElementById("quote-form");
    const success = document.getElementById("quote-success");
    if (!form || !body) return;
    // ensure items list exists at top of form
    let listEl = document.getElementById("quote-items-list");
    if (!listEl) {
      listEl = document.createElement("div");
      listEl.id = "quote-items-list";
      listEl.className = "mb-3";
      form.insertBefore(listEl, form.firstChild);
    }
    listEl.innerHTML = items
      .map(
        (it) => `
      <div class="flex items-center justify-between p-2 bg-white border border-border-gray rounded mb-1">
        <div class="text-sm font-medium">${it.title}</div>
        <div class="text-xs text-text-light">Qty: <input type="number" value="${it.qty}" min="1" data-id="${it.id}" class="quote-item-qty w-16 px-2 py-1 border border-border-gray rounded text-sm"/></div>
      </div>
    `,
      )
      .join("");

    // show modal
    document.getElementById("quote-overlay").classList.add("opacity-100");
    document.getElementById("quote-overlay").style.pointerEvents = "auto";
    const modal = document.getElementById("quote-modal");
    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.style.pointerEvents = "auto";
  }

  async function submitForm(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    const name = document.getElementById("quote-name")?.value || "";
    const company = document.getElementById("quote-company")?.value || "";
    const phone = document.getElementById("quote-phone")?.value || "";
    const city = document.getElementById("quote-city")?.value || "";
    const sector = document.getElementById("quote-sector")?.value || "";
    const message = document.getElementById("quote-message")?.value || "";

    // sync quantities from inputs
    document.querySelectorAll(".quote-item-qty").forEach((inp) => {
      const id = inp.dataset.id;
      const val = parseInt(inp.value) || 1;
      const m = items.find((x) => x.id === id);
      if (m) m.qty = val;
    });

    const payload = {
      name,
      company,
      phone,
      city,
      sector,
      message,
      items: list(),
    };

    // Try POST to /api/quote (if backend available). Otherwise fallback to WhatsApp or mailto.
    try {
      const resp = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        showSuccess();
        clear();
        return;
      }
    } catch (e) {
      // ignore
    }

    // fallback: open WhatsApp with prefilled message
    const waNum = getContactNumber();
    const waMsg = encodeURIComponent(
      `Hello, I am ${name} from ${company || "my company"} (${sector || city || ""}). We are interested in bulk procurement of: ${items.map((i) => i.title + ` x${i.qty}`).join(", ")}. ${message}`,
    );
    const waHref = `https://wa.me/${waNum}?text=${waMsg}`;
    window.open(waHref, "_blank");
    showSuccess();
    clear();
  }

  function showSuccess() {
    const form = document.getElementById("quote-form");
    const success = document.getElementById("quote-success");
    if (form) form.classList.add("hidden");
    if (success) {
      success.classList.remove("hidden");
      document.getElementById("quote-success-icon")?.classList.add("scale-100");
    }
  }

  // attach form handler
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("quote-form");
    if (form) form.addEventListener("submit", submitForm);
    // wire Done button to close
    document.getElementById("quote-done-btn")?.addEventListener("click", () => {
      document.getElementById("close-quote-modal")?.click();
      const form = document.getElementById("quote-form");
      if (form) form.classList.remove("hidden");
      const success = document.getElementById("quote-success");
      if (success) success.classList.add("hidden");
    });

    // wire clear cart in compare bar to clear bulk too
    document.getElementById("cart-clear-btn")?.addEventListener("click", () => {
      clear();
    });
  });

  window.BulkRequest = { addItem, removeItem, list, openBulkModal, clear };
})();
