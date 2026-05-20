// Adaptive Catalog Card component (no price). Use createProductCard(product)
(function (global) {
  function createProductCard(product) {
    const card = document.createElement("article");
    card.className =
      "product-card p-4 rounded-lg border border-border-gray hover-lift";
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <div class="flex gap-4 items-start">
        <div class="w-28 h-20 bg-light-gray img-fallback overflow-hidden rounded-md flex-shrink-0">
          <img src="${product.image || "/public/assets/brands/placeholder.jpg"}" alt="${product.title || ""}" onload="this.classList.add('loaded')"/>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-md font-bold text-secondary product-title">${product.title || "Untitled"}</h3>
          <p class="text-sm text-text-light mt-1">${product.brand || ""} • ${product.id || ""}</p>
          <ul class="mt-3 text-sm text-text-light space-y-1">
            <li><strong>Material:</strong> ${product.material || "N/A"}</li>
            <li><strong>Grade:</strong> ${product.grade || "Commercial"}</li>
            <li><strong>Durability:</strong> ${product.durability || "High"}</li>
          </ul>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-2">
          <div class="flex flex-col items-end gap-2">
            <button class="request-details-btn px-4 py-2 rounded-full bg-primary text-white font-semibold">Request Details</button>
            <button class="add-bulk-btn px-4 py-2 rounded-full bg-white border border-border-gray text-sm">Add to Bulk</button>
            <button class="wa-btn px-3 py-2 rounded-full bg-green-500 text-white text-sm">WhatsApp</button>
          </div>
        </div>
      </div>
      <div class="mt-3 text-xs text-text-light scarcity-note">Daily Batch Limit: High Demand in Lahore/Karachi.</div>
    `;
    const btn = card.querySelector(".request-details-btn");
    btn.addEventListener("click", () => {
      if (window.openProductQuote) window.openProductQuote(product);
      else openQuoteFor(product);
    });
    const addBtn = card.querySelector(".add-bulk-btn");
    addBtn?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      try {
        window.BulkRequest && window.BulkRequest.addItem(product);
      } catch (e) {}
    });
    const waBtn = card.querySelector(".wa-btn");
    waBtn?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      try {
        const num =
          window.RBStoreData &&
          window.RBStoreData.CONTACT_INFO &&
          window.RBStoreData.CONTACT_INFO.whatsapp
            ? window.RBStoreData.CONTACT_INFO.whatsapp.replace(/\D/g, "")
            : "923001234567";
        const msg = encodeURIComponent(
          `Hello, I am interested in ${product.title || product.id} for our facility. Please share bulk pricing and lead time.`,
        );
        const href = `https://wa.me/${num}?text=${msg}`;
        window.open(href, "_blank");
      } catch (e) {
        if (window.showToast)
          window.showToast("Unable to open WhatsApp", "error");
      }
    });
    function openQuoteFor(p) {
      document.getElementById("quote-product-id").value = p.id || "";
      // open modal
      const overlay = document.getElementById("quote-overlay");
      const modal = document.getElementById("quote-modal");
      overlay.classList.add("opacity-100");
      overlay.style.pointerEvents = "auto";
      modal.classList.remove("opacity-0", "pointer-events-none");
      modal.style.pointerEvents = "auto";
      // prefills
      document.getElementById("quote-product-id").value = p.id || "";
      const title =
        modal.querySelector(".text-2xl") || modal.querySelector("h2");
    }
    return card;
  }

  global.RBProductCard = { createProductCard };
})(window);
