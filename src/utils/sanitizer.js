// Simple global brand sanitizer
(function (global) {
  const competitorTokens = ["competitora", "competitorb", "somebrand"];
  const tokenRegex = new RegExp(
    "\\b(" + competitorTokens.map((t) => escapeRegExp(t)).join("|") + ")\\b",
    "gi",
  );
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function sanitizeTitle(title) {
    if (!title) return title;
    return title.replace(tokenRegex, "RB Premium");
  }
  global.RBSanitizer = { sanitizeTitle };
})(window);
