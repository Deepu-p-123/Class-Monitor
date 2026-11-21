const AI_DOMAINS = [
  "chatgpt.com", "chat.openai.com", "openai.com", "sora.com",
  "gemini.google.com", "aistudio.google.com", "notebooklm.google.com", "bard.google.com",
  "claude.ai", "copilot.microsoft.com",
  "perplexity.ai", "you.com", "phind.com", "pi.ai", "meta.ai",
  "grok.com", "x.ai", "deepseek.com", "chat.deepseek.com",
  "chat.mistral.ai", "chat.qwen.ai", "kimi.com", "doubao.com",
  "character.ai", "poe.com", "janitorai.com",
  "lmarena.ai", "openrouter.ai", "t3.chat", "monica.im",
  "jasper.ai", "writesonic.com", "copy.ai", "gamma.app",
  "gauthmath.com", "photomath.com", "brainly.com", "chegg.com",
  "mathway.com", "studyx.ai", "questionai.com",
  "undetectable.ai", "stealthgpt.ai", "hix.ai",
  "midjourney.com", "leonardo.ai", "ideogram.ai"
];
function isAI(url) {
  try {
    const host = new URL(url).hostname;
    return AI_DOMAINS.some(d => host === d || host.endsWith("." + d));
  } catch { return false; }
}

async function setBlocking(on) {
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    on ? { enableRulesetIds: ["ai_block"] }
       : { disableRulesetIds: ["ai_block"] }
  );
  await chrome.storage.local.set({ blockingOn: on });

  chrome.action.setBadgeText({ text: on ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: on ? "#c0392b" : "#7f8c8d" });
  chrome.action.setTitle({ title: on ? "AI blocking: ON (click to turn off)"
                                     : "AI blocking: OFF (click to turn on)" });

  // Close already-open AI tabs when turning blocking on
  if (on) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && isAI(tab.url)) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("blocked.html") });
      }
    }
  }
}

// Restore the saved state (defaults to ON)
async function init() {
  const { blockingOn = true } = await chrome.storage.local.get("blockingOn");
  await setBlocking(blockingOn);
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

// Click the toolbar icon to toggle
// ---------- Password handling ----------
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const fromHex = h => new Uint8Array(h.match(/.{2}/g).map(x => parseInt(x, 16)));

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: 100000, hash: "SHA-256" },
    key, 256);
  return toHex(bits);
}

async function handleMessage(msg) {
  const { blockingOn = true, pwHash, pwSalt } =
    await chrome.storage.local.get(["blockingOn", "pwHash", "pwSalt"]);

  if (msg.type === "getState") {
    return { blockingOn, passwordSet: !!pwHash };
  }

  if (msg.type === "setPassword") {
    if (pwHash) return { ok: false, error: "Password already set." };
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await hashPassword(msg.password, salt);
    await chrome.storage.local.set({ pwHash: hash, pwSalt: salt });
    return { ok: true };
  }

  if (msg.type === "toggle") {
    if (!blockingOn) {            // turning ON never needs a password
      await setBlocking(true);
      return { ok: true };
    }
    if (!pwHash) return { ok: false, error: "Set a password first." };
    const attempt = await hashPassword(msg.password || "", pwSalt);
    if (attempt !== pwHash) return { ok: false, error: "Wrong password." };
    await setBlocking(false);
    return { ok: true };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse);
  return true; // keep the channel open for the async reply
});


async function blockIfAI(tabId, url) {
  if (!url || !isAI(url)) return;
  const { blockingOn = true } = await chrome.storage.local.get("blockingOn");
  if (!blockingOn) return;
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL("blocked.html") });
}

// Page loads, redirects, and in-site (single-page app) navigation
chrome.webNavigation.onBeforeNavigate.addListener(d => {
  if (d.frameId === 0) blockIfAI(d.tabId, d.url);
});
chrome.webNavigation.onCommitted.addListener(d => {
  if (d.frameId === 0) blockIfAI(d.tabId, d.url);
});
chrome.webNavigation.onHistoryStateUpdated.addListener(d => {
  if (d.frameId === 0) blockIfAI(d.tabId, d.url);
});

// Tab-level fallback
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  blockIfAI(tabId, changeInfo.url || tab.url);
});
chrome.tabs.onCreated.addListener(tab => blockIfAI(tab.id, tab.pendingUrl || tab.url));