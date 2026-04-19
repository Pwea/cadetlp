(() => {
  async function fetchPartial(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load ${path} (${response.status})`);
    }
    return response.text();
  }

  async function injectLayout() {
    const headerMount = document.getElementById("siteHeader");
    const footerMount = document.getElementById("siteFooter");

    if (!headerMount && !footerMount) {
      return;
    }

    try {
      const [navHtml, footerHtml] = await Promise.all([
        fetchPartial("assets/html/nav.html"),
        fetchPartial("assets/html/footer.html"),
      ]);

      if (headerMount) {
        headerMount.innerHTML = navHtml;
      }
      if (footerMount) {
        footerMount.innerHTML = footerHtml;
      }
    } catch (error) {
      console.error("Could not inject shared layout:", error);
    }
  }

  window.layoutReady = injectLayout();
})();
