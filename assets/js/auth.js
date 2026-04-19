const { pb: pbClient, setStatus, updateAuthUi, bindLogout } = window.pbUtils;

function gotoNextPage() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.endsWith(".html")) {
    window.location.href = next;
    return;
  }
  window.location.href = "index.html";
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const identity = form.identity.value.trim();
  const password = form.password.value;

  if (!identity || !password) {
    setStatus("authStatus", "Email/username and password are required.", "error");
    return;
  }

  try {
    await pbClient.collection("users").authWithPassword(identity, password);
    setStatus("authStatus", "Login successful. Redirecting...", "success");
    gotoNextPage();
  } catch (error) {
    setStatus("authStatus", `Login failed: ${error.message}`, "error");
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const passwordConfirm = form.passwordConfirm.value;

  if (!email || !password || !passwordConfirm) {
    setStatus("authStatus", "Email, password and confirmation are required for signup.", "error");
    return;
  }

  if (password !== passwordConfirm) {
    setStatus("authStatus", "Passwords do not match.", "error");
    return;
  }

  try {
    await pbClient.collection("users").create({
      name,
      email,
      password,
      passwordConfirm,
    });

    await pbClient.collection("users").authWithPassword(email, password);
    setStatus("authStatus", "Signup successful. Redirecting...", "success");
    gotoNextPage();
  } catch (error) {
    setStatus("authStatus", `Signup failed: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUi();
  bindLogout();

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
});
