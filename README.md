# Help Seif - CRM Data Automation Chrome Extension 🚀

**Help Seif** is a specialized Salesforce CRM automation tool and Chrome Extension designed to streamline repetitive sales and support workflows.

## ✨ Key Features

- **Automated Workflow Execution**: Run complex multi-step Salesforce actions in a single click (No Answer, CRM Autofill, Follow UP, Will Call Us Back, Sent Link, FL Payment, etc.).
- **Dynamic Close Date**: Automatically resolves `{{TODAY}}` to the current date dynamically at execution time.
- **Configurable Flexible Field 3 Value**:
  - Global persistent selector directly in the popup.
  - Preloaded options: `ANR`, `LED`, `BEG 10% List`, `REG 10%`, `BEG T1 RES`.
  - Ability to add custom options on the fly.
  - Persisted securely across sessions in `chrome.storage.local`.
- **Drag-and-Drop Workflow Ordering**:
  - Reorder workflows directly from the extension popup interface.
  - Custom sequence is automatically saved and remembered.
- **Dynamic Currency & Ownership Handlers**:
  - Automatically selects `EGP` currency and switches owners smoothly.
  - Integrated Call Log automation (`EG / Sales`) with zero extra delays.
- **Modern Minimal UI**: Designed with clean aesthetic styling for speed and focus.

---

## 📦 How to Install (Chrome / Edge / Brave / Opera)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Seif250/Help_me_data_CRM.git
   ```
2. Open your browser's extensions management page:
   - **Google Chrome**: `chrome://extensions`
   - **Microsoft Edge**: `edge://extensions`
   - **Brave**: `brave://extensions`
3. Enable **Developer mode** (toggle in the top-right or sidebar).
4. Click **Load unpacked** (تحميل إضافة تم فك حزمتها).
5. Select the folder containing `manifest.json`.
6. Pin the extension to your toolbar for instant access.

---

## 🛠️ Usage

1. Open your Salesforce record page.
2. Click on the **Help Seif** extension icon in your browser toolbar.
3. Select or add your **Flexible Field 3 Value** at the top.
4. Drag and drop any workflow card to arrange your preferred order.
5. Click on the desired workflow to run the automated sequence.

---

## 📄 License
This project is licensed under the terms of the [LICENSE](LICENSE) file.

## Update 1.17.9
- Updated CRM Autofill to include the requested Salesforce picklists.
- Improved custom dropdown click sequencing, option whitespace matching, and delays for dependent picklists.

## v1.17.12 — FL Payment & Closed Lost workflow update

- Will Call us back now waits 500 ms after selecting `Not Registered (Closed Lost)` before opening the loss-reason dropdown.
- FL Payment now fills today's Close Date, `Reason_Opportunity_Lost_Other__c` (`FL Payment`), and Flexible Field 3 before logging the call.
- FL Payment logs the call as `EG/Sales Call` with `FL Payment` in the call-log textarea, then changes the stage to Closed Lost, selects reason `Other`, saves, and changes the owner last.
- Existing locally stored copies are migrated when the updated workflow sequence is missing.


## v1.17.15 — Save, Owner, Not Interested, and compact popup fixes
- CRM Autofill now saves before the final Change Owner sequence.
- Change Owner detects Salesforce’s “already owns this record” toast and closes the dialog with Cancel.
- Not Interested is seeded into the actual resources store and fills the Other detail only after the loss reason is selected.
- Popup spacing and controls are more compact while retaining the green/white/gray palette.
