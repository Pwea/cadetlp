const {
  pb: pbClient,
  currentUser,
  guardAuth,
  setStatus,
  updateAuthUi,
  bindLogout,
} = window.pbUtils;

const LESSON_ALLOWED = ["docx", "pdf", "txt"];
const SLIDES_ALLOWED = ["pptx", "ppt", "pdf"];

function extensionOf(fileName) {
  const parts = String(fileName || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function isAllowed(file, whitelist) {
  return whitelist.includes(extensionOf(file.name));
}

async function handleCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;

  const code = form.code.value.trim();
  const name = form.name.value.trim();
  const lessonFile = form.lessonPlan.files[0];
  const slideshowFile = form.slideshow.files[0] || null;

  if (!code || !name || !lessonFile) {
    setStatus("createStatus", "Code, lesson name, and lesson file are required.", "error");
    return;
  }

  if (!isAllowed(lessonFile, LESSON_ALLOWED)) {
    setStatus("createStatus", "Lesson file must be .docx, .pdf, or .txt.", "error");
    return;
  }

  if (slideshowFile && !isAllowed(slideshowFile, SLIDES_ALLOWED)) {
    setStatus("createStatus", "Slideshow must be .pptx, .ppt, or .pdf.", "error");
    return;
  }

  const user = currentUser();
  const creator = user?.id || "Unknown";

  const payload = {
    code,
    name,
    creator,
    lessonPlan: lessonFile,
  };
  if (slideshowFile) {
    payload.slideshow = slideshowFile;
  }

  setStatus("createStatus", "Creating lesson plan...", "success");
  try {
    const created = await pbClient.collection("lessonPlans").create(payload);
    setStatus("createStatus", "Lesson plan created successfully.", "success");
    window.location.href = `lesson.html?id=${encodeURIComponent(created.id)}`;
  } catch (error) {
    setStatus("createStatus", `Failed to create lesson plan: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!guardAuth()) {
    return;
  }

  updateAuthUi();
  bindLogout();

  const form = document.getElementById("createLessonForm");
  if (form) {
    form.addEventListener("submit", handleCreate);
  }
});
