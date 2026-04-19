const { pb: pbClient, escapeHtml, getCreatorLabel, setStatus, updateAuthUi, bindLogout } = window.pbUtils;

let searchTimer = null;

function lessonCardTemplate(record) {
  const creator = escapeHtml(getCreatorLabel(record));
  const code = escapeHtml(record.code || "No code");
  const name = escapeHtml(record.name || "Untitled lesson");

  return `
    <article class="card">
      <h3>${name}</h3>
      <p><strong>Code:</strong> ${code}</p>
      <p><strong>Creator:</strong> ${creator}</p>
      <div class="actions">
        <a class="nav-link" href="lesson.html?id=${encodeURIComponent(record.id)}">View lesson plan</a>
      </div>
    </article>
  `;
}

async function loadLessonPlans(searchTerm = "") {
  const listNode = document.getElementById("lessonList");
  if (!listNode) {
    return;
  }

  setStatus("listStatus", "Loading lesson plans...", "success");
  listNode.innerHTML = "";

  const safeSearch = String(searchTerm || "").trim();
  const escapedSearch = safeSearch.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  const filter = escapedSearch ? `name ~ '${escapedSearch}' || code ~ '${escapedSearch}'` : "";

  try {
    const result = await pbClient.collection("lessonPlans").getList(1, 100, {
      sort: "-created",
      expand: "creator",
      filter,
    });

    if (!result.items.length) {
      if (safeSearch) {
        setStatus("listStatus", "No lesson plans matched your search.", "success");
        listNode.innerHTML = '<p class="muted">Try a different lesson name or code.</p>';
      } else {
        setStatus("listStatus", "No lesson plans found yet.", "success");
        listNode.innerHTML = '<p class="muted">Create the first lesson plan from the create page.</p>';
      }
      return;
    }

    setStatus("listStatus", "", "");
    listNode.innerHTML = result.items.map(lessonCardTemplate).join("");
  } catch (error) {
    setStatus("listStatus", `Could not load lesson plans: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.layoutReady;
  updateAuthUi();
  bindLogout();
  const searchInput = document.getElementById("lessonSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadLessonPlans(searchInput.value);
      }, 250);
    });
  }
  loadLessonPlans();
});
