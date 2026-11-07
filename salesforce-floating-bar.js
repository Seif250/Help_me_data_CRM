(() => {
  if (window.__helpSeifFloatingBarLoaded) return;
  window.__helpSeifFloatingBarLoaded = true;

  const FLEX_OPTIONS_KEY = "qfeFlexibleFieldOptions";
  const FLEX_FIELD_3_KEY = "qfeFlexibleFieldValue";
  const WON_FIELD_4_KEY = "qfeFlexibleField4Value";
  const SPEED_STORAGE_KEY = "qfeDelayMultiplier";
  const ORDER_KEY = "flexiScriptOrder";
  const FLOAT_ENABLED_KEY = "qfeFloatingBarEnabled";
  const FLOAT_COLLAPSED_KEY = "qfeFloatingBarCollapsed";
  const FLOAT_TOP_KEY = "qfeFloatingBarTop";
  const SMS_ID_SUFFIX_KEY = "qfeSmsIdSuffix";
  const TARGET_OWNER_KEY = "qfeTargetOwnerName";
  const FLOAT_SEC_CUST_KEY = "qfeFloatSecCust";
  const FLOAT_SEC_CTRL_KEY = "qfeFloatSecCtrl";
  const FLOAT_SEC_WF_KEY = "qfeFloatSecWf";

  // Caches so once Account Phone/Email or Opportunity SMS ID is read, it stays available
  const accountDetailsCache = new Map();
  const recordSmsIdCache = new Map();

  const FLEX_FIELD_3_SELECTOR =
    'textarea[name="Flexible_Field_3_Value__c"], input[name="Flexible_Field_3_Value__c"], [data-target-selection-name*="Flexible_Field_3_Value"] textarea, [data-target-selection-name*="Flexible_Field_3_Value"] input';
  const FLEX_FIELD_4_SELECTOR =
    'textarea[name="Flexible_Field_4_Value__c"], input[name="Flexible_Field_4_Value__c"], [data-target-selection-name*="Flexible_Field_4_Value"] textarea, [data-target-selection-name*="Flexible_Field_4_Value"] input';

  const FLEX_FIELD_3_WORKFLOWS = new Set([
    "no answer",
    "follow up",
    "will call us back",
    "not interested",
    "sent link",
  ]);

  const DEFAULT_FLEX_3_OPTIONS = [
    "BEG 10% List",
    "ANR",
    "LED",
    "REG 10%",
    "BEG T1 RES",
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getRecordCacheKey = () => {
    const m = String(window.location.pathname || "").match(
      /\/lightning\/r\/(?:[^/]+\/)?([a-zA-Z0-9]{15,18})\b/
    );
    return m ? m[1] : String(window.location.pathname || "");
  };

  const isSalesforcePage = () => {
    const h = String(window.location.hostname || "").toLowerCase();
    return (
      h.includes("salesforce.com") ||
      h.includes("force.com") ||
      h.includes("cloudforce.com") ||
      h.includes("salesforceliveagent.com") ||
      !!document.querySelector(
        "one-record-home-flexipage2, records-lwc-detail-panel, .slds-GlobalHeader, lightning-formatted-text"
      )
    );
  };

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    try {
      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }
      return el.getClientRects().length > 0;
    } catch {
      return false;
    }
  };

  // Cached shadow roots list (TTL 400ms) so multiple queryAllDeep calls per extraction don't re-walk the entire DOM
  let cachedRoots = null;
  let cachedRootsTime = 0;

  const getSearchRoots = (root = document) => {
    if (root !== document) {
      const roots = [root];
      const visit = (node) => {
        try {
          const all = node.querySelectorAll ? node.querySelectorAll("*") : [];
          for (const el of all) {
            if (el.shadowRoot && el.id !== "help-seif-floating-host") {
              roots.push(el.shadowRoot);
              visit(el.shadowRoot);
            }
          }
        } catch {}
      };
      visit(root);
      return roots;
    }

    const now = Date.now();
    if (cachedRoots && now - cachedRootsTime < 400) {
      return cachedRoots;
    }
    const roots = [document];
    const visit = (node) => {
      try {
        const all = node.querySelectorAll ? node.querySelectorAll("*") : [];
        for (const el of all) {
          if (el.shadowRoot && el.id !== "help-seif-floating-host") {
            roots.push(el.shadowRoot);
            visit(el.shadowRoot);
          }
        }
      } catch {}
    };
    visit(document);
    cachedRoots = roots;
    cachedRootsTime = now;
    return roots;
  };

  const queryAllDeep = (selector, root = document) => {
    const results = [];
    const seen = new Set();
    const roots = getSearchRoots(root);
    for (const r of roots) {
      try {
        const matches = r.querySelectorAll ? r.querySelectorAll(selector) : [];
        for (const el of matches) {
          if (!seen.has(el)) {
            seen.add(el);
            results.push(el);
          }
        }
      } catch {}
    }
    return results;
  };

  const cleanText = (raw) =>
    String(raw || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const formatSmsIdWithSuffix = (rawId, suffix) => {
    const cleanId = cleanText(rawId);
    if (!cleanId) return "";
    const cleanSuffix = cleanText(suffix);
    return cleanSuffix ? `${cleanId}  ${cleanSuffix}` : cleanId;
  };

  // Broadcast live customer info updates to popup.html if it is open
  let lastBroadcastJson = "";
  const broadcastCustomerInfoUpdate = (info) => {
    try {
      const json = JSON.stringify(info || {});
      if (json === lastBroadcastJson) return;
      lastBroadcastJson = json;
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime
          .sendMessage({ name: "customerInfoUpdated", data: info })
          .catch(() => {});
      }
    } catch {}
  };

  // Extract from Salesforce Hover Preview Stencil (.forceHighlightsPreviewStencil)
  const extractFromHoverPreviewStencils = (expectedAccountName = "") => {
    const result = { name: "", phone: "", email: "" };
    const stencils = queryAllDeep(
      ".forceHighlightsPreviewStencil, .uiPanel--preview, .forceHoverPrototype"
    );

    const sortedStencils = [
      ...stencils.filter(isVisible),
      ...stencils.filter((s) => !isVisible(s)),
    ];

    for (const stencil of sortedStencils) {
      const primaryLink = stencil.querySelector(
        ".primaryFieldWrapper .primaryField a.forceOutputLookup, h2.primaryField a, h2.highlightsH2 a, .primaryField"
      );
      let stencilName = "";
      if (primaryLink) {
        const clone = primaryLink.cloneNode(true);
        clone
          .querySelectorAll?.(".slds-assistive-text, lightning-icon, svg")
          .forEach((n) => n.remove());
        stencilName = cleanText(clone.textContent);
      }

      if (
        expectedAccountName &&
        stencilName &&
        !isVisible(stencil) &&
        stencilName.toLowerCase() !== expectedAccountName.toLowerCase()
      ) {
        continue;
      }

      let stencilPhone = "";
      let stencilEmail = "";

      const items = stencil.querySelectorAll(
        ".forceListRecordItem, .secondaryFieldGrid"
      );
      for (const item of items) {
        const lblEl = item.querySelector(".recordCellLabel, .slds-item_label");
        const detEl = item.querySelector(".recordCellDetail, .slds-item_detail");
        const label = cleanText(
          lblEl?.getAttribute("title") || lblEl?.textContent || ""
        );
        if (!detEl) continue;

        if (!stencilPhone && /Phone|Mobile|Tel|WhatsApp/i.test(label)) {
          const phoneSpan =
            detEl.querySelector(
              ".forceOutputPhone, lightning-formatted-phone, a[href^='tel:']"
            ) || detEl;
          const ph = cleanText(phoneSpan.textContent);
          if (ph && /\d{5,}/.test(ph.replace(/\D/g, ""))) {
            stencilPhone = ph;
          }
        }

        if (!stencilEmail && /Email/i.test(label)) {
          const emailAnchor =
            detEl.querySelector(
              "a.emailuiFormattedEmail, a[href^='mailto:'], .emailuiOutputEmail"
            ) || detEl;
          const href = emailAnchor.getAttribute?.("href") || "";
          const em = href.toLowerCase().startsWith("mailto:")
            ? cleanText(href.slice(7).split("?")[0])
            : cleanText(emailAnchor.textContent);
          if (em && em.includes("@")) {
            stencilEmail = em;
          }
        }
      }

      if (!stencilPhone) {
        const directPhone = stencil.querySelector(".forceOutputPhone");
        if (directPhone) {
          const ph = cleanText(directPhone.textContent);
          if (ph && /\d{5,}/.test(ph.replace(/\D/g, ""))) stencilPhone = ph;
        }
      }
      if (!stencilEmail) {
        const directEmail = stencil.querySelector(
          "a.emailuiFormattedEmail, .secondaryFieldsWrapper a[href^='mailto:']"
        );
        if (directEmail) {
          const em = cleanText(directEmail.textContent);
          if (em && em.includes("@")) stencilEmail = em;
        }
      }

      if (stencilName && (stencilPhone || stencilEmail)) {
        const prev = accountDetailsCache.get(stencilName.toLowerCase()) || {};
        accountDetailsCache.set(stencilName.toLowerCase(), {
          name: stencilName,
          phone: stencilPhone || prev.phone || "",
          email: stencilEmail || prev.email || "",
        });
      }

      if (stencilName && !result.name) result.name = stencilName;
      if (stencilPhone && !result.phone) result.phone = stencilPhone;
      if (stencilEmail && !result.email) result.email = stencilEmail;

      if (result.phone && result.email) break;
    }

    return result;
  };

  const extractCleanFieldValue = (container, type = "text") => {
    if (!container) return "";
    const valueRoot =
      container.querySelector?.(".test-id__field-value") ||
      container.querySelector?.(".slds-form-element__control") ||
      container.querySelector?.(".recordCellDetail") ||
      container;

    if (!valueRoot) return "";

    if (type === "email") {
      const mailLink =
        valueRoot.querySelector?.("a.emailuiFormattedEmail") ||
        valueRoot.querySelector?.('a[href^="mailto:"]') ||
        valueRoot.querySelector?.("emailui-formatted-email-wrapper a") ||
        valueRoot.querySelector?.("lightning-formatted-email a") ||
        valueRoot.querySelector?.("lightning-formatted-email");
      if (mailLink) {
        const href = mailLink.getAttribute?.("href") || "";
        if (href.toLowerCase().startsWith("mailto:")) {
          const fromHref = cleanText(href.slice(7).split("?")[0]);
          if (fromHref) return fromHref;
        }
        const txt = cleanText(mailLink.textContent);
        if (txt) return txt;
      }
    }

    if (type === "phone") {
      const telLink =
        valueRoot.querySelector?.(".forceOutputPhone") ||
        valueRoot.querySelector?.('a[href^="tel:"]') ||
        valueRoot.querySelector?.("lightning-formatted-phone a") ||
        valueRoot.querySelector?.("lightning-formatted-phone");
      if (telLink) {
        const txt = cleanText(telLink.textContent);
        if (txt) return txt;
        const href = telLink.getAttribute?.("href") || "";
        if (href.toLowerCase().startsWith("tel:")) {
          return cleanText(href.slice(4));
        }
      }
    }

    if (type === "name") {
      const lookupLink =
        valueRoot.querySelector?.("records-hoverable-link a") ||
        valueRoot.querySelector?.("force-lookup a") ||
        valueRoot.querySelector?.("a.forceOutputLookup") ||
        valueRoot.querySelector?.('a[href*="/lightning/r/Account/"]') ||
        valueRoot.querySelector?.('a[href*="/lightning/r/001"]') ||
        valueRoot.querySelector?.('a[href*="/lightning/r/Contact/"]') ||
        valueRoot.querySelector?.("lightning-formatted-name");
      if (lookupLink) {
        const clone = lookupLink.cloneNode(true);
        clone
          .querySelectorAll?.(".slds-assistive-text, lightning-icon, svg")
          .forEach((n) => n.remove());
        const txt = cleanText(clone.textContent);
        if (txt) return txt;
      }
    }

    const formatted =
      valueRoot.querySelector?.(
        "records-formula-output lightning-formatted-text"
      ) ||
      valueRoot.querySelector?.("lightning-formatted-text") ||
      valueRoot.querySelector?.("lightning-formatted-name") ||
      valueRoot.querySelector?.("lightning-formatted-phone") ||
      valueRoot.querySelector?.("lightning-formatted-email") ||
      valueRoot.querySelector?.(".forceOutputPhone") ||
      valueRoot.querySelector?.(".emailuiFormattedEmail") ||
      valueRoot.querySelector?.("ui-output-text") ||
      valueRoot.querySelector?.("ui-output-phone") ||
      valueRoot.querySelector?.("ui-output-email");

    if (formatted) {
      const txt = cleanText(formatted.textContent);
      if (txt) return txt;
    }

    const activeInput = valueRoot.querySelector?.(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'
    );
    if (activeInput && typeof activeInput.value === "string") {
      const val = cleanText(activeInput.value);
      if (val) return val;
    }

    try {
      const clone = valueRoot.cloneNode(true);
      clone
        .querySelectorAll?.(
          ".slds-assistive-text, button, lightning-button-icon, lightning-helptext, .inline-edit-trigger-icon, script, style"
        )
        .forEach((n) => n.remove());
      const txt = cleanText(clone.textContent);
      if (txt && !/^--None--$/i.test(txt)) return txt;
    } catch {}

    return "";
  };

  const extractCustomerInfo = () => {
    const info = {
      name: "",
      phone: "",
      email: "",
      smsId: "",
    };

    const recKey = getRecordCacheKey();

    const formElements = queryAllDeep(
      ".slds-form-element, records-record-layout-item, [data-target-selection-name], .forceListRecordItem"
    ).filter(isVisible);

    const fieldPairs = [];
    for (const el of formElements) {
      const labelEl =
        el.querySelector?.(".test-id__field-label") ||
        el.querySelector?.(".slds-form-element__label") ||
        el.querySelector?.(".recordCellLabel");
      const label = cleanText(
        labelEl?.getAttribute?.("title") || (labelEl ? labelEl.textContent : "")
      ).replace(/^\*\s*/, "");
      const targetAttr = String(
        el.getAttribute?.("data-target-selection-name") || ""
      );
      if (label || targetAttr) {
        fieldPairs.push({ el, label, targetAttr });
      }
    }

    // 1. Student SMS ID from Account
    for (const { el, label, targetAttr } of fieldPairs) {
      if (
        /Student\s*SMS\s*ID/i.test(label) ||
        /SMS\s*ID/i.test(label) ||
        /Student_SMS_ID|SMS_ID/i.test(targetAttr)
      ) {
        const val = extractCleanFieldValue(el, "text");
        if (val) {
          info.smsId = val;
          break;
        }
      }
    }

    if (info.smsId && recKey) {
      recordSmsIdCache.set(recKey, info.smsId);
    } else if (!info.smsId && recKey && recordSmsIdCache.has(recKey)) {
      info.smsId = recordSmsIdCache.get(recKey) || "";
    }

    // 2. Customer Name (Prioritize Account Name / Student Name / Contact Name over Opportunity Name)
    const namePriorityMatchers = [
      ({ label, targetAttr }) =>
        /^(?:Account\s*Name|Student\s*Name|Client\s*Name|Customer\s*Name)$/i.test(
          label
        ) ||
        /RecordField\.(?:Opportunity\.AccountId|Account\.Name|Contact\.Name|Lead\.Name)/i.test(
          targetAttr
        ),
      ({ label, targetAttr }) =>
        /^(?:Contact\s*Name|Full\s*Name|Person\s*Name|Primary\s*Contact|Name)$/i.test(
          label
        ) && !/Opportunity\.Name/i.test(targetAttr),
      ({ label }) =>
        /(?:Account\s*Name|Student\s*Name|Contact\s*Name)/i.test(label) &&
        !/SMS\s*ID|Owner|Created|Modified|Parent/i.test(label),
    ];

    for (const matcher of namePriorityMatchers) {
      if (info.name) break;
      for (const item of fieldPairs) {
        if (matcher(item)) {
          const val = extractCleanFieldValue(item.el, "name");
          if (val) {
            info.name = val;
            break;
          }
        }
      }
    }

    if (!info.name) {
      const accountLinks = queryAllDeep(
        'a.outputLookupLink.forceOutputLookup[data-recordid^="001"], a[href*="/lightning/r/Account/"], a[href*="/lightning/r/001"], a[href*="/lightning/r/Contact/"]'
      ).filter(isVisible);
      for (const link of accountLinks) {
        const clone = link.cloneNode(true);
        clone
          .querySelectorAll?.(".slds-assistive-text, lightning-icon, svg")
          .forEach((n) => n.remove());
        const txt = cleanText(clone.textContent);
        if (
          txt &&
          txt.length > 1 &&
          !/^(?:Accounts|Contacts|Related|Details|Show\s+more)$/i.test(txt)
        ) {
          info.name = txt;
          break;
        }
      }
    }

    // Check Hover Preview Stencils (.forceHighlightsPreviewStencil)
    const fromStencil = extractFromHoverPreviewStencils(info.name);
    if (!info.name && fromStencil.name) info.name = fromStencil.name;
    if (fromStencil.phone) info.phone = fromStencil.phone;
    if (fromStencil.email) info.email = fromStencil.email;

    // 3. Email from page fields if not already from stencil
    if (!info.email) {
      for (const { el, label, targetAttr } of fieldPairs) {
        if (/Opt\s*Out|Bounced|Template|Owner/i.test(label)) continue;
        if (/Email/i.test(label) || /Email/i.test(targetAttr)) {
          const val = extractCleanFieldValue(el, "email");
          if (val && val.includes("@")) {
            info.email = val;
            break;
          }
        }
      }
    }

    if (!info.email) {
      const emailNodes = queryAllDeep(
        'a.emailuiFormattedEmail, lightning-formatted-email, emailui-formatted-email-wrapper a, a[href^="mailto:"]'
      ).filter(isVisible);
      for (const node of emailNodes) {
        const href = node.getAttribute?.("href") || "";
        const txt = href.toLowerCase().startsWith("mailto:")
          ? cleanText(href.slice(7).split("?")[0])
          : cleanText(node.textContent);
        if (txt && txt.includes("@")) {
          info.email = txt;
          break;
        }
      }
    }

    // 4. Phone / Mobile (including "Phone 1", "Phone 2", etc., excluding Channel Source)
    if (!info.phone) {
      const phonePriorityMatchers = [
        ({ label, targetAttr }) =>
          /^(?:Phone\s*1|Phone\s*2|Mobile|Mobile\s*Phone|Phone|Student\s*Mobile|Student\s*Phone|Account\s*Phone|Contact\s*Phone|Primary\s*Phone|Phone\s*Number|Mobile\s*Number|WhatsApp)$/i.test(
            label
          ) ||
          /RecordField\.[^.]*\.(?:Phone|Phone_1__c|MobilePhone|PersonMobilePhone|Phone__c|Mobile__c)/i.test(
            targetAttr
          ),
        ({ label, targetAttr }) =>
          /(?:Mobile|Phone|Tel|WhatsApp)/i.test(label) &&
          !/Channel|Source|Opt\s*Out|Do\s*Not|Extension|Verified|Status/i.test(
            label
          ) &&
          !/Channel_Source/i.test(targetAttr),
      ];

      for (const matcher of phonePriorityMatchers) {
        if (info.phone) break;
        for (const item of fieldPairs) {
          if (matcher(item)) {
            const val = extractCleanFieldValue(item.el, "phone");
            if (val && /\d{5,}/.test(val.replace(/\D/g, ""))) {
              info.phone = val;
              break;
            }
          }
        }
      }
    }

    if (!info.phone) {
      const phoneNodes = queryAllDeep(
        '.forceOutputPhone, lightning-formatted-phone, a[href^="tel:"]'
      ).filter(isVisible);
      for (const node of phoneNodes) {
        const txt = cleanText(node.textContent);
        if (txt && /\d{5,}/.test(txt.replace(/\D/g, ""))) {
          info.phone = txt;
          break;
        }
      }
    }

    // Check cache by Account Name if phone or email is still missing
    if (info.name) {
      const key = info.name.toLowerCase();
      const cached = accountDetailsCache.get(key);
      if (cached) {
        if (!info.phone && cached.phone) info.phone = cached.phone;
        if (!info.email && cached.email) info.email = cached.email;
      }
      if (info.phone || info.email) {
        accountDetailsCache.set(key, {
          name: info.name,
          phone: info.phone || cached?.phone || "",
          email: info.email || cached?.email || "",
        });
      }
    }

    return info;
  };

  // Find scrollable containers for the active Salesforce record view
  const getScrollableRecordContainers = () => {
    const containers = [];
    const seen = new Set();

    const addIfScrollable = (el) => {
      if (!el || seen.has(el)) return;
      try {
        if (el === document.scrollingElement || el === document.documentElement) {
          if (el.scrollHeight > window.innerHeight + 30) {
            seen.add(el);
            containers.push(el);
          }
          return;
        }
        if (!isVisible(el)) return;
        const st = window.getComputedStyle(el);
        const oy = st.overflowY;
        if (
          (oy === "auto" || oy === "scroll" || oy === "overlay") &&
          el.scrollHeight > el.clientHeight + 40
        ) {
          seen.add(el);
          containers.push(el);
        }
      } catch {}
    };

    const detailNodes = queryAllDeep(
      "records-lwc-detail-panel, one-record-home-flexipage2, flexipage-record-home-template-desktop2, .record-body-container"
    ).filter(isVisible);

    for (const startNode of detailNodes) {
      let cur = startNode;
      while (cur) {
        addIfScrollable(cur);
        cur = cur.parentElement || cur.getRootNode?.()?.host || null;
      }
    }

    const commonScrollables = queryAllDeep(
      ".workspaceManager .active .scrollable, .oneWorkspace .active .scrollable, .slds-scrollable_y, . stageMain, .center-stage"
    ).filter(isVisible);
    for (const sc of commonScrollables) {
      addIfScrollable(sc);
    }

    addIfScrollable(document.scrollingElement || document.documentElement);
    return containers;
  };

  // Automatically scroll-probe the detail panel to force Salesforce to mount lazy bottom fields (like Student SMS ID), then restore scrollTop
  const autoScrollToLoadSmsId = async () => {
    let info = extractCustomerInfo();
    if (info.smsId) return info;

    const scrollables = getScrollableRecordContainers();
    if (scrollables.length === 0) return info;

    const savedPositions = scrollables.map((el) => ({
      el,
      top: el.scrollTop,
    }));

    try {
      // Step 1: scroll 60% down
      for (const { el } of savedPositions) {
        el.scrollTop = Math.round(el.scrollHeight * 0.6);
        el.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
      await sleep(110);

      // Step 2: scroll 100% down to bottom of detail panel
      for (const { el } of savedPositions) {
        el.scrollTop = el.scrollHeight;
        el.dispatchEvent(new Event("scroll", { bubbles: true }));
      }

      // Poll up to 750ms for Salesforce LWC to mount the bottom fields
      const deadline = Date.now() + 750;
      while (Date.now() < deadline) {
        await sleep(75);
        info = extractCustomerInfo();
        if (info.smsId) break;
      }
    } catch {}

    // Always restore original scroll position immediately
    for (const { el, top } of savedPositions) {
      try {
        el.scrollTop = top;
        el.dispatchEvent(new Event("scroll", { bubbles: true }));
      } catch {}
    }

    return extractCustomerInfo();
  };

  // Find the Account Name lookup link on the Opportunity page
  const findAccountLookupLink = () => {
    const candidates = queryAllDeep(
      '[data-target-selection-name*="Opportunity.AccountId"] a, records-hoverable-link a[href*="/001"], records-hoverable-link a[href*="/Account/"], a.outputLookupLink.forceOutputLookup[data-recordid^="001"], a.forceOutputLookup[href*="/001"], a[href*="/lightning/r/Account/"]'
    ).filter(isVisible);
    return candidates[0] || null;
  };

  let activeAutoFetchPromise = null;

  const ensureCustomerInfoWithAutoHover = () => {
    if (activeAutoFetchPromise) return activeAutoFetchPromise;

    activeAutoFetchPromise = (async () => {
      try {
        // 1. Ensure bottom lazy fields (Student SMS ID) are mounted & read
        let info = await autoScrollToLoadSmsId();
        broadcastCustomerInfoUpdate(info);

        if (info.phone && info.email && info.smsId) {
          return info;
        }

        // 2. If Phone or Email is missing, auto-hover Account Name link
        const accountLink = findAccountLookupLink();
        if (!accountLink) return info;

        const rect = accountLink.getBoundingClientRect();
        const clientX = Math.round(rect.left + rect.width / 2);
        const clientY = Math.round(rect.top + rect.height / 2);
        const evtInit = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          clientX,
          clientY,
        };

        const hoverWrapper = accountLink.closest(
          "records-hoverable-link, force-lookup, .outputLookupContainer"
        );
        const targets = [hoverWrapper, accountLink].filter(Boolean);

        for (const t of targets) {
          try {
            t.dispatchEvent(new PointerEvent("pointerover", evtInit));
            t.dispatchEvent(
              new PointerEvent("pointerenter", { ...evtInit, bubbles: false })
            );
            t.dispatchEvent(new MouseEvent("mouseover", evtInit));
            t.dispatchEvent(
              new MouseEvent("mouseenter", { ...evtInit, bubbles: false })
            );
            t.dispatchEvent(new MouseEvent("mousemove", evtInit));
          } catch {}
        }

        // Poll up to 2200ms for Salesforce to render .forceHighlightsPreviewStencil
        const deadline = Date.now() + 2200;
        while (Date.now() < deadline) {
          await sleep(85);
          info = extractCustomerInfo();
          if (info.phone || info.email) {
            broadcastCustomerInfoUpdate(info);
          }
          if (info.phone && info.email) break;
        }

        // Dismiss hover card cleanly AFTER data is captured
        for (const t of targets) {
          try {
            t.dispatchEvent(new PointerEvent("pointerout", evtInit));
            t.dispatchEvent(
              new PointerEvent("pointerleave", { ...evtInit, bubbles: false })
            );
            t.dispatchEvent(new MouseEvent("mouseout", evtInit));
            t.dispatchEvent(
              new MouseEvent("mouseleave", { ...evtInit, bubbles: false })
            );
          } catch {}
        }
        const closePreviewBtn = document.querySelector(
          ".uiPanel--preview button.closeBtn, .uiPanel--preview button[title='Close'], .forceHoverPrototype button.closeBtn"
        );
        if (closePreviewBtn && isVisible(closePreviewBtn)) {
          try {
            closePreviewBtn.click();
          } catch {}
        }
      } catch {}

      const finalInfo = extractCustomerInfo();
      broadcastCustomerInfoUpdate(finalInfo);
      return finalInfo;
    })().finally(() => {
      activeAutoFetchPromise = null;
    });

    return activeAutoFetchPromise;
  };

  window.__helpSeifExtractCustomerInfo = extractCustomerInfo;
  window.__helpSeifEnsureCustomerInfo = ensureCustomerInfoWithAutoHover;

  const copyTextToClipboard = async (text) => {
    const clean = String(text || "").trim();
    if (!clean) return false;
    try {
      const ta = document.createElement("textarea");
      ta.value = clean;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) return true;
    } catch {}
    try {
      await navigator.clipboard.writeText(clean);
      return true;
    } catch {
      return false;
    }
  };

  // Copies each item separately into Windows Clipboard History (Win+V) in exact queue order:
  // 1st copied (bottom of Win+V): SMS ID + 2-letter suffix (e.g. "0061704516  SE")
  // 2nd copied (above ID):        Email
  // 3rd copied (above Email):     Phone
  // 4th copied (top of Win+V):    Name
  const copyCustomerQueueToClipboard = async (info, suffix, onProgress) => {
    const formattedId = formatSmsIdWithSuffix(info.smsId, suffix);
    const queue = [
      { label: "SMS ID", value: formattedId },
      { label: "Email", value: cleanText(info.email) },
      { label: "Phone", value: cleanText(info.phone) },
      { label: "Name", value: cleanText(info.name) },
    ].filter((item) => Boolean(item.value));

    if (queue.length === 0) return 0;

    let copiedCount = 0;
    for (let i = 0; i < queue.length; i++) {
      onProgress?.(i + 1, queue.length, queue[i].label);
      const ok = await copyTextToClipboard(queue[i].value);
      if (ok) copiedCount++;
      if (i < queue.length - 1) {
        await sleep(320);
      }
    }
    return copiedCount;
  };

  const applyDynamicFieldsToResource = (resource, flex3Value, wonField4Value) => {
    if (!resource || !Array.isArray(resource.interactions)) return resource;
    const normalizedName = String(resource.name || "").trim().toLowerCase();
    const cloned = JSON.parse(JSON.stringify(resource));

    if (FLEX_FIELD_3_WORKFLOWS.has(normalizedName)) {
      const chosenFlex3 = String(flex3Value ?? "").trim();
      const targetGroup =
        cloned.interactions.find(
          (step) =>
            step &&
            step.type === "MULTIPLE_FIELDS" &&
            Array.isArray(step.fields) &&
            step.fields.some((f) => /StageName/i.test(String(f?.key || "")))
        ) ||
        cloned.interactions.find(
          (step) =>
            step && step.type === "MULTIPLE_FIELDS" && Array.isArray(step.fields)
        );

      if (targetGroup && Array.isArray(targetGroup.fields)) {
        targetGroup.fields = targetGroup.fields.filter(
          (f) => !/Flexible_Field_3_Value/i.test(String(f?.key || ""))
        );
        if (chosenFlex3) {
          targetGroup.fields.push({
            key: FLEX_FIELD_3_SELECTOR,
            value: chosenFlex3,
            fieldType: "text",
            searchType: "cssSelector",
            id: "flex-field-3-dynamic",
          });
        }
      }
    }

    if (normalizedName === "won") {
      const chosenWon4 =
        String(wonField4Value || "CC").trim().toUpperCase() === "CS"
          ? "CS"
          : "CC";
      const targetGroup =
        cloned.interactions.find(
          (step) =>
            step &&
            step.type === "MULTIPLE_FIELDS" &&
            Array.isArray(step.fields) &&
            step.fields.some((f) => /StageName/i.test(String(f?.key || "")))
        ) ||
        cloned.interactions.find(
          (step) =>
            step && step.type === "MULTIPLE_FIELDS" && Array.isArray(step.fields)
        );

      if (targetGroup && Array.isArray(targetGroup.fields)) {
        targetGroup.fields = targetGroup.fields.filter(
          (f) => !/Flexible_Field_4_Value/i.test(String(f?.key || ""))
        );
        targetGroup.fields.push({
          key: FLEX_FIELD_4_SELECTOR,
          value: chosenWon4,
          fieldType: "text",
          searchType: "cssSelector",
          id: "flex-field-4-won-dynamic",
        });
      }
    }

    return cloned;
  };

  const executeWorkflowByResource = async (resource) => {
    if (!resource) return;
    window.__helpSeifAborted = false;
    const storage = await chrome.storage.local.get([
      " delayTime",
      FLEX_FIELD_3_KEY,
      WON_FIELD_4_KEY,
    ]);
    const delayTime = Number(storage[" delayTime"] ?? 100);
    const flex3Value = String(storage[FLEX_FIELD_3_KEY] ?? "");
    const wonField4Value = String(storage[WON_FIELD_4_KEY] || "CC");
    const prepared = applyDynamicFieldsToResource(
      resource,
      flex3Value,
      wonField4Value
    );
    if (typeof window.__helpSeifRunParser === "function") {
      await window.__helpSeifRunParser(prepared, delayTime);
    }
  };

  // Listen for popup requests
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.name === "getCustomerInfo") {
        (async () => {
          try {
            const info = msg.autoHover
              ? await ensureCustomerInfoWithAutoHover()
              : extractCustomerInfo();
            sendResponse({ ok: true, data: info });
          } catch (err) {
            sendResponse({ ok: false, error: String(err) });
          }
        })();
        return true;
      }
      if (msg?.name === "setFloatingBarEnabled") {
        setFloatingBarVisibility(Boolean(msg.enabled));
        sendResponse({ ok: true });
        return true;
      }
    });
  }

  // Floating Bar UI
  let hostEl = null;
  let shadow = null;
  let currentCustomerInfo = { name: "", phone: "", email: "", smsId: "" };
  let currentSmsSuffix = "SE";

  const setFloatingBarVisibility = (enabled) => {
    if (!hostEl && enabled && isSalesforcePage()) {
      initFloatingBar();
      return;
    }
    if (hostEl) {
      hostEl.style.display = enabled ? "block" : "none";
    }
  };

  const getButtonTheme = (name) => {
    const n = String(name || "").toLowerCase();
    if (n.includes("won")) return "btn-won";
    if (n.includes("not interested")) return "btn-danger";
    if (n.includes("follow up") || n.includes("sent link")) return "btn-primary";
    if (n.includes("crm") || n.includes("payment")) return "btn-accent";
    return "btn-neutral";
  };

  const initFloatingBar = async () => {
    if (!isSalesforcePage() || document.getElementById("help-seif-floating-host")) {
      return;
    }

    const state = await chrome.storage.local.get([
      FLOAT_ENABLED_KEY,
      FLOAT_COLLAPSED_KEY,
      FLOAT_TOP_KEY,
      SPEED_STORAGE_KEY,
      FLEX_OPTIONS_KEY,
      FLEX_FIELD_3_KEY,
      WON_FIELD_4_KEY,
      SMS_ID_SUFFIX_KEY,
      TARGET_OWNER_KEY,
      FLOAT_SEC_CUST_KEY,
      FLOAT_SEC_CTRL_KEY,
      FLOAT_SEC_WF_KEY,
      ORDER_KEY,
      "resources",
    ]);

    const isEnabled = state[FLOAT_ENABLED_KEY] !== false;
    let isCollapsed = Boolean(state[FLOAT_COLLAPSED_KEY]);
    const savedTop = Number(state[FLOAT_TOP_KEY]) || 110;
    currentSmsSuffix =
      state[SMS_ID_SUFFIX_KEY] !== undefined
        ? String(state[SMS_ID_SUFFIX_KEY])
        : "SE";
    let currentTargetOwner =
      state[TARGET_OWNER_KEY] !== undefined
        ? String(state[TARGET_OWNER_KEY])
        : "Seif Ezz Eldin";
    let secCustCollapsed = Boolean(state[FLOAT_SEC_CUST_KEY]);
    let secCtrlCollapsed = Boolean(state[FLOAT_SEC_CTRL_KEY]);
    let secWfCollapsed = Boolean(state[FLOAT_SEC_WF_KEY]);

    hostEl = document.createElement("div");
    hostEl.id = "help-seif-floating-host";
    hostEl.style.cssText = `
      position: fixed;
      top: ${Math.max(12, Math.min(window.innerHeight - 80, savedTop))}px;
      right: 12px;
      z-index: 2147483646;
      display: ${isEnabled ? "block" : "none"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    shadow = hostEl.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        .hs-wrap {
          color: #f8fafc;
          user-select: none;
          font-size: 12px;
        }
        .hs-pill {
          display: none;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(99, 102, 241, 0.45);
          border-radius: 999px;
          padding: 5px 8px 5px 11px;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.45);
          backdrop-filter: blur(10px);
        }
        .hs-wrap.collapsed .hs-pill { display: inline-flex; }
        .hs-wrap.collapsed .hs-panel { display: none; }
        .hs-pill-expand {
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 700;
          font-size: 11.5px;
          color: #e2e8f0;
          padding-right: 4px;
        }
        .hs-pill-expand:hover { color: #a5b4fc; }
        .hs-pill-copy {
          all: unset;
          cursor: pointer;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.45);
          color: #6ee7b7;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 999px;
          transition: all 0.14s ease;
        }
        .hs-pill-copy:hover {
          background: rgba(16, 185, 129, 0.32);
          color: #ecfdf5;
        }
        .hs-panel {
          width: 266px;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 11px;
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.55);
          backdrop-filter: blur(12px);
          overflow: hidden;
        }
        .hs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: linear-gradient(90deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          cursor: grab;
        }
        .hs-header:active { cursor: grabbing; }
        .hs-brand {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 700;
          font-size: 11.5px;
          color: #f8fafc;
        }
        .hs-header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .hs-icon-btn {
          all: unset;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(51, 65, 85, 0.7);
          color: #cbd5e1;
          border: 1px solid rgba(148, 163, 184, 0.2);
          transition: all 0.12s ease;
        }
        .hs-icon-btn:hover {
          background: rgba(71, 85, 105, 0.9);
          color: #fff;
        }
        .hs-stop-btn {
          background: rgba(239, 68, 68, 0.18);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .hs-stop-btn:hover {
          background: rgba(239, 68, 68, 0.35);
          color: #fff;
        }
        .hs-body {
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: calc(100vh - 90px);
          overflow-y: auto;
        }
        .hs-card {
          background: rgba(30, 41, 59, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 7px;
          padding: 5px 6px;
        }
        .hs-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }
        .hs-sec-toggle {
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
          padding: 1px 2px;
        }
        .hs-sec-toggle:hover { color: #f8fafc; }
        .hs-sec-arrow {
          display: inline-block;
          font-size: 9px;
          transition: transform 0.15s ease;
        }
        .hs-card.sec-collapsed .hs-sec-arrow {
          transform: rotate(-90deg);
        }
        .hs-card-body {
          margin-top: 5px;
        }
        .hs-card.sec-collapsed .hs-card-body {
          display: none;
        }
        .hs-card-btns {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .hs-suffix-wrap {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 4px;
          padding: 1px 4px;
        }
        .hs-suffix-lbl {
          font-size: 9px;
          font-weight: 700;
          color: #94a3b8;
        }
        .hs-suffix-input {
          width: 26px;
          background: transparent;
          border: none;
          color: #6ee7b7;
          font-size: 10px;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
          outline: none;
          padding: 0;
        }
        .hs-copy-all-btn {
          all: unset;
          cursor: pointer;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
          transition: opacity 0.12s ease;
          white-space: nowrap;
        }
        .hs-copy-all-btn:hover { opacity: 0.92; }
        .hs-refresh-btn {
          all: unset;
          cursor: pointer;
          color: #94a3b8;
          font-size: 11px;
          padding: 1px 4px;
          border-radius: 4px;
        }
        .hs-refresh-btn:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }
        .hs-info-rows {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .hs-info-row {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 2.5px 5px;
          border-radius: 4px;
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid transparent;
          transition: all 0.12s ease;
        }
        .hs-info-row:hover {
          border-color: rgba(99, 102, 241, 0.45);
          background: rgba(30, 41, 59, 0.9);
        }
        .hs-info-lbl {
          font-size: 9.5px;
          font-weight: 600;
          color: #94a3b8;
          flex-shrink: 0;
          width: 42px;
        }
        .hs-info-val {
          font-size: 10.5px;
          font-weight: 600;
          color: #e2e8f0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          text-align: right;
        }
        .hs-info-val.empty {
          color: #64748b;
          font-weight: 400;
          font-style: italic;
        }
        .hs-controls-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hs-ctrl-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .hs-ctrl-lbl {
          font-size: 10px;
          font-weight: 600;
          color: #cbd5e1;
          white-space: nowrap;
        }
        .hs-select, .hs-text-input {
          flex: 1;
          min-width: 0;
          background: rgba(15, 23, 42, 0.85);
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 4px;
          padding: 2.5px 5px;
          font-size: 10px;
          outline: none;
        }
        .hs-text-input:focus, .hs-select:focus {
          border-color: #10b981;
        }
        .hs-seg {
          display: inline-flex;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 4px;
          padding: 1px;
          gap: 2px;
        }
        .hs-seg-btn {
          all: unset;
          cursor: pointer;
          padding: 1.5px 9px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          transition: all 0.12s ease;
        }
        .hs-seg-btn.active {
          background: #10b981;
          color: #ffffff;
        }
        .hs-wf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }
        .hs-wf-btn {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 5px 5px;
          border-radius: 5px;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1.15;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(30, 41, 59, 0.85);
          color: #f1f5f9;
          transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease;
        }
        .hs-wf-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(165, 180, 252, 0.55);
          background: rgba(51, 65, 85, 0.95);
        }
        .hs-wf-btn:active { transform: translateY(0); }
        .hs-wf-btn.btn-won {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(5, 150, 105, 0.38));
          border-color: rgba(16, 185, 129, 0.55);
          color: #6ee7b7;
        }
        .hs-wf-btn.btn-won:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.42), rgba(5, 150, 105, 0.52));
          color: #ecfdf5;
        }
        .hs-wf-btn.btn-primary {
          background: rgba(79, 70, 229, 0.25);
          border-color: rgba(99, 102, 241, 0.5);
          color: #c7d2fe;
        }
        .hs-wf-btn.btn-primary:hover {
          background: rgba(79, 70, 229, 0.4);
          color: #fff;
        }
        .hs-wf-btn.btn-danger {
          background: rgba(239, 68, 68, 0.16);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }
        .hs-wf-btn.btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #fff;
        }
        .hs-wf-btn.btn-accent {
          background: rgba(14, 165, 233, 0.2);
          border-color: rgba(56, 189, 248, 0.45);
          color: #bae6fd;
        }
        .hs-wf-btn.btn-accent:hover {
          background: rgba(14, 165, 233, 0.34);
          color: #fff;
        }
      </style>
      <div class="hs-wrap ${isCollapsed ? "collapsed" : ""}" id="hs-wrap">
        <div class="hs-pill" id="hs-pill">
          <button class="hs-pill-expand" id="hs-expand-btn" title="Expand Help Seif Quick Bar">
            <span>⚡</span>
            <span>Help Seif</span>
          </button>
          <button class="hs-pill-copy" id="hs-pill-copy-btn" title="Copy Name, Phone, Email & SMS ID separately to Clipboard Queue">
            📋 Copy
          </button>
        </div>

        <div class="hs-panel">
          <div class="hs-header" id="hs-drag-handle" title="Drag up or down">
            <div class="hs-brand">
              <span>⚡</span>
              <span>Help Seif</span>
            </div>
            <div class="hs-header-actions">
              <button class="hs-icon-btn" id="hs-speed-btn" title="Cycle execution speed (Normal / Fast / Slow)">1x</button>
              <button class="hs-icon-btn hs-stop-btn" id="hs-stop-btn" title="Stop running workflow (Esc)">⏹ Stop</button>
              <button class="hs-icon-btn" id="hs-collapse-btn" title="Minimize to side pill">—</button>
            </div>
          </div>

          <div class="hs-body">
            <!-- Section 1: Customer Queue -->
            <div class="hs-card ${secCustCollapsed ? "sec-collapsed" : ""}" id="hs-sec-cust">
              <div class="hs-card-head">
                <button type="button" class="hs-sec-toggle" id="hs-toggle-cust" title="Collapse / Expand Customer Queue">
                  <span class="hs-sec-arrow">▾</span>
                  <span>Customer</span>
                </button>
                <div class="hs-card-btns">
                  <div class="hs-suffix-wrap" title="Letters appended after SMS ID (e.g. SE or MY)">
                    <span class="hs-suffix-lbl">ID+</span>
                    <input type="text" class="hs-suffix-input" id="hs-id-suffix" maxlength="6" value="${currentSmsSuffix}" placeholder="SE" />
                  </div>
                  <button class="hs-refresh-btn" id="hs-refresh-info" title="Auto-load SMS ID & Account Phone/Email">↻</button>
                  <button class="hs-copy-all-btn" id="hs-copy-all" title="Copy ID, Email, Phone, Name separately into Win+V queue">📋 Copy All</button>
                </div>
              </div>
              <div class="hs-card-body">
                <div class="hs-info-rows">
                  <button class="hs-info-row" data-field="name" title="Click to copy Name only">
                    <span class="hs-info-lbl">Name</span>
                    <span class="hs-info-val empty" id="hs-val-name">—</span>
                  </button>
                  <button class="hs-info-row" data-field="phone" title="Click to copy Phone only">
                    <span class="hs-info-lbl">Phone</span>
                    <span class="hs-info-val empty" id="hs-val-phone">—</span>
                  </button>
                  <button class="hs-info-row" data-field="email" title="Click to copy Email only">
                    <span class="hs-info-lbl">Email</span>
                    <span class="hs-info-val empty" id="hs-val-email">—</span>
                  </button>
                  <button class="hs-info-row" data-field="smsId" title="Click to copy SMS ID with suffix">
                    <span class="hs-info-lbl">SMS ID</span>
                    <span class="hs-info-val empty" id="hs-val-smsId">—</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Section 2: Quick Settings (Flex 3, Won Field 4, Owner Skip) -->
            <div class="hs-card ${secCtrlCollapsed ? "sec-collapsed" : ""}" id="hs-sec-ctrl">
              <div class="hs-card-head">
                <button type="button" class="hs-sec-toggle" id="hs-toggle-ctrl" title="Collapse / Expand Quick Settings">
                  <span class="hs-sec-arrow">▾</span>
                  <span>Fields & Owner Skip</span>
                </button>
              </div>
              <div class="hs-card-body hs-controls-row">
                <div class="hs-ctrl-item">
                  <span class="hs-ctrl-lbl">Flex 3</span>
                  <select class="hs-select" id="hs-flex3-select"></select>
                </div>
                <div class="hs-ctrl-item">
                  <span class="hs-ctrl-lbl">Won (Field 4)</span>
                  <div class="hs-seg" id="hs-won4-seg">
                    <button type="button" class="hs-seg-btn" data-val="CC">CC</button>
                    <button type="button" class="hs-seg-btn" data-val="CS">CS</button>
                  </div>
                </div>
                <div class="hs-ctrl-item" title="If Record Owner matches this name, Change Owner steps are skipped automatically">
                  <span class="hs-ctrl-lbl">Skip Owner</span>
                  <input type="text" class="hs-text-input" id="hs-owner-skip" value="${currentTargetOwner.replace(/"/g, "&quot;")}" placeholder="Seif Ezz Eldin" />
                </div>
              </div>
            </div>

            <!-- Section 3: Workflows -->
            <div class="hs-card ${secWfCollapsed ? "sec-collapsed" : ""}" id="hs-sec-wf">
              <div class="hs-card-head">
                <button type="button" class="hs-sec-toggle" id="hs-toggle-wf" title="Collapse / Expand Workflows">
                  <span class="hs-sec-arrow">▾</span>
                  <span>Workflows</span>
                </button>
              </div>
              <div class="hs-card-body">
                <div class="hs-wf-grid" id="hs-wf-grid"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.documentElement.appendChild(hostEl);

    const wrapEl = shadow.getElementById("hs-wrap");
    const expandBtn = shadow.getElementById("hs-expand-btn");
    const collapseBtn = shadow.getElementById("hs-collapse-btn");
    const pillCopyBtn = shadow.getElementById("hs-pill-copy-btn");
    const copyAllBtn = shadow.getElementById("hs-copy-all");
    const refreshBtn = shadow.getElementById("hs-refresh-info");
    const suffixInput = shadow.getElementById("hs-id-suffix");
    const ownerSkipInput = shadow.getElementById("hs-owner-skip");
    const speedBtn = shadow.getElementById("hs-speed-btn");
    const stopBtn = shadow.getElementById("hs-stop-btn");
    const flex3Select = shadow.getElementById("hs-flex3-select");
    const won4Seg = shadow.getElementById("hs-won4-seg");
    const wfGrid = shadow.getElementById("hs-wf-grid");
    const dragHandle = shadow.getElementById("hs-drag-handle");

    // Section collapse toggles
    const bindSecToggle = (btnId, secId, storageKey) => {
      const btn = shadow.getElementById(btnId);
      const sec = shadow.getElementById(secId);
      if (!btn || !sec) return;
      btn.addEventListener("click", () => {
        const nextCollapsed = !sec.classList.contains("sec-collapsed");
        sec.classList.toggle("sec-collapsed", nextCollapsed);
        chrome.storage.local.set({ [storageKey]: nextCollapsed });
      });
    };
    bindSecToggle("hs-toggle-cust", "hs-sec-cust", FLOAT_SEC_CUST_KEY);
    bindSecToggle("hs-toggle-ctrl", "hs-sec-ctrl", FLOAT_SEC_CTRL_KEY);
    bindSecToggle("hs-toggle-wf", "hs-sec-wf", FLOAT_SEC_WF_KEY);

    // Owner Skip input handler
    ownerSkipInput.addEventListener("input", () => {
      currentTargetOwner = ownerSkipInput.value;
      chrome.storage.local.set({ [TARGET_OWNER_KEY]: currentTargetOwner.trim() });
    });

    // Vertical Drag Support
    let dragging = false;
    let startY = 0;
    let startTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest("button, input, select")) return;
      dragging = true;
      startY = e.clientY;
      startTop = hostEl.getBoundingClientRect().top;
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const nextTop = Math.max(
        10,
        Math.min(window.innerHeight - 60, startTop + (e.clientY - startY))
      );
      hostEl.style.top = `${nextTop}px`;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      const finalTop = Math.round(hostEl.getBoundingClientRect().top);
      chrome.storage.local.set({ [FLOAT_TOP_KEY]: finalTop });
    };

    dragHandle.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    // Collapse / Expand
    const setCollapsed = (collapsed) => {
      isCollapsed = collapsed;
      wrapEl.classList.toggle("collapsed", isCollapsed);
      chrome.storage.local.set({ [FLOAT_COLLAPSED_KEY]: isCollapsed });
      if (!isCollapsed) refreshCustomerInfoUI();
    };

    expandBtn.addEventListener("click", () => setCollapsed(false));
    collapseBtn.addEventListener("click", () => setCollapsed(true));

    // Customer Info UI Refresh
    const renderCustomerInfoValues = () => {
      for (const key of ["name", "phone", "email", "smsId"]) {
        const el = shadow.getElementById(`hs-val-${key}`);
        if (!el) continue;
        const rawVal = currentCustomerInfo[key] || "";
        const displayVal =
          key === "smsId" && rawVal
            ? formatSmsIdWithSuffix(rawVal, currentSmsSuffix)
            : rawVal;
        el.textContent = displayVal || "—";
        el.classList.toggle("empty", !displayVal);
      }
    };

    const refreshCustomerInfoUI = () => {
      currentCustomerInfo = extractCustomerInfo();
      renderCustomerInfoValues();
      broadcastCustomerInfoUpdate(currentCustomerInfo);
    };

    // Suffix Input Handler
    suffixInput.addEventListener("input", () => {
      currentSmsSuffix = suffixInput.value.trim().toUpperCase();
      suffixInput.value = currentSmsSuffix;
      renderCustomerInfoValues();
      chrome.storage.local.set({ [SMS_ID_SUFFIX_KEY]: currentSmsSuffix });
    });

    refreshBtn.addEventListener("click", async () => {
      refreshBtn.textContent = "…";
      currentCustomerInfo = await ensureCustomerInfoWithAutoHover();
      renderCustomerInfoValues();
      refreshBtn.textContent = "↻";
    });

    // Individual Field Click-to-Copy (copies raw value without label prefix)
    shadow.querySelectorAll(".hs-info-row").forEach((row) => {
      row.addEventListener("click", async () => {
        const field = row.getAttribute("data-field");
        if (!currentCustomerInfo[field]) {
          currentCustomerInfo = await ensureCustomerInfoWithAutoHover();
          renderCustomerInfoValues();
        } else {
          refreshCustomerInfoUI();
        }
        const rawVal = currentCustomerInfo[field] || "";
        const valToCopy =
          field === "smsId"
            ? formatSmsIdWithSuffix(rawVal, currentSmsSuffix)
            : rawVal;
        const valEl = shadow.getElementById(`hs-val-${field}`);
        if (!valToCopy) {
          if (valEl) {
            const prev = valEl.textContent;
            valEl.textContent = "Not found";
            setTimeout(() => {
              valEl.textContent = prev;
            }, 900);
          }
          return;
        }
        const ok = await copyTextToClipboard(valToCopy);
        if (ok && valEl) {
          const prev = valEl.textContent;
          valEl.textContent = "✓ Copied!";
          valEl.style.color = "#6ee7b7";
          setTimeout(() => {
            valEl.textContent = prev;
            valEl.style.color = "";
          }, 950);
        }
      });
    });

    // Copy All into Windows Clipboard Queue (1. SMS ID + Suffix -> 2. Email -> 3. Phone -> 4. Name)
    const handleCopyAll = async (btnEl, defaultText) => {
      btnEl.textContent = "Reading...";
      currentCustomerInfo = await ensureCustomerInfoWithAutoHover();
      renderCustomerInfoValues();

      const hasAny =
        currentCustomerInfo.name ||
        currentCustomerInfo.phone ||
        currentCustomerInfo.email ||
        currentCustomerInfo.smsId;

      if (!hasAny) {
        btnEl.textContent = "No Data Found";
        setTimeout(() => {
          btnEl.textContent = defaultText;
        }, 1100);
        return;
      }

      const count = await copyCustomerQueueToClipboard(
        currentCustomerInfo,
        currentSmsSuffix,
        (step, total, label) => {
          btnEl.textContent = `Copying ${step}/${total} (${label})...`;
        }
      );

      btnEl.textContent = count > 0 ? `✓ Queued ${count} items!` : "Copy Failed";
      setTimeout(() => {
        btnEl.textContent = defaultText;
      }, 1300);
    };

    copyAllBtn.addEventListener("click", () =>
      handleCopyAll(copyAllBtn, "📋 Copy All")
    );
    pillCopyBtn.addEventListener("click", () =>
      handleCopyAll(pillCopyBtn, "📋 Copy")
    );

    // Speed Button (synced with Popup qfeDelayMultiplier: 0.7 Fast, 1.0 1x, 1.5 Slow)
    const speedLabels = { 0.7: "Fast", 1: "1x", 1.5: "Slow" };
    const speedOrder = [0.7, 1, 1.5];
    let currentSpeed = Number(state[SPEED_STORAGE_KEY]) || 0.7;
    const renderSpeed = (spd) => {
      currentSpeed = speedLabels[spd] ? spd : 0.7;
      speedBtn.textContent = speedLabels[currentSpeed] || "Fast";
    };
    renderSpeed(currentSpeed);

    speedBtn.addEventListener("click", () => {
      const idx = speedOrder.indexOf(currentSpeed);
      const next = speedOrder[(idx + 1) % speedOrder.length];
      renderSpeed(next);
      chrome.storage.local.set({ [SPEED_STORAGE_KEY]: next });
    });

    // Stop Button
    stopBtn.addEventListener("click", () => {
      window.__helpSeifAborted = true;
      window.__helpSeifFinishHud?.("stopped");
    });

    // Flex Field 3 & Won Field 4 Controls (synced with Popup)
    const renderFlex3Options = (optsRaw, valRaw) => {
      let opts = Array.isArray(optsRaw) && optsRaw.length ? [...optsRaw] : [...DEFAULT_FLEX_3_OPTIONS];
      let val = typeof valRaw === "string" && valRaw.trim() ? valRaw.trim() : opts[0];
      if (!opts.includes(val)) opts.unshift(val);
      flex3Select.innerHTML = opts
        .map((opt) => `<option value="${opt.replace(/"/g, "&quot;")}">${opt}</option>`)
        .join("");
      flex3Select.value = val;
    };
    renderFlex3Options(state[FLEX_OPTIONS_KEY], state[FLEX_FIELD_3_KEY]);

    flex3Select.addEventListener("change", () => {
      chrome.storage.local.set({ [FLEX_FIELD_3_KEY]: flex3Select.value });
    });

    const renderWon4 = (val) => {
      const normalized = String(val || "CC").toUpperCase() === "CS" ? "CS" : "CC";
      won4Seg.querySelectorAll(".hs-seg-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.val === normalized);
      });
    };
    renderWon4(state[WON_FIELD_4_KEY] || "CC");

    won4Seg.querySelectorAll(".hs-seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.val || "CC";
        renderWon4(val);
        chrome.storage.local.set({ [WON_FIELD_4_KEY]: val });
      });
    });

    // Helper to parse resources (which may be a JSON string from @plasmohq/storage or an Array)
    const parseResourcesList = (raw) => {
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return [];
    };

    let currentResourcesRaw = state.resources;
    let currentOrder = Array.isArray(state[ORDER_KEY]) ? state[ORDER_KEY] : null;

    // Render Workflow Buttons
    const renderWorkflows = (resourcesRaw, orderList = currentOrder) => {
      const list = [...parseResourcesList(resourcesRaw)];
      if (Array.isArray(orderList) && orderList.length) {
        const keyFor = (res) => {
          const n = String(res?.name || "").trim().toLowerCase();
          if (n === "no answer") return "no-answer";
          if (n === "follow up") return "follow-up";
          if (n === "will call us back") return "will-call-us-back";
          if (n === "not interested") return "not-interested";
          if (n === "crm autofill") return "crm-autofill";
          if (n === "sent link") return "sent-link";
          if (n === "won") return "won";
          if (n === "fl payment") return "fl-payment";
          return res?.id || "";
        };
        list.sort((a, b) => {
          let idxA = orderList.indexOf(keyFor(a));
          let idxB = orderList.indexOf(keyFor(b));
          if (idxA === -1) idxA = 999;
          if (idxB === -1) idxB = 999;
          return idxA - idxB;
        });
      }
      wfGrid.innerHTML = "";
      for (const res of list) {
        if (!res || !res.name) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `hs-wf-btn ${getButtonTheme(res.name)}`;
        btn.textContent = res.name;
        btn.title = `Run "${res.name}"`;
        btn.addEventListener("click", () => {
          executeWorkflowByResource(res);
        });
        wfGrid.appendChild(btn);
      }
    };

    renderWorkflows(currentResourcesRaw, currentOrder);
    refreshCustomerInfoUI();

    // Sync storage changes live
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.resources || changes[ORDER_KEY]) {
        if (changes.resources) currentResourcesRaw = changes.resources.newValue;
        if (changes[ORDER_KEY]) currentOrder = changes[ORDER_KEY].newValue;
        renderWorkflows(currentResourcesRaw, currentOrder);
      }
      if (changes[FLEX_OPTIONS_KEY] || changes[FLEX_FIELD_3_KEY]) {
        chrome.storage.local.get([FLEX_OPTIONS_KEY, FLEX_FIELD_3_KEY], (st) => {
          renderFlex3Options(st[FLEX_OPTIONS_KEY], st[FLEX_FIELD_3_KEY]);
        });
      }
      if (changes[WON_FIELD_4_KEY]) {
        renderWon4(changes[WON_FIELD_4_KEY].newValue || "CC");
      }
      if (changes[SPEED_STORAGE_KEY]) {
        renderSpeed(Number(changes[SPEED_STORAGE_KEY].newValue) || 0.7);
      }
      if (changes[FLOAT_ENABLED_KEY]) {
        setFloatingBarVisibility(changes[FLOAT_ENABLED_KEY].newValue !== false);
      }
      if (changes[SMS_ID_SUFFIX_KEY]) {
        currentSmsSuffix = String(changes[SMS_ID_SUFFIX_KEY].newValue ?? "");
        suffixInput.value = currentSmsSuffix;
        renderCustomerInfoValues();
      }
      if (changes[TARGET_OWNER_KEY]) {
        currentTargetOwner = String(changes[TARGET_OWNER_KEY].newValue ?? "");
        if (shadow.activeElement !== ownerSkipInput) {
          ownerSkipInput.value = currentTargetOwner;
        }
      }
    });

    // Auto-refresh Customer Info when navigating records or when hover preview opens
    let refreshTimer = null;
    let lastAutoFetchedRecordKey = "";

    const scheduleInfoRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        refreshCustomerInfoUI();
        // When a record page finishes mounting its Account Name link, auto-preload SMS ID + Phone/Email once per record
        const recKey = getRecordCacheKey();
        if (
          recKey &&
          recKey !== lastAutoFetchedRecordKey &&
          (!currentCustomerInfo.smsId ||
            !currentCustomerInfo.phone ||
            !currentCustomerInfo.email) &&
          findAccountLookupLink()
        ) {
          lastAutoFetchedRecordKey = recKey;
          currentCustomerInfo = await ensureCustomerInfoWithAutoHover();
          renderCustomerInfoValues();
        }
      }, 350);
    };

    window.addEventListener("popstate", scheduleInfoRefresh);
    window.addEventListener("hashchange", scheduleInfoRefresh);
    const obs = new MutationObserver((mutations) => {
      // Ignore mutations inside our own floating bar or HUD
      const hasExternalMutation = mutations.some((m) => {
        const t = m.target;
        return (
          t &&
          t.id !== "help-seif-floating-host" &&
          t.id !== "help-seif-hud" &&
          !hostEl?.contains(t)
        );
      });
      if (hasExternalMutation) {
        scheduleInfoRefresh();
      }
    });
    obs.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initFloatingBar, 400);
    });
  } else {
    setTimeout(initFloatingBar, 400);
  }
})();
