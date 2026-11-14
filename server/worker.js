import { STARTER_RESOURCES } from "./workflows.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });

const normalizeKey = (k) => String(k || "").trim().toUpperCase();

const generateLicenseKey = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SNAP-${seg()}-${seg()}-${seg()}`;
};

const isAdmin = (request, env) => {
  const secret = env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
};

const validateLicenseRecord = (record, deviceId, { requireRegisteredDevice = false } = {}) => {
  if (!record) return { ok: false, error: "Invalid license key." };
  if (record.revoked) return { ok: false, error: "License has been revoked." };
  if (record.expiresAt && Date.now() > new Date(record.expiresAt).getTime()) {
    return { ok: false, error: "License expired. Please renew your subscription." };
  }
  const devices = Array.isArray(record.devices) ? record.devices : [];
  const maxDevices = Number(record.maxDevices) || 1;
  if (requireRegisteredDevice && deviceId && !devices.includes(deviceId)) {
    return {
      ok: false,
      error: "Device session was reset by admin. Please re-activate your license key."
    };
  }
  if (deviceId && !devices.includes(deviceId) && devices.length >= maxDevices) {
    return {
      ok: false,
      error: `Device limit reached (${devices.length}/${maxDevices}). Contact support to reset devices.`
    };
  }
  return { ok: true };
};

const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SalesSnap License Admin</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root {
      --bg: #0b1120;
      --card: #131c31;
      --card-2: #0f172a;
      --border: #26334d;
      --text: #e2e8f0;
      --text-strong: #f8fafc;
      --muted: #94a3b8;
      --accent: #10b981;
      --accent-text: #052e16;
      --code-bg: #0b1120;
      --code-text: #34d399;
      --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    body.theme-light {
      --bg: #f3f7f4;
      --card: #ffffff;
      --card-2: #f8faf9;
      --border: #dce7e0;
      --text: #17231d;
      --text-strong: #0f172a;
      --muted: #64746b;
      --accent: #126747;
      --accent-text: #ffffff;
      --code-bg: #eef6f1;
      --code-text: #126747;
      --shadow: 0 6px 24px rgba(18, 103, 71, 0.08);
    }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; transition: background 0.2s ease, color 0.2s ease; }
    .wrap { max-width: 1160px; margin: 0 auto; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
    h1 { margin: 0; font-size: 20px; color: var(--text-strong); letter-spacing: -0.02em; }
    .brand-sub { font-size: 12px; color: var(--muted); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 13px 15px; box-shadow: var(--shadow); }
    .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 700; }
    .stat-val { font-size: 23px; font-weight: 800; color: var(--text-strong); margin-top: 4px; }
    .stat-val.green { color: #10b981; }
    .stat-val.amber { color: #f59e0b; }
    .stat-val.red { color: #ef4444; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 15px 16px; margin-bottom: 14px; box-shadow: var(--shadow); }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    input, select { background: var(--card-2); color: var(--text-strong); border: 1px solid var(--border); border-radius: 9px; padding: 8px 11px; font-size: 13px; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); }
    button { background: var(--accent); color: var(--accent-text); border: none; border-radius: 9px; padding: 8px 13px; font-weight: 700; font-size: 12.5px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px; transition: transform 0.1s ease, opacity 0.15s ease, background 0.15s ease; }
    button:hover { opacity: 0.92; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:disabled { opacity: 0.55; cursor: wait; transform: none; }
    button.danger { background: #ef4444; color: #fff; }
    button.warn { background: #f59e0b; color: #1f1600; }
    button.blue { background: #2563eb; color: #fff; }
    button.sec { background: var(--card-2); color: var(--text); border: 1px solid var(--border); }
    button.sm { padding: 5px 10px; font-size: 11.5px; border-radius: 7px; }
    .icon-btn { width: 36px; height: 36px; padding: 0; border-radius: 10px; }
    .status-bar { display: none; padding: 10px 14px; border-radius: 11px; font-size: 13px; font-weight: 600; margin-bottom: 14px; border: 1px solid transparent; }
    .status-bar.show { display: block; }
    .status-bar.ok { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.4); color: #10b981; }
    .status-bar.err { background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.4); color: #ef4444; }
    .status-bar.info { background: rgba(56, 189, 248, 0.12); border-color: rgba(56, 189, 248, 0.4); color: #0284c7; }
    .new-key-box { display: none; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent); border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .new-key-box.show { display: flex; }
    .new-key-code { font-family: ui-monospace, monospace; font-size: 18px; font-weight: 800; color: var(--accent); letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { text-align: left; padding: 11px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    th { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    code { background: var(--code-bg); padding: 3px 8px; border-radius: 6px; font-size: 12px; color: var(--code-text); border: 1px solid var(--border); font-weight: 700; }
    .subtext { font-size: 11px; color: var(--muted); margin-top: 3px; }
    .badge { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; display: inline-block; }
    .badge.ok { background: rgba(16, 185, 129, 0.16); color: #059669; }
    body:not(.theme-light) .badge.ok { color: #6ee7b7; }
    .badge.warn { background: rgba(245, 158, 11, 0.18); color: #b45309; }
    body:not(.theme-light) .badge.warn { color: #fde68a; }
    .badge.bad { background: rgba(239, 68, 68, 0.16); color: #dc2626; }
    body:not(.theme-light) .badge.bad { color: #fca5a5; }
    .empty { text-align: center; padding: 28px; color: var(--muted); }

    /* Custom Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.65); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; padding: 16px; z-index: 999; }
    .modal-backdrop.open { display: flex; animation: fadeIn 0.15s ease; }
    .modal-card { width: 100%; max-width: 420px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: 0 24px 48px rgba(0,0,0,0.35); animation: popIn 0.16s ease; }
    .modal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .modal-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-icon.blue { background: rgba(37, 99, 235, 0.15); color: #3b82f6; }
    .modal-icon.warn { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .modal-icon.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .modal-icon.ok { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .modal-title { font-size: 16px; font-weight: 800; color: var(--text-strong); margin: 0; }
    .modal-desc { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0 0 14px; }
    .modal-key-pill { display: inline-block; margin-bottom: 12px; }
    .preset-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .preset-btn { background: var(--card-2); color: var(--text); border: 1px solid var(--border); padding: 5px 10px; border-radius: 7px; font-size: 12px; font-weight: 700; }
    .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"/></svg>
        </div>
        <div>
          <h1>SalesSnap License Admin</h1>
          <div class="brand-sub">Manage keys, devices &amp; subscriptions</div>
        </div>
      </div>
      <div class="row">
        <button id="btn-theme" type="button" class="sec icon-btn" onclick="toggleTheme()" title="Toggle Light / Dark Mode" aria-label="Toggle Theme"></button>
        <input id="secret" type="password" placeholder="Admin Secret..." style="width:200px" />
        <button id="btn-connect" type="button" onclick="loadKeys()">Connect &amp; Refresh</button>
      </div>
    </div>

    <div id="status-bar" class="status-bar"></div>

    <div class="stats" id="stats">
      <div class="stat-card"><div class="stat-lbl">Total Keys</div><div class="stat-val" id="st-total">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Active Keys</div><div class="stat-val green" id="st-active">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Expiring &le; 3d</div><div class="stat-val amber" id="st-soon">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Active Devices</div><div class="stat-val" id="st-devices">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Revoked / Expired</div><div class="stat-val red" id="st-bad">0</div></div>
    </div>

    <div id="new-key-box" class="new-key-box">
      <div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:3px;">New License Key Created:</div>
        <div id="new-key-val" class="new-key-code"></div>
      </div>
      <button type="button" onclick="copyText(document.getElementById('new-key-val').textContent)">Copy Key</button>
    </div>

    <div class="card">
      <div class="row">
        <input id="cust" placeholder="Customer Name (e.g. Ahmed)" style="flex:1;min-width:170px" />
        <select id="plan"><option value="PRO">PRO</option><option value="TRIAL">TRIAL</option></select>
        <input id="days" type="number" value="30" min="1" style="width:85px" title="Duration (Days)" placeholder="Days" />
        <input id="maxDev" type="number" value="1" min="1" style="width:80px" title="Max Devices" placeholder="Devices" />
        <button id="btn-create" type="button" onclick="createKey()">+ Generate Key</button>
      </div>
    </div>

    <div class="card">
      <div class="row" style="margin-bottom:12px;">
        <input id="search" placeholder="Search by key or customer name..." style="flex:1;min-width:200px" oninput="renderTable()" />
        <select id="filter-status" onchange="renderTable()">
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="soon">Expiring Soon (&le; 3d)</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Key</th><th>Customer</th><th>Plan</th><th>Remaining / Expires</th><th>Devices</th><th>Last Seen</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="tbody"><tr><td colspan="8" class="empty">Enter Admin Secret and click "Connect &amp; Refresh"</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Custom Modal -->
  <div id="modal-backdrop" class="modal-backdrop" onclick="if(event.target===this) closeModal()">
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div id="modal-icon" class="modal-icon"></div>
        <h2 id="modal-title" class="modal-title"></h2>
      </div>
      <div id="modal-key-wrap" class="modal-key-pill"></div>
      <p id="modal-desc" class="modal-desc"></p>
      <div id="modal-extra"></div>
      <div class="modal-actions">
        <button type="button" class="sec" onclick="closeModal()">Cancel</button>
        <button id="modal-confirm-btn" type="button">Confirm</button>
      </div>
    </div>
  </div>

  <script>
    const secInput = document.getElementById("secret");
    const statusBar = document.getElementById("status-bar");
    const newKeyBox = document.getElementById("new-key-box");
    const newKeyVal = document.getElementById("new-key-val");
    const tbody = document.getElementById("tbody");
    const themeBtn = document.getElementById("btn-theme");
    let allKeys = [];
    let modalHandler = null;

    const sunSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    const moonSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    function applyTheme(light) {
      document.body.classList.toggle("theme-light", light);
      themeBtn.innerHTML = light ? moonSvg : sunSvg;
      localStorage.setItem("snap_admin_theme", light ? "light" : "dark");
    }
    function toggleTheme() {
      applyTheme(!document.body.classList.contains("theme-light"));
    }
    applyTheme(localStorage.getItem("snap_admin_theme") === "light");

    secInput.value = sessionStorage.getItem("snap_admin") || "";

    function showStatus(msg, type) {
      statusBar.textContent = msg;
      statusBar.className = "status-bar show " + (type || "info");
    }

    function openModal({ title, desc, key, tone, confirmText, confirmClass, extraHtml, onConfirm }) {
      const iconMap = {
        blue: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        warn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        danger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
        ok: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      };
      const iconEl = document.getElementById("modal-icon");
      iconEl.className = "modal-icon " + (tone || "blue");
      iconEl.innerHTML = iconMap[tone || "blue"] || "";
      document.getElementById("modal-title").textContent = title || "";
      document.getElementById("modal-desc").textContent = desc || "";
      document.getElementById("modal-key-wrap").innerHTML = key ? ("<code>" + key + "</code>") : "";
      document.getElementById("modal-extra").innerHTML = extraHtml || "";
      const cBtn = document.getElementById("modal-confirm-btn");
      cBtn.textContent = confirmText || "Confirm";
      cBtn.className = confirmClass || "";
      modalHandler = onConfirm;
      cBtn.onclick = async () => {
        if (!modalHandler) return;
        cBtn.disabled = true;
        try {
          const keepOpen = await modalHandler();
          if (keepOpen !== false) closeModal();
        } finally {
          cBtn.disabled = false;
        }
      };
      document.getElementById("modal-backdrop").classList.add("open");
    }

    function closeModal() {
      document.getElementById("modal-backdrop").classList.remove("open");
      modalHandler = null;
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });

    function escapeHtml(str) {
      return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function pad2(n) { return String(n).padStart(2, "0"); }

    function fmtExactDate(iso) {
      if (!iso) return "-";
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return "-";
      return dt.getFullYear() + "-" + pad2(dt.getMonth() + 1) + "-" + pad2(dt.getDate()) +
        " " + pad2(dt.getHours()) + ":" + pad2(dt.getMinutes()) + ":" + pad2(dt.getSeconds());
    }

    function fmtRemaining(expiresAt) {
      if (!expiresAt) return { text: "Lifetime", cls: "ok", daysLeft: 9999 };
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        const ago = Math.abs(diff);
        const d = Math.floor(ago / 86400000);
        const h = Math.floor((ago % 86400000) / 3600000);
        const m = Math.floor((ago % 3600000) / 60000);
        const s = Math.floor((ago % 60000) / 1000);
        const parts = [];
        if (d > 0) parts.push(d + "d");
        if (d > 0 || h > 0) parts.push(pad2(h) + "h");
        parts.push(pad2(m) + "m", pad2(s) + "s");
        return { text: "Expired " + parts.join(" ") + " ago", cls: "bad", daysLeft: -1 };
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(d + "d");
      if (d > 0 || h > 0) parts.push(pad2(h) + "h");
      if (d > 0 || h > 0 || m > 0) parts.push(pad2(m) + "m");
      parts.push(pad2(s) + "s");
      return { text: parts.join(" ") + " left", cls: d <= 3 ? "warn" : "ok", daysLeft: diff / 86400000 };
    }

    function fmtAgo(iso) {
      if (!iso) return "Never";
      const diff = Math.max(0, Date.now() - new Date(iso).getTime());
      if (diff < 60000) return Math.floor(diff / 1000) + "s ago";
      if (diff < 3600000) return Math.floor(diff / 60000) + "m " + pad2(Math.floor((diff % 60000) / 1000)) + "s ago";
      if (diff < 86400000) return Math.floor(diff / 3600000) + "h " + pad2(Math.floor((diff % 3600000) / 60000)) + "m ago";
      return Math.floor(diff / 86400000) + "d ago";
    }

    async function copyText(txt) {
      try {
        await navigator.clipboard.writeText(txt);
        showStatus("Copied key: " + txt, "ok");
      } catch {}
    }

    async function api(url, opts) {
      const secret = secInput.value.trim();
      if (!secret) {
        showStatus("Please enter your Admin Secret first.", "err");
        secInput.focus();
        return null;
      }
      sessionStorage.setItem("snap_admin", secret);
      const res = await fetch(url, {
        ...(opts || {}),
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
          ...((opts && opts.headers) || {})
        }
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error (" + res.status + "): " + text.slice(0, 140));
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || ("Request failed (" + res.status + ")"));
      }
      return data;
    }

    function updateStats() {
      let activeCount = 0, soonCount = 0, badCount = 0, devCount = 0;
      for (const k of allKeys) {
        const rem = fmtRemaining(k.expiresAt);
        const expired = rem.daysLeft < 0;
        devCount += (k.devices || []).length;
        if (k.revoked || expired) badCount++;
        else {
          activeCount++;
          if (rem.daysLeft <= 3) soonCount++;
        }
      }
      document.getElementById("st-total").textContent = allKeys.length;
      document.getElementById("st-active").textContent = activeCount;
      document.getElementById("st-soon").textContent = soonCount;
      document.getElementById("st-devices").textContent = devCount;
      document.getElementById("st-bad").textContent = badCount;
    }

    function renderTable() {
      const q = (document.getElementById("search").value || "").trim().toLowerCase();
      const filter = document.getElementById("filter-status").value;
      const filtered = allKeys.filter(function (k) {
        const rem = fmtRemaining(k.expiresAt);
        const expired = rem.daysLeft < 0;
        const active = !k.revoked && !expired;
        if (filter === "active" && !active) return false;
        if (filter === "soon" && !(active && rem.daysLeft <= 3)) return false;
        if (filter === "expired" && !(!k.revoked && expired)) return false;
        if (filter === "revoked" && !k.revoked) return false;
        if (q) {
          const hay = (String(k.key || "") + " " + String(k.customerName || "") + " " + String(k.notes || "")).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">No matching license keys.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(function (k) {
        const rem = fmtRemaining(k.expiresAt);
        const expired = rem.daysLeft < 0;
        const active = !k.revoked && !expired;
        const statusText = k.revoked ? "Revoked" : (expired ? "Expired" : "Active");
        const safeKey = String(k.key || "").replace(/[^A-Za-z0-9_-]/g, "");
        const devCount = (k.devices || []).length;
        const createdStr = fmtExactDate(k.createdAt);
        const expStr = k.expiresAt ? fmtExactDate(k.expiresAt) : "Never";
        const lastSeenIso = k.lastVerifiedAt || k.updatedAt || "";
        const lastSeenExact = lastSeenIso ? fmtExactDate(lastSeenIso) : "";
        const custHtml = escapeHtml(k.customerName || "-");
        const notesHtml = k.notes ? ("<div class='subtext'>" + escapeHtml(k.notes) + "</div>") : "";
        const planHtml = escapeHtml(k.plan || "PRO");
        return "<tr>" +
          "<td><code>" + safeKey + "</code><div class='subtext'>Created: " + createdStr + "</div></td>" +
          "<td><strong>" + custHtml + "</strong>" + notesHtml + "</td>" +
          "<td>" + planHtml + "</td>" +
          '<td><span class="badge rem-live ' + rem.cls + '" data-exp="' + escapeHtml(k.expiresAt || "") + '">' + rem.text + "</span><div class='subtext'>" + expStr + "</div></td>" +
          "<td>" + devCount + "/" + (k.maxDevices || 1) + "</td>" +
          '<td><span class="ago-live" data-seen="' + escapeHtml(lastSeenIso) + '">' + fmtAgo(lastSeenIso) + "</span>" + (lastSeenExact ? "<div class='subtext'>" + lastSeenExact + "</div>" : "") + "</td>" +
          '<td><span class="badge ' + (active ? "ok" : "bad") + '">' + statusText + "</span></td>" +
          '<td><div class="row" style="gap:6px;">' +
            '<button type="button" class="sec sm" onclick="copyText(\\'' + safeKey + '\\')">Copy</button>' +
            '<button type="button" class="sec sm" onclick="editKey(\\'' + safeKey + '\\')">Edit</button>' +
            '<button type="button" class="blue sm" onclick="renewKey(\\'' + safeKey + '\\')">+ Renew</button>' +
            '<button type="button" class="warn sm" onclick="resetDev(\\'' + safeKey + '\\')">Reset Devices</button>' +
            '<button type="button" class="sm ' + (k.revoked ? "" : "danger") + '" onclick="toggleRevoke(\\'' + safeKey + '\\', ' + (!k.revoked) + ')">' + (k.revoked ? "Restore" : "Revoke") + "</button>" +
            '<button type="button" class="danger sm" onclick="deleteKey(\\'' + safeKey + '\\')" title="Delete key permanently">Del</button>' +
          "</div></td>" +
        "</tr>";
      }).join("");
    }

    setInterval(function () {
      document.querySelectorAll(".rem-live").forEach(function (el) {
        const exp = el.getAttribute("data-exp");
        if (!exp) return;
        const r = fmtRemaining(exp);
        el.textContent = r.text;
        el.className = "badge rem-live " + r.cls;
      });
      document.querySelectorAll(".ago-live").forEach(function (el) {
        const seen = el.getAttribute("data-seen");
        if (seen) el.textContent = fmtAgo(seen);
      });
    }, 1000);

    async function loadKeys() {
      const btn = document.getElementById("btn-connect");
      btn.disabled = true;
      btn.textContent = "Loading...";
      showStatus("Connecting to license server...", "info");
      try {
        const d = await api("/api/admin/keys");
        if (!d) return;
        allKeys = Array.isArray(d.keys) ? d.keys : [];
        updateStats();
        renderTable();
        showStatus("Connected! Loaded " + allKeys.length + " license key(s).", "ok");
      } catch (err) {
        showStatus(err.message || "Failed to load keys", "err");
      } finally {
        btn.disabled = false;
        btn.textContent = "Connect & Refresh";
      }
    }

    async function createKey() {
      const btn = document.getElementById("btn-create");
      btn.disabled = true;
      btn.textContent = "Generating...";
      showStatus("Generating license key...", "info");
      try {
        const d = await api("/api/admin/keys", {
          method: "POST",
          body: JSON.stringify({
            customerName: document.getElementById("cust").value,
            notes: document.getElementById("notes").value,
            plan: document.getElementById("plan").value,
            days: Number(document.getElementById("days").value) || 30,
            maxDevices: Number(document.getElementById("maxDev").value) || 1
          })
        });
        if (!d) return;
        const createdKey = d.record && d.record.key;
        if (createdKey) {
          newKeyVal.textContent = createdKey;
          newKeyBox.classList.add("show");
        }
        document.getElementById("cust").value = "";
        document.getElementById("notes").value = "";
        await loadKeys();
        showStatus("Key created: " + (createdKey || ""), "ok");
      } catch (err) {
        showStatus(err.message || "Failed to create key", "err");
      } finally {
        btn.disabled = false;
        btn.textContent = "+ Generate Key";
      }
    }

    function editKey(key) {
      const rec = allKeys.find((x) => x.key === key);
      if (!rec) return;
      openModal({
        title: "Edit License Details",
        key,
        tone: "blue",
        desc: "Update customer name, plan label, max devices, or notes without regenerating the key.",
        confirmText: "Save Changes",
        confirmClass: "blue",
        extraHtml:
          '<div style="display:grid;gap:9px;">' +
            '<input id="edit-cust" value="' + escapeHtml(rec.customerName || "") + '" placeholder="Customer Name" style="width:100%" />' +
            '<input id="edit-notes" value="' + escapeHtml(rec.notes || "") + '" placeholder="Notes (optional)" style="width:100%" />' +
            '<div class="row">' +
              '<select id="edit-plan" style="flex:1"><option value="PRO"' + (rec.plan !== "TRIAL" ? " selected" : "") + '>PRO</option><option value="TRIAL"' + (rec.plan === "TRIAL" ? " selected" : "") + '>TRIAL</option></select>' +
              '<input id="edit-maxdev" type="number" min="1" value="' + (rec.maxDevices || 1) + '" style="width:110px" title="Max Devices" placeholder="Devices" />' +
            '</div>' +
          '</div>',
        onConfirm: async () => {
          const maxDevices = Math.max(1, Number(document.getElementById("edit-maxdev").value) || 1);
          try {
            showStatus("Saving changes...", "info");
            await api("/api/admin/edit", {
              method: "POST",
              body: JSON.stringify({
                key,
                customerName: document.getElementById("edit-cust").value,
                notes: document.getElementById("edit-notes").value,
                plan: document.getElementById("edit-plan").value,
                maxDevices
              })
            });
            await loadKeys();
            showStatus("Updated " + key, "ok");
          } catch (err) {
            showStatus(err.message, "err");
          }
        }
      });
      setTimeout(() => document.getElementById("edit-cust")?.focus(), 40);
    }

    function exportKeys(fmt) {
      if (!allKeys.length) {
        showStatus("No keys loaded to export.", "err");
        return;
      }
      let content = "", mime = "application/json", ext = "json";
      if (fmt === "csv") {
        ext = "csv";
        mime = "text/csv;charset=utf-8";
        const cols = ["key", "customerName", "notes", "plan", "maxDevices", "devicesCount", "revoked", "createdAt", "expiresAt", "lastVerifiedAt"];
        const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
        const rows = allKeys.map((k) => [
          k.key, k.customerName || "", k.notes || "", k.plan || "PRO", k.maxDevices || 1,
          (k.devices || []).length, Boolean(k.revoked), k.createdAt || "", k.expiresAt || "", k.lastVerifiedAt || ""
        ].map(esc).join(","));
        content = [cols.join(","), ...rows].join("\\n");
      } else {
        content = JSON.stringify(allKeys, null, 2);
      }
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "salessnap-licenses-" + new Date().toISOString().slice(0, 10) + "." + ext;
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Exported " + allKeys.length + " keys (" + ext.toUpperCase() + ").", "ok");
    }

    function renewKey(key) {
      openModal({
        title: "Renew License Key",
        key,
        tone: "blue",
        desc: "Choose how many days to add to this subscription. If already expired, the new duration starts from today.",
        confirmText: "Renew License",
        confirmClass: "blue",
        extraHtml:
          '<div class="preset-row">' +
            '<button type="button" class="preset-btn" onclick="document.getElementById(\\'renew-days-input\\').value=7">+7 days</button>' +
            '<button type="button" class="preset-btn" onclick="document.getElementById(\\'renew-days-input\\').value=30">+30 days</button>' +
            '<button type="button" class="preset-btn" onclick="document.getElementById(\\'renew-days-input\\').value=90">+90 days</button>' +
            '<button type="button" class="preset-btn" onclick="document.getElementById(\\'renew-days-input\\').value=365">+1 year</button>' +
          '</div>' +
          '<input id="renew-days-input" type="number" min="1" value="30" style="width:100%" placeholder="Enter number of days..." />',
        onConfirm: async () => {
          const days = Number(document.getElementById("renew-days-input").value);
          if (!Number.isFinite(days) || days <= 0) {
            showStatus("Please enter a valid positive number of days.", "err");
            return false;
          }
          try {
            showStatus("Renewing license for +" + days + " days...", "info");
            await api("/api/admin/renew", { method: "POST", body: JSON.stringify({ key, days }) });
            await loadKeys();
            showStatus("Renewed " + key + " by +" + days + " days.", "ok");
          } catch (err) {
            showStatus(err.message, "err");
          }
        }
      });
      setTimeout(() => document.getElementById("renew-days-input")?.focus(), 40);
    }

    function toggleRevoke(key, revoked) {
      openModal({
        title: revoked ? "Revoke License Key?" : "Restore License Key?",
        key,
        tone: revoked ? "danger" : "ok",
        desc: revoked
          ? "This key will be blocked immediately and any active devices will lose access on their next verification check."
          : "This key will be re-enabled so the customer can use it again.",
        confirmText: revoked ? "Yes, Revoke Key" : "Yes, Restore Key",
        confirmClass: revoked ? "danger" : "",
        onConfirm: async () => {
          try {
            showStatus(revoked ? "Revoking key..." : "Restoring key...", "info");
            await api("/api/admin/revoke", { method: "POST", body: JSON.stringify({ key, revoked }) });
            await loadKeys();
            showStatus((revoked ? "Revoked " : "Restored ") + key, "ok");
          } catch (err) {
            showStatus(err.message, "err");
          }
        }
      });
    }

    function resetDev(key) {
      openModal({
        title: "Reset Registered Devices?",
        key,
        tone: "warn",
        desc: "All currently registered devices for this key will be cleared and automatically logged out on their next check. The customer will need to re-activate.",
        confirmText: "Yes, Reset Devices",
        confirmClass: "warn",
        onConfirm: async () => {
          try {
            showStatus("Resetting devices...", "info");
            await api("/api/admin/reset-devices", { method: "POST", body: JSON.stringify({ key }) });
            await loadKeys();
            showStatus("Devices reset for " + key + ". Previous devices have been logged out.", "ok");
          } catch (err) {
            showStatus(err.message, "err");
          }
        }
      });
    }

    function deleteKey(key) {
      openModal({
        title: "Delete License Key Permanently?",
        key,
        tone: "danger",
        desc: "This action cannot be undone. The license key and all its device records will be permanently removed.",
        confirmText: "Delete Permanently",
        confirmClass: "danger",
        onConfirm: async () => {
          try {
            showStatus("Deleting key...", "info");
            await api("/api/admin/delete", { method: "POST", body: JSON.stringify({ key }) });
            await loadKeys();
            showStatus("Deleted key " + key, "ok");
          } catch (err) {
            showStatus(err.message, "err");
          }
        }
      });
    }

    secInput.addEventListener("keydown", function (e) { if (e.key === "Enter") loadKeys(); });
    document.getElementById("cust").addEventListener("keydown", function (e) { if (e.key === "Enter") createKey(); });
    if (secInput.value) loadKeys();
  </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/admin" && request.method === "GET") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (path === "/api/activate" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const key = normalizeKey(body.key);
      const deviceId = String(body.deviceId || "").trim();
      if (!key || !deviceId) return json({ ok: false, error: "License key and deviceId are required." }, 400);

      const raw = await env.LICENSES.get(`key:${key}`);
      const record = raw ? JSON.parse(raw) : null;
      const check = validateLicenseRecord(record, deviceId);
      if (!check.ok) return json(check, 403);

      const devices = Array.isArray(record.devices) ? record.devices : [];
      if (!devices.includes(deviceId)) {
        devices.push(deviceId);
        record.devices = devices;
      }
      record.lastVerifiedAt = new Date().toISOString();
      record.updatedAt = new Date().toISOString();
      await env.LICENSES.put(`key:${key}`, JSON.stringify(record));

      return json({
        ok: true,
        key: record.key,
        plan: record.plan,
        expiresAt: record.expiresAt,
        maxDevices: record.maxDevices,
        workflows: STARTER_RESOURCES
      });
    }

    if (path === "/api/verify" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const key = normalizeKey(body.key);
      const deviceId = String(body.deviceId || "").trim();
      if (!key || !deviceId) return json({ ok: false, error: "Missing key or deviceId." }, 400);

      const raw = await env.LICENSES.get(`key:${key}`);
      const record = raw ? JSON.parse(raw) : null;
      const check = validateLicenseRecord(record, deviceId, { requireRegisteredDevice: true });
      if (!check.ok) return json(check, 403);

      const lastMs = record.lastVerifiedAt ? new Date(record.lastVerifiedAt).getTime() : 0;
      if (!lastMs || (Date.now() - lastMs) >= 30 * 60 * 1000) {
        record.lastVerifiedAt = new Date().toISOString();
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
      }

      return json({ ok: true, plan: record.plan, expiresAt: record.expiresAt });
    }

    // Admin Endpoints
    if (path.startsWith("/api/admin/")) {
      if (!isAdmin(request, env)) return json({ ok: false, error: "Unauthorized" }, 401);

      if (path === "/api/admin/keys" && request.method === "GET") {
        const list = await env.LICENSES.list({ prefix: "key:" });
        const values = await Promise.all(list.keys.map((item) => env.LICENSES.get(item.name)));
        const keys = values.filter(Boolean).map((val) => JSON.parse(val));
        keys.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return json({ ok: true, keys });
      }

      if (path === "/api/admin/keys" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key) || generateLicenseKey();
        const days = Number(body.days) || 30;
        const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
        const record = {
          key,
          customerName: String(body.customerName || "").trim(),
          notes: String(body.notes || "").trim().slice(0, 300),
          plan: String(body.plan || "PRO").toUpperCase(),
          maxDevices: Math.max(1, Number(body.maxDevices) || 1),
          devices: [],
          revoked: false,
          createdAt: new Date().toISOString(),
          expiresAt
        };
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }

      if (path === "/api/admin/edit" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key);
        const raw = await env.LICENSES.get(`key:${key}`);
        if (!raw) return json({ ok: false, error: "Key not found" }, 404);
        const record = JSON.parse(raw);
        if (body.customerName !== undefined) record.customerName = String(body.customerName || "").trim();
        if (body.notes !== undefined) record.notes = String(body.notes || "").trim().slice(0, 300);
        if (body.plan !== undefined) record.plan = String(body.plan || "PRO").toUpperCase() === "TRIAL" ? "TRIAL" : "PRO";
        if (body.maxDevices !== undefined) record.maxDevices = Math.max(1, Number(body.maxDevices) || 1);
        record.updatedAt = new Date().toISOString();
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }

      if (path === "/api/admin/revoke" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key);
        const raw = await env.LICENSES.get(`key:${key}`);
        if (!raw) return json({ ok: false, error: "Key not found" }, 404);
        const record = JSON.parse(raw);
        record.revoked = Boolean(body.revoked);
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }

      if (path === "/api/admin/reset-devices" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key);
        const raw = await env.LICENSES.get(`key:${key}`);
        if (!raw) return json({ ok: false, error: "Key not found" }, 404);
        const record = JSON.parse(raw);
        record.devices = [];
        record.updatedAt = new Date().toISOString();
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }

      if (path === "/api/admin/renew" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key);
        const days = Number(body.days);
        if (!key || !Number.isFinite(days) || days <= 0) {
          return json({ ok: false, error: "Valid key and positive days are required." }, 400);
        }
        const raw = await env.LICENSES.get(`key:${key}`);
        if (!raw) return json({ ok: false, error: "Key not found" }, 404);
        const record = JSON.parse(raw);
        const currentExp = record.expiresAt ? new Date(record.expiresAt).getTime() : 0;
        const baseTime = currentExp > Date.now() ? currentExp : Date.now();
        record.expiresAt = new Date(baseTime + days * 86400000).toISOString();
        record.revoked = false;
        record.updatedAt = new Date().toISOString();
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }

      if (path === "/api/admin/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const key = normalizeKey(body.key);
        if (!key) return json({ ok: false, error: "Key is required." }, 400);
        await env.LICENSES.delete(`key:${key}`);
        return json({ ok: true });
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};

