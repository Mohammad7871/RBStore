// Voice search helper: inserts a mic button and wires Web Speech API to the global search input
(function () {
  function init() {
    const wrapper = document.getElementById("search-wrapper");
    if (!wrapper) return;
    if (document.getElementById("voice-search-btn")) return;
    const btn = document.createElement("button");
    btn.id = "voice-search-btn";
    btn.type = "button";
    btn.title = "Voice search";
    btn.className =
      "voice-btn absolute right-10 top-1/2 -translate-y-1/2 text-text-light hover:text-primary p-2";
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    wrapper.appendChild(btn);

    const input = document.getElementById("global-search");
    if (!input) return;

    let recognition = null;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btn.style.display = "none";
      return;
    }

    btn.addEventListener("click", () => {
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.addEventListener("result", (ev) => {
          const text = ev.results[0][0].transcript;
          input.value = text;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        });
        recognition.addEventListener("error", () => {});
      }
      try {
        recognition.start();
      } catch (e) {}
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  window.RBVoiceSearch = { init };
})();
