HELP SEIF 1.17.8 (local modified copy)

Features
- Advanced popup mode only; Lite tab/navigation/context-menu entry removed.
- Persistent Flexible Field 3 Value selector shown at the top of the extension popup.
- Built-in options: ANR, LED, BEG 10% List, REG 10%, BEG T1 RES.
- Add additional options from the popup; choices and selected value persist in chrome.storage.local until changed.
- Selected value overrides Flexible_Field_3_Value__c in Multiple Fields executions for all four starter workflows.
- {{TODAY}} in CloseDate is resolved at runtime to the local date in DD/MM/YYYY format.
- Four starter workflows in the Resources store: No Answer, CRM autofill, Follow UP, Will Call Us Back.

Install in Microsoft Edge
1. Extract this archive to a permanent folder.
2. Open edge://extensions/ and enable Developer mode.
3. Click Load unpacked and select the extracted folder containing manifest.json.
4. Keep the original QuickForm extension as a fallback.
5. Open Help Seif; select Flexible Field 3 Value at the top. To add a new option, type it in the box and press Add.

Notes
- This is a locally modified copy, not an official QuickForm release.
- Four Salesforce workflows are preloaded into local extension storage. Review/test on a safe Salesforce record before live use.
- Changing the dropdown affects all workflows that contain Flexible_Field_3_Value__c and remains selected until changed.
