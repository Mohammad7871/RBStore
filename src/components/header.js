// Luxury Industrial Header: injects mega-menu entries into #main-nav
(function () {
  function createMegaMenu(title, sections) {
    const li = document.createElement("li");
    li.className = "relative group";
    const btn = document.createElement("button");
    btn.className =
      "nav-item font-semibold flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-light-gray/60 transition-colors";
    btn.type = "button";
    btn.innerHTML = `<span>${title}</span> <i class="fas fa-chevron-down text-xs"></i>`;
    btn.setAttribute("aria-expanded", "false");

    const mega = document.createElement("div");
    mega.className =
      "mega-menu hidden group-hover:block absolute left-0 top-full mt-3 bg-card-bg border border-border-gray rounded-xl shadow-lg w-[900px] p-6 z-40";
    mega.setAttribute("role", "menu");
    // Build sections grid
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-3 gap-6";
    sections.forEach((sec) => {
      const s = document.createElement("div");
      s.className = "mega-section";
      s.innerHTML = `
        <h4 class="text-sm font-bold mb-2 text-text-dark">${sec.title}</h4>
        <ul class="space-y-2 text-sm text-text-light">
          ${sec.items.map((i) => `<li class="hover:text-primary"><a href="${i.href || "#"}">${i.label}</a></li>`).join("")}
        </ul>
      `;
      grid.appendChild(s);
    });
    mega.appendChild(grid);

    li.appendChild(btn);
    li.appendChild(mega);

    // Accessibility: toggle aria on mouseenter/focus
    li.addEventListener("mouseenter", () =>
      btn.setAttribute("aria-expanded", "true"),
    );
    li.addEventListener("mouseleave", () =>
      btn.setAttribute("aria-expanded", "false"),
    );
    btn.addEventListener("focus", () =>
      btn.setAttribute("aria-expanded", "true"),
    );
    btn.addEventListener("blur", () =>
      btn.setAttribute("aria-expanded", "false"),
    );

    return li;
  }

  function init() {
    const nav = document.getElementById("main-nav");
    if (!nav) return;
    // Hospital Wing
    const hospitalSections = [
      {
        title: "Critical Care",
        items: [
          { label: "Hospital Beds", href: "#" },
          { label: "ICU Equipment", href: "#" },
          { label: "Patient Monitors", href: "#" },
        ],
      },
      {
        title: "Surgical",
        items: [
          { label: "Surgical Lights", href: "#" },
          { label: "Operating Tables", href: "#" },
          { label: "Sterilization", href: "#" },
        ],
      },
      {
        title: "Support",
        items: [
          { label: "Linen & Laundry", href: "#" },
          { label: "Cleaning", href: "#" },
          { label: "Carts & Trolleys", href: "#" },
        ],
      },
    ];
    const hotelSections = [
      {
        title: "Rooms",
        items: [
          { label: "Linen Sets", href: "#" },
          { label: "Mattresses", href: "#" },
          { label: "Bedroom Furniture", href: "#" },
        ],
      },
      {
        title: "Food & Beverage",
        items: [
          { label: "Kitchen Appliances", href: "#" },
          { label: "Cookware", href: "#" },
          { label: "Serviceware", href: "#" },
        ],
      },
      {
        title: "Facilities",
        items: [
          { label: "Housekeeping", href: "#" },
          { label: "Lobby Supplies", href: "#" },
          { label: "Gym & Spa", href: "#" },
        ],
      },
    ];

    const hosp = createMegaMenu("Hospital Wing", hospitalSections);
    const hot = createMegaMenu("Hotel Wing", hotelSections);
    nav.insertBefore(hosp, nav.firstChild);
    nav.insertBefore(hot, nav.children[1]);
  }

  // Init on DOM ready
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  window.RBHeader = { init };
})();
