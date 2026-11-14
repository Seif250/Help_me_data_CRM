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

const validateLicenseRecord = (record, deviceId) => {
  if (!record) return { ok: false, error: "Invalid license key." };
  if (record.revoked) return { ok: false, error: "License has been revoked." };
  if (record.expiresAt && Date.now() > new Date(record.expiresAt).getTime()) {
    return { ok: false, error: "License expired. Please renew your subscription." };
  }
  const devices = Array.isArray(record.devices) ? record.devices : [];
  const maxDevices = Number(record.maxDevices) || 1;
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
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }
    .wrap { max-width: 980px; margin: 0 auto; }
    h1 { margin: 0 0 16px; font-size: 22px; color: #34d399; display: flex; align-items: center; gap: 8px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    input, select { background: #0f172a; color: #f8fafc; border: 1px solid #475569; border-radius: 8px; padding: 9px 11px; font-size: 13px; outline: none; }
    input:focus, select:focus { border-color: #10b981; }
    button { background: #10b981; color: #052e16; border: none; border-radius: 8px; padding: 9px 14px; font-weight: 700; font-size: 13px; cursor: pointer; transition: transform 0.1s ease, opacity 0.15s ease, background 0.15s ease; }
    button:hover { opacity: 0.92; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:disabled { opacity: 0.55; cursor: wait; transform: none; }
    button.danger { background: #ef4444; color: #fff; }
    button.sec { background: #334155; color: #e2e8f0; }
    button.sm { padding: 5px 10px; font-size: 12px; }
    .status-bar { display: none; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 14px; border: 1px solid transparent; }
    .status-bar.show { display: block; }
    .status-bar.ok { background: rgba(16, 185, 129, 0.14); border-color: rgba(16, 185, 129, 0.45); color: #6ee7b7; }
    .status-bar.err { background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.45); color: #fca5a5; }
    .status-bar.info { background: rgba(56, 189, 248, 0.14); border-color: rgba(56, 189, 248, 0.45); color: #bae6fd; }
    .new-key-box { display: none; background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .new-key-box.show { display: flex; }
    .new-key-code { font-family: ui-monospace, monospace; font-size: 18px; font-weight: 800; color: #34d399; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    code { background: #0f172a; padding: 3px 7px; border-radius: 6px; font-size: 12.5px; color: #34d399; }
    .badge { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge.ok { background: #064e3b; color: #6ee7b7; }
    .badge.bad { background: #7f1d1d; color: #fca5a5; }
    .empty { text-align: center; padding: 28px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>⚡ SalesSnap — License Admin</h1>

    <div id="status-bar" class="status-bar"></div>

    <div id="new-key-box" class="new-key-box">
      <div>
        <div style="font-size:12px;color:#a7f3d0;margin-bottom:3px;">New License Key Created:</div>
        <div id="new-key-val" class="new-key-code"></div>
      </div>
      <button type="button" onclick="copyText(document.getElementById('new-key-val').textContent)">📋 Copy Key</button>
    </div>

    <div class="card row">
      <input id="secret" type="password" placeholder="Enter Admin Secret..." style="flex:1;min-width:200px" />
      <button id="btn-connect" type="button" onclick="loadKeys()">Connect & Load Keys</button>
    </div>

    <div class="card">
      <div class="row">
        <input id="cust" placeholder="Customer Name (e.g. Ahmed)" style="flex:1;min-width:180px" />
        <select id="plan"><option value="PRO">PRO</option><option value="TRIAL">TRIAL</option></select>
        <input id="days" type="number" value="30" min="1" style="width:90px" title="Days" />
        <input id="maxDev" type="number" value="1" min="1" style="width:75px" title="Max Devices" />
        <button id="btn-create" type="button" onclick="createKey()">+ Generate Key</button>
      </div>
    </div>

    <div class="card" style="overflow-x:auto">
      <table>
        <thead><tr><th>Key</th><th>Customer</th><th>Plan</th><th>Expires</th><th>Devices</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="tbody"><tr><td colspan="7" class="empty">Enter Admin Secret and click "Connect & Load Keys"</td></tr></tbody>
      </table>
    </div>
  </div>
  <script>
    const secInput = document.getElementById("secret");
    const statusBar = document.getElementById("status-bar");
    const newKeyBox = document.getElementById("new-key-box");
    const newKeyVal = document.getElementById("new-key-val");
    const tbody = document.getElementById("tbody");

    secInput.value = sessionStorage.getItem("snap_admin") || "";

    function showStatus(msg, type) {
      statusBar.textContent = msg;
      statusBar.className = "status-bar show " + (type || "info");
    }

    async function copyText(txt) {
      try {
        await navigator.clipboard.writeText(txt);
        showStatus("📋 Copied key: " + txt, "ok");
      } catch {
        prompt("Copy this key:", txt);
      }
    }

    async function api(url, opts) {
      const secret = secInput.value.trim();
      if (!secret) {
        showStatus("⚠️ Please enter your Admin Secret first.", "err");
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

    async function loadKeys() {
      const btn = document.getElementById("btn-connect");
      btn.disabled = true;
      btn.textContent = "Loading...";
      showStatus("⏳ Connecting to license server...", "info");
      try {
        const d = await api("/api/admin/keys");
        if (!d) return;
        const keys = Array.isArray(d.keys) ? d.keys : [];
        if (keys.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="empty">Connected! No license keys yet. Generate your first key above.</td></tr>';
        } else {
          tbody.innerHTML = keys.map(function (k) {
            const expired = k.expiresAt && Date.now() > new Date(k.expiresAt).getTime();
            const active = !k.revoked && !expired;
            const statusText = k.revoked ? "Revoked" : (expired ? "Expired" : "Active");
            const safeKey = String(k.key || "").replace(/'/g, "");
            return "<tr>" +
              "<td><code>" + safeKey + "</code></td>" +
              "<td>" + (k.customerName || "-") + "</td>" +
              "<td>" + (k.plan || "PRO") + "</td>" +
              "<td>" + (k.expiresAt ? k.expiresAt.slice(0, 10) : "Never") + "</td>" +
              "<td>" + ((k.devices || []).length) + "/" + (k.maxDevices || 1) + "</td>" +
              '<td><span class="badge ' + (active ? "ok" : "bad") + '">' + statusText + "</span></td>" +
              '<td class="row">' +
                '<button type="button" class="sec sm" onclick="copyText(\\'' + safeKey + '\\')">📋 Copy</button>' +
                '<button type="button" class="sec sm" onclick="resetDev(\\'' + safeKey + '\\')">Reset Devices</button>' +
                '<button type="button" class="sm ' + (k.revoked ? "" : "danger") + '" onclick="toggleRevoke(\\'' + safeKey + '\\', ' + (!k.revoked) + ')">' + (k.revoked ? "Restore" : "Revoke") + "</button>" +
              "</td>" +
            "</tr>";
          }).join("");
        }
        showStatus("✅ Connected! Loaded " + keys.length + " license key(s).", "ok");
      } catch (err) {
        showStatus("❌ " + (err.message || "Failed to load keys"), "err");
      } finally {
        btn.disabled = false;
        btn.textContent = "Connect & Load Keys";
      }
    }

    async function createKey() {
      const btn = document.getElementById("btn-create");
      btn.disabled = true;
      btn.textContent = "Generating...";
      showStatus("⏳ Generating license key...", "info");
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
        showStatus("✅ Key created: " + (createdKey || ""), "ok");
      } catch (err) {
        showStatus("❌ " + (err.message || "Failed to create key"), "err");
      } finally {
        btn.disabled = false;
        btn.textContent = "+ Generate Key";
      }
    }

    async function toggleRevoke(key, revoked) {
      try {
        showStatus("⏳ Updating key...", "info");
        await api("/api/admin/revoke", { method: "POST", body: JSON.stringify({ key, revoked }) });
        await loadKeys();
      } catch (err) {
        showStatus("❌ " + err.message, "err");
      }
    }

    async function resetDev(key) {
      try {
        showStatus("⏳ Resetting devices...", "info");
        await api("/api/admin/reset-devices", { method: "POST", body: JSON.stringify({ key }) });
        await loadKeys();
      } catch (err) {
        showStatus("❌ " + err.message, "err");
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
        record.updatedAt = new Date().toISOString();
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
      }

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
      const check = validateLicenseRecord(record, deviceId);
      if (!check.ok) return json(check, 403);

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
        await env.LICENSES.put(`key:${key}`, JSON.stringify(record));
        return json({ ok: true, record });
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};

