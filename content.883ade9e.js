/** Help Seif — Pure Vanilla JS Execution Engine (v1.17.30) */
(() => {
"use strict";
if (window.__helpSeifEngineLoaded) return;
window.__helpSeifEngineLoaded = true;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const onDelay = async (step) => {
if (window.__helpSeifAborted) return;
const mult = Number(window.__helpSeifDelayMultiplier) || 1;
const waitMs = Math.max(15, Math.round((Number(step?.value) || 0) * mult));
await delay(waitMs);
};
function normalizeSelector(sel) {
function saveUnmatched() {
if (unmatched) {
if (tokens.length > 0 && /^[~+>]$/.test(tokens[tokens.length - 1])) {
tokens.push(" ");
}
tokens.push(unmatched);
}
}
var match,
unmatched,
regex,
prevIndex,
tokens = [],
state = [0],
nextIndex = 0,
prevNotEscaped = /(?:[^\\]|(?:^|[^\\])(?:\\\\)+)$/,
whitespaceRx = /^\s+$/,
statePatterns = [
/\s+|\/\*|["'>~+[(]/g,
/\s+|\/\*|["'[\]()]/g,
/\s+|\/\*|["'[\]()]/g,
null,
/\*\//g,
];
sel = String(sel || "").trim();
for (;;) {
unmatched = "";
regex = statePatterns[state[state.length - 1]];
regex.lastIndex = nextIndex;
match = regex.exec(sel);
if (!match) {
unmatched = sel.substr(nextIndex);
saveUnmatched();
break;
}
prevIndex = nextIndex;
nextIndex = regex.lastIndex;
if (prevIndex < nextIndex - match[0].length) {
unmatched = sel.substring(prevIndex, nextIndex - match[0].length);
}
if (state[state.length - 1] < 3) {
saveUnmatched();
if (match[0] === "[") state.push(1);
else if (match[0] === "(") state.push(2);
else if (/^["']$/.test(match[0])) {
state.push(3);
statePatterns[3] = new RegExp(match[0], "g");
} else if (match[0] === "/*") state.push(4);
else if (/^[\])]$/.test(match[0]) && state.length > 0) state.pop();
else if (/^(?:\s+|[~+>])$/.test(match[0])) {
if (
tokens.length > 0 &&
!whitespaceRx.test(tokens[tokens.length - 1]) &&
state[state.length - 1] === 0
) {
tokens.push(" ");
}
if (
state[state.length - 1] === 1 &&
tokens.length === 5 &&
tokens[2].charAt(tokens[2].length - 1) === "="
) {
tokens[4] = " " + tokens[4];
}
if (whitespaceRx.test(match[0])) continue;
}
tokens.push(match[0]);
} else {
tokens[tokens.length - 1] += unmatched;
if (prevNotEscaped.test(tokens[tokens.length - 1])) {
if (state[state.length - 1] === 4) {
if (
tokens.length < 2 ||
whitespaceRx.test(tokens[tokens.length - 2])
) {
tokens.pop();
} else {
tokens[tokens.length - 1] = " ";
}
match[0] = "";
}
state.pop();
}
tokens[tokens.length - 1] += match[0];
}
}
return tokens.join("").trim();
}
function splitByCharacterUnlessQuoted(str, char) {
return (str.match(/\\?.|^$/g) || []).reduce(
(acc, c) => {
if (c === '"' && !acc.sQuote) {
acc.quote ^= 1;
acc.a[acc.a.length - 1] += c;
} else if (c === "'" && !acc.quote) {
acc.sQuote ^= 1;
acc.a[acc.a.length - 1] += c;
} else if (acc.quote || acc.sQuote || c !== char) {
acc.a[acc.a.length - 1] += c;
} else {
acc.a.push("");
}
return acc;
},
{ a: [""] }
).a;
}
function findParentOrHost(el, root) {
const parent = el.parentNode;
if (parent && parent.host && parent.nodeType === 11) return parent.host;
return parent === root ? null : parent;
}
let cachedDeepElements = null;
let cachedDeepTimestamp = 0;
const DEEP_CACHE_TTL_MS = 80;
function collectAllElementsDeep(selector = null, root = document, cachedElements = null) {
let allElements = [];
if (cachedElements) {
allElements = cachedElements;
} else if (root === document) {
const now = Date.now();
if (cachedDeepElements && now - cachedDeepTimestamp < DEEP_CACHE_TTL_MS) {
allElements = cachedDeepElements;
} else {
const list = [];
const walk = (nodes) => {
for (let i = 0; i < nodes.length; i++) {
const el = nodes[i];
if (!el || el.id === "help-seif-floating-host" || el.id === "help-seif-hud") {
continue;
}
list.push(el);
if (el.shadowRoot) {
walk(el.shadowRoot.querySelectorAll("*"));
}
}
};
walk(document.querySelectorAll("*"));
cachedDeepElements = list;
cachedDeepTimestamp = now;
allElements = list;
}
} else {
const walk = (nodes) => {
for (let i = 0; i < nodes.length; i++) {
const el = nodes[i];
if (!el || el.id === "help-seif-floating-host" || el.id === "help-seif-hud") {
continue;
}
allElements.push(el);
if (el.shadowRoot) {
walk(el.shadowRoot.querySelectorAll("*"));
}
}
};
if (root.shadowRoot) {
walk(root.shadowRoot.querySelectorAll("*"));
}
walk(root.querySelectorAll("*"));
}
if (!selector) return allElements;
return allElements.filter((el) => {
try {
return el.matches(selector);
} catch {
return false;
}
});
}
function querySelectorDeepInternal(selector, findMany, root = document, allElements = null) {
selector = normalizeSelector(selector);
let lightElement = null;
try {
lightElement = root.querySelector(selector);
} catch {}
if (document.head?.createShadowRoot || document.head?.attachShadow) {
if (!findMany && lightElement) return lightElement;
const selectionsToMake = splitByCharacterUnlessQuoted(selector, ",");
return selectionsToMake.reduce(
(acc, minimalSelector) => {
if (!findMany && acc) return acc;
const splitSelector = splitByCharacterUnlessQuoted(
minimalSelector
.replace(/^\s+/g, "")
.replace(/\s*([>+~]+)\s*/g, "$1"),
" "
)
.filter((entry) => !!entry)
.map((entry) => splitByCharacterUnlessQuoted(entry, ">"));
const possibleElementsIndex = splitSelector.length - 1;
const lastSplitPart =
splitSelector[possibleElementsIndex][
splitSelector[possibleElementsIndex].length - 1
];
const possibleElements = collectAllElementsDeep(
lastSplitPart,
root,
allElements
);
const findElements = (el) => {
let idx = possibleElementsIndex;
let item = el;
let found = false;
while (
item &&
item.nodeType !== Node.DOCUMENT_FRAGMENT_NODE &&
item.nodeType !== Node.DOCUMENT_NODE
) {
let matches = true;
if (splitSelector[idx].length === 1) {
try {
matches = item.matches(splitSelector[idx]);
} catch {
matches = false;
}
} else {
const reversedParts = [].concat(splitSelector[idx]).reverse();
let parent = item;
for (const part of reversedParts) {
let partMatch = false;
try {
partMatch = !!parent && parent.matches(part);
} catch {
partMatch = false;
}
if (!partMatch) {
matches = false;
break;
}
parent = findParentOrHost(parent, root);
}
}
if (matches && idx === 0) {
found = true;
break;
}
if (matches) idx--;
item = findParentOrHost(item, root);
}
return found;
};
if (findMany) {
return acc.concat(possibleElements.filter(findElements));
}
return possibleElements.find(findElements) || null;
},
findMany ? [] : null
);
}
if (!findMany) return lightElement;
try {
return Array.from(root.querySelectorAll(selector));
} catch {
return [];
}
}
const normalizeRoot = (root) =>
root instanceof Document || root instanceof HTMLElement ? root : document;
const queryDocument = (selector, root = document) => {
const trimmed = String(selector || "").trim();
if (!trimmed) return null;
const targetRoot = normalizeRoot(root);
try {
const found = querySelectorDeepInternal(trimmed, false, targetRoot);
if (found) return found;
} catch {}
try {
return targetRoot.querySelector(trimmed);
} catch {
return null;
}
};
const queryDocumentAll = (selector, root = document) => {
const trimmed = String(selector || "").trim();
if (!trimmed) return [];
const targetRoot = normalizeRoot(root);
try {
const found = querySelectorDeepInternal(trimmed, true, targetRoot);
if (found && found.length > 0) return found;
} catch {}
try {
return Array.from(targetRoot.querySelectorAll(trimmed));
} catch {
return [];
}
};
const queryAllElements = () => collectAllElementsDeep(null, document);
const isElementVisible = (el) => {
if (!el || !el.isConnected) return false;
try {
const style = window.getComputedStyle(el);
return (
style.display !== "none" &&
style.visibility !== "hidden" &&
style.opacity !== "0" &&
el.getClientRects().length > 0
);
} catch {
return false;
}
};
const isOppDesc = (el) => {
if (!el) return false;
try {
if (
el.closest(
".cuf-publisherContainer,.activityTimelinePublisherContainer,.forceChatterPublisher,[data-target-selection-name*='LogACall'],.runtime_sales_activitiesTaskTabContent"
)
) {
return false;
}
if (
el.closest(
'[title*="Opportunity Description"],[data-target-selection-name*="Opportunity_Description"]'
)
) {
return true;
}
const formEl = el.closest(".slds-form-element");
if (formEl && /Opportunity Description/i.test(formEl.textContent || "")) {
return true;
}
if (el.getAttribute("title") === "Edit Opportunity Description/Comments") {
return true;
}
} catch {}
return false;
};
const findElementsByFieldType = (fieldType) => {
switch (fieldType) {
case "text":
return queryDocumentAll("input, textarea");
case "radio":
case "checkbox":
return queryDocumentAll("input[type=radio], input[type=checkbox]");
case "select":
return queryDocumentAll(
"select, [role='combobox'], [aria-haspopup='listbox']"
);
case "time":
return queryDocumentAll(
'.PfQ8Lb, input[aria-label="Hour"], input[aria-label="Minute"]'
);
default:
return [];
}
};
const attrEqualsCI = (el, attr, val) => {
const raw = el.getAttribute(attr);
return raw?.trim()?.toLowerCase() === val?.trim()?.toLowerCase();
};
const searchMatchers = {
name: (el, val) => attrEqualsCI(el, "name", val),
id: (el, val) => attrEqualsCI(el, "id", val),
placeholder: (el, val) => attrEqualsCI(el, "placeholder", val),
dataTestId: (el, val) =>
["data-testid", "data-test", "data-test-id", "data-testId"].some((attr) =>
attrEqualsCI(el, attr, val)
),
class: (el, val) => el.classList.contains(String(val || "").trim()),
text: (el, val) =>
el.textContent?.toLowerCase()?.trim() === val?.trim()?.toLowerCase(),
value: (el, val) =>
el instanceof HTMLInputElement &&
el.value?.trim()?.toLowerCase() === val?.trim()?.toLowerCase(),
};
const findFlexByLabel = (key, requireVisible = false) => {
const match = String(key || "").match(/Flexible[_\s]*Field[_\s]*([34])/i);
if (!match) return null;
const num = match[1];
try {
const all = queryAllElements();
const bySel = all.find(
(el) =>
(el.tagName === "TEXTAREA" || el.tagName === "INPUT") &&
(!requireVisible || isElementVisible(el)) &&
!isOppDesc(el) &&
(el.getAttribute("name") === `Flexible_Field_${num}_Value__c` ||
!!el.closest(
`[data-target-selection-name*="Flexible_Field_${num}_Value"]`
))
);
if (bySel) return bySel;
const lblRx = new RegExp(`Flexible\\s*Field\\s*${num}\\s*Value`, "i");
const lbl = all.find(
(el) => el.tagName === "LABEL" && lblRx.test(el.textContent || "")
);
if (lbl) {
const root =
lbl.closest("lightning-textarea,lightning-input,.slds-form-element") ||
lbl.parentElement;
if (root) {
const field =
root.querySelector("textarea,input") ||
root.shadowRoot?.querySelector("textarea,input");
if (field && !isOppDesc(field)) return field;
}
const forId = lbl.getAttribute("for");
if (forId) {
const field = all.find(
(el) =>
(el.tagName === "TEXTAREA" || el.tagName === "INPUT") &&
el.id === forId &&
!isOppDesc(el)
);
if (field) return field;
}
}
} catch {}
return null;
};
const findFieldElement = (key, searchType, fieldType) => {
const candidates = fieldType
? findElementsByFieldType(fieldType)
: queryAllElements();
if (searchType === "cssSelector") {
const trimmedKey = String(key || "").trim();
let found =
queryAllElements().find((el) => {
try {
return (
el.matches(trimmedKey) && isElementVisible(el) && !isOppDesc(el)
);
} catch {
return false;
}
}) ||
queryDocument(trimmedKey) ||
candidates?.find((el) => {
try {
return el.matches(key) && !isOppDesc(el);
} catch {
return false;
}
});
if (found && isOppDesc(found)) found = null;
if (found) return found;
if (/quickTextKeyboardTip|Comments|comment/i.test(String(key || ""))) {
const fallbackSelectors = [
".cuf-publisherContainer textarea",
".activityTimelinePublisherContainer textarea",
".forceChatterPublisher textarea",
".runtime_sales_activitiesTaskTabContent textarea",
'textarea[aria-describedby*="quickTextKeyboardTip"]',
'textarea[aria-label="Comments"]',
'textarea[name="Comments"]',
'textarea[placeholder*="comment" i]',
];
for (const sel of fallbackSelectors) {
const el = queryAllElements().find((node) => {
try {
return (
node.matches(sel) && isElementVisible(node) && !isOppDesc(node)
);
} catch {
return false;
}
});
if (el && !isOppDesc(el)) return el;
}
return null;
}
return (
candidates?.find(
(el) => searchMatchers[searchType]?.(el, key) && !isOppDesc(el)
) || findFlexByLabel(key, true)
);
}
return (
candidates?.find(
(el) => searchMatchers[searchType]?.(el, key) && !isOppDesc(el)
) || findFlexByLabel(key, true)
);
};
const findClickElement = (key, searchType, fieldType) => {
const candidates = fieldType
? findElementsByFieldType(fieldType)
: queryAllElements();
const found =
searchType === "cssSelector"
? queryDocument(String(key || "").trim()) ||
candidates?.find((el) => {
try {
return el.matches(key);
} catch {
return false;
}
})
: candidates?.find((el) => searchMatchers[searchType]?.(el, key));
return found || findFlexByLabel(key, false);
};
const setNativeValue = (el, val) => {
if (el.getAttribute("contenteditable") === "true") {
el.textContent = val;
return;
}
const proto =
el instanceof HTMLTextAreaElement
? HTMLTextAreaElement.prototype
: HTMLInputElement.prototype;
const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
if (setter) setter.call(el, val);
else el.value = val;
};
const simulateTyping = async (value, el, typeDelayConfig) => {
const animate = typeDelayConfig?.autofillAnimation;
const charDelay = typeDelayConfig?.autoFillDelay;
const str = String(value ?? "");
if (!animate || str.length === 0) {
setNativeValue(el, str);
return;
}
let current = "";
for (let i = 0; i < str.length; i++) {
current += str[i];
setNativeValue(el, current);
await delay(charDelay || 50);
}
};
class TextFieldHandler {
constructor(typeDelayConfig) {
this.typeDelayConfig = typeDelayConfig;
}
async handle(el, field) {
await simulateTyping(field.value, el, this.typeDelayConfig);
el.dispatchEvent(new Event("input", { bubbles: true }));
el.dispatchEvent(new Event("change", { bubbles: true }));
}
}
class CheckboxHandler {
async handle(el, field) {
const checked = field.value === "true";
if (el.getAttribute("aria-hidden") === "true") {
const proxy = el.parentElement?.querySelector(
'[role="checkbox"], [role="switch"]'
);
if ((proxy?.getAttribute("aria-checked") === "true") !== checked) {
proxy?.dispatchEvent(new Event("click", { bubbles: true }));
}
} else if (el.checked !== checked) {
el.checked = checked;
el.dispatchEvent(new Event("click", { bubbles: true }));
el.dispatchEvent(new Event("change", { bubbles: true }));
}
}
}
class RadioHandler {
async handle(el, field) {
const checked = field.value === "true";
if (el.getAttribute("aria-hidden") === "true") {
const proxy = el.parentElement?.querySelector('[role="radio"]');
if ((proxy?.getAttribute("aria-checked") === "true") !== checked) {
proxy?.dispatchEvent(new Event("click", { bubbles: true }));
}
} else if (el.checked !== checked) {
el.checked = checked;
el.dispatchEvent(new Event("click", { bubbles: true }));
el.dispatchEvent(new Event("change", { bubbles: true }));
}
}
}
class SelectFieldHandler {
constructor(options = {}) {
this.options = options;
}
async handle(el, field) {
if (el.tagName.toLowerCase() === "select") {
el.value = field.value;
el.dispatchEvent(new Event("change", { bubbles: true }));
} else if (this.options.isGoogleForm) {
await this.fillGoogleFormsSelect(el, field.value);
} else {
await this.fillCustomSelect(el, field.value);
}
}
async fillCustomSelect(el, targetValue) {
await delay(10);
try {
if (typeof el.focus === "function") el.focus();
} catch {}
try {
el.dispatchEvent(
new PointerEvent("pointerdown", {
bubbles: true,
cancelable: true,
pointerType: "mouse",
button: 0,
})
);
} catch {}
try {
el.dispatchEvent(
new MouseEvent("mousedown", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
try {
el.dispatchEvent(
new PointerEvent("pointerup", {
bubbles: true,
cancelable: true,
pointerType: "mouse",
button: 0,
})
);
} catch {}
try {
el.dispatchEvent(
new MouseEvent("mouseup", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
try {
if (typeof el.click === "function") el.click();
else
el.dispatchEvent(
new MouseEvent("click", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
await delay(250);
let listbox = await this.findVisibleListbox(el);
if (!listbox) {
await delay(250);
listbox = await this.findVisibleListbox(el);
}
if (!listbox) {
console.error("Cannot find listbox for element:", el);
return;
}
const normalize = (s) =>
String(s ?? "")
.replace(/\s+/g, " ")
.trim()
.toLowerCase();
const options = listbox.querySelectorAll('[role="option"]');
const match = Array.from(options).find((opt) => {
if (!opt) return false;
const text = opt.textContent ? opt.textContent.trim() : "";
const val =
opt.getAttribute("data-value") || opt.getAttribute("value") || "";
const title =
opt.getAttribute("title") ||
opt.querySelector("[title]")?.getAttribute("title") ||
"";
if (
normalize(text) === normalize(targetValue) ||
normalize(val) === normalize(targetValue) ||
normalize(title) === normalize(targetValue) ||
normalize(text).includes(normalize(targetValue))
) {
return true;
}
if (
targetValue &&
(targetValue === "EGP" || targetValue.includes("EGP")) &&
(val === "EGP" || text.includes("EGP") || title.includes("EGP"))
) {
return true;
}
return false;
});
if (match) {
try {
if (typeof match.scrollIntoView === "function") {
match.scrollIntoView({ block: "nearest" });
}
} catch {}
try {
if (typeof match.focus === "function") match.focus();
} catch {}
try {
match.dispatchEvent(
new MouseEvent("mousedown", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
try {
match.dispatchEvent(
new MouseEvent("mouseup", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
try {
if (typeof match.click === "function") match.click();
else
match.dispatchEvent(
new MouseEvent("click", {
bubbles: true,
cancelable: true,
view: window,
})
);
} catch {}
try {
match.dispatchEvent(new Event("change", { bubbles: true }));
} catch {}
if (match.hasAttribute("data-radix-collection-item")) {
match.dispatchEvent(
new PointerEvent("pointerdown", {
bubbles: true,
pointerType: "mouse",
button: 0,
})
);
match.dispatchEvent(
new PointerEvent("pointerup", {
bubbles: true,
pointerType: "mouse",
button: 0,
})
);
}
await delay(10);
try {
document.body.dispatchEvent(
new MouseEvent("mousedown", { bubbles: true })
);
} catch {}
await delay(10);
} else {
console.warn(`Option "${targetValue}" was not found in listbox`);
}
}
async findVisibleListbox(el) {
const isVisible = (node) => {
const s = window.getComputedStyle(node);
return (
s.display !== "none" &&
s.visibility !== "hidden" &&
s.opacity !== "0" &&
node.offsetParent !== null
);
};
let listboxes = Array.from(
document.querySelectorAll('[role="listbox"]')
).filter(isVisible);
if (listboxes.length === 0) {
listboxes = queryAllElements().filter(
(node) => node.getAttribute?.("role") === "listbox" && isVisible(node)
);
}
if (listboxes.length === 0) return null;
if (listboxes.length === 1) return listboxes[0];
const ariaControls = el.getAttribute("aria-controls");
if (ariaControls) {
for (const id of ariaControls.split(/\s+/)) {
const found = document.getElementById(id);
if (found && isVisible(found)) return found;
}
}
const ariaOwns = el.getAttribute("aria-owns");
if (ariaOwns) {
for (const id of ariaOwns.split(/\s+/)) {
const found = document.getElementById(id);
if (found && isVisible(found)) return found;
}
}
for (const lb of listboxes) {
if (
lb.getAttribute("aria-labelledby") === el.id ||
el.contains(lb) ||
(lb.parentElement && el.contains(lb.parentElement))
) {
return lb;
}
}
return listboxes[listboxes.length - 1];
}
async fillGoogleFormsSelect(el, targetValue) {
const pres = el.querySelector('[role="presentation"]');
if (!pres) return false;
pres.dispatchEvent(
new Event("click", { bubbles: true, cancelable: true })
);
await delay(300);
const activeChild = Array.from(el.children).find(
(ch) => ch.getAttribute("aria-hidden") !== "true"
);
if (!activeChild) return false;
const options = activeChild.querySelectorAll('[role="option"]');
for (const opt of options) {
if (opt.textContent?.trim() === targetValue) {
opt.setAttribute("aria-selected", "true");
opt.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
await delay(50);
opt.dispatchEvent(
new PointerEvent("pointerdown", {
bubbles: true,
cancelable: true,
pointerType: "mouse",
button: 0,
})
);
await delay(20);
opt.dispatchEvent(
new MouseEvent("mousedown", { bubbles: true, cancelable: true })
);
await delay(20);
opt.dispatchEvent(
new MouseEvent("mouseup", { bubbles: true, cancelable: true })
);
await delay(20);
opt.dispatchEvent(
new MouseEvent("click", {
bubbles: true,
cancelable: true,
view: window,
})
);
return true;
}
}
return false;
}
}
function parseTimeValue(val) {
const cleaned = String(val || "")
.replace(/\s+/g, " ")
.trim();
const m12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
if (m12) {
let hour = parseInt(m12[1], 10);
const minute = parseInt(m12[2], 10);
const period = m12[3].toUpperCase();
if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
if (period === "AM" && hour === 12) hour = 0;
else if (period === "PM" && hour !== 12) hour += 12;
return { hour, minute };
}
const m24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
if (m24) {
const hour = parseInt(m24[1], 10);
const minute = parseInt(m24[2], 10);
if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
return { hour, minute };
}
return null;
}
class TimeFieldHandler {
async handle(el, field) {
const parsed = parseTimeValue(field.value);
if (!parsed) return;
const container = el.closest(".PfQ8Lb") || el;
const listbox = container.querySelector('[role="listbox"]');
let hourStr,
minuteStr,
period = null;
if (listbox) {
let h12 = parsed.hour % 12;
if (h12 === 0) h12 = 12;
hourStr = String(h12);
minuteStr = String(parsed.minute).padStart(2, "0");
period = parsed.hour < 12 ? "AM" : "PM";
} else {
hourStr = String(parsed.hour);
minuteStr = String(parsed.minute).padStart(2, "0");
}
const hourInput = container.querySelector('input[aria-label="Hour"]');
if (hourInput) await this.fillNumberInput(hourInput, hourStr);
await delay(50);
const minInput = container.querySelector('input[aria-label="Minute"]');
if (minInput) await this.fillNumberInput(minInput, minuteStr);
await delay(50);
if (listbox && period) {
const opts = listbox.querySelectorAll('[role="option"]');
opts.forEach((opt) => {
if (opt.getAttribute("data-value") === period) {
opt.click();
}
});
}
}
async fillNumberInput(input, val) {
const trimmed = val.trim();
if (!/^\d+$/.test(trimmed)) return;
setNativeValue(input, trimmed);
input.focus();
input.dispatchEvent(new Event("input", { bubbles: true }));
input.dispatchEvent(new Event("change", { bubbles: true }));
input.dispatchEvent(new Event("blur", { bubbles: true }));
}
}
const isGoogleForm = () =>
window.location.hostname === "docs.google.com" &&
window.location.pathname.startsWith("/forms/");
const fillElement = async (el, field, typeDelayConfig) => {
const handler = {
text: new TextFieldHandler(typeDelayConfig),
radio: new RadioHandler(),
checkbox: new CheckboxHandler(),
select: new SelectFieldHandler({ isGoogleForm: isGoogleForm() }),
time: new TimeFieldHandler(),
}[field.fieldType];
if (handler) {
await handler.handle(el, field);
} else {
console.warn(`Unsupported field type: ${field.fieldType}`);
}
};
class FormFiller {
constructor(typeDelayConfig) {
this.typeDelayConfig = typeDelayConfig;
}
async fillField(field) {
let el = findFieldElement(field.key, field.searchType, field.fieldType);
if (!el && !isGoogleForm()) {
const deadline = Date.now() + 1000;
while (Date.now() < deadline && !el && !window.__helpSeifAborted) {
await delay(60);
el = findFieldElement(field.key, field.searchType, field.fieldType);
}
}
if (!el) return;
await fillElement(el, field, this.typeDelayConfig);
}
}
const formatTodayDate = () => {
const d = new Date();
return (
String(d.getDate()).padStart(2, "0") +
"/" +
String(d.getMonth() + 1).padStart(2, "0") +
"/" +
d.getFullYear()
);
};
const fillSpecificFields = async (profileOrStep, options) => {
if (profileOrStep?.fields) {
for (const rawField of profileOrStep.fields) {
if (window.__helpSeifAborted) break;
const filler = new FormFiller(options);
const field = { ...rawField };
if (field.value === "{{TODAY}}") {
field.value = formatTodayDate();
}
if (field.value === "{{FLEXIBLE_FIELD_3}}") {
field.value = "BEG 10% List";
}
if (
(rawField?.value === "{{FLEXIBLE_FIELD_3}}" ||
field.key === "Flexible_Field_3_Value__c") &&
typeof chrome !== "undefined" &&
chrome.storage?.local
) {
try {
const st = await new Promise((res) =>
chrome.storage.local.get("qfeFlexibleFieldValue", res)
);
if (
typeof st?.qfeFlexibleFieldValue === "string" &&
st.qfeFlexibleFieldValue.trim()
) {
field.value = st.qfeFlexibleFieldValue;
}
} catch {}
}
if (field.value === "{{FLEXIBLE_FIELD_4}}") {
field.value = "CC";
}
if (
(rawField?.value === "{{FLEXIBLE_FIELD_4}}" ||
/Flexible_Field_4|Flexible\s*Field\s*4/i.test(
String(field.key || "")
)) &&
typeof chrome !== "undefined" &&
chrome.storage?.local
) {
try {
const st = await new Promise((res) =>
chrome.storage.local.get("qfeFlexibleField4Value", res)
);
if (
typeof st?.qfeFlexibleField4Value === "string" &&
st.qfeFlexibleField4Value.trim()
) {
field.value = st.qfeFlexibleField4Value.trim();
}
} catch {}
}
if (
field.key &&
(field.key.includes("Opportunity Currency") ||
field.key.includes("CurrencyIsoCode"))
) {
field.value = "EGP - Egyptian Pound";
}
await filler.fillField(field);
if (field.fieldType === "select") {
await delay(350);
}
}
}
await delay(10);
};
const findVisibleMatches = (selector) => {
try {
return (
queryAllElements().find((el) => {
try {
return el.matches(selector) && isElementVisible(el);
} catch {
return false;
}
}) || null
);
} catch {
return null;
}
};
function findTaskTab() {
try {
const all = queryAllElements();
const direct = all.find((el) => {
if (!el || !isElementVisible(el)) return false;
const tag = el.tagName;
if (
tag === "H1" ||
tag === "H2" ||
tag === "H3" ||
tag === "H4" ||
el.classList.contains("panelTitle")
) {
return false;
}
const aria = (el.getAttribute("aria-label") || "").toLowerCase();
const title = (el.getAttribute("title") || "").toLowerCase();
const txt = (el.innerText || el.textContent || "")
.trim()
.toLowerCase();
const target = el.getAttribute("data-target-selection-name") || "";
const tabVal = (
el.getAttribute("data-tab-value") ||
el.getAttribute("data-tab-name") ||
""
).toLowerCase();
const isTabLike =
tag === "A" ||
tag === "BUTTON" ||
el.getAttribute("role") === "tab" ||
el.classList.contains("slds-tabs_default__link");
return (
isTabLike &&
(aria === "new task" ||
title === "new task" ||
txt === "new task" ||
tabVal === "newtask" ||
target.includes("NewTask"))
);
});
if (direct) return direct;
const container = all.find((el) => {
if (!el || !isElementVisible(el)) return false;
const tag = el.tagName;
if (
tag === "H1" ||
tag === "H2" ||
tag === "H3" ||
tag === "H4" ||
el.classList.contains("panelTitle")
) {
return false;
}
const target = el.getAttribute("data-target-selection-name") || "";
const title = (el.getAttribute("title") || "").toLowerCase();
const aria = (el.getAttribute("aria-label") || "").toLowerCase();
return (
target.includes("NewTask") ||
title === "new task" ||
aria === "new task"
);
});
if (container) {
return (
container.querySelector?.(
"a, button, [role='tab'], .slds-tabs_default__link"
) ||
container.shadowRoot?.querySelector?.(
"a, button, [role='tab'], .slds-tabs_default__link"
) ||
container
);
}
} catch {}
return null;
}
function isInsideActivityPanel(el) {
for (let cur = el; cur; ) {
try {
if (
cur.matches &&
cur.matches(
'.activityPanel, runtime_sales_activities-activity-panel-composer, [data-target-selection-name="LogACallTab"]'
)
) {
return true;
}
} catch {}
let next = cur.parentElement;
if (!next) {
const root = cur.getRootNode?.();
next = (root && root.host) || null;
}
cur = next;
}
return false;
}
const onClickToElement = async (step) => {
if (window.__helpSeifAborted) return false;
if (
/Edit (?:Stage|Close Date)/i.test(String(step.key || "")) &&
!/combobox|aria-label=["']Stage/i.test(String(step.key || ""))
) {
try {
const alreadyEditing = queryAllElements().some(
(el) =>
isElementVisible(el) &&
((el.tagName === "BUTTON" &&
el.getAttribute("role") === "combobox" &&
el.getAttribute("aria-label") === "Stage") ||
(el.tagName === "INPUT" &&
el.getAttribute("name") === "CloseDate") ||
(el.tagName === "BUTTON" &&
el.getAttribute("name") === "SaveEdit"))
);
if (alreadyEditing) return true;
} catch {}
}
let target = findClickElement(step.key, step.searchType);
if (!target || !isElementVisible(target)) {
if (step.searchType === "cssSelector") {
target = findVisibleMatches(step.key);
}
}
if (
target &&
/Stage/i.test(String(step.key || "")) &&
/undo/i.test(String(target.title || "") + " " + String(target.className || ""))
) {
try {
target =
queryAllElements().find(
(el) =>
isElementVisible(el) &&
el.tagName === "BUTTON" &&
(el.getAttribute("role") === "combobox" ||
el.classList.contains("slds-combobox__input")) &&
/stage/i.test(String(el.getAttribute("aria-label") || ""))
) || null;
} catch {
target = null;
}
}
if (/NewTask|New Task/i.test(String(step.id || "") + String(step.key || ""))) {
const tabEl = findTaskTab();
if (tabEl) target = tabEl;
}
if (
(!target || !isElementVisible(target)) &&
/cuf-publisherShareButton/i.test(step.key || "")
) {
try {
target =
queryAllElements().find(
(el) =>
el.tagName === "BUTTON" &&
String(el.textContent || "").trim().toLowerCase() === "save" &&
isElementVisible(el) &&
el.classList.contains("slds-button_brand") &&
isInsideActivityPanel(el)
) || null;
} catch {
target = null;
}
}
if (
(!target || !isElementVisible(target)) &&
/SaveEdit|Save/i.test(step.key || "")
) {
try {
target =
queryAllElements().find(
(el) =>
el.tagName === "BUTTON" &&
isElementVisible(el) &&
(String(el.name || "") === "SaveEdit" ||
(String(el.textContent || "").trim().toLowerCase() === "save" &&
el.classList.contains("slds-button_brand") &&
!!el.closest(
".slds-docked-form-footer, .actionsContainer, .slds-modal__footer, footer, form"
)))
) || null;
} catch {
target = null;
}
}
if (!target || !isElementVisible(target)) {
const deadline = Date.now() + 3000;
while (
Date.now() < deadline &&
!window.__helpSeifAborted &&
(!target || !isElementVisible(target))
) {
await delay(100);
try {
if (
/NewTask|New Task/i.test(
String(step.id || "") + String(step.key || "")
)
) {
const tabEl = findTaskTab();
if (tabEl) {
target = tabEl;
break;
}
}
target = findClickElement(step.key, step.searchType);
if (!target || !isElementVisible(target)) {
if (step.searchType === "cssSelector") {
target = findVisibleMatches(step.key);
}
}
if (
(!target || !isElementVisible(target)) &&
/SaveEdit|Save/i.test(step.key || "")
) {
target =
queryAllElements().find(
(el) =>
el.tagName === "BUTTON" &&
isElementVisible(el) &&
(String(el.name || "") === "SaveEdit" ||
(String(el.textContent || "").trim().toLowerCase() ===
"save" &&
el.classList.contains("slds-button_brand") &&
!!el.closest(
".slds-docked-form-footer, .actionsContainer, .slds-modal__footer, footer, form"
)))
) || null;
}
} catch {
target = null;
}
}
}
if (!target || !isElementVisible(target)) {
console.warn(
"Help Seif: click target not found or not visible after wait:",
step.key
);
return false;
}
if (target.disabled || target.getAttribute("aria-disabled") === "true") {
const waitDeadline = Date.now() + 3000;
while (
Date.now() < waitDeadline &&
!window.__helpSeifAborted &&
(target.disabled || target.getAttribute("aria-disabled") === "true")
) {
await delay(100);
try {
const fresh = findClickElement(step.key, step.searchType);
if (fresh && isElementVisible(fresh)) target = fresh;
} catch {}
}
}
if (target.disabled || target.getAttribute("aria-disabled") === "true") {
console.warn("Help Seif: click target is disabled:", step.key);
return false;
}
let toClick = target;
if (
target.tagName !== "BUTTON" &&
target.tagName !== "A" &&
target.getAttribute("role") !== "button" &&
target.getAttribute("role") !== "tab"
) {
const inner =
target.querySelector?.(
"a, button, [role='tab'], [role='button'], [role='option'], span"
) ||
target.shadowRoot?.querySelector?.(
"a, button, [role='tab'], [role='button'], [role='option'], span"
);
if (inner && isElementVisible(inner)) toClick = inner;
}
try {
if (typeof toClick.scrollIntoView === "function") {
toClick.scrollIntoView({ block: "center", inline: "nearest" });
}
} catch {}
try {
if (typeof toClick.focus === "function") {
toClick.focus({ preventScroll: true });
}
} catch {}
const evtInit = {
bubbles: true,
cancelable: true,
composed: true,
view: window,
button: 0,
buttons: 1,
pointerType: "mouse",
isPrimary: true,
};
try {
toClick.dispatchEvent(new PointerEvent("pointerdown", evtInit));
} catch {}
try {
toClick.dispatchEvent(new MouseEvent("mousedown", evtInit));
} catch {}
await delay(25);
try {
toClick.dispatchEvent(
new PointerEvent("pointerup", { ...evtInit, buttons: 0 })
);
} catch {}
try {
toClick.dispatchEvent(
new MouseEvent("mouseup", { ...evtInit, buttons: 0 })
);
} catch {}
await delay(15);
try {
if (typeof toClick.click === "function") toClick.click();
else
toClick.dispatchEvent(
new MouseEvent("click", {
bubbles: true,
cancelable: true,
composed: true,
view: window,
})
);
} catch (err) {
console.warn("Help Seif: click dispatch failed", err);
return false;
}
if (toClick !== target) {
try {
target.click();
} catch {}
}
await delay(30);
if (/cuf-publisherShareButton/i.test(String(step.key || ""))) {
const deadline = Date.now() + 950;
while (Date.now() < deadline) {
if (
!target.isConnected ||
!isElementVisible(target) ||
!isInsideActivityPanel(target)
) {
break;
}
await delay(45);
}
}
if (
/button\s*\.\s*slds-button_brand\s*\[\s*type\s*=\s*["']submit/i.test(
String(step.key || "")
)
) {
let modal = null;
try {
modal = target.closest(
'.slds-modal, .modal-container, .uiModal, [role="dialog"]'
);
} catch {}
if (modal) {
const deadline = Date.now() + 1200;
while (Date.now() < deadline) {
if (!modal.isConnected || !isElementVisible(modal)) break;
let hasErr = false;
try {
hasErr = queryAllElements().some(
(el) =>
el &&
(/slds-theme_error|forcePageError/i.test(
String(el.className || "")
) ||
el.matches?.(
".slds-notify_toast.slds-theme_error, .forcePageError"
)) &&
isElementVisible(el)
);
} catch {}
if (hasErr) {
window.__helpSeifSaveFailed = true;
break;
}
await delay(50);
}
}
}
if (
/SaveEdit|Save/i.test(String(step.key || "")) &&
(/button\s*\[\s*name\s*=\s*["']SaveEdit/i.test(String(step.key || "")) ||
target.name === "SaveEdit" ||
target.closest?.(".slds-docked-form-footer"))
) {
const deadline = Date.now() + 5000;
let savedOk = false;
while (Date.now() < deadline && !window.__helpSeifAborted) {
let saveBtnStillVisible = false;
let hasErr = false;
try {
saveBtnStillVisible = queryAllElements().some(
(el) =>
el.tagName === "BUTTON" &&
String(el.name || "") === "SaveEdit" &&
isElementVisible(el)
);
hasErr = queryAllElements().some(
(el) =>
el &&
(/slds-theme_error|forcePageError/i.test(
String(el.className || "")
) ||
el.matches?.(
".slds-notify_toast.slds-theme_error, .forcePageError"
)) &&
isElementVisible(el)
);
} catch {}
if (!saveBtnStillVisible) {
savedOk = true;
break;
}
if (hasErr) {
window.__helpSeifSaveFailed = true;
console.warn(
"Help Seif: Salesforce displayed a save error; skipping subsequent owner actions."
);
break;
}
await delay(150);
}
if (!savedOk && !window.__helpSeifSaveFailed) {
window.__helpSeifSaveFailed = true;
console.warn(
"Help Seif: could not verify that Salesforce saved the record; skipping subsequent owner actions."
);
}
}
const isOwnerAction = /lookup__list|lookup__item|owner|change\s*owner/i.test(
String(step.id || "") + String(step.key || "")
);
if (isOwnerAction) {
const isConfirmBtn =
/button\s*\[\s*name\s*=\s*["']change owner|button\.changeOwnerConfirm|\.slds-modal__footer button\.slds-button_brand/i.test(
String(step.key || "")
);
const deadline = Date.now() + (isConfirmBtn ? 2200 : 350);
while (Date.now() < deadline && !window.__helpSeifAborted) {
let hasDup = false;
try {
if (
/(?:already owns this record|already\s+the\s+owner)/i.test(
document.body?.innerText || ""
)
) {
hasDup = true;
} else {
const allEls = queryAllElements();
hasDup = allEls.some(
(el) =>
el &&
/(?:already owns this record|already\s+the\s+owner)/i.test(
el.innerText || el.textContent || ""
)
);
}
} catch {}
if (hasDup) {
window.__helpSeifOwnerAlreadyCurrent = true;
console.info(
"Help Seif: duplicate owner detected in onClickToElement; dismissing modal immediately."
);
try {
const allBtns = queryAllElements().filter(
(b) => b && b.tagName === "BUTTON"
);
let cancelBtn = allBtns.find((b) => {
const t = (b.title || "").toLowerCase();
const l = (b.getAttribute("aria-label") || "").toLowerCase();
const txt = (b.innerText || b.textContent || "")
.trim()
.toLowerCase();
const n = (b.name || "").toLowerCase();
if (
t.includes("close op-") ||
l.includes("close op-") ||
t.includes("close tab") ||
l.includes("close subtab")
) {
return false;
}
const inModal = !!b.closest(
".changeOwnerContentWrapper,.forceChangeOwnerContent,.modal-container,section.slds-modal,[role='dialog'],.uiModal"
);
if (
inModal &&
(n === "cancel" ||
txt === "cancel" ||
t === "cancel" ||
l === "cancel" ||
b.classList.contains("slds-modal__close") ||
(b.classList.contains("slds-button_neutral") &&
txt.includes("cancel")))
) {
return true;
}
return (
(n === "cancel" ||
txt === "cancel" ||
t === "cancel" ||
l === "cancel") &&
!t.includes("op-")
);
});
if (!cancelBtn) {
cancelBtn = document.querySelector(
".changeOwnerContentWrapper button,.forceChangeOwnerContent button,[role='dialog'] .slds-modal__footer button.slds-button_neutral,section.slds-modal .slds-modal__footer button.slds-button_neutral,button[title='Cancel'],button[name='cancel'],button.slds-modal__close,button[title='Close this window']"
);
}
if (cancelBtn) {
try {
cancelBtn.focus?.();
} catch {}
try {
cancelBtn.click();
} catch {}
const clickInit = {
bubbles: true,
cancelable: true,
composed: true,
view: window,
};
try {
cancelBtn.dispatchEvent(new MouseEvent("mousedown", clickInit));
} catch {}
try {
cancelBtn.dispatchEvent(new MouseEvent("mouseup", clickInit));
} catch {}
try {
cancelBtn.dispatchEvent(new MouseEvent("click", clickInit));
} catch {}
const host = cancelBtn.getRootNode?.()?.host;
if (host) {
try {
host.click?.();
} catch {}
try {
host.dispatchEvent(new MouseEvent("click", clickInit));
} catch {}
}
}
window.dispatchEvent(
new KeyboardEvent("keydown", {
key: "Escape",
code: "Escape",
keyCode: 27,
which: 27,
bubbles: true,
composed: true,
})
);
window.dispatchEvent(
new KeyboardEvent("keyup", {
key: "Escape",
code: "Escape",
keyCode: 27,
which: 27,
bubbles: true,
composed: true,
})
);
} catch {}
await delay(150);
break;
}
if (isConfirmBtn) {
const modalOpen = document.querySelector(
".changeOwnerContentWrapper,.forceChangeOwnerContent,section.slds-modal.slds-fade-in-open,[role='dialog'].slds-fade-in-open"
);
if (!modalOpen) break;
}
await delay(35);
}
if (isConfirmBtn && Date.now() >= deadline) {
const ownerModal = document.querySelector(
".changeOwnerContentWrapper,.forceChangeOwnerContent,section[aria-label*='Change Owner'],[role='dialog']"
);
if (ownerModal && /change\s*owner/i.test(ownerModal.innerText || "")) {
window.__helpSeifOwnerAlreadyCurrent = true;
const cancelBtn = ownerModal.querySelector(
"button[name='cancel'],button[title='Cancel'],button.slds-button_neutral,button.slds-modal__close"
);
if (cancelBtn) {
try {
cancelBtn.focus?.();
} catch {}
try {
cancelBtn.click();
} catch {}
}
window.dispatchEvent(
new KeyboardEvent("keydown", {
key: "Escape",
code: "Escape",
bubbles: true,
composed: true,
})
);
}
}
}
return true;
};
function isStrictlyInsideLogACall(el) {
for (let cur = el; cur; ) {
try {
if (
cur.matches &&
cur.matches(
'[data-target-selection-name="LogACallTab"], .logACallTabContent, [data-tab-name="LogACall"], [data-tab-value="logacall"]'
)
) {
return true;
}
} catch {}
let next = cur.parentElement;
if (!next) {
const root = cur.getRootNode?.();
next = (root && root.host) || null;
}
cur = next;
}
return false;
}
function findTaskSubjectInput() {
try {
const all = queryAllElements();
const inputs = all.filter((el) => el && el.tagName === "INPUT");
const subjectInputs = inputs.filter((el) => {
const aria = (el.getAttribute("aria-label") || "")
.trim()
.toLowerCase();
const placeholder = (el.getAttribute("placeholder") || "")
.trim()
.toLowerCase();
const name = (el.getAttribute("name") || "").trim().toLowerCase();
const part = (el.getAttribute("part") || "").trim().toLowerCase();
const role = (el.getAttribute("role") || "").trim().toLowerCase();
const isSub =
aria === "subject" ||
placeholder === "subject" ||
name === "subject" ||
(role === "combobox" &&
part === "input" &&
!isStrictlyInsideLogACall(el));
return isSub && !isStrictlyInsideLogACall(el);
});
const best = subjectInputs.find((el) => {
const aria = (el.getAttribute("aria-label") || "")
.trim()
.toLowerCase();
const isCombo =
el.getAttribute("role") === "combobox" ||
el.classList.contains("slds-combobox__input") ||
el.getAttribute("part") === "input";
return isElementVisible(el) && aria === "subject" && isCombo;
});
if (best) return best;
const visSub = subjectInputs.find(
(el) =>
isElementVisible(el) &&
(el.getAttribute("aria-label") || "").trim().toLowerCase() ===
"subject"
);
if (visSub) return visSub;
const visAny = subjectInputs.find((el) => isElementVisible(el));
if (visAny) return visAny;
if (subjectInputs.length > 0) {
return subjectInputs[subjectInputs.length - 1];
}
} catch {}
return null;
}
function describeStep(s) {
if (!s) return "Working...";
const k = String(s.id || "") + " " + String(s.key || "");
if (/owner/i.test(k)) return "Change Owner";
if (/CloseDate|opp-fields/i.test(k)) return "Close Date & Flex Field 3";
if (
/Log a Call|log-call|log-fields|call-btn|call-fields|cuf-publisherShareButton/i.test(
k
)
) {
return "Log a Call";
}
if (/Stage|stage/i.test(k)) return "Update Stage";
if (/Reason|reason/i.test(k)) return "Loss Reason";
if (/NewTask|task/i.test(k)) return "New Task Subject";
if (/SaveEdit|save/i.test(k)) return "Saving Record";
if (s.type === "DELAY") return "Waiting for Salesforce...";
return s.type || "Working...";
}
function ensureHud(wfName) {
try {
let el = document.getElementById("help-seif-hud");
if (window.__helpSeifHudTimer) {
clearTimeout(window.__helpSeifHudTimer);
window.__helpSeifHudTimer = null;
}
if (!el) {
el = document.createElement("div");
el.id = "help-seif-hud";
el.style.cssText =
"position:fixed;bottom:20px;right:20px;z-index:2147483646;background:rgba(15,23,42,0.95);color:#f8fafc;border:1px solid rgba(139,92,246,0.45);border-radius:12px;padding:10px 14px;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:12.5px;box-shadow:0 14px 34px rgba(15,23,42,0.45);display:flex;flex-direction:column;gap:7px;min-width:250px;max-width:330px;backdrop-filter:blur(8px);transition:opacity 0.25s ease,transform 0.25s ease;";
el.innerHTML =
'<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><div style="display:flex;align-items:center;gap:8px;min-width:0;"><span id="help-seif-hud-dot" style="width:8px;height:8px;border-radius:999px;background:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,0.25);flex-shrink:0;"></span><strong id="help-seif-hud-title" style="font-size:12.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></strong></div><button id="help-seif-hud-stop" type="button" style="background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.4);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;">⏹ Stop</button></div><div id="help-seif-hud-step" style="font-size:11.5px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Starting...</div><div style="height:4px;background:rgba(255,255,255,0.12);border-radius:999px;overflow:hidden;"><div id="help-seif-hud-bar" style="height:100%;width:8%;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:999px;transition:width 0.2s ease;"></div></div>';
document.body.appendChild(el);
const stopBtn = el.querySelector("#help-seif-hud-stop");
stopBtn?.addEventListener("click", () => {
window.__helpSeifAborted = true;
window.__helpSeifFinishHud?.("stopped");
});
}
el.style.opacity = "1";
el.style.transform = "translateY(0)";
const titleEl = el.querySelector("#help-seif-hud-title");
if (titleEl) titleEl.textContent = wfName || "Help Seif";
const dotEl = el.querySelector("#help-seif-hud-dot");
if (dotEl) {
dotEl.style.background = "#a855f7";
dotEl.style.boxShadow = "0 0 0 3px rgba(168,85,247,0.25)";
}
const stopBtn = el.querySelector("#help-seif-hud-stop");
if (stopBtn) stopBtn.style.display = "inline-block";
return el;
} catch {
return null;
}
}
function updateHud(stepIdx, total, label, wfName) {
try {
const el = ensureHud(wfName);
if (!el) return;
const stepEl = el.querySelector("#help-seif-hud-step");
if (stepEl) stepEl.textContent = `Step ${stepIdx}/${total} · ${label}`;
const barEl = el.querySelector("#help-seif-hud-bar");
if (barEl) {
const pct = Math.min(
100,
Math.max(8, Math.round((stepIdx / Math.max(1, total)) * 100))
);
barEl.style.width = `${pct}%`;
}
} catch {}
}
window.__helpSeifFinishHud = function (status, wfName) {
try {
const el = document.getElementById("help-seif-hud");
if (!el) return;
const dotEl = el.querySelector("#help-seif-hud-dot");
const stepEl = el.querySelector("#help-seif-hud-step");
const barEl = el.querySelector("#help-seif-hud-bar");
const stopBtn = el.querySelector("#help-seif-hud-stop");
if (stopBtn) stopBtn.style.display = "none";
if (status === "stopped") {
if (dotEl) {
dotEl.style.background = "#ef4444";
dotEl.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.25)";
}
if (stepEl) stepEl.textContent = "⏹ Workflow stopped by user";
if (barEl) barEl.style.background = "#ef4444";
} else {
if (dotEl) {
dotEl.style.background = "#22c55e";
dotEl.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.25)";
}
if (stepEl) {
stepEl.textContent = "✓ Completed" + (wfName ? " · " + wfName : "");
}
if (barEl) {
barEl.style.width = "100%";
barEl.style.background = "#22c55e";
}
}
if (window.__helpSeifHudTimer) clearTimeout(window.__helpSeifHudTimer);
window.__helpSeifHudTimer = setTimeout(() => {
try {
el.style.opacity = "0";
el.style.transform = "translateY(8px)";
setTimeout(() => el.remove(), 260);
} catch {}
}, 2200);
} catch {}
};
const isCloseDateKey = (k) => /close[\s_-]?date/i.test(String(k || ""));
const normalizeStepDates = (step) => {
if (!step || typeof step !== "object") return step;
if (step.type === "MULTIPLE_FIELDS" && Array.isArray(step.fields)) {
return {
...step,
fields: step.fields.map((f) =>
f && (f.value === "{{TODAY}}" || isCloseDateKey(f.key))
? { ...f, value: formatTodayDate() }
: f
),
};
}
if (
(step.value === "{{TODAY}}" || isCloseDateKey(step.key || step.name)) &&
Object.prototype.hasOwnProperty.call(step, "value")
) {
return { ...step, value: formatTodayDate() };
}
return step;
};
const isPublisherSaveClick = (step) =>
step?.type === "CLICK" &&
/cuf-publisherShareButton|button\s*\[\s*(?:title|aria-label)\s*=\s*["']Save/i.test(
String(step.key || "")
);
const hasSubjectField = (step) =>
Array.isArray(step?.fields) &&
step.fields.some(
(f) => f && /subject/i.test(String(f.key || "")) && f.fieldType === "text"
);
const hasCommentField = (step) =>
Array.isArray(step?.fields) &&
step.fields.some(
(f) =>
f &&
/(quickTextKeyboardTip|comments|comment|description|notes)/i.test(
String(f.key || "")
)
);
const defaultCommentForWorkflow = (resource) => {
const name = String(resource?.name || "");
if (/sent\s*link/i.test(name)) return "Sent Link";
if (/fl\s*payment|payment/i.test(name)) return "FL Payment";
if (/will\s*call/i.test(name)) return "will call us back later";
if (/follow\s*up/i.test(name)) return "Follow up";
if (/no\s*answer/i.test(name)) return "No Answer";
return "";
};
const waitForNextStepTarget = async (_unused, nextStep, maxMs) => {
const mult = Number(window.__helpSeifDelayMultiplier) || 0.7;
const deadline = Date.now() + Math.round(maxMs * mult);
let ready = false;
while (Date.now() < deadline && !window.__helpSeifAborted) {
try {
if (nextStep?.type === "MULTIPLE_FIELDS") {
const list = (nextStep.fields || []).filter((f) => f?.key);
const target =
list.find((f) => /quickTextKeyboardTip|Comment/i.test(f.key)) ||
list[0];
if (target) {
const el = findClickElement(
target.key,
target.searchType,
target.fieldType
);
if (el && isElementVisible(el)) ready = true;
}
} else if (nextStep?.key) {
const el = findClickElement(
nextStep.key,
nextStep.searchType,
nextStep.fieldType
);
if (el && isElementVisible(el)) ready = true;
}
} catch {
ready = false;
}
if (ready) {
await onDelay({ value: "25" });
return true;
}
await onDelay({ value: "25" });
}
await onDelay({ value: "25" });
return false;
};
const parser = async (resource, options) => {
if (!resource?.interactions) return;
window.__helpSeifAborted = false;
window.__helpSeifOwnerAlreadyCurrent = false;
window.__helpSeifSaveFailed = false;
window.__helpSeifDelayMultiplier = 0.7;
try {
if (typeof chrome !== "undefined" && chrome.storage?.local) {
const st = await new Promise((res) =>
chrome.storage.local.get(
["qfeDelayMultiplier", "qfeTargetOwnerName"],
res
)
);
const mult = parseFloat(st?.qfeDelayMultiplier);
if (Number.isFinite(mult) && mult >= 0.4 && mult <= 3) {
window.__helpSeifDelayMultiplier = mult;
}
const targetOwner = String(
st?.qfeTargetOwnerName ?? "Seif Ezz Eldin"
)
.trim()
.replace(/\s+/g, " ")
.toLowerCase();
if (targetOwner) {
const allNodes = queryAllElements();
const ownerEls = allNodes.filter(
(el) =>
el &&
isElementVisible(el) &&
(el.classList?.contains("owner-name") ||
el.matches?.('[data-target-selection-name*="OwnerId"]'))
);
for (const oEl of ownerEls) {
const lnk =
oEl.querySelector?.(
'a[href*="/lightning/r/User/"],a[href*="/005"],records-hoverable-link a,a'
) || oEl;
const clone = lnk.cloneNode(true);
clone
.querySelectorAll?.(
".slds-assistive-text,button,lightning-button-icon,svg"
)
.forEach((n) => n.remove());
const txt = String(clone.textContent || "")
.trim()
.replace(/\s+/g, " ")
.toLowerCase();
if (txt && (txt === targetOwner || txt.includes(targetOwner))) {
window.__helpSeifOwnerAlreadyCurrent = true;
console.info(
"Help Seif: Record already owned by",
txt,
"— skipping Change Owner steps."
);
break;
}
}
}
}
} catch {}
ensureHud(resource?.name || "Workflow");
const checkDismiss = () => {
let hasDup = false;
try {
if (
/(?:already owns this record|already\s+the\s+owner)/i.test(
document.body?.innerText || ""
)
) {
hasDup = true;
} else {
const els = document.querySelectorAll(
".slds-notify_toast, .slds-theme_error, .forcePageError, [role='alert'], .changeOwnerContentWrapper, .forceChangeOwnerContent"
);
for (const el of els) {
if (
/(?:already owns this record|already\s+the\s+owner)/i.test(
el.innerText || el.textContent || ""
)
) {
hasDup = true;
break;
}
}
}
} catch {}
if (!hasDup && !window.__helpSeifOwnerAlreadyCurrent) return false;
window.__helpSeifOwnerAlreadyCurrent = true;
console.info(
"Help Seif: duplicate owner detected, dismissing Change Owner modal."
);
try {
const allBtns = Array.from(document.querySelectorAll("button"));
const cancelBtn = allBtns.find((b) => {
const t = (b.title || "").toLowerCase();
const l = (b.getAttribute("aria-label") || "").toLowerCase();
const txt = (b.innerText || b.textContent || "")
.trim()
.toLowerCase();
const n = (b.name || "").toLowerCase();
if (
t.includes("close op-") ||
l.includes("close op-") ||
t.includes("close tab") ||
l.includes("close subtab")
) {
return false;
}
const modal = b.closest(
".changeOwnerContentWrapper,.forceChangeOwnerContent,section.slds-modal,[role='dialog'],.modal-container,.uiModal"
);
if (modal) {
const mText = modal.innerText || modal.textContent || "";
if (
/change\s*owner|already owns this record|Search Users/i.test(
mText
) &&
!/SaveEdit|Opportunity Information/i.test(mText)
) {
return (
n === "cancel" ||
txt === "cancel" ||
t === "cancel" ||
l === "cancel" ||
b.classList.contains("slds-modal__close")
);
}
}
return false;
});
if (cancelBtn) {
cancelBtn.focus?.();
cancelBtn.click();
const evt = {
bubbles: true,
cancelable: true,
composed: true,
view: window,
};
cancelBtn.dispatchEvent(new MouseEvent("mousedown", evt));
cancelBtn.dispatchEvent(new MouseEvent("mouseup", evt));
cancelBtn.dispatchEvent(new MouseEvent("click", evt));
}
window.dispatchEvent(
new KeyboardEvent("keydown", {
key: "Escape",
code: "Escape",
keyCode: 27,
which: 27,
bubbles: true,
composed: true,
})
);
window.dispatchEvent(
new KeyboardEvent("keyup", {
key: "Escape",
code: "Escape",
keyCode: 27,
which: 27,
bubbles: true,
composed: true,
})
);
} catch {}
return true;
};
const setTaskSubjectValue = async (val) => {
const targetVal = String(val || "EG/Sales team (Follow up)");
let inp = null;
const deadline = Date.now() + 6000;
while (Date.now() < deadline && !window.__helpSeifAborted) {
inp = findTaskSubjectInput();
if (
inp &&
inp.isConnected &&
(inp.offsetWidth > 0 || inp.getClientRects().length > 0)
) {
break;
}
const tabBtn = document.querySelector(
'[data-target-selection-name*="NewTask"], a[title="New Task"], button[aria-label="New Task"], [data-tab-name*="NewTask"], [data-tab-value*="newtask"]'
);
if (tabBtn && (!inp || inp.offsetWidth === 0)) {
try {
tabBtn.click();
} catch {}
}
await onDelay({ value: "150" });
}
if (!inp) inp = findTaskSubjectInput();
if (!inp) {
console.warn("Help Seif: Could not find New Task Subject input");
return false;
}
console.info(
"Help Seif: Found New Task Subject input, filling with:",
targetVal
);
try {
inp.scrollIntoView?.({ block: "center", inline: "nearest" });
} catch {}
try {
inp.focus?.();
} catch {}
try {
inp.click?.();
} catch {}
try {
inp.dispatchEvent(
new FocusEvent("focus", { bubbles: true, composed: true })
);
} catch {}
try {
inp.dispatchEvent(
new FocusEvent("focusin", { bubbles: true, composed: true })
);
} catch {}
try {
inp.select?.();
} catch {}
let execOk = false;
try {
execOk = document.execCommand("insertText", false, targetVal);
} catch {}
if (!execOk || inp.value !== targetVal) {
setNativeValue(inp, "");
try {
inp.dispatchEvent(
new Event("input", { bubbles: true, composed: true })
);
} catch {}
setNativeValue(inp, targetVal);
try {
inp.dispatchEvent(
new InputEvent("beforeinput", {
bubbles: true,
cancelable: true,
composed: true,
inputType: "insertText",
data: targetVal,
})
);
} catch {}
try {
inp.dispatchEvent(
new InputEvent("input", {
bubbles: true,
cancelable: true,
composed: true,
inputType: "insertText",
data: targetVal,
})
);
} catch {}
try {
inp.dispatchEvent(
new Event("input", { bubbles: true, composed: true })
);
} catch {}
try {
inp.dispatchEvent(
new Event("change", { bubbles: true, composed: true })
);
} catch {}
}
for (const ch of targetVal) {
try {
inp.dispatchEvent(
new KeyboardEvent("keydown", {
key: ch,
bubbles: true,
composed: true,
})
);
} catch {}
try {
inp.dispatchEvent(
new KeyboardEvent("keyup", {
key: ch,
bubbles: true,
composed: true,
})
);
} catch {}
}
await onDelay({ value: "100" });
if (inp.value !== targetVal) {
setNativeValue(inp, targetVal);
try {
inp.dispatchEvent(
new Event("input", { bubbles: true, composed: true })
);
} catch {}
try {
inp.dispatchEvent(
new Event("change", { bubbles: true, composed: true })
);
} catch {}
}
try {
inp.dispatchEvent(
new KeyboardEvent("keydown", {
key: "Enter",
code: "Enter",
keyCode: 13,
which: 13,
bubbles: true,
composed: true,
})
);
} catch {}
try {
inp.dispatchEvent(
new KeyboardEvent("keyup", {
key: "Enter",
code: "Enter",
keyCode: 13,
which: 13,
bubbles: true,
composed: true,
})
);
} catch {}
try {
inp.dispatchEvent(
new FocusEvent("focusout", { bubbles: true, composed: true })
);
} catch {}
try {
inp.dispatchEvent(
new FocusEvent("blur", { bubbles: true, composed: true })
);
} catch {}
return true;
};
if (/follow\s*up|sent\s*link|won/i.test(String(resource?.name || ""))) {
try {
const inputs = Array.from(
document.querySelectorAll(
'input[name="Reason_Opportunity_Lost_Other__c"],input[id*="Reason_Opportunity_Lost_Other"],[data-target-selection-name*="Reason_Opportunity_Lost_Other"] input'
)
);
for (const inp of inputs) {
if (inp) {
setNativeValue(inp, "");
inp.dispatchEvent(
new Event("input", { bubbles: true, composed: true })
);
inp.dispatchEvent(
new Event("change", { bubbles: true, composed: true })
);
}
}
} catch {}
}
const isOwnerStep = (st) =>
/owner|Search Users|lookup__list|uiInputTextForAutocomplete|changeOwner/i.test(
String(st?.id || "") + String(st?.key || "")
);
const isWonWorkflow =
/^won$/i.test(String(resource?.name || "").trim()) ||
resource?.id === "d4c8e9f0-1234-4a5b-9c8d-7e6f5a4b3c21";
const readCurrentCloseDateValue = () => {
try {
const all = queryAllElements();
const existingInput = all.find(
(el) =>
el.tagName === "INPUT" &&
attrEqualsCI(el, "name", "CloseDate") &&
String(el.value || "").trim()
);
if (existingInput) return String(existingInput.value).trim();
const container = all.find(
(el) =>
el &&
isElementVisible(el) &&
/CloseDate/i.test(
String(el.getAttribute?.("data-target-selection-name") || "")
)
);
if (container) {
const formatted =
container.querySelector?.(
"lightning-formatted-text, lightning-formatted-date-time, .uiOutputDate, .test-id__field-value"
) || container;
const m = String(formatted.textContent || "").match(
/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
);
if (m) return m[0];
}
for (const el of all) {
if (!el || !isElementVisible(el)) continue;
if (
el.classList?.contains("test-id__field-label") &&
/^close\s*date$/i.test(String(el.textContent || "").trim())
) {
const item = el.closest(
"records-record-layout-item, .slds-form-element"
);
const m = String(item?.textContent || "").match(
/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
);
if (m) return m[0];
}
}
} catch {}
return "";
};
const originalCloseDateForWon = isWonWorkflow ? readCurrentCloseDateValue() : "";
let inLogACallFlow = false;
const totalSteps = resource.interactions.length;
for (let idx = 0; idx < totalSteps; idx++) {
if (window.__helpSeifAborted) break;
checkDismiss();
let rawStep = resource.interactions[idx];
if (isWonWorkflow && rawStep) {
if (
rawStep.type === "CLICK" &&
/Close Date/i.test(String(rawStep.key || ""))
) {
rawStep = {
...rawStep,
key: 'button[title="Edit Stage"], button.test-id__inline-edit-trigger[title*="Stage"], [data-target-selection-name*="StageName"] button',
};
} else if (
rawStep.type === "MULTIPLE_FIELDS" &&
Array.isArray(rawStep.fields)
) {
rawStep = {
...rawStep,
fields: rawStep.fields.filter(
(f) => !isCloseDateKey(f?.key) && f?.value !== "{{TODAY}}"
),
};
} else if (
rawStep.type === "INPUT" &&
(isCloseDateKey(rawStep.key || rawStep.name) ||
rawStep.value === "{{TODAY}}")
) {
continue;
}
}
const step = normalizeStepDates(rawStep);
if (
(window.__helpSeifOwnerAlreadyCurrent || window.__helpSeifSaveFailed) &&
(isOwnerStep(step) ||
(step.type === "DELAY" &&
isOwnerStep(resource.interactions[idx + 1])))
) {
continue;
}
updateHud(idx + 1, totalSteps, describeStep(step), resource?.name);
if (
step.type === "CLICK" &&
/button\s*\[\s*aria-label\s*=\s*["']Log a Call/i.test(
String(step.key || "")
)
) {
inLogACallFlow = true;
}
const filler = new FormFiller(options);
switch (step.type) {
case "MULTIPLE_FIELDS": {
let stepToFill = step;
if (inLogACallFlow && hasSubjectField(step)) {
if (!hasCommentField(step) && !resource.manualCallLog) {
const comment = defaultCommentForWorkflow(resource);
if (comment) {
stepToFill = {
...step,
fields: [
...step.fields,
{
key: 'textarea[aria-describedby="quickTextKeyboardTip"]',
value: comment,
fieldType: "text",
searchType: "cssSelector",
},
],
};
}
}
stepToFill = normalizeStepDates(stepToFill);
await fillSpecificFields(stepToFill, options);
if (!resource.manualCallLog) {
await onDelay({ value: "90" });
const saveAhead = resource.interactions
.slice(idx + 1)
.some(isPublisherSaveClick);
if (!saveAhead) {
let saved = await onClickToElement({
key: "button.cuf-publisherShareButton",
searchType: "cssSelector",
});
if (!saved) {
await onDelay({ value: "180" });
saved = await onClickToElement({
key: "button.cuf-publisherShareButton",
searchType: "cssSelector",
});
}
await onDelay({ value: "120" });
if (saved) inLogACallFlow = false;
}
}
} else {
await fillSpecificFields(stepToFill, options);
}
break;
}
case "INPUT":
case "CHECKBOX":
case "SELECT": {
if (
/task-subject|Subject/i.test(
String(step.id || "") + String(step.key || "")
)
) {
await setTaskSubjectValue(
step.value || "EG/Sales team (Follow up)"
);
} else {
await filler.fillField(step);
}
break;
}
case "VERIFY_FIELD": {
const expected = String(step.value ?? "EG/Sales team (Follow up)");
if (
/task-subject|Subject/i.test(
String(step.id || "") + String(step.key || "")
)
) {
let verified = false;
for (let attempt = 0; attempt < 3; attempt++) {
const inp = findTaskSubjectInput();
const actual = String(inp?.value ?? inp?.textContent ?? "");
if (actual.includes("Follow up") || actual === expected) {
verified = true;
break;
}
await setTaskSubjectValue(expected);
await onDelay({ value: "150" });
}
if (verified) {
console.info("Help Seif: Follow Up task Subject verified.");
} else {
console.warn(
"Help Seif: Follow Up task Subject verification failed."
);
}
} else {
let subject = findClickElement(
step.key,
step.searchType,
step.fieldType
);
for (let attempt = 0; attempt < 2; attempt++) {
const actual = String(
subject?.value ?? subject?.textContent ?? ""
);
if (actual === expected) break;
if (subject && subject.isConnected && !subject.disabled) {
await filler.fillField({ ...step, type: "INPUT" });
await onDelay({ value: "120" });
subject = findClickElement(
step.key,
step.searchType,
step.fieldType
);
} else {
break;
}
}
}
break;
}
case "CLICK": {
if (
isWonWorkflow &&
originalCloseDateForWon &&
/SaveEdit|Save/i.test(String(step.key || ""))
) {
try {
const closeInp = queryAllElements().find(
(el) =>
el.tagName === "INPUT" &&
attrEqualsCI(el, "name", "CloseDate") &&
isElementVisible(el)
);
if (
closeInp &&
String(closeInp.value || "").trim() !== originalCloseDateForWon
) {
setNativeValue(closeInp, originalCloseDateForWon);
closeInp.dispatchEvent(
new Event("input", { bubbles: true, composed: true })
);
closeInp.dispatchEvent(
new Event("change", { bubbles: true, composed: true })
);
}
} catch {}
}
const clicked = await onClickToElement(step);
if (inLogACallFlow && isPublisherSaveClick(step)) {
await onDelay({ value: "120" });
inLogACallFlow = false;
} else if (
/button\s*\[\s*aria-label\s*=\s*["']Log a Call/i.test(
String(step.key || "")
)
) {
inLogACallFlow = !!clicked;
}
break;
}
case "DELAY": {
checkDismiss();
if (
window.__helpSeifOwnerAlreadyCurrent &&
/owner/i.test(String(step.id || ""))
) {
break;
}
if (resource.interactions[idx + 1]?.type === "DELAY") break;
const next = resource.interactions
.slice(idx + 1)
.find((s) => s && s.type !== "DELAY");
if (next) {
const maxWait = Math.min(
3000,
Math.max(150, Number(step.value) || 150)
);
await waitForNextStepTarget(0, next, maxWait);
} else {
await onDelay({ value: "60" });
}
break;
}
}
}
window.__helpSeifFinishHud?.(
window.__helpSeifAborted ? "stopped" : "done",
resource?.name
);
};
window.__helpSeifRunParser = parser;
window.__helpSeifFillFields = fillSpecificFields;
const parseStoredList = (raw) => {
if (Array.isArray(raw)) return raw;
if (typeof raw === "string") {
try {
const parsed = JSON.parse(raw);
if (Array.isArray(parsed)) return parsed;
} catch {}
}
return [];
};
const getStoredArray = async (key) => {
if (typeof chrome === "undefined" || !chrome.storage?.local) return [];
try {
const data = await new Promise((res) =>
chrome.storage.local.get(key, res)
);
return parseStoredList(data?.[key]);
} catch {
return [];
}
};
let lastContextMenuTarget = null;
document.addEventListener(
"contextmenu",
(e) => {
lastContextMenuTarget = e.target;
},
true
);
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
window.__helpSeifStopListenerInstalled = true;
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
const body = msg?.body;
if (msg?.name !== "content" && !body?.type) return false;
if (!body?.type) {
try {
sendResponse?.("ignored");
} catch {}
return false;
}
const { type, id, settings } = body;
const mainSettings = settings?.mainSettings;
const autofillAnimation = mainSettings?.autofillAnimation;
const autoFillDelay = mainSettings?.autofillAnimationDuration;
if (type === "stop") {
window.__helpSeifAborted = true;
try {
window.__helpSeifFinishHud?.("stopped");
} catch {}
try {
sendResponse?.("stopped");
} catch {}
return false;
}
(async () => {
try {
if (type === "profile") {
const profiles = await getStoredArray("profiles");
const profile = profiles.find((p) => p.id === id);
if (!profile) {
sendResponse?.("ignored");
return;
}
try {
await chrome.storage.local.set({
lastUsedProfileId: JSON.stringify(profile.id),
});
} catch {}
await fillSpecificFields(profile, {
autofillAnimation,
autoFillDelay,
});
sendResponse?.("success");
return;
}
if (type === "resource") {
const resources = await getStoredArray("resources");
const resource = resources.find((r) => r.id === id);
if (!resource) {
sendResponse?.("ignored");
return;
}
await parser(resource, {
autofillAnimation,
autoFillDelay,
});
sendResponse?.("success");
return;
}
if (type === "fill-field") {
const profiles = await getStoredArray("profiles");
const profile = profiles.find((p) => p.id === body.profileId);
const field = profile?.fields?.find((f) => f.key === body.fieldKey);
if (!profile || !field || !lastContextMenuTarget) {
sendResponse?.("ignored");
return;
}
await fillElement(lastContextMenuTarget, field, {
autofillAnimation,
autoFillDelay,
});
sendResponse?.("success");
return;
}
sendResponse?.("ignored");
} catch (err) {
console.error("Help Seif: content message error:", err);
try {
sendResponse?.("error");
} catch {}
}
})();
return true;
});
}
})();