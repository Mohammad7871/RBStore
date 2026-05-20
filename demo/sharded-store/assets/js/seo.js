// SEO helpers: JSON-LD local business + dynamic meta generation
const jsonLdContainer = document.getElementById("json-ld");
const CITY = document.getElementById("city-select");
const CATEGORY = document.getElementById("category-select");

function updateMeta() {
  const city = CITY.value || "Pakistan";
  const cat = CATEGORY.options[CATEGORY.selectedIndex].text || "Products";
  document.title = `${cat} in ${city} - RB Store`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta)
    meta.setAttribute(
      "content",
      `${cat} procurement and enterprise quotes in ${city} — RB Store`,
    );
  updateJsonLd(city);
}

function updateJsonLd(city) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "RB Store Pakistan",
    telephone: "+92 300 123 4567",
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressCountry: "PK",
    },
    url: window.location.origin + window.location.pathname,
  };
  jsonLdContainer.innerHTML = `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

CITY.addEventListener("change", updateMeta);
CATEGORY.addEventListener("change", updateMeta);
updateMeta();

export { updateMeta };
