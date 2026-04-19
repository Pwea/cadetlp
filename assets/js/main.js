const { pb: pbClient, escapeHtml, getCreatorLabel, setStatus, updateAuthUi, bindLogout } = window.pbUtils;

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

async function loadLessonPlans() {
  const listNode = document.getElementById("lessonList");
  if (!listNode) {
    return;
  }

  setStatus("listStatus", "Loading lesson plans...", "success");
  listNode.innerHTML = "";

  try {
    const result = await pbClient.collection("lessonPlans").getList(1, 100, {
      sort: "-created",
      expand: "creator",
    });

    if (!result.items.length) {
      setStatus("listStatus", "No lesson plans found yet.", "success");
      listNode.innerHTML = '<p class="muted">Create the first lesson plan from the create page.</p>';
      return;
    }

    setStatus("listStatus", "", "");
    listNode.innerHTML = result.items.map(lessonCardTemplate).join("");
  } catch (error) {
    setStatus("listStatus", `Could not load lesson plans: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUi();
  bindLogout();
  loadLessonPlans();
});
