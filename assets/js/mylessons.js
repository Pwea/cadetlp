const {
  pb: pbClient,
  escapeHtml,
  getCreatorLabel,
  setStatus,
  updateAuthUi,
  bindLogout,
  guardAuth,
  currentUser,
} = window.pbUtils;

let searchTimer = null;

function lessonCardTemplate(record) {
  const creator = escapeHtml(getCreatorLabel(record));
  const code = escapeHtml(record.code || "No code");
  const name = escapeHtml(record.name || "Untitled lesson");

  return `
    <article class="card" data-lesson-id="${escapeHtml(record.id)}">
      <h3>${name}</h3>
      <p><strong>Code:</strong> ${code}</p>
      <p><strong>Creator:</strong> ${creator}</p>
      <div class="actions">
        <a class="nav-link" href="lesson.html?id=${encodeURIComponent(record.id)}">View lesson plan</a>
        <button class="danger" type="button" data-action="delete" data-lesson-id="${escapeHtml(record.id)}">Delete</button>
      </div>
    </article>
  `;
}

function escapedFilterValue(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function loadMyLessonPlans(searchTerm = "") {
  const listNode = document.getElementById("lessonList");
  if (!listNode) {
    return;
  }

  const user = currentUser();
  if (!user?.id) {
    setStatus("listStatus", "Could not determine signed-in user.", "error");
    return;
  }

  setStatus("listStatus", "Loading your lesson plans...", "success");
  listNode.innerHTML = "";

  const safeSearch = String(searchTerm || "").trim();
  const creatorId = escapedFilterValue(user.id);
  const searchFilter = safeSearch
    ? ` && (name ~ '${escapedFilterValue(safeSearch)}' || code ~ '${escapedFilterValue(safeSearch)}')`
    : "";
  const filter = `creator = '${creatorId}'${searchFilter}`;

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
        setStatus("listStatus", "You have not created any lesson plans yet.", "success");
        listNode.innerHTML = '<p class="muted">Create your first lesson plan from the create page.</p>';
      }
      return;
    }

    setStatus("listStatus", "", "");
    listNode.innerHTML = result.items.map(lessonCardTemplate).join("");
  } catch (error) {
    setStatus("listStatus", `Could not load your lesson plans: ${error.message}`, "error");
  }
}

async function handleDeleteClick(event) {
  const deleteButton = event.target.closest("button[data-action='delete']");
  if (!deleteButton) {
    return;
  }

  const lessonId = deleteButton.dataset.lessonId;
  if (!lessonId) {
    return;
  }

  const confirmed = window.confirm("Delete this lesson plan permanently?");
  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  setStatus("listStatus", "Deleting lesson plan...", "success");

  try {
    await pbClient.collection("lessonPlans").delete(lessonId);
    setStatus("listStatus", "Lesson deleted.", "success");
    const searchInput = document.getElementById("lessonSearch");
    await loadMyLessonPlans(searchInput ? searchInput.value : "");
  } catch (error) {
    deleteButton.disabled = false;
    setStatus("listStatus", `Could not delete lesson: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.layoutReady;
  if (!guardAuth("auth.html")) {
    return;
  }

  updateAuthUi();
  bindLogout();

  const listNode = document.getElementById("lessonList");
  if (listNode) {
    listNode.addEventListener("click", handleDeleteClick);
  }

  const searchInput = document.getElementById("lessonSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadMyLessonPlans(searchInput.value);
      }, 250);
    });
  }

  loadMyLessonPlans();
});
