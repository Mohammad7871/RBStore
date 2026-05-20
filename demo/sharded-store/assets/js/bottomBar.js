const bottomSearch = document.getElementById("bottom-search");
const bottomWa = document.getElementById("bottom-wa");

bottomSearch.addEventListener("click", () => {
  document.getElementById("search").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

bottomWa.addEventListener("click", () => {
  const contact =
    (window.RBStoreData &&
      window.RBStoreData.CONTACT_INFO &&
      window.RBStoreData.CONTACT_INFO.whatsapp) ||
    "";
  const item =
    window.lastSelected && window.lastSelected.rb_premium_name
      ? window.lastSelected.rb_premium_name
      : "your catalog items";
  const site = window.location.hostname || "RB Store";
  const msg = `Asalam-o-alaikum, I am inquiring from ${site} regarding ${item}. Please provide today's market rate.`;
  if (contact) {
    window.open(
      `https://wa.me/${contact.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  } else alert(msg);
});
