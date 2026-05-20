// Inject trust certification badges into footer with glow effect
(function () {
  const badges = [
    {
      id: "psqca",
      label: "PSQCA Certified",
      img: "/public/assets/brands/psqca.png",
    },
    {
      id: "iso-med",
      label: "ISO Medical",
      img: "/public/assets/brands/iso-med.png",
    },
    {
      id: "fbr-verified",
      label: "FBR Verified",
      img: "/public/assets/brands/fbr.png",
    },
    {
      id: "authorized",
      label: "Authorized Distributor",
      img: "/public/assets/brands/authorized.png",
    },
  ];

  function render() {
    const container = document.createElement("div");
    container.className = "rb-trust-badges flex items-center gap-4 mt-6";
    badges.forEach((b) => {
      const el = document.createElement("div");
      el.className = "rb-trust-badge flex items-center gap-3 p-2 rounded-lg";
      el.innerHTML = `<img src="${b.img}" alt="${b.label}" class="rb-trust-img" width="56" height="34"/><div class="text-sm font-semibold">${b.label}</div>`;
      container.appendChild(el);
    });
    const footer = document.querySelector("footer .container");
    if (footer) footer.appendChild(container);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", render);
  else render();
  window.RBTrustBadges = { render };
})();
