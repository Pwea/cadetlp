const { pb: pbClient, escapeHtml, getCreatorLabel, setStatus, updateAuthUi, bindLogout } = window.pbUtils;

function getParamId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function fileValue(record, fieldName) {
  const field = record?.[fieldName];
  if (Array.isArray(field)) {
    return field[0] || "";
  }
  return field || "";
}

function createLink(url, label) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function extensionOf(fileName) {
  const parts = String(fileName || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

async function renderPreview(record, lessonPlanFile) {
  const previewNode = document.getElementById("previewArea");
  if (!previewNode) {
    return;
  }
  previewNode.innerHTML = "";

  if (!lessonPlanFile) {
    previewNode.innerHTML = '<p class="muted">No lesson plan file attached.</p>';
    return;
  }

  const lessonUrl = pbClient.files.getUrl(record, lessonPlanFile);
  const extension = extensionOf(lessonPlanFile);

  if (extension === "pdf") {
    const frame = document.createElement("iframe");
    frame.className = "preview-frame";
    frame.src = lessonUrl;
    frame.title = "Lesson plan PDF preview";
    previewNode.appendChild(frame);
    return;
  }

  if (extension === "txt") {
    try {
      const response = await fetch(lessonUrl);
      if (!response.ok) {
        throw new Error("Unable to fetch text preview.");
      }
      const text = await response.text();
      const pre = document.createElement("pre");
      pre.className = "preview-text";
      pre.textContent = text;
      previewNode.appendChild(pre);
      return;
    } catch (error) {
      previewNode.innerHTML = `<p class="muted">Text preview not available: ${escapeHtml(error.message)}</p>`;
      return;
    }
  }

  previewNode.innerHTML = '<p class="muted">Inline preview is not available for this file type. Use the download links below.</p>';
}

async function loadLesson() {
  const lessonId = getParamId();
  if (!lessonId) {
    setStatus("lessonStatus", "Missing lesson id in URL.", "error");
    return;
  }

  setStatus("lessonStatus", "Loading lesson details...", "success");
  try {
    const record = await pbClient.collection("lessonPlans").getOne(lessonId, {
      expand: "creator",
    });

    document.getElementById("lessonName").textContent = record.name || "Untitled lesson";
    document.getElementById("lessonCode").textContent = record.code || "No code";
    document.getElementById("lessonCreator").textContent = getCreatorLabel(record);

    const lessonPlanFile = fileValue(record, "lessonPlan");
    const slideshowFile = fileValue(record, "slideshow");

    const fileLinksNode = document.getElementById("fileLinks");
    fileLinksNode.innerHTML = "";

    if (lessonPlanFile) {
      const url = pbClient.files.getUrl(record, lessonPlanFile);
      fileLinksNode.appendChild(createLink(url, "Open lesson plan"));
      fileLinksNode.appendChild(createLink(url, "Download lesson plan"));
    }

    if (slideshowFile) {
      const slideUrl = pbClient.files.getUrl(record, slideshowFile);
      fileLinksNode.appendChild(createLink(slideUrl, "Open slideshow"));
      fileLinksNode.appendChild(createLink(slideUrl, "Download slideshow"));
    }

    await renderPreview(record, lessonPlanFile);
    setStatus("lessonStatus", "", "");
  } catch (error) {
    setStatus("lessonStatus", `Could not load lesson: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUi();
  bindLogout();
  loadLesson();
});
