/** SalesSnap — Pure Vanilla JS Background Service Worker with License Verification */
(() => {
  "use strict";

  const STORAGE_KEY = "resources";
  const LICENSE_KEY = "qfeLicense";
  const DEVICE_ID_KEY = "qfeDeviceId";
  const DEFAULT_API_URL = "https://salessnap-license-api.seif12300656.workers.dev";
  const VERIFY_INTERVAL_MS = 60 * 1000; // 1 minute

  const parseStoredList = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch { }
    }
    return [];
  };

  const sortByUpdatedDesc = (arr) =>
    [...(arr || [])].sort((a, b) => {
      const ta = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });

  const getOrCreateDeviceId = async () => {
    const data = await chrome.storage.local.get([DEVICE_ID_KEY]);
    if (data?.[DEVICE_ID_KEY]) return data[DEVICE_ID_KEY];
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await chrome.storage.local.set({ [DEVICE_ID_KEY]: id });
    return id;
  };

  const cleanApiUrl = (url) => String(url || DEFAULT_API_URL).trim().replace(/\/+$/, "");

  const activateLicense = async ({ key, apiUrl }) => {
    const cleanKey = String(key || "").trim().toUpperCase();
    const baseUrl = cleanApiUrl(apiUrl);
    if (!cleanKey) return { ok: false, error: "Please enter a license key." };

    const deviceId = await getOrCreateDeviceId();
    try {
      const res = await fetch(`${baseUrl}/api/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey, deviceId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        return { ok: false, error: data?.error || `Activation failed (${res.status})` };
      }

      const licenseState = {
        key: data.key || cleanKey,
        status: "active",
        plan: data.plan || "PRO",
        expiresAt: data.expiresAt || null,
        apiUrl: baseUrl,
        workflowsVersion: data.workflowsVersion || null,
        lastVerifiedAt: Date.now()
      };

      const toSave = { [LICENSE_KEY]: licenseState };
      if (Array.isArray(data.workflows) && data.workflows.length > 0) {
        toSave[STORAGE_KEY] = JSON.stringify(data.workflows);
      }
      await chrome.storage.local.set(toSave);
      scheduleMenuRebuild();
      return { ok: true, license: licenseState };
    } catch (err) {
      return { ok: false, error: `Network error: ${err?.message || "Cannot reach license server"}` };
    }
  };

  const verifyLicense = async (force = false) => {
    const stored = await chrome.storage.local.get([LICENSE_KEY]);
    const lic = stored?.[LICENSE_KEY];
    if (!lic || !lic.key || lic.status !== "active") {
      return { ok: false, status: "locked" };
    }

    if (lic.expiresAt && Date.now() > new Date(lic.expiresAt).getTime()) {
      await chrome.storage.local.set({
        [LICENSE_KEY]: { ...lic, status: "locked", error: "License expired" }
      });
      await chrome.storage.local.remove([STORAGE_KEY]);
      scheduleMenuRebuild();
      return { ok: false, error: "License expired" };
    }

    if (!force && lic.lastVerifiedAt && Date.now() - lic.lastVerifiedAt < VERIFY_INTERVAL_MS) {
      return { ok: true, license: lic };
    }

    const deviceId = await getOrCreateDeviceId();
    const baseUrl = cleanApiUrl(lic.apiUrl);
    try {
      const res = await fetch(`${baseUrl}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: lic.key,
          deviceId,
          workflowsVersion: lic.workflowsVersion || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403 || data?.ok === false) {
        await chrome.storage.local.set({
          [LICENSE_KEY]: { ...lic, status: "locked", error: data?.error || "License invalid" }
        });
        await chrome.storage.local.remove([STORAGE_KEY]);
        scheduleMenuRebuild();
        return { ok: false, error: data?.error || "License invalid" };
      }
      if (res.ok && data?.ok) {
        const updated = {
          ...lic,
          plan: data.plan || lic.plan,
          expiresAt: data.expiresAt || lic.expiresAt,
          workflowsVersion: data.workflowsVersion || lic.workflowsVersion || null,
          lastVerifiedAt: Date.now(),
          error: null
        };
        const toSave = { [LICENSE_KEY]: updated };
        const hasNewWorkflows = Array.isArray(data.workflows) && data.workflows.length > 0;
        if (hasNewWorkflows) {
          toSave[STORAGE_KEY] = JSON.stringify(data.workflows);
        }
        await chrome.storage.local.set(toSave);
        if (hasNewWorkflows) scheduleMenuRebuild();
        return { ok: true, license: updated };
      }
    } catch {
      // Offline grace: keep current active state if temporarily unreachable
    }
    return { ok: true, license: lic };
  };

  const deactivateLicense = async () => {
    await chrome.storage.local.remove([LICENSE_KEY, STORAGE_KEY]);
    scheduleMenuRebuild();
    return { ok: true };
  };

  // Context menus
  const ROOT_ID = "salessnap_root";
  const PROFILES_ID = "salessnap_profiles";
  const RESOURCES_ID = "salessnap_resources";
  const FILL_FIELD_ID = "salessnap_fill_field";
  const PROFILE_PREFIX = "salessnap_profile_item_";
  const RESOURCE_PREFIX = "salessnap_resource_item_";
  const FIELD_PREFIX = "salessnap_field_item_";
  const FIELD_SEP = "__FIELD__";

  let menuRebuildTimer = null;
  const rebuildContextMenus = async () => {
    if (!chrome.contextMenus) return;
    try {
      const data = await chrome.storage.local.get(["resources", "profiles", LICENSE_KEY]);
      if (data?.[LICENSE_KEY]?.status !== "active") {
        chrome.contextMenus.removeAll(() => void chrome.runtime?.lastError);
        return;
      }
      const resources = sortByUpdatedDesc(parseStoredList(data?.resources));
      const profiles = sortByUpdatedDesc(parseStoredList(data?.profiles));

      const items = [
        { id: ROOT_ID, title: "SalesSnap", contexts: ["all"] },
        { id: RESOURCES_ID, parentId: ROOT_ID, title: "Workflows", contexts: ["all"] },
        { id: PROFILES_ID, parentId: ROOT_ID, title: "Profiles", contexts: ["all"] },
        { id: FILL_FIELD_ID, parentId: ROOT_ID, title: "Fill this field", contexts: ["editable"] }
      ];

      for (const r of resources) {
        if (!r?.id || !r?.name) continue;
        items.push({ id: `${RESOURCE_PREFIX}${r.id}`, parentId: RESOURCES_ID, title: r.name, contexts: ["all"] });
      }

      for (const p of profiles) {
        if (!p?.id || !p?.name) continue;
        items.push({ id: `${PROFILE_PREFIX}${p.id}`, parentId: PROFILES_ID, title: p.name, contexts: ["all"] });
        if (Array.isArray(p.fields) && p.fields.length) {
          const fpId = `salessnap_fill_profile_${p.id}`;
          items.push({ id: fpId, parentId: FILL_FIELD_ID, title: p.name, contexts: ["editable"] });
          for (const f of p.fields) {
            if (!f?.key) continue;
            items.push({
              id: `${FIELD_PREFIX}${p.id}${FIELD_SEP}${encodeURIComponent(f.key)}`,
              parentId: fpId,
              title: f.key,
              contexts: ["editable"]
            });
          }
        }
      }

      chrome.contextMenus.removeAll(() => {
        for (const item of items) {
          chrome.contextMenus.create(item, () => void chrome.runtime?.lastError);
        }
      });
    } catch { }
  };

  const scheduleMenuRebuild = () => {
    if (menuRebuildTimer) clearTimeout(menuRebuildTimer);
    menuRebuildTimer = setTimeout(rebuildContextMenus, 250);
  };

  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onInstalled?.addListener(() => {
      verifyLicense(false);
      scheduleMenuRebuild();
    });
    chrome.runtime.onStartup?.addListener(() => {
      verifyLicense(false);
      scheduleMenuRebuild();
    });
    chrome.tabs?.onUpdated?.addListener((_tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab?.active) {
        verifyLicense(false);
        scheduleMenuRebuild();
      }
    });
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area === "local" && (changes.resources || changes.profiles || changes[LICENSE_KEY])) {
        scheduleMenuRebuild();
      }
    });
    chrome.contextMenus?.onClicked?.addListener(async (info, tab) => {
      const id = String(info.menuItemId || "");
      let body = null;
      if (id.startsWith(FIELD_PREFIX)) {
        const [profileId, rawKey] = id.slice(FIELD_PREFIX.length).split(FIELD_SEP);
        body = { type: "fill-field", profileId, fieldKey: decodeURIComponent(rawKey || "") };
      } else if (id.startsWith(RESOURCE_PREFIX)) {
        body = { type: "resource", id: id.slice(RESOURCE_PREFIX.length) };
      } else if (id.startsWith(PROFILE_PREFIX)) {
        body = { type: "profile", id: id.slice(PROFILE_PREFIX.length) };
      }
      if (!body) return;
      try {
        let targetTabId = tab?.id;
        if (typeof targetTabId !== "number") {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          targetTabId = activeTab?.id;
        }
        if (typeof targetTabId === "number") {
          chrome.tabs.sendMessage(targetTabId, { name: "content", body }, () => void chrome.runtime?.lastError);
        }
      } catch { }
    });

    chrome.runtime.onMessage?.addListener((msg, _sender, sendResponse) => {
      if (!msg) return false;
      if (msg.name === "activateLicense") {
        activateLicense(msg.body || {}).then(sendResponse);
        return true;
      }
      if (msg.name === "verifyLicense") {
        verifyLicense(Boolean(msg.force)).then(sendResponse);
        return true;
      }
      if (msg.name === "deactivateLicense") {
        deactivateLicense().then(sendResponse);
        return true;
      }
      if (msg.name === "resetStarterResources") {
        chrome.storage.local.get([LICENSE_KEY]).then((st) => {
          const lic = st?.[LICENSE_KEY];
          if (!lic?.key) {
            sendResponse({ ok: false, error: "License required" });
            return;
          }
          activateLicense({ key: lic.key, apiUrl: lic.apiUrl }).then((r) => sendResponse({ ok: r.ok }));
        });
        return true;
      }
      if (msg.name === "saveDetectedProfile") {
        if (msg.body?.redirect && msg.body?.id) {
          chrome.tabs.create({ url: `/options.html#/advanced` });
        }
        sendResponse({ message: "Saved" });
        return false;
      }
      return false;
    });
  }
})();
