const $ = id => document.getElementById(id);
let state = {};

async function refresh() {
  state = await chrome.runtime.sendMessage({ type: "getState" });
  $("status").textContent = state.blockingOn ? "ON" : "OFF";

  if (!state.passwordSet) {
    $("pw").placeholder = "Create a teacher password";
    $("action").textContent = "Save password";
  } else if (state.blockingOn) {
    $("pw").placeholder = "Teacher password";
    $("action").textContent = "Turn OFF";
  } else {
    $("pw").style.display = "none";
    $("action").textContent = "Turn ON";
  }
  if (state.passwordSet && state.blockingOn) $("pw").style.display = "";
}

$("action").addEventListener("click", async () => {
  const password = $("pw").value;
  let res;
  if (!state.passwordSet) {
    if (password.length < 6) { $("msg").textContent = "Use at least 6 characters."; return; }
    res = await chrome.runtime.sendMessage({ type: "setPassword", password });
  } else {
    res = await chrome.runtime.sendMessage({ type: "toggle", password });
  }
  $("msg").textContent = res.ok ? "" : res.error;
  $("pw").value = "";
  if (res.ok) await refresh();
});

refresh();