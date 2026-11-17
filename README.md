# ⚡ SalesSnap (v1.18.0)

**SalesSnap** is a Salesforce CRM automation Chrome Extension with a floating quick-action bar, customer clipboard queue, and cloud-managed licensing.

---

## 🔗 Quick Links

| Resource | URL |
| --- | --- |
| **GitHub Repository** | https://github.com/Seif250/Help_me_data_CRM.git |
| **License API Base URL** | https://salessnap-license-api.seif12300656.workers.dev |

| Resource | URL |
| --- | --- |
| **GitHub Repository** | https://github.com/Seif250/Help_me_data_CRM.git |
| **License API Base URL** | https://salessnap-license-api.seif12300656.workers.dev |

---

## 1. Download & Setup

Clone the repository (requires [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) LTS):

```bash
git clone https://github.com/Seif250/Help_me_data_CRM.git
cd Help_me_data_CRM
```

To pull the latest updates later:

```bash
git pull origin main
```

---

## 2. Build the Protected Extension (`dist/`)

Install dependencies and run the protected build script (`scripts/build-dist.js`):

```bash
npm install
npm run build
```

This creates the **`dist/`** folder, which:
- Excludes backend/dev files (`server/`, `scripts/`, `node_modules/`, `package.json`, `package-lock.json`, `.git/`, `.gitignore`).
- Minifies and obfuscates the extension's core scripts (`content.883ade9e.js`, `salesforce-floating-bar.js`, `quickform-editor-controls.js`, `options-page.js`, `static/background/index.js`).

> **Sharing with users:** Zip the contents of **`dist/`** (so `manifest.json` is directly inside the extracted folder) and send that `.zip` file along with a license key.

---

## 3. Install & Activate in Browser

1. Open your browser's extensions page:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the **`dist/`** folder.
4. Pin **SalesSnap** to your toolbar and open the popup.
5. Paste your license key (`SNAP-XXXX-XXXX-XXXX`), leave **License Server URL (Advanced)** empty, and click **Activate License**.

---

## 4. Using SalesSnap on Salesforce

Open any Salesforce record page (`*.salesforce.com`, `*.force.com`, `*.cloudforce.com`, `*.salesforceliveagent.com`):

- **Workflows:** `No Answer`, `Follow Up`, `Will Call us back`, `Not Interested`, `CRM autofill`, `Sent Link`, `Won`, `FL Payment`.
- **Popup Shortcuts:** `1–9` run workflow • `C` copy Customer Queue (`Win+V`) • `S` stop running script.
- **Controls:** Speed presets (`Fast` / `1x` / `Slow`), `Review Before Save`, `Skip If Owned By`, `Flexible Field 3` & `Flexible Field 4 (CC/CS)`, Floating Bar toggle, and Light/Dark theme.
- **Settings (`options.html`):** Sync cloud workflows or lock/deactivate the license on the current device.

---


The backend lives in `server/` (`worker.js`, `workflows.js`, `wrangler.toml`):

```bash
cd server
npx wrangler secret put ADMIN_SECRET
npx wrangler deploy
```

---

## 📄 License

See the [LICENSE](LICENSE) file for details.
