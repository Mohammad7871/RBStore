// Minimal virtual scrolling helper
window.RBVirtualScroll = (function () {
  function init(containerId, total, itemHeight, fetchItemData) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error("container not found: " + containerId);
    container.style.position = "relative";
    const spacer = document.createElement("div");
    spacer.style.height = total * itemHeight + "px";
    container.innerHTML = "";
    container.appendChild(spacer);

    let lastStart = -1;
    const perPage = 20;
    const buffer = 10;

    async function render() {
      const scrollTop = container.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      if (start === lastStart) return;
      lastStart = start;
      const fragment = document.createDocumentFragment();
      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.top = start * itemHeight + "px";
      for (let i = start; i < Math.min(start + perPage + buffer, total); i++) {
        const el = document.createElement("div");
        el.className = "vs-item";
        el.style.height = itemHeight + "px";
        el.dataset.index = i;
        el.innerText = "Loading...";
        fragment.appendChild(el);
      }
      wrapper.appendChild(fragment);
      // Remove previous dynamic children (keep spacer)
      while (container.children.length > 1)
        container.removeChild(container.lastChild);
      container.appendChild(wrapper);
      // fetch data for visible items
      const nodes = wrapper.querySelectorAll(".vs-item");
      const indices = Array.from(nodes).map((n) =>
        parseInt(n.dataset.index, 10),
      );
      const data = await fetchItemData(indices);
      nodes.forEach((n, idx) => {
        const item = data[idx];
        if (item)
          n.innerHTML =
            '<div class="product-title">' +
            (item.title || "Item #" + indices[idx]) +
            "</div>";
      });
    }

    container.addEventListener("scroll", () => {
      requestAnimationFrame(render);
    });
    // initial render
    render();
    return { container, refresh: render };
  }
  return { init };
})();
