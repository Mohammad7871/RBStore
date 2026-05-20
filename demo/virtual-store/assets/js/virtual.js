// Simple helper: debounce
function debounce(fn, wait) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

const CONTAINER = document.getElementById("virtual-list");
const SPACER = document.getElementById("spacer");
const ROOT = document.getElementById("items-root");
const SEARCH = document.getElementById("search");
const CATEGORY = document.getElementById("category-select");
const CURRENT_CAT = document.getElementById("current-category");

let products = [];
let filtered = [];
const ITEM_HEIGHT = 104; // px — fixed height for virtualization
const BUFFER = 6;

// Price masking: find nodes with currency patterns and replace them
function maskPricesInNode(node) {
  const currencyRx = /(PKR|Rs|Rs\.|RS|\u20B9)\s*\d[\d,]*/i;
  if (node.nodeType === Node.TEXT_NODE) {
    if (currencyRx.test(node.textContent)) {
      const span = document.createElement("span");
      span.className = "badge-enterprise price-masked";
      span.textContent = "Enterprise Quote Required";
      node.parentNode.replaceChild(span, node);
    }
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    // if element explicitly marked as price
    if (node.classList && node.classList.contains("price")) {
      node.textContent = "Enterprise Quote Required";
      node.classList.add("badge-enterprise", "price-masked");
      return;
    }
    for (let ch of Array.from(node.childNodes)) maskPricesInNode(ch);
  }
}

function maskAllPrices() {
  maskPricesInNode(document.body);
}

// Render a slice
function renderWindow() {
  const scrollTop = CONTAINER.scrollTop;
  const viewHeight = CONTAINER.clientHeight;
  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const count = Math.min(
    filtered.length - start,
    Math.ceil(viewHeight / ITEM_HEIGHT) + BUFFER * 2,
  );
  const end = Math.max(0, start + count);

  SPACER.style.height = filtered.length * ITEM_HEIGHT + "px";

  ROOT.style.transform = `translateY(${start * ITEM_HEIGHT}px)`;
  const slice = filtered.slice(start, end);
  ROOT.innerHTML = slice.map((p) => productCardHTML(p)).join("");
  // mask any accidental prices inside cards
  maskAllPrices();
}

function productCardHTML(p) {
  return `
    <div class="product-card" style="height:${ITEM_HEIGHT - 8}px">
      <div class="product-thumb"><img src="/public/assets/products/${p.id}.png" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.15"></div>
      <div class="product-meta">
        <div class="product-title">${escapeHtml(p.rb_premium_name)}</div>
        <div class="product-sub">${escapeHtml(p.original_brand)} · ${escapeHtml(p.category)} · ${escapeHtml(p.stock_status)}</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="badge-enterprise">Enterprise Quote Required</div>
        <button class="quote-btn" onclick="openQuote('${p.id}')">Request Quote</button>
      </div>
    </div>`;
}

window.openQuote = function (id) {
  const p = products.find((x) => x.id === id);
  const msg = `Hello, I need an enterprise quote for ${p?.rb_premium_name || id}`;
  const wa =
    (window.RBStoreData &&
      window.RBStoreData.CONTACT_INFO &&
      window.RBStoreData.CONTACT_INFO.whatsapp) ||
    "";
  if (wa) {
    window.open(
      `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  } else alert(msg);
};

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// SEO updater
function updateSEO(categoryLabel) {
  const title = `${categoryLabel} - RB Store Pakistan | Enterprise Procurement`;
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta)
    meta.setAttribute(
      "content",
      `${categoryLabel} procurement & enterprise quotes in Pakistan — RB Store`,
    );
  document.getElementById("current-category").textContent = categoryLabel;
}

// Initialize worker
let worker;
function initWorker() {
  worker = new Worker("workers/search-worker.js");
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === "ready") console.log("Search worker ready");
    if (m.type === "results") {
      filtered = m.results;
      SPACER.style.height = filtered.length * ITEM_HEIGHT + "px";
      CONTAINER.scrollTop = 0;
      renderWindow();
    }
  };
}

async function loadProducts() {
  const res = await fetch("data/products-sample.json");
  products = await res.json();
  filtered = products.slice();
  if (worker) worker.postMessage({ type: "init", products });
  SPACER.style.height = filtered.length * ITEM_HEIGHT + "px";
  renderWindow();
}

// Debounced search that asks worker
const doSearch = debounce((q) => {
  if (!worker) return;
  worker.postMessage({ type: "search", q, limit: 1000 });
}, 220);

SEARCH.addEventListener("input", (e) => {
  const q = e.target.value.trim();
  if (!q) {
    filtered = products.slice();
    renderWindow();
    updateSEO("All");
    return;
  }
  doSearch(q);
});

CATEGORY.addEventListener("change", (e) => {
  const val = e.target.value;
  updateSEO(CATEGORY.options[CATEGORY.selectedIndex].text);
  if (val === "all") {
    filtered = products.slice();
    renderWindow();
    return;
  }
  filtered = products.filter((p) => p.category.toLowerCase().includes(val));
  SPACER.style.height = filtered.length * ITEM_HEIGHT + "px";
  CONTAINER.scrollTop = 0;
  renderWindow();
});

CONTAINER.addEventListener("scroll", debounce(renderWindow, 25));

initWorker();
loadProducts();

// Ensure initial masking for any stray prices
window.addEventListener("load", () => setTimeout(maskAllPrices, 400));
