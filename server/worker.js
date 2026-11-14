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
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b1120; color: #e2e8f0; margin: 0; padding: 24px; }
    .wrap { max-width: 1140px; margin: 0 auto; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 22px; color: #34d399; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }
    .stat-card { background: #131c31; border: 1px solid #26334d; border-radius: 12px; padding: 12px 14px; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 700; }
    .stat-val { font-size: 22px; font-weight: 800; color: #f8fafc; margin-top: 4px; }
    .stat-val.green { color: #34d399; }
    .stat-val.amber { color: #fbbf24; }
    .stat-val.red { color: #f87171; }
    .card { background: #131c31; border: 1px solid #26334d; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    input, select { background: #0b1120; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px 11px; font-size: 13px; outline: none; }
    input:focus, select:focus { border-color: #10b981; }
    button { background: #10b981; color: #052e16; border: none; border-radius: 8px; padding: 8px 13px; font-weight: 700; font-size: 12.5px; cursor: pointer; transition: transform 0.1s ease, opacity 0.15s ease, background 0.15s ease; }
    button:hover { opacity: 0.92; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:disabled { opacity: 0.55; cursor: wait; transform: none; }
    button.danger { background: #ef4444; color: #fff; }
    button.warn { background: #f59e0b; color: #1f1600; }
    button.blue { background: #3b82f6; color: #fff; }
    button.sec { background: #26334d; color: #e2e8f0; }
    button.sm { padding: 5px 9px; font-size: 11.5px; border-radius: 6px; }
    .status-bar { display: none; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 14px; border: 1px solid transparent; }
    .status-bar.show { display: block; }
    .status-bar.ok { background: rgba(16, 185, 129, 0.14); border-color: rgba(16, 185, 129, 0.45); color: #6ee7b7; }
    .status-bar.err { background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.45); color: #fca5a5; }
    .status-bar.info { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.45); color: #bae6fd; }
    .new-key-box { display: none; background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .new-key-box.show { display: flex; }
    .new-key-code { font-family: ui-monospace, monospace; font-size: 18px; font-weight: 800; color: #34d399; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #26334d; vertical-align: middle; }
    th { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    code { background: #0b1120; padding: 3px 7px; border-radius: 6px; font-size: 12px; color: #34d399; border: 1px solid #1e293b; }
    .subtext { font-size: 11px; color: #94a3b8; margin-top: 3px; }
    .badge { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; display: inline-block; }
    .badge.ok { background: #064e3b; color: #6ee7b7; }
    .badge.warn { background: #78350f; color: #fde68a; }
    .badge.bad { background: #7f1d1d; color: #fca5a5; }
    .empty { text-align: center; padding: 28px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <h1>⚡ SalesSnap — License Admin</h1>
      <div class="row">
        <input id="secret" type="password" placeholder="Admin Secret..." style="width:210px" />
        <button id="btn-connect" type="button" onclick="loadKeys()">Connect & Refresh</button>
      </div>
    </div>

    <div id="status-bar" class="status-bar"></div>

    <div class="stats" id="stats">
      <div class="stat-card"><div class="stat-lbl">Total Keys</div><div class="stat-val" id="st-total">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Active Keys</div><div class="stat-val green" id="st-active">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Expiring ≤ 3d</div><div class="stat-val amber" id="st-soon">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Active Devices</div><div class="stat-val" id="st-devices">0</div></div>
      <div class="stat-card"><div class="stat-lbl">Revoked / Expired</div><div class="stat-val red" id="st-bad">0</div></div>
    </div>

    <div id="new-key-box" class="new-key-box">
      <div>
        <div style="font-size:12px;color:#a7f3d0;margin-bottom:3px;">New License Key Created:</div>
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
          <option value="soon">Expiring Soon (≤ 3d)</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Key</th><th>Customer</th><th>Plan</th><th>Remaining / Expires</th><th>Devices</th><th>Last Seen</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="tbody"><tr><td colspan="8" class="empty">Enter Admin Secret and click "Connect & Refresh"</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    const secInput = document.getElementById("secret");
    const statusBar = document.getElementById("status-bar");
    const newKeyBox = document.getElementById("new-key-box");
    const newKeyVal = document.getElementById("new-key-val");
    const tbody = document.getElementById("tbody");
    let allKeys = [];

    secInput.value = sessionStorage.getItem("snap_admin") || "";

    function showStatus(msg, type) {
      statusBar.textContent = msg;
      statusBar.className = "status-bar show " + (type || "info");
    }

    function fmtRemaining(expiresAt) {
      if (!expiresAt) return { text: "Lifetime", cls: "ok", daysLeft: 9999 };
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        const ago = Math.abs(diff);
        const d = Math.floor(ago / 86400000);
        const h = Math.floor((ago % 86400000) / 3600000);
        return { text: "Expired " + (d > 0 ? d + "d " : "") + h + "h ago", cls: "bad", daysLeft: -1 };
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const text = d > 0 ? (d + "d " + h + "h left") : (h > 0 ? (h + "h " + m + "m left") : (m + "m left"));
      return { text, cls: d <= 3 ? "warn" : "ok", daysLeft: diff / 86400000 };
    }

    function fmtAgo(iso) {
      if (!iso) return "Never";
      const diff = Date.now() - new Date(iso).getTime();
      if (diff < 60000) return "Just now";
      if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
      if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
      return Math.floor(diff / 86400000) + "d ago";
    }

    async function copyText(txt) {
      try {
        await navigator.clipboard.writeText(txt);
        showStatus("Copied key: " + txt, "ok");
      } catch {
        prompt("Copy this key:", txt);
      }
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
          const hay = (String(k.key || "") + " " + String(k.customerName || "")).toLowerCase();
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
        const safeKey = String(k.key || "").replace(/'/g, "");
        const devCount = (k.devices || []).length;
        const createdStr = k.createdAt ? k.createdAt.slice(0, 10) : "-";
        const expStr = k.expiresAt ? k.expiresAt.slice(0, 10) : "Never";
        return "<tr>" +
          "<td><code>" + safeKey + "</code><div class='subtext'>Created: " + createdStr + "</div></td>" +
          "<td><strong>" + (k.customerName || "-") + "</strong></td>" +
          "<td>" + (k.plan || "PRO") + "</td>" +
          '<td><span class="badge ' + rem.cls + '">' + rem.text + "</span><div class='subtext'>" + expStr + "</div></td>" +
          "<td>" + devCount + "/" + (k.maxDevices || 1) + "</td>" +
          "<td>" + fmtAgo(k.lastVerifiedAt || k.updatedAt) + "</td>" +
          '<td><span class="badge ' + (active ? "ok" : "bad") + '">' + statusText + "</span></td>" +
          '<td class="row">' +
            '<button type="button" class="sec sm" onclick="copyText(\\'' + safeKey + '\\')">Copy</button>' +
            '<button type="button" class="blue sm" onclick="renewKey(\\'' + safeKey + '\\')">+ Renew</button>' +
            '<button type="button" class="warn sm" onclick="resetDev(\\'' + safeKey + '\\')">Reset Devices</button>' +
            '<button type="button" class="sm ' + (k.revoked ? "" : "danger") + '" onclick="toggleRevoke(\\'' + safeKey + '\\', ' + (!k.revoked) + ')">' + (k.revoked ? "Restore" : "Revoke") + "</button>" +
            '<button type="button" class="danger sm" onclick="deleteKey(\\'' + safeKey + '\\')" title="Delete key permanently">Del</button>' +
          "</td>" +
        "</tr>";
      }).join("");
    }

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
        await loadKeys();
        showStatus("Key created: " + (createdKey || ""), "ok");
      } catch (err) {
        showStatus(err.message || "Failed to create key", "err");
      } finally {
        btn.disabled = false;
        btn.textContent = "+ Generate Key";
      }
    }

    async function renewKey(key) {
      const input = prompt("How many days to add to " + key + "?", "30");
      if (!input) return;
      const days = Number(input);
      if (!Number.isFinite(days) || days <= 0) {
        showStatus("Please enter a valid positive number of days.", "err");
        return;
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

    async function toggleRevoke(key, revoked) {
      try {
        showStatus("Updating key...", "info");
        await api("/api/admin/revoke", { method: "POST", body: JSON.stringify({ key, revoked }) });
        await loadKeys();
      } catch (err) {
        showStatus(err.message, "err");
      }
    }

    async function resetDev(key) {
      if (!confirm("Reset all registered devices for " + key + "? Existing devices will be logged out on next check.")) return;
      try {
        showStatus("Resetting devices (existing devices will be logged out)...", "info");
        await api("/api/admin/reset-devices", { method: "POST", body: JSON.stringify({ key }) });
        await loadKeys();
        showStatus("Devices reset for " + key + ". Previous devices have been logged out.", "ok");
      } catch (err) {
        showStatus(err.message, "err");
      }
    }

    async function deleteKey(key) {
      if (!confirm("Permanently delete license key " + key + "?")) return;
      try {
        showStatus("Deleting key...", "info");
        await api("/api/admin/delete", { method: "POST", body: JSON.stringify({ key }) });
        await loadKeys();
        showStatus("Deleted key " + key, "ok");
      } catch (err) {
        showStatus(err.message, "err");
      }
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

      record.lastVerifiedAt = new Date().toISOString();
      await env.LICENSES.put(`key:${key}`, JSON.stringify(record));

      return json({ ok: true, plan: record.plan, expiresAt: record.expiresAt });
    }

    // Admin Endpoints
    if (path.startsWith("/api/admin/")) {
      if (!isAdmin(request, env)) return json({ ok: false, error: "Unauthorized" }, 401);

      if (path === "/api/admin/keys" && request.method === "GET") {
        const list = await env.LICENSES.list({ prefix: "key:" });
        const keys = [];
        for (const item of list.keys) {
          const val = await env.LICENSES.get(item.name);
          if (val) keys.push(JSON.parse(val));
        }
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

