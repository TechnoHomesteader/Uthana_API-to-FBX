const els = {
  apiKey: document.getElementById("apiKey"),
  loadCharactersBtn: document.getElementById("loadCharactersBtn"),
  characterStatus: document.getElementById("characterStatus"),
  characterSelect: document.getElementById("characterSelect"),
  prompt: document.getElementById("prompt"),
  generateBtn: document.getElementById("generateBtn"),
  generateStatus: document.getElementById("generateStatus"),
  motionId: document.getElementById("motionId"),
  previewLink: document.getElementById("previewLink"),
  downloadBtn: document.getElementById("downloadBtn"),
  revealBtn: document.getElementById("revealBtn"),
  savedPath: document.getElementById("savedPath"),
  accountInfo: document.getElementById("accountInfo"),
  statusFeed: document.getElementById("statusFeed")
};

const state = {
  apiKey: "",
  characters: [],
  characterId: "",
  motionId: "",
  previewUrl: "",
  savedPath: "",
  revealSupported: false
};

function timestamp() {
  return new Date().toLocaleTimeString();
}

function pushStatus(message, type = "info") {
  const item = document.createElement("li");
  item.className = `status-${type}`;
  item.textContent = `[${timestamp()}] ${message}`;
  els.statusFeed.prepend(item);
  while (els.statusFeed.childElementCount > 25) {
    els.statusFeed.removeChild(els.statusFeed.lastChild);
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_error) {
    body = {};
  }

  if (!response.ok) {
    const message = body?.error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (body?.error?.message) {
    throw new Error(body.error.message);
  }

  return body;
}

function syncButtons() {
  const canGenerate =
    state.apiKey.trim() !== "" && state.characterId.trim() !== "" && els.prompt.value.trim().length > 5;
  els.generateBtn.disabled = !canGenerate;

  const canDownload = state.apiKey.trim() !== "" && state.characterId.trim() !== "" && state.motionId !== "";
  els.downloadBtn.disabled = !canDownload;

  els.revealBtn.disabled = !(state.savedPath && state.revealSupported);
}

function renderCharacterSelect(characters) {
  els.characterSelect.innerHTML = "";
  if (characters.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No characters found";
    els.characterSelect.append(option);
    els.characterSelect.disabled = true;
    return;
  }

  for (const character of characters) {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = `${character.name} (${character.id})`;
    els.characterSelect.append(option);
  }

  els.characterSelect.disabled = false;
  state.characterId = characters[0].id;
  els.characterSelect.value = state.characterId;
}

function resetResult() {
  state.motionId = "";
  state.previewUrl = "";
  state.savedPath = "";
  state.revealSupported = false;
  els.motionId.textContent = "-";
  els.previewLink.href = "#";
  els.previewLink.textContent = "Not available yet";
  els.savedPath.textContent = "-";
  syncButtons();
}

async function loadAccountInfo() {
  try {
    const body = await postJson("/api/account", { apiKey: state.apiKey });
    if (!body.available) {
      els.accountInfo.textContent = body.message || "Account information unavailable.";
      pushStatus("Account info unavailable; continuing without it.", "warn");
      return;
    }

    const org = body.account?.organization || {};
    const generated = org.generated_seconds;
    const max = org.max_seconds;
    const remaining = org.remaining_seconds;
    const generatedText = generated === null || generated === undefined ? "n/a" : String(generated);
    const maxText = max === null || max === undefined ? "n/a" : String(max);
    const remainingText = remaining === null || remaining === undefined ? "n/a" : String(remaining);
    els.accountInfo.textContent = `Org: ${org.name || "n/a"} | Generated: ${generatedText}s | Max: ${maxText}s | Remaining: ${remainingText}s`;
    pushStatus("Account usage loaded.", "ok");
  } catch (error) {
    els.accountInfo.textContent = error.message;
    pushStatus(`Failed to load account usage: ${error.message}`, "warn");
  }
}

async function handleLoadCharacters() {
  state.apiKey = els.apiKey.value.trim();
  if (!state.apiKey) {
    pushStatus("Enter API key first.", "error");
    return;
  }

  resetResult();
  els.characterStatus.textContent = "Loading character list...";
  pushStatus("Fetching characters from Uthana...", "info");

  try {
    const body = await postJson("/api/characters", { apiKey: state.apiKey });
    state.characters = body.characters || [];
    renderCharacterSelect(state.characters);
    els.characterStatus.textContent = `${state.characters.length} character(s) loaded.`;
    pushStatus(`Loaded ${state.characters.length} character(s).`, "ok");
    await loadAccountInfo();
  } catch (error) {
    state.characters = [];
    state.characterId = "";
    renderCharacterSelect([]);
    els.characterStatus.textContent = "Failed to load characters.";
    pushStatus(`Character load failed: ${error.message}`, "error");
  }

  syncButtons();
}

async function handleGenerate() {
  state.apiKey = els.apiKey.value.trim();
  state.characterId = els.characterSelect.value;
  const prompt = els.prompt.value.trim();

  if (!state.apiKey || !state.characterId || prompt.length <= 5) {
    pushStatus("Need API key, character, and prompt longer than 5 chars.", "error");
    return;
  }

  state.motionId = "";
  state.previewUrl = "";
  state.savedPath = "";
  state.revealSupported = false;
  els.generateStatus.textContent = "Generating motion...";
  els.savedPath.textContent = "-";
  els.revealBtn.disabled = true;

  pushStatus("Submitting text-to-motion request...", "info");

  try {
    const body = await postJson("/api/generate", {
      apiKey: state.apiKey,
      characterId: state.characterId,
      prompt
    });

    state.motionId = body.motion.id;
    state.previewUrl = body.previewUrl;
    els.motionId.textContent = state.motionId;
    els.previewLink.href = state.previewUrl;
    els.previewLink.textContent = state.previewUrl;
    els.generateStatus.textContent = "Generation complete.";
    pushStatus(`Motion generated: ${state.motionId}`, "ok");
    pushStatus("Preview is ready. Download when you are satisfied.", "info");
  } catch (error) {
    els.generateStatus.textContent = "Generation failed.";
    pushStatus(`Generate failed: ${error.message}`, "error");
  }

  syncButtons();
}

async function handleDownload() {
  state.apiKey = els.apiKey.value.trim();
  state.characterId = els.characterSelect.value;
  if (!state.apiKey || !state.characterId || !state.motionId) {
    pushStatus("Generate a motion first.", "error");
    return;
  }

  pushStatus("Downloading FBX...", "info");

  try {
    const body = await postJson("/api/download", {
      apiKey: state.apiKey,
      characterId: state.characterId,
      motionId: state.motionId
    });

    state.savedPath = body.savedPath;
    state.revealSupported = Boolean(body.revealSupported);
    els.savedPath.textContent = `${body.savedPath} (${body.sizeBytes} bytes)`;
    pushStatus(`Saved FBX: ${body.fileName}`, "ok");
  } catch (error) {
    pushStatus(`Download failed: ${error.message}`, "error");
  }

  syncButtons();
}

async function handleReveal() {
  if (!state.savedPath) {
    pushStatus("No downloaded file to reveal.", "warn");
    return;
  }

  try {
    const body = await postJson("/api/reveal", { savedPath: state.savedPath });
    if (body.ok) {
      pushStatus("Revealed file in Finder.", "ok");
      return;
    }
    pushStatus(body.message || "Reveal not supported in this environment.", "warn");
  } catch (error) {
    pushStatus(`Reveal failed: ${error.message}`, "error");
  }
}

els.apiKey.addEventListener("input", () => {
  state.apiKey = els.apiKey.value.trim();
  syncButtons();
});

els.characterSelect.addEventListener("change", () => {
  state.characterId = els.characterSelect.value;
  syncButtons();
});

els.prompt.addEventListener("input", () => {
  syncButtons();
});

els.loadCharactersBtn.addEventListener("click", handleLoadCharacters);
els.generateBtn.addEventListener("click", handleGenerate);
els.downloadBtn.addEventListener("click", handleDownload);
els.revealBtn.addEventListener("click", handleReveal);

pushStatus("Web UI ready. Enter API key to begin.", "info");
syncButtons();
