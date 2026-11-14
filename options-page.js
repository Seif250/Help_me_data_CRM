(() => {
  const statusEl = document.getElementById("opt-lic-status");
  const planEl = document.getElementById("opt-lic-plan");
  const expEl = document.getElementById("opt-lic-exp");
  const syncBtn = document.getElementById("opt-sync-btn");
  const lockBtn = document.getElementById("opt-lock-btn");
  const msgEl = document.getElementById("opt-msg");

  const showMsg = (txt, isErr = false) => {
    if (!msgEl) return;
    msgEl.textContent = txt;
    msgEl.style.color = isErr ? "#f87171" : "#34d399";
  };

  const render = (lic) => {
    const active = lic?.status === "active";
    if (statusEl) {
      statusEl.textContent = active ? "Active" : "Locked";
      statusEl.className = `badge ${active ? "ok" : "bad"}`;
    }
    if (planEl) planEl.textContent = active ? (lic.plan || "PRO") : "-";
    if (expEl) expEl.textContent = active && lic.expiresAt ? lic.expiresAt.slice(0, 10) : "-";
  };

  chrome.storage.local.get(["qfeLicense"], (st) => render(st?.qfeLicense));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.qfeLicense) render(changes.qfeLicense.newValue);
  });

  syncBtn?.addEventListener("click", () => {
    showMsg("Syncing workflows from server...");
    chrome.runtime.sendMessage({ name: "resetStarterResources" }, (res) => {
      if (res?.ok) showMsg("✓ Workflows synced from server.");
      else showMsg("Activate your license in the popup first.", true);
    });
  });

  lockBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ name: "deactivateLicense" }, () => {
      showMsg("Extension locked on this device.");
    });
  });
})();
