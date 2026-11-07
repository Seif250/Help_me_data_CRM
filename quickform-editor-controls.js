(() => {
  "use strict";

  const OPTIONS_KEY = "qfeFlexibleFieldOptions";
  const VALUE_KEY = "qfeFlexibleFieldValue";
  const FLEX4_VALUE_KEY = "qfeFlexibleField4Value";
  const DEFAULT_FLEX4_VALUE = "CC";
  const DELAY_MULTIPLIER_KEY = "qfeDelayMultiplier";
  const ORDER_KEY = "flexiScriptOrder";
  const DEFAULTS = ["BEG 10% List", "ANR", "LED", "REG 10%", "BEG T1 RES"];

  const SPEED_PRESETS = [
    { label: "1x", multiplier: 1.0, desc: "Normal speed (1x)" },
    { label: "Fast", multiplier: 0.7, desc: "Fast speed (0.7x)" },
    { label: "Slow", multiplier: 1.5, desc: "Safe / slow speed (1.5x)" }
  ];

  // Script definitions strictly matching the design system
  const DEFAULT_DEFINITIONS = [
    {
      key: "no-answer",
      name: "No Answer",
      desc: "Log and update fields",
      defaultId: "c07fa334-c6a6-417a-ba2b-9c0a55208836",
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`
    },
    {
      key: "follow-up",
      name: "Follow Up",
      desc: "Log and update fields",
      defaultId: "5312e5af-9da9-4344-81a1-0ab1e4114afd",
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#126747"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`
    },
    {
      key: "will-call-us-back",
      name: "Will Call us back",
      desc: "Log and update fields",
      defaultId: "6915604c-386b-4175-b45f-39f456fe1a7d",
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#126747"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/><path d="M15 3h6v6l-2.5-2.5-4.5 4.5-1.5-1.5 4.5-4.5L15 3z" /></svg>`
    },
    {
      key: "not-interested",
      name: "Not Interested",
      desc: "Log not interested, set Closed Lost",
      defaultId: "b8d4e5a1-8b45-4c2c-9a91-6b5e2c3f7a10",
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
    },
    {
      key: "crm-autofill",
      name: "CRM autofill",
      desc: "Fill CRM fields automatically",
      defaultId: "a6a9f57b-6127-42b8-8f94-51ad41e2e695",
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V12C3 13.66 7.03 15 12 15C16.97 15 21 13.66 21 12V5"></path><path d="M3 12V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V12"></path></svg>`
    },
    {
      key: "sent-link",
      name: "Sent Link",
      desc: "Send link, update fields and log call",
      defaultId: "b7b0f68c-7238-43c9-90a5-62be52f3f7a6",
      isHighlighted: true,
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#126747"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
    },
    {
      key: "won",
      name: "Won",
      desc: "Set Closed Won & Flexible Field 4 (CC/CS)",
      defaultId: "d4c8e9f0-1234-4a5b-9c8d-7e6f5a4b3c21",
      isHighlighted: true,
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`
    },
    {
      key: "fl-payment",
      name: "FL Payment",
      desc: "Process payment & update fields",
      defaultId: "f1a00000-pay1-4000-8000-000000000001",
      isHighlighted: true,
      type: "resource",
      iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`
    }
  ];

  let toastTimeout = null;
  function showToast(message, isError = false) {
    const toast = document.getElementById("flexi-toast");
    if (!toast) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#c53030" : "#17231D";
    toast.classList.add("visible");
    toastTimeout = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2200);
  }

  // 1. Initialize Flexible Field 3 Value (with inline Add / Delete option support)
  async function initFlexibleField() {
    const select = document.getElementById("qfe-flex-value");
    const addBtn = document.getElementById("qfe-flex-add");
    const delBtn = document.getElementById("qfe-flex-del");
    const inlineAddBox = document.getElementById("qfe-flex-inline-add");
    const newInput = document.getElementById("qfe-flex-new-input");
    const saveNewBtn = document.getElementById("qfe-flex-save-btn");
    const cancelNewBtn = document.getElementById("qfe-flex-cancel-btn");
    if (!select) return;

    const defaultDelHtml = delBtn ? delBtn.innerHTML : "";
    let deleteConfirmTimer = null;

    function resetDeleteConfirm() {
      if (!delBtn) return;
      if (deleteConfirmTimer) {
        clearTimeout(deleteConfirmTimer);
        deleteConfirmTimer = null;
      }
      delBtn.classList.remove("confirming");
      delBtn.innerHTML = defaultDelHtml;
    }

    async function loadOptions() {
      const stored = await chrome.storage.local.get([OPTIONS_KEY, VALUE_KEY]);
      let options = Array.isArray(stored[OPTIONS_KEY]) ? stored[OPTIONS_KEY] : [...DEFAULTS];
      if (!options.length) options = [...DEFAULTS];
      let value = typeof stored[VALUE_KEY] === "string" ? stored[VALUE_KEY].trim() : DEFAULTS[0];
      if (!value) value = DEFAULTS[0];
      if (!options.includes(value)) options.unshift(value);
      return { options, value };
    }

    async function renderOptions(options, selectedValue) {
      select.replaceChildren();
      for (const opt of options) {
        const el = document.createElement("option");
        el.value = opt;
        el.textContent = opt;
        select.appendChild(el);
      }
      select.value = selectedValue;
    }

    async function save(options, value) {
      await chrome.storage.local.set({ [OPTIONS_KEY]: options, [VALUE_KEY]: value });
    }

    async function commitNewOption() {
      if (!newInput) return;
      const newOpt = newInput.value.trim();
      if (!newOpt) {
        showToast("Please enter an option value first", true);
        newInput.focus();
        return;
      }
      const { options: current } = await loadOptions();
      if (current.includes(newOpt)) {
        showToast("Option already exists", true);
        return;
      }
      const updated = [...current, newOpt];
      await save(updated, newOpt);
      await renderOptions(updated, newOpt);
      newInput.value = "";
      if (inlineAddBox) inlineAddBox.hidden = true;
      showToast(`✓ Added: ${newOpt}`);
    }

    try {
      const { options, value } = await loadOptions();
      await renderOptions(options, value);

      select.addEventListener("change", async () => {
        resetDeleteConfirm();
        const next = select.value;
        await chrome.storage.local.set({ [VALUE_KEY]: next });
        showToast(`✓ Field 3: ${next}`);
      });

      // ➕ Open inline add form
      if (addBtn && inlineAddBox && newInput) {
        addBtn.addEventListener("click", () => {
          resetDeleteConfirm();
          const isHidden = inlineAddBox.hidden;
          inlineAddBox.hidden = !isHidden;
          if (!inlineAddBox.hidden) {
            newInput.value = "";
            newInput.focus();
          }
        });

        saveNewBtn?.addEventListener("click", commitNewOption);
        cancelNewBtn?.addEventListener("click", () => {
          newInput.value = "";
          inlineAddBox.hidden = true;
        });

        newInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitNewOption();
          } else if (e.key === "Escape") {
            e.preventDefault();
            newInput.value = "";
            inlineAddBox.hidden = true;
          }
        });
      }

      // ➖ Two-step inline delete confirmation (no blocking confirm() dialog)
      if (delBtn) {
        delBtn.addEventListener("click", async () => {
          if (inlineAddBox) inlineAddBox.hidden = true;
          const current = select.value;
          if (!current) return;
          const { options: all } = await loadOptions();
          if (all.length <= 1) {
            showToast("At least one option must remain", true);
            return;
          }

          if (!delBtn.classList.contains("confirming")) {
            delBtn.classList.add("confirming");
            delBtn.textContent = "Delete?";
            deleteConfirmTimer = setTimeout(resetDeleteConfirm, 2500);
            return;
          }

          resetDeleteConfirm();
          const updated = all.filter(o => o !== current);
          const newSelected = updated[0];
          await save(updated, newSelected);
          await renderOptions(updated, newSelected);
          showToast(`✓ Deleted: ${current}`);
        });
      }
    } catch (e) {
      console.warn("Help Seif: Flexible field init error", e);
    }
  }

  // 1b. Initialize Flexible Field 4 Value (CC / CS toggle for Won script)
  async function initFlexibleField4() {
    const ccBtn = document.getElementById("qfe-flex4-cc");
    const csBtn = document.getElementById("qfe-flex4-cs");
    if (!ccBtn || !csBtn) return;

    const buttons = [ccBtn, csBtn];
    const renderActive = (val) => {
      const normalized = String(val || DEFAULT_FLEX4_VALUE).trim().toUpperCase() === "CS" ? "CS" : "CC";
      buttons.forEach(btn => {
        const isMatch = btn.dataset.value === normalized;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("aria-pressed", isMatch ? "true" : "false");
      });
    };

    try {
      const stored = await chrome.storage.local.get([FLEX4_VALUE_KEY]);
      let currentVal = typeof stored[FLEX4_VALUE_KEY] === "string" ? stored[FLEX4_VALUE_KEY].trim().toUpperCase() : "";
      if (currentVal !== "CC" && currentVal !== "CS") {
        currentVal = DEFAULT_FLEX4_VALUE;
        await chrome.storage.local.set({ [FLEX4_VALUE_KEY]: currentVal });
      }
      renderActive(currentVal);
    } catch {
      renderActive(DEFAULT_FLEX4_VALUE);
    }

    buttons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const nextVal = btn.dataset.value === "CS" ? "CS" : "CC";
        renderActive(nextVal);
        try {
          await chrome.storage.local.set({ [FLEX4_VALUE_KEY]: nextVal });
          showToast(`✓ Field 4 (Won): ${nextVal}`);
        } catch {}
      });
    });
  }

  // 2. Speed Preset Selector (Fast 0.7x / Normal 1.0x / Slow 1.5x)
  async function initSpeedControl() {
    const speedBtn = document.getElementById("flexi-speed-btn");
    const speedLabel = document.getElementById("flexi-speed-label");
    if (!speedBtn || !speedLabel) return;

    let currentMult = 1.0;
    try {
      const stored = await chrome.storage.local.get([DELAY_MULTIPLIER_KEY]);
      const val = Number(stored[DELAY_MULTIPLIER_KEY]);
      if (SPEED_PRESETS.some(p => p.multiplier === val)) {
        currentMult = val;
      } else {
        await chrome.storage.local.set({ [DELAY_MULTIPLIER_KEY]: 1.0 });
      }
    } catch {}

    const renderSpeed = (mult) => {
      const preset = SPEED_PRESETS.find(p => p.multiplier === mult) || SPEED_PRESETS[0];
      speedLabel.textContent = preset.label;
    };
    renderSpeed(currentMult);

    speedBtn.addEventListener("click", async () => {
      const idx = SPEED_PRESETS.findIndex(p => p.multiplier === currentMult);
      const nextPreset = SPEED_PRESETS[(idx + 1) % SPEED_PRESETS.length];
      currentMult = nextPreset.multiplier;
      renderSpeed(currentMult);
      try {
        await chrome.storage.local.set({ [DELAY_MULTIPLIER_KEY]: currentMult });
        showToast(`⚡ ${nextPreset.desc}`);
      } catch {}
    });
  }

  // 3. Initialize Header Actions (Stop, Settings, Close)
  function initHeaderActions() {
    const stopBtn = document.getElementById("flexi-stop-btn");
    if (stopBtn) {
      stopBtn.addEventListener("click", async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              name: "content",
              body: { type: "stop" }
            }, () => {
              void chrome.runtime?.lastError;
            });
          }
          showToast("⏹ Stop signal sent");
        } catch {
          showToast("Could not send stop signal", true);
        }
      });
    }

    const settingsBtn = document.getElementById("flexi-settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL("/settings.html") });
        } catch (e) {
          window.open("/settings.html", "_blank");
        }
      });
    }

    const closeBtn = document.getElementById("flexi-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        window.close();
      });
    }
  }

  // 4. Close open dropdown menus on click outside
  function setupGlobalMenuCloser() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".flexi-menu-btn") && !e.target.closest(".flexi-dropdown-menu")) {
        document.querySelectorAll(".flexi-dropdown-menu").forEach(m => m.remove());
      }
    });
  }

  // 5. Run Script on Salesforce Tab
  async function runScript(scriptId, scriptName, playBtn, scriptType = "resource") {
    if (playBtn) {
      playBtn.classList.add("flexi-play-active");
      setTimeout(() => playBtn.classList.remove("flexi-play-active"), 600);
    }

    showToast(`▶ Running ${scriptName}...`);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showToast("No active tab found", true);
        return;
      }

      chrome.tabs.sendMessage(tab.id, {
        name: "content",
        body: {
          type: scriptType === "profile" ? "profile" : "resource",
          id: scriptId
        }
      }, () => {
        if (chrome.runtime?.lastError) {
          console.warn("Help Seif: script message note:", chrome.runtime.lastError.message);
          showToast("Open a Salesforce page or refresh the tab", true);
        }
      });
    } catch (err) {
      console.error("Help Seif: Run error", err);
      showToast("Could not send command to page", true);
    }
  }

  // 6. Initialize Script Rows (Dynamically loading defaults + all user-added workflows)
  async function initScriptRows() {
    const container = document.getElementById("flexi-scripts-list");
    if (!container) return;

    let storedResources = [];
    let storedProfiles = [];
    let savedOrder = null;
    try {
      const res = await chrome.storage.local.get(["resources", "profiles", ORDER_KEY]);
      const rawRes = res?.resources;
      if (Array.isArray(rawRes)) {
        storedResources = rawRes;
      } else if (typeof rawRes === "string") {
        try { storedResources = JSON.parse(rawRes); } catch (e) {}
      }
      const rawProf = res?.profiles;
      if (Array.isArray(rawProf)) {
        storedProfiles = rawProf;
      } else if (typeof rawProf === "string") {
        try { storedProfiles = JSON.parse(rawProf); } catch (e) {}
      }
      if (Array.isArray(res?.[ORDER_KEY])) {
        savedOrder = res[ORDER_KEY];
      }
    } catch (e) {
      console.warn("Could not read resources from storage", e);
    }

    const norm = (s) => String(s || "").trim().toLowerCase();

    const allDefs = [...DEFAULT_DEFINITIONS];

    for (const r of storedResources) {
      if (!r || !r.name) continue;
      const exists = allDefs.some(d => d.defaultId === r.id || norm(d.name) === norm(r.name));
      if (!exists) {
        const isPayment = /pay|fl\s*payment/i.test(r.name);
        allDefs.push({
          key: r.id || `custom-${norm(r.name).replace(/\s+/g, "-")}`,
          name: r.name,
          desc: r.description || (isPayment ? "Process payment & update fields" : "Custom workflow"),
          defaultId: r.id,
          type: "resource",
          isCustom: true,
          isHighlighted: isPayment,
          iconSvg: isPayment
            ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`
            : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
        });
      }
    }

    for (const p of storedProfiles) {
      if (!p || !p.name) continue;
      const exists = allDefs.some(d => d.defaultId === p.id || norm(d.name) === norm(p.name));
      if (!exists) {
        allDefs.push({
          key: `prof-${p.id}`,
          name: p.name,
          desc: p.description || "Autofill profile",
          defaultId: p.id,
          type: "profile",
          isCustom: true,
          iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#126747" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
        });
      }
    }

    let orderedDefs = [...allDefs];
    if (savedOrder && savedOrder.length) {
      orderedDefs.sort((a, b) => {
        let idxA = savedOrder.indexOf(a.key);
        let idxB = savedOrder.indexOf(b.key);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
      });
    }

    container.replaceChildren();

    function refreshShortcutBadges() {
      const rows = container.querySelectorAll(".flexi-script-row");
      rows.forEach((r, idx) => {
        const badge = r.querySelector(".flexi-shortcut-badge");
        if (badge) {
          if (idx < 9) {
            badge.textContent = String(idx + 1);
            badge.style.display = "flex";
          } else {
            badge.style.display = "none";
          }
        }
      });
    }

    async function persistNewOrder() {
      const rows = container.querySelectorAll(".flexi-script-row");
      const currentKeys = Array.from(rows).map(r => r.dataset.key).filter(Boolean);
      refreshShortcutBadges();
      try {
        await chrome.storage.local.set({ [ORDER_KEY]: currentKeys });
        showToast("✓ Script order saved");
      } catch (err) {
        console.warn("Help Seif: failed to save script order", err);
      }
    }

    let draggedElement = null;

    orderedDefs.forEach((def, index) => {
      const matchedRes = storedResources.find(r => r && (
        r.id === def.defaultId || norm(r.name) === norm(def.name)
      ));
      const matchedProf = !matchedRes ? storedProfiles.find(p => p && (
        p.id === def.defaultId || norm(p.name) === norm(def.name)
      )) : null;

      const activeId = matchedRes?.id || matchedProf?.id || def.defaultId;
      const scriptType = def.type || (matchedProf ? "profile" : "resource");

      const row = document.createElement("div");
      row.className = `flexi-script-row${def.isHighlighted ? " flexi-row-highlight" : ""}`;
      row.dataset.key = def.key;
      row.dataset.scriptId = activeId;
      row.dataset.scriptName = def.name;
      row.dataset.scriptType = scriptType;
      row.setAttribute("draggable", "true");

      const left = document.createElement("div");
      left.className = "flexi-row-left";

      const dragHandle = document.createElement("div");
      dragHandle.className = "flexi-drag-handle";
      dragHandle.title = "Drag to reorder";
      dragHandle.setAttribute("aria-label", "Drag to reorder");
      dragHandle.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="8" cy="6" r="1.8"></circle><circle cx="16" cy="6" r="1.8"></circle><circle cx="8" cy="12" r="1.8"></circle><circle cx="16" cy="12" r="1.8"></circle><circle cx="8" cy="18" r="1.8"></circle><circle cx="16" cy="18" r="1.8"></circle></svg>`;

      const iconBox = document.createElement("div");
      iconBox.className = "flexi-row-icon";
      iconBox.innerHTML = def.iconSvg;

      const shortcutBadge = document.createElement("span");
      shortcutBadge.className = "flexi-shortcut-badge";
      shortcutBadge.title = `Keyboard shortcut: Press ${index + 1}`;
      if (index < 9) {
        shortcutBadge.textContent = String(index + 1);
      } else {
        shortcutBadge.style.display = "none";
      }
      iconBox.appendChild(shortcutBadge);

      const infoBox = document.createElement("div");
      infoBox.className = "flexi-row-info";

      const title = document.createElement("div");
      title.className = "flexi-row-title";
      title.textContent = def.name;

      const desc = document.createElement("div");
      desc.className = "flexi-row-desc";
      desc.textContent = def.desc;

      infoBox.appendChild(title);
      infoBox.appendChild(desc);

      left.appendChild(dragHandle);
      left.appendChild(iconBox);
      left.appendChild(infoBox);

      const actions = document.createElement("div");
      actions.className = "flexi-row-actions";

      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "flexi-play-btn";
      playBtn.title = `Run ${def.name} (Shortcut: ${index + 1})`;
      playBtn.setAttribute("aria-label", `Run ${def.name}`);
      playBtn.setAttribute("draggable", "false");
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg>`;
      playBtn.addEventListener("click", () => {
        runScript(activeId, def.name, playBtn, scriptType);
      });

      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "flexi-menu-btn";
      menuBtn.title = "Options";
      menuBtn.setAttribute("aria-label", `Options for ${def.name}`);
      menuBtn.setAttribute("draggable", "false");
      menuBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#17231D"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>`;

      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const existing = row.querySelector(".flexi-dropdown-menu");
        if (existing) {
          existing.remove();
          return;
        }

        document.querySelectorAll(".flexi-dropdown-menu").forEach(m => m.remove());

        const menu = document.createElement("div");
        menu.className = "flexi-dropdown-menu";

        const editItem = document.createElement("button");
        editItem.type = "button";
        editItem.className = "flexi-dropdown-item";
        editItem.textContent = scriptType === "profile" ? "Edit profile" : "Edit workflow";
        editItem.addEventListener("click", () => {
          const editPath = scriptType === "profile"
            ? `/options.html#/profiles/edit/${activeId}`
            : `/options.html#/advanced/edit/${activeId}`;
          chrome.tabs.create({ url: chrome.runtime.getURL(editPath) });
          menu.remove();
        });

        const viewItem = document.createElement("button");
        viewItem.type = "button";
        viewItem.className = "flexi-dropdown-item";
        viewItem.textContent = "Open in options";
        viewItem.addEventListener("click", () => {
          const viewPath = scriptType === "profile" ? "/options.html#/profiles" : "/options.html#/advanced";
          chrome.tabs.create({ url: chrome.runtime.getURL(viewPath) });
          menu.remove();
        });

        menu.appendChild(editItem);
        menu.appendChild(viewItem);

        if (!def.isCustom) {
          const resetItem = document.createElement("button");
          resetItem.type = "button";
          resetItem.className = "flexi-dropdown-item";
          resetItem.textContent = "Reset to default";
          resetItem.addEventListener("click", () => {
            chrome.runtime.sendMessage({ name: "resetStarterResources", id: def.defaultId }, () => {
              void chrome.runtime?.lastError;
              showToast(`✓ Restored ${def.name} to default`);
            });
            menu.remove();
          });
          menu.appendChild(resetItem);
        }

        row.appendChild(menu);
      });

      actions.appendChild(playBtn);
      actions.appendChild(menuBtn);

      row.appendChild(left);
      row.appendChild(actions);

      // --- Drag and Drop Event Listeners ---
      row.addEventListener("dragstart", (e) => {
        if (e.target.closest("button") || e.target.closest(".flexi-dropdown-menu")) {
          e.preventDefault();
          return;
        }
        draggedElement = row;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", def.key);
        setTimeout(() => {
          row.classList.add("flexi-dragging");
        }, 0);
      });

      row.addEventListener("dragend", () => {
        row.classList.remove("flexi-dragging");
        container.querySelectorAll(".flexi-script-row").forEach(r => {
          r.classList.remove("flexi-drag-over-top", "flexi-drag-over-bottom");
        });
        draggedElement = null;
      });

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!draggedElement || draggedElement === row) return;

        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          row.classList.add("flexi-drag-over-top");
          row.classList.remove("flexi-drag-over-bottom");
        } else {
          row.classList.add("flexi-drag-over-bottom");
          row.classList.remove("flexi-drag-over-top");
        }
      });

      row.addEventListener("dragleave", (e) => {
        if (!row.contains(e.relatedTarget)) {
          row.classList.remove("flexi-drag-over-top", "flexi-drag-over-bottom");
        }
      });

      row.addEventListener("drop", async (e) => {
        e.preventDefault();
        row.classList.remove("flexi-drag-over-top", "flexi-drag-over-bottom");
        if (!draggedElement || draggedElement === row) return;

        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          container.insertBefore(draggedElement, row);
        } else {
          container.insertBefore(draggedElement, row.nextSibling);
        }

        await persistNewOrder();
      });

      container.appendChild(row);
    });
  }

  // 7. Customer Info Copy Card & Floating Bar Toggle
  const FLOAT_ENABLED_KEY = "qfeFloatingBarEnabled";

  async function initFloatingBarToggle() {
    const toggleBtn = document.getElementById("flexi-float-toggle-btn");
    if (!toggleBtn) return;

    let isEnabled = true;
    try {
      const stored = await chrome.storage.local.get(FLOAT_ENABLED_KEY);
      isEnabled = stored[FLOAT_ENABLED_KEY] !== false;
    } catch {}

    const renderToggle = () => {
      toggleBtn.classList.toggle("active", isEnabled);
      toggleBtn.title = isEnabled
        ? "Floating Quick-Action Bar is ON (click to hide)"
        : "Floating Quick-Action Bar is OFF (click to show)";
    };
    renderToggle();

    toggleBtn.addEventListener("click", async () => {
      isEnabled = !isEnabled;
      renderToggle();
      try {
        await chrome.storage.local.set({ [FLOAT_ENABLED_KEY]: isEnabled });
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            name: "setFloatingBarEnabled",
            enabled: isEnabled,
          }).catch(() => {});
        }
        showToast(isEnabled ? "⚡ Floating Bar enabled" : "Floating Bar hidden");
      } catch {}
    });
  }

  const SMS_ID_SUFFIX_KEY = "qfeSmsIdSuffix";

  const formatSmsIdWithSuffix = (rawId, suffix) => {
    const cleanId = String(rawId || "").trim();
    if (!cleanId) return "";
    const cleanSuffix = String(suffix || "").trim();
    return cleanSuffix ? `${cleanId}  ${cleanSuffix}` : cleanId;
  };

  async function initCustomerInfoCard() {
    const copyAllBtn = document.getElementById("flexi-cust-copy-all");
    const refreshBtn = document.getElementById("flexi-cust-refresh");
    const suffixInput = document.getElementById("flexi-id-suffix");
    const rows = document.querySelectorAll(".flexi-cust-row");
    if (!copyAllBtn || !rows.length) return;

    let currentInfo = { name: "", phone: "", email: "", smsId: "" };
    let currentSuffix = "SE";

    try {
      const stored = await chrome.storage.local.get(SMS_ID_SUFFIX_KEY);
      if (stored[SMS_ID_SUFFIX_KEY] !== undefined) {
        currentSuffix = String(stored[SMS_ID_SUFFIX_KEY]);
      }
    } catch {}

    if (suffixInput) {
      suffixInput.value = currentSuffix;
      suffixInput.addEventListener("input", async () => {
        currentSuffix = suffixInput.value.trim().toUpperCase();
        suffixInput.value = currentSuffix;
        updateUI(currentInfo);
        try {
          await chrome.storage.local.set({ [SMS_ID_SUFFIX_KEY]: currentSuffix });
        } catch {}
      });
    }

    const updateUI = (info) => {
      currentInfo = info || { name: "", phone: "", email: "", smsId: "" };
      for (const key of ["name", "phone", "email", "smsId"]) {
        const el = document.getElementById(`flexi-cust-${key}`);
        if (!el) continue;
        const rawVal = String(currentInfo[key] || "").trim();
        const displayVal =
          key === "smsId" && rawVal
            ? formatSmsIdWithSuffix(rawVal, currentSuffix)
            : rawVal;
        el.textContent = displayVal || "—";
        el.classList.toggle("is-empty", !displayVal);
      }
    };

    const fetchFromActiveTab = async (autoHover = false) => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url || /^(?:chrome|edge|about):/i.test(tab.url)) {
          return;
        }
        let res = null;
        try {
          res = await chrome.tabs.sendMessage(tab.id, {
            name: "getCustomerInfo",
            autoHover,
          });
        } catch {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["salesforce-floating-bar.js"],
            });
            res = await chrome.tabs.sendMessage(tab.id, {
              name: "getCustomerInfo",
              autoHover,
            });
          } catch {}
        }
        if (res?.ok && res.data) {
          updateUI(res.data);
        }
      } catch {}
    };

    refreshBtn?.addEventListener("click", async () => {
      refreshBtn.textContent = "…";
      await fetchFromActiveTab(true);
      refreshBtn.textContent = "↻";
      showToast("↻ Customer data refreshed");
    });

    rows.forEach((row) => {
      row.addEventListener("click", async () => {
        const field = row.getAttribute("data-cust-field");
        if (!currentInfo[field]) {
          await fetchFromActiveTab(true);
        } else {
          await fetchFromActiveTab(false);
        }
        const rawVal = String(currentInfo[field] || "").trim();
        const valToCopy =
          field === "smsId"
            ? formatSmsIdWithSuffix(rawVal, currentSuffix)
            : rawVal;
        if (!valToCopy) {
          showToast(`No ${field} found on this page`);
          return;
        }
        try {
          await navigator.clipboard.writeText(valToCopy);
          showToast(`✓ Copied: ${valToCopy}`);
        } catch {
          showToast("Failed to copy to clipboard");
        }
      });
    });

    // Copy All separately into Windows Clipboard History (Win+V):
    // 1st copied (bottom of Win+V): SMS ID + Suffix (e.g. "0061704516  SE")
    // 2nd copied (above ID):        Email
    // 3rd copied (above Email):     Phone
    // 4th copied (top of Win+V):    Name
    copyAllBtn.addEventListener("click", async () => {
      const defaultLabel = "📋 Copy All";
      copyAllBtn.textContent = "Reading...";
      await fetchFromActiveTab(true);

      const formattedId = formatSmsIdWithSuffix(currentInfo.smsId, currentSuffix);
      const queue = [
        { label: "SMS ID", value: formattedId },
        { label: "Email", value: String(currentInfo.email || "").trim() },
        { label: "Phone", value: String(currentInfo.phone || "").trim() },
        { label: "Name", value: String(currentInfo.name || "").trim() },
      ].filter((item) => Boolean(item.value));

      if (queue.length === 0) {
        copyAllBtn.textContent = defaultLabel;
        showToast("No customer info found on active tab");
        return;
      }

      try {
        for (let i = 0; i < queue.length; i++) {
          copyAllBtn.textContent = `Copying ${i + 1}/${queue.length}...`;
          await navigator.clipboard.writeText(queue[i].value);
          if (i < queue.length - 1) {
            await new Promise((r) => setTimeout(r, 420));
          }
        }
        copyAllBtn.textContent = `✓ Queued ${queue.length}!`;
        showToast(`✓ Queued ${queue.length} items to Win+V (Name on top, ID on bottom)`);
        setTimeout(() => {
          copyAllBtn.textContent = defaultLabel;
        }, 1200);
      } catch {
        copyAllBtn.textContent = defaultLabel;
        showToast("Failed to copy to clipboard");
      }
    });

    // Listen for live updates pushed from salesforce-floating-bar.js while popup is open
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg?.name === "customerInfoUpdated" && msg.data) {
          updateUI(msg.data);
        }
      });
    }

    // Live poll while popup stays open so UI updates automatically without closing/reopening
    setInterval(() => {
      fetchFromActiveTab(false);
    }, 550);

    // Fetch immediately on popup open (and auto-scroll + auto-hover if smsId/phone/email missing)
    await fetchFromActiveTab(false);
    if (!currentInfo.phone || !currentInfo.email || !currentInfo.smsId) {
      await fetchFromActiveTab(true);
    }
  }

  // 8. Owner Skip Control & Collapsible Sections + Grid/List View Toggle
  const TARGET_OWNER_KEY = "qfeTargetOwnerName";
  const POPUP_SEC_CUST_KEY = "qfePopupSecCustCollapsed";
  const POPUP_SEC_FIELDS_KEY = "qfePopupSecFieldsCollapsed";
  const POPUP_SEC_WF_KEY = "qfePopupSecWfCollapsed";
  const POPUP_GRID_MODE_KEY = "qfePopupGridMode";

  async function initOwnerSkipControl() {
    const ownerInput = document.getElementById("qfe-owner-skip-input");
    const summaryEl = document.getElementById("flexi-fields-summary");
    if (!ownerInput) return;

    const refreshSummary = async () => {
      if (!summaryEl) return;
      try {
        const st = await chrome.storage.local.get([WON_FIELD_4_KEY, TARGET_OWNER_KEY]);
        const wonVal = String(st[WON_FIELD_4_KEY] || "CC").toUpperCase() === "CS" ? "CS" : "CC";
        const ownerVal = String(st[TARGET_OWNER_KEY] ?? "Seif Ezz Eldin").trim();
        summaryEl.textContent = ownerVal
          ? `Won: ${wonVal} • ${ownerVal}`
          : `Won: ${wonVal} • No Owner Skip`;
      } catch {}
    };

    try {
      const st = await chrome.storage.local.get(TARGET_OWNER_KEY);
      if (st[TARGET_OWNER_KEY] === undefined) {
        await chrome.storage.local.set({ [TARGET_OWNER_KEY]: "Seif Ezz Eldin" });
        ownerInput.value = "Seif Ezz Eldin";
      } else {
        ownerInput.value = String(st[TARGET_OWNER_KEY]);
      }
    } catch {}

    await refreshSummary();

    ownerInput.addEventListener("input", async () => {
      const val = ownerInput.value.trim();
      try {
        await chrome.storage.local.set({ [TARGET_OWNER_KEY]: val });
        await refreshSummary();
      } catch {}
    });

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;
        if (changes[WON_FIELD_4_KEY] || changes[TARGET_OWNER_KEY]) {
          refreshSummary();
        }
      });
    }
  }

  async function initCollapsibleSectionsAndViewMode() {
    const sections = [
      {
        btnId: "flexi-sec-cust-toggle",
        secId: "flexi-customer-card",
        key: POPUP_SEC_CUST_KEY,
        defaultCollapsed: false,
      },
      {
        btnId: "flexi-sec-fields-toggle",
        secId: "flexi-field-card",
        key: POPUP_SEC_FIELDS_KEY,
        defaultCollapsed: false,
      },
      {
        btnId: "flexi-sec-wf-toggle",
        secId: "flexi-wf-section",
        key: POPUP_SEC_WF_KEY,
        defaultCollapsed: false,
      },
    ];

    let stored = {};
    try {
      stored = await chrome.storage.local.get([
        POPUP_SEC_CUST_KEY,
        POPUP_SEC_FIELDS_KEY,
        POPUP_SEC_WF_KEY,
        POPUP_GRID_MODE_KEY,
      ]);
    } catch {}

    for (const { btnId, secId, key, defaultCollapsed } of sections) {
      const btn = document.getElementById(btnId);
      const sec = document.getElementById(secId);
      if (!btn || !sec) continue;

      const isCollapsed =
        stored[key] !== undefined ? Boolean(stored[key]) : defaultCollapsed;
      sec.classList.toggle("is-collapsed", isCollapsed);
      btn.setAttribute("aria-expanded", String(!isCollapsed));

      btn.addEventListener("click", async () => {
        const nextCollapsed = !sec.classList.contains("is-collapsed");
        sec.classList.toggle("is-collapsed", nextCollapsed);
        btn.setAttribute("aria-expanded", String(!nextCollapsed));
        try {
          await chrome.storage.local.set({ [key]: nextCollapsed });
        } catch {}
      });
    }

    const viewToggleBtn = document.getElementById("flexi-wf-view-toggle");
    const scriptsList = document.getElementById("flexi-scripts-list");
    if (viewToggleBtn && scriptsList) {
      let isGrid =
        stored[POPUP_GRID_MODE_KEY] !== undefined
          ? Boolean(stored[POPUP_GRID_MODE_KEY])
          : true;

      const renderViewMode = () => {
        scriptsList.classList.toggle("is-compact-grid", isGrid);
        viewToggleBtn.textContent = isGrid ? "⊞ Compact Grid" : "☰ Full List";
      };
      renderViewMode();

      viewToggleBtn.addEventListener("click", async () => {
        isGrid = !isGrid;
        renderViewMode();
        try {
          await chrome.storage.local.set({ [POPUP_GRID_MODE_KEY]: isGrid });
        } catch {}
      });
    }
  }

  // 9. Keyboard shortcuts (1-9 to run script, S to stop) inside Popup
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key >= "1" && e.key <= "9") {
        const index = Number(e.key) - 1;
        const rows = document.querySelectorAll("#flexi-scripts-list .flexi-script-row");
        const targetRow = rows[index];
        if (targetRow) {
          e.preventDefault();
          const playBtn = targetRow.querySelector(".flexi-play-btn");
          playBtn?.click();
        }
      }
    });
  }

  // Single-execution bootstrap guard (fixes double event listener registration)
  let isBooted = false;
  function boot() {
    if (isBooted) return;
    isBooted = true;
    initFlexibleField();






    initHeaderActions();
    setupGlobalMenuCloser();
    initScriptRows();
    setupKeyboardShortcuts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();




