(() => {
  const POCKETBASE_URL = "https://cadetlp.duckdns.org";

  const pb = new PocketBase(POCKETBASE_URL);
  window.pb = pb;

  function currentUser() {
    return pb.authStore.model;
  }

  function isLoggedIn() {
    return pb.authStore.isValid;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getCreatorLabel(record) {
    if (record?.expand?.creator?.name) {
      return record.expand.creator.name;
    }
    if (record?.expand?.creator?.email) {
      return record.expand.creator.email;
    }
    if (typeof record?.creator === "string" && record.creator.trim()) {
      return record.creator;
    }
    return "Unknown";
  }

  function setStatus(targetId, message, type) {
    const node = document.getElementById(targetId);
    if (!node) {
      return;
    }
    if (!message) {
      node.textContent = "";
      node.className = "";
      return;
    }
    node.textContent = message;
    node.className = `status ${type}`;
  }

  function setHiddenById(nodeId, hidden) {
    const node = document.getElementById(nodeId);
    if (node) {
      node.hidden = hidden;
    }
  }

  function updateAuthUi() {
    const userNode = document.getElementById("authState");
    const logoutBtn = document.getElementById("logoutBtn");
    const loggedIn = isLoggedIn();

    setHiddenById("loginSignupLink", loggedIn);
    setHiddenById("footerLoginSignupLink", loggedIn);
    setHiddenById("myLessonsLink", !loggedIn);
    setHiddenById("footerMyLessonsLink", !loggedIn);

    if (logoutBtn) {
      logoutBtn.hidden = !loggedIn;
    }

    if (!userNode) {
      return;
    }

    if (loggedIn) {
      const user = currentUser();
      userNode.textContent = `Signed in as ${user?.name || user?.email || "user"}`;
      userNode.classList.add("auth-state", "auth-state--signed-in");
      userNode.classList.remove("auth-state--signed-out");
    } else {
      userNode.textContent = "Not signed in";
      userNode.classList.add("auth-state", "auth-state--signed-out");
      userNode.classList.remove("auth-state--signed-in");
    }
  }

  function bindLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) {
      return;
    }
    logoutBtn.addEventListener("click", () => {
      pb.authStore.clear();
      window.location.href = "auth.html";
    });
  }

  function guardAuth(redirectTo = "auth.html") {
    if (!isLoggedIn()) {
      const next = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
      window.location.href = `${redirectTo}?next=${next}`;
      return false;
    }
    return true;
  }

  window.pbUtils = {
    pb,
    currentUser,
    isLoggedIn,
    escapeHtml,
    getCreatorLabel,
    setStatus,
    updateAuthUi,
    bindLogout,
    guardAuth,
  };
})();
