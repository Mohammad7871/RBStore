// Market Quote component: replaces price elements with an enterprise CTA
(function (global) {
  function openInquiryModalFor(productCard) {
    // Simple modal stub - in production open app modal and prefill product snapshot
    const name =
      productCard?.querySelector(".product-title")?.innerText || "Product";
    alert("Open enterprise inquiry for: " + name);
  }

  function createMarketQuoteButton(productCard) {
    const btn = document.createElement("button");
    btn.className = "market-quote-btn tooltip";
    btn.type = "button";
    btn.innerText = "Get Real-Time Market Quote";
    btn.setAttribute("aria-label", "Get Real-Time Market Quote");
    const tip = document.createElement("span");
    tip.className = "tip";
    tip.innerText =
      "Price updated daily due to market volatility. Click to message.";
    btn.appendChild(tip);
    btn.addEventListener("click", () =>
      openInquiryModalFor(productCard || btn.closest(".product-card")),
    );
    return btn;
  }

  function replacePrices(selector = ".price, .product-price") {
    document.querySelectorAll(selector).forEach((el) => {
      const productCard = el.closest(".product-card");
      const btn = createMarketQuoteButton(productCard);
      el.replaceWith(btn);
    });
  }

  global.RBMarketQuote = { replacePrices, createMarketQuoteButton };
})(window);
