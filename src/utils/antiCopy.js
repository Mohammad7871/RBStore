// Anti-copy layer (client-side) — simple deterrent only. Easily bypassed.
// Use opt-in by calling `RBProtect.enable()`; admins can disable via `RBProtect.disable()`.
(function () {
  let enabled = false;
  function prevent(e) {
    e.preventDefault();
  }
  function blockSelection() {
    document.addEventListener("selectstart", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
  }
  function allowSelection() {
    document.removeEventListener("selectstart", prevent);
    document.removeEventListener("copy", prevent);
    document.removeEventListener("contextmenu", prevent);
  }
  function enable() {
    if (enabled) return;
    enabled = true;
    blockSelection();
    document.documentElement.classList.add("no-copy");
  }
  function disable() {
    if (!enabled) return;
    enabled = false;
    allowSelection();
    document.documentElement.classList.remove("no-copy");
  }
  // small CSS to reduce selection visibility
  const style = document.createElement("style");
  style.innerHTML =
    ".no-copy * { -webkit-user-select:none; user-select:none; } .no-copy img { pointer-events:none; }";
  document.head.appendChild(style);
  window.RBProtect = { enable, disable };
  // Do NOT enable by default; leave as opt-in via admin console
})();
