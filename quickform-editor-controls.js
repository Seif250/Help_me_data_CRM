(() => {
  "use strict";

  const OPTIONS_KEY = "qfeFlexibleFieldOptions";
  const VALUE_KEY = "qfeFlexibleFieldValue";
  const DEFAULTS = ["BEG 10% List", "ANR", "LED", "REG 10%", "BEG T1 RES"];

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

  // 1. Initialize Flexible Field 3 Value (with Add / Delete option support)
  async function initFlexibleField() {
    const select = document.getElementById("qfe-flex-value");
    const addBtn  = document.getElementById("qfe-flex-add");
    const delBtn  = document.getElementById("qfe-flex-del");
    if (!select) return;

    // --- helpers ---
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

    // --- initial render ---
    try {
      const { options, value } = await loadOptions();
      await renderOptions(options, value);

      // On change: persist selected value
      select.addEventListener("change", async () => {
        const next = select.value;
        await chrome.storage.local.set({ [VALUE_KEY]: next });
        showToast(`✓ Field 3: ${next}`);
      });

      // ➕ Add new option
      if (addBtn) {
        addBtn.addEventListener("click", async () => {
          const raw = prompt("اكتب الـ Option الجديد:");
          if (!raw) return;
          const newOpt = raw.trim();
          if (!newOpt) return;
          const { options: current } = await loadOptions();
          if (current.includes(newOpt)) {
            showToast("الخيار موجود بالفعل", true);
            return;
          }
          const updated = [...current, newOpt];
          await save(updated, newOpt);
          await renderOptions(updated, newOpt);
          showToast(`✓ تمت إضافة: ${newOpt}`);
        });
      }

      // ➖ Delete current option
      if (delBtn) {
        delBtn.addEventListener("click", async () => {
          const current = select.value;
          if (!current) return;
          const { options: all } = await loadOptions();
          if (all.length <= 1) {
            showToast("لازم يفضل خيار واحد على الأقل", true);
            return;
          }
          const confirmed = confirm(`هتحذف "${current}"؟`);
          if (!confirmed) return;
          const updated = all.filter(o => o !== current);
          const newSelected = updated[0];
          await save(updated, newSelected);
          await renderOptions(updated, newSelected);
          showToast(`✓ تم حذف: ${current}`);
        });
      }

    } catch (e) {
      console.warn("Help Seif: Flexible field init error", e);
    }
  }

  // ─── Adaptive Delay ────────────────────────────────────────────────────────
  // Measures actual page load/response time and stores a multiplier so that
  // slow connections get longer delays and fast connections get shorter ones.
  // Multiplier is stored in chrome.storage.local as "qfeDelayMultiplier".
  const DELAY_MULTIPLIER_KEY = "qfeDelayMultiplier";

  async function measureAndStoreLatency() {
    try {
      const t0 = performance.now();
      // Lightweight ping: check how fast storage itself responds as a proxy
      await chrome.storage.local.get(["resources"]);
      const roundTripMs = performance.now() - t0;

      // Map round-trip to a sane multiplier:
      //   < 50 ms  → 0.7 (fast)
      //   50-150   → 1.0 (normal)
      //   150-400  → 1.4 (medium-slow)
      //   > 400 ms → 2.0 (slow / heavy page)
      let multiplier;
      if      (roundTripMs < 50)  multiplier = 0.7;
      else if (roundTripMs < 150) multiplier = 1.0;
      else if (roundTripMs < 400) multiplier = 1.4;
      else                        multiplier = 2.0;

      await chrome.storage.local.set({ [DELAY_MULTIPLIER_KEY]: multiplier });
    } catch (e) {
      // Non-fatal – scripts will fall back to their hard-coded delays
      console.warn("Help Seif: latency measurement failed", e);
    }
  }

  // Expose a helper the content scripts can read before executing each DELAY step
  // (the background/index.js already reads qfeDelayMultiplier from storage)
  async function getDelayMultiplier() {
    try {
      const res = await chrome.storage.local.get([DELAY_MULTIPLIER_KEY]);
      const m = res[DELAY_MULTIPLIER_KEY];
      return (typeof m === "number" && m > 0) ? m : 1.0;
    } catch {
      return 1.0;
    }
  }


  // 2. Initialize Header Actions
  function initHeaderActions() {
    const settingsBtn = document.getElementById("flexi-settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        try {
          chrome.tabs.create({ url: chrome.runtime.getURL("/options.html#/settings/") });
        } catch (e) {
          window.open("/options.html#/settings/", "_blank");
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

  // 3. Close open dropdown menus on click outside
  function setupGlobalMenuCloser() {
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".flexi-menu-btn") && !e.target.closest(".flexi-dropdown-menu")) {
        document.querySelectorAll(".flexi-dropdown-menu").forEach(m => m.remove());
      }
    });
  }

  // 4. Run Script on Salesforce Tab
  async function runScript(scriptId, scriptName, playBtn, scriptType = "resource") {
    if (playBtn) {
      playBtn.classList.add("flexi-play-active");
      setTimeout(() => playBtn.classList.remove("flexi-play-active"), 600);
    }

    showToast(`Running ${scriptName}...`);

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
      }, (res) => {
        if (chrome.runtime?.lastError) {
          console.warn("Help Seif: script message note:", chrome.runtime.lastError.message);
        }
      });
    } catch (err) {
      console.error("Help Seif: Run error", err);
      showToast("Could not send command to page", true);
    }
  }

  const ORDER_KEY = "flexiScriptOrder";

  // 5. Initialize Script Rows (Dynamically loading defaults + all user-added workflows)
  async function initScriptRows() {
    const container = document.getElementById("flexi-scripts-list");
    if (!container) return;

    // Load actual stored resources, profiles, and saved script order
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

    // Start with default definitions
    const allDefs = [...DEFAULT_DEFINITIONS];

    // Dynamically append any user-created resources that aren't in allDefs
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

    // Dynamically append any user-created profiles that aren't in allDefs
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

    // Sort script definitions according to saved custom order
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

    // Persist reordered script keys to storage
    async function persistNewOrder() {
      const rows = container.querySelectorAll(".flexi-script-row");
      const currentKeys = Array.from(rows).map(r => r.dataset.key).filter(Boolean);
      try {
        await chrome.storage.local.set({ [ORDER_KEY]: currentKeys });
        showToast("✓ تم حفظ ترتيب السكريبتات");
      } catch (err) {
        console.warn("Help Seif: failed to save script order", err);
      }
    }

    let draggedElement = null;

    for (const def of orderedDefs) {
      // Find matching resource/profile by ID or name
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
      row.setAttribute("draggable", "true");

      // Left side: Drag Handle + Icon + Title + Description
      const left = document.createElement("div");
      left.className = "flexi-row-left";

      // 6-Dot Drag Handle
      const dragHandle = document.createElement("div");
      dragHandle.className = "flexi-drag-handle";
      dragHandle.title = "اسحب لتغيير الترتيب";
      dragHandle.setAttribute("aria-label", "Drag to reorder");
      dragHandle.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="8" cy="6" r="1.8"></circle><circle cx="16" cy="6" r="1.8"></circle><circle cx="8" cy="12" r="1.8"></circle><circle cx="16" cy="12" r="1.8"></circle><circle cx="8" cy="18" r="1.8"></circle><circle cx="16" cy="18" r="1.8"></circle></svg>`;

      const iconBox = document.createElement("div");
      iconBox.className = "flexi-row-icon";
      iconBox.innerHTML = def.iconSvg;

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

      // Right side: Play Button + 3-Dot Button
      const actions = document.createElement("div");
      actions.className = "flexi-row-actions";

      // Play Button
      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "flexi-play-btn";
      playBtn.title = `Run ${def.name}`;
      playBtn.setAttribute("aria-label", `Run ${def.name}`);
      playBtn.setAttribute("draggable", "false");
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#FFFFFF"><path d="M8 5v14l11-7z"/></svg>`;
      playBtn.addEventListener("click", () => {
        runScript(activeId, def.name, playBtn, scriptType);
      });

      // 3-Dot Overflow Menu Button
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

        // Close other open menus
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
    }
  }

  // Main Startup
  document.addEventListener("DOMContentLoaded", () => {
    initFlexibleField();
    initHeaderActions();
    setupGlobalMenuCloser();
    initScriptRows();
    measureAndStoreLatency();
  });

  // If DOM is already loaded
  if (document.readyState === "interactive" || document.readyState === "complete") {
    initFlexibleField();
    initHeaderActions();
    setupGlobalMenuCloser();
    initScriptRows();
    measureAndStoreLatency();
  }
})();
