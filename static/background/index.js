/** SalesSnap — Pure Vanilla JS Background Service Worker (v1.18.0) */
(() => {
  "use strict";

  const STORAGE_KEY = "resources";
  const LEGACY_WRONG_KEY = "quickformProSave_resources";

  const STARTER_RESOURCES = [
    {
      id: "c07fa334-c6a6-417a-ba2b-9c0a55208836",
      name: "No Answer",
      url: "https://britishcouncil.lightning.force.com/lightning/r/Opportunity/006Nz00000uAVyMIAW/view",
      description: "Change Owner first, update date & fields, log call, then update stage/reason fields and save.",
      interactions: [
        { id: "qfe-na-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-na-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-edit-date-btn", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }] },
        { id: "qfe-na-log-call-btn", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-log-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-na-log-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "No Answer", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-na-before-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-log-save", type: "CLICK", key: "button.cuf-publisherShareButton", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-after-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-stage-open", type: "CLICK", key: 'button[aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], button[title="Edit Stage"], [data-target-selection-name*="Stage"] button', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-stage-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-stage-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not Registered (Closed Lost)"], [role="option"][data-value="Not Registered (Closed Lost)"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-after-stage", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-reason-open", type: "CLICK", key: 'button[aria-label="Reason Opportunity Lost or Closed"], button[aria-label*="Reason Opportunity Lost"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-reason-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-reason-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not reachable/No answer"], [role="option"][data-value="Not reachable/No answer"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-reason-other-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-reason-other", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[name="Reason_Opportunity_Lost_Other__c"]', value: "No Answer", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-na-before-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-na-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-na-save-done", type: "DELAY", value: "400", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-16T03:42:14.732Z"
    },
    {
      id: "5312e5af-9da9-4344-81a1-0ab1e4114afd",
      name: "Follow Up",
      url: "https://britishcouncil.lightning.force.com/lightning/r/Opportunity/006Nz00000uAVyMIAW/view",
      description: "Change Owner first, update date fields & clear loss reason and save, log call, then open New Task and fill Subject only. Leave task open for manual review and saving.",
      interactions: [
        { id: "qfe-followup-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-followup-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-edit-date-btn", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }, { key: "Reason_Opportunity_Lost_Other__c", value: "", fieldType: "text", searchType: "name" }] },
        { id: "qfe-followup-before-opp-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-opp-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-opp-save-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-log-call-btn", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-log-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-followup-log-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "Follow up ", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-followup-before-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-log-save", type: "CLICK", key: "button.cuf-publisherShareButton", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-after-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-followup-task-btn", type: "CLICK", key: '[data-target-selection-name="sfdc:QuickAction.Task.NewTask"] a, a[role="tab"][title="New Task"], a.slds-tabs_default__link[title="New Task"], [data-target-selection-name*="NewTask"] a, [data-target-selection-name="sfdc:QuickAction.Task.NewTask"], [title="New Task"], button[aria-label="New Task"], button[title="New Task"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-task-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-followup-task-subject", type: "INPUT", key: 'input.slds-combobox__input[aria-label="Subject"], input[role="combobox"][aria-label="Subject"], [part="input"][aria-label="Subject"], [data-target-selection-name="sfdc:RecordField.Task.Subject"] input', value: "EG/Sales team (Follow up)", fieldType: "text", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-followup-subject-verify", type: "VERIFY_FIELD", key: 'input.slds-combobox__input[aria-label="Subject"], input[role="combobox"][aria-label="Subject"], [part="input"][aria-label="Subject"], [data-target-selection-name="sfdc:RecordField.Task.Subject"] input', value: "EG/Sales team (Follow up)", fieldType: "text", searchType: "cssSelector", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-16T05:11:20.700Z"
    },
    {
      id: "b7b0f68c-7238-43c9-90a5-62be52f3f7a6",
      name: "Sent Link",
      url: "https://britishcouncil.lightning.force.com/lightning/o/Opportunity/new?count=12&nooverride=1&useRecordTypeCheck=1&navigationLocation=RELATED_LIST&uid=179205036504112013&recordTypeId=01220000000MKJPAA4",
      description: "Change Owner first, update date fields & clear loss reason, set Registered Not Paid stage and save, then open Log a Call with Subject and Comment. Leave open for manual saving.",
      interactions: [
        { id: "qfe-sl-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-sl-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-edit-date-btn", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }, { key: "Reason_Opportunity_Lost_Other__c", value: "", fieldType: "text", searchType: "name" }] },
        { id: "qfe-sl-before-stage", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-stage-open", type: "CLICK", key: 'button[aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], [data-target-selection-name*="Stage"] button, button[title="Edit Stage"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-stage-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-stage-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Registered Not Paid"], [role="option"][data-value="Registered Not Paid"], .slds-listbox__option[data-value="Registered Not Paid"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-after-stage", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-stage-save", type: "CLICK", key: 'button[name="SaveEdit"], button.slds-button_brand[name="SaveEdit"], .slds-docked-form-footer button.slds-button_brand, button[title="Save"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-stage-save-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-sl-call-btn", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-sl-call-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-sl-call-manual-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "Sent Link", fieldType: "text", searchType: "cssSelector" }] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-15T07:48:39.737Z",
      manualCallLog: true
    },
    {
      id: "d4c8e9f0-1234-4a5b-9c8d-7e6f5a4b3c21",
      name: "Won",
      url: "https://britishcouncil.lightning.force.com/lightning/r/Opportunity/view",
      description: "Set Stage to Registered Paid (Closed Won), fill Flexible Field 4 Value (CC/CS) & Flexible Field 3, clear loss reason, and save.",
      interactions: [
        { id: "qfe-won-page-settle", type: "DELAY", value: "300", fields: [{}] },
        { id: "qfe-won-edit-btn", type: "CLICK", key: 'button[title="Edit Stage"], button.test-id__inline-edit-trigger[title*="Stage"], [data-target-selection-name*="StageName"] button', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-won-edit-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-won-stage-open", type: "CLICK", key: 'button[role="combobox"][aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], [data-target-selection-name*="StageName"] button[role="combobox"], button[aria-label="Stage"], button[title="Edit Stage"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-won-stage-wait", type: "DELAY", value: "350", fields: [{}] },
        { id: "qfe-won-stage-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Registered Paid (Closed Won)"], [role="option"][data-value="Registered Paid (Closed Won)"], .slds-listbox__option[data-value="Registered Paid (Closed Won)"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-won-after-stage", type: "DELAY", value: "350", fields: [{}] },
        { id: "qfe-won-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_4_Value__c", value: "{{FLEXIBLE_FIELD_4}}", fieldType: "text", searchType: "name" }, { key: "Reason_Opportunity_Lost_Other__c", value: "", fieldType: "text", searchType: "name" }] },
        { id: "qfe-won-before-save", type: "DELAY", value: "350", fields: [{}] },
        { id: "qfe-won-save", type: "CLICK", key: 'button[name="SaveEdit"], button.slds-button_brand[name="SaveEdit"], .slds-docked-form-footer button.slds-button_brand, button[title="Save"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-won-save-wait", type: "DELAY", value: "400", fields: [{}] }
      ],
      updatedAt: "2026-12-01T00:00:00.000Z",
      createdAt: "2026-11-01T00:00:00.000Z"
    },
    {
      id: "b8d4e5a1-8b45-4c2c-9a91-6b5e2c3f7a10",
      name: "Not Interested",
      url: "https://britishcouncil.lightning.force.com/lightning/r/Opportunity/006Nz00000uAVyMIAW/view",
      description: "Change Owner first, update date fields and save, log not interested, set Closed Lost / Not interested/Not needed as the loss reason, then save.",
      interactions: [
        { id: "qfe-ni-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-ni-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-edit-date", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }] },
        { id: "qfe-ni-log-call", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-log-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-ni-log-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "not interested", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-ni-before-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-save-log", type: "CLICK", key: "button.cuf-publisherShareButton", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-after-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-stage-open", type: "CLICK", key: 'button[aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], button[title="Edit Stage"], [data-target-selection-name*="Stage"] button', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-stage-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-stage-lost", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not Registered (Closed Lost)"], [role="option"][data-value="Not Registered (Closed Lost)"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-lost-stage-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-reason-open", type: "CLICK", key: 'button[aria-label="Reason Opportunity Lost or Closed"], button[aria-label*="Reason Opportunity Lost"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-reason-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-reason-not-interested-needed", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not interested/Not needed"], [role="option"][data-value="Not interested/Not needed"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-reason-other-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-reason-other", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[name="Reason_Opportunity_Lost_Other__c"]', value: "not interested", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-ni-before-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-ni-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-ni-save-done", type: "DELAY", value: "400", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-16T05:09:01.189Z"
    },
    {
      id: "6915604c-386b-4175-b45f-39f456fe1a7d",
      name: "Will Call us back",
      url: "https://britishcouncil.lightning.force.com/lightning/r/Opportunity/006Nz00000uAVyMIAW/view",
      description: "Change Owner first, update date fields and save, log call, update stage/reason fields and save.",
      interactions: [
        { id: "qfe-wcb-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-wcb-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-edit-date-btn", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }] },
        { id: "qfe-wcb-log-call-btn", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-log-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-wcb-log-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "will call us back later", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-wcb-before-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-log-save", type: "CLICK", key: "button.cuf-publisherShareButton", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-after-log-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-stage-open", type: "CLICK", key: 'button[aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], button[title="Edit Stage"], [data-target-selection-name*="Stage"] button', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-stage-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-stage-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not Registered (Closed Lost)"], [role="option"][data-value="Not Registered (Closed Lost)"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-after-stage", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-reason-open", type: "CLICK", key: 'button[aria-label="Reason Opportunity Lost or Closed"], button[aria-label*="Reason Opportunity Lost"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-reason-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-reason-select", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not now, maybe later"], [role="option"][data-value="Not now, maybe later"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-reason-other-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-reason-other", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[name="Reason_Opportunity_Lost_Other__c"]', value: "will call us back later", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-wcb-before-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-wcb-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-wcb-save-done", type: "DELAY", value: "400", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-16T05:09:01.189Z"
    },
    {
      id: "f1a00000-pay1-4000-8000-000000000001",
      name: "FL Payment",
      url: "https://britishcouncil.lightning.force.com/lightning/o/Opportunity/new?count=12&nooverride=1&useRecordTypeCheck=1&navigationLocation=RELATED_LIST&uid=179205036504112013&recordTypeId=01220000000MKJPAA4",
      description: "Change Owner first, update date fields and save, log FL Payment, set Closed Lost / Other and detail, then save.",
      interactions: [
        { id: "qfe-flp-page-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-flp-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-owner-done", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-edit-date-btn", type: "CLICK", key: 'button[title="Edit Close Date"], [data-target-selection-name*="CloseDate"] button, button[title*="Close Date"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-date-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-opp-fields", type: "MULTIPLE_FIELDS", fields: [{ key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" }, { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }] },
        { id: "qfe-flp-call-btn", type: "CLICK", key: 'button[aria-label="Log a Call"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-call-open-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-flp-call-fields", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[aria-label="Subject"]', value: "EG/Sales Call", fieldType: "text", searchType: "cssSelector" }, { key: 'textarea[aria-describedby="quickTextKeyboardTip"]', value: "FL Payment", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-flp-before-call-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-call-save", type: "CLICK", key: "button.cuf-publisherShareButton", searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-after-call-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-stage-open", type: "CLICK", key: 'button[aria-label="Stage"], button.slds-combobox__input[aria-label="Stage"], button[title="Edit Stage"], [data-target-selection-name*="Stage"] button', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-stage-menu-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-stage-closed-lost", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Not Registered (Closed Lost)"], [role="option"][data-value="Not Registered (Closed Lost)"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-after-stage", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-reason-open", type: "CLICK", key: 'button[aria-label="Reason Opportunity Lost or Closed"], button[aria-label*="Reason Opportunity Lost"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-reason-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-reason-other", type: "CLICK", key: 'lightning-base-combobox-item[data-value="Other"], [role="option"][data-value="Other"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-after-other", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-loss-other-text", type: "MULTIPLE_FIELDS", fields: [{ key: 'input[name="Reason_Opportunity_Lost_Other__c"]', value: "FL Payment", fieldType: "text", searchType: "cssSelector" }] },
        { id: "qfe-flp-before-save", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-flp-stage-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-flp-save-done", type: "DELAY", value: "400", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-15T07:48:39.737Z"
    },
    {
      id: "a6a9f57b-6127-42b8-8f94-51ad41e2e695",
      name: "CRM Autofill",
      url: "https://britishcouncil.lightning.force.com/lightning/o/Opportunity/new?count=12&nooverride=1&useRecordTypeCheck=1&navigationLocation=RELATED_LIST&uid=179205036504112013&recordTypeId=01220000000MKJPAA4",
      description: "Fill CRM fields, save the Opportunity, then change owner.",
      interactions: [
        {
          id: "6051b0e5-3123-48e3-9f9d-59f8142faef5",
          type: "MULTIPLE_FIELDS",
          fields: [
            { key: "CloseDate", value: "{{TODAY}}", fieldType: "text", searchType: "name" },
            { key: 'button[aria-label="Channel Source"]', value: "Phone", fieldType: "select", searchType: "cssSelector" },
            { key: 'button[aria-label="Channel Source Sub Category"]', value: "Outbound", fieldType: "select", searchType: "cssSelector" },
            { key: 'button[aria-label="Stage"]', value: "Consultation / PT taken", fieldType: "select", searchType: "cssSelector" },
            { key: 'button.slds-combobox__input-value[role="combobox"][aria-label="Opportunity Type"], button[aria-label="Opportunity Type"]', value: "AL - BC English/My Class", fieldType: "select", searchType: "cssSelector" },
            { key: 'button.slds-combobox__input-value[role="combobox"][aria-label="Sub Type"], button[aria-label="Sub Type"]', value: "Not Yet Selected", fieldType: "select", searchType: "cssSelector" },
            { key: "Flexible_Field_3_Value__c", value: "{{FLEXIBLE_FIELD_3}}", fieldType: "text", searchType: "name" }
          ]
        },
        { id: "qfe-crm-fields-settle", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-crm-final-save", type: "CLICK", key: 'button[name="SaveEdit"], .slds-button_brand[name="SaveEdit"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-crm-post-save-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-crm-owner-open", type: "CLICK", key: '.change-owner-trigger button, button[title="Change Owner"]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-crm-owner-modal-wait", type: "DELAY", value: "1000", fields: [{}] },
        { id: "qfe-crm-owner-input-click", type: "CLICK", key: '.autocompleteWrapper input, input[title="Search Users"], input.uiInputTextForAutocomplete, input[placeholder="Search Users..."]', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-crm-owner-results-wait", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-crm-owner-first-result", type: "CLICK", key: 'ul.lookup__list li.lookup__item:first-child a[role="option"], ul.lookup__list li.lookup__item a[role="option"], .lookup__list .lookup__item a', searchType: "cssSelector", fields: [{}] },
        { id: "qfe-crm-owner-before-confirm", type: "DELAY", value: "400", fields: [{}] },
        { id: "qfe-crm-owner-confirm", type: "CLICK", key: 'button[name="change owner"], button[value="change owner"], .slds-modal__footer button.slds-button_brand, footer.slds-modal__footer button.slds-button_brand, button.changeOwnerConfirm', searchType: "cssSelector", fields: [{}] }
      ],
      updatedAt: "2026-10-25T00:00:00.000Z",
      createdAt: "2026-10-15T07:48:39.737Z"
    }
  ];

  const normName = (v) => String(v || "").trim().toLowerCase();

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

  const sortByUpdatedDesc = (arr) =>
    [...(arr || [])].sort((a, b) => {
      const ta = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });

  const seedStarterResources = (forceTargetId, onDone) => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) {
      onDone?.(false);
      return;
    }
    chrome.storage.local.get([STORAGE_KEY], (stored) => {
      if (chrome.runtime?.lastError) {
        console.warn("SalesSnap: unable to read resources storage", chrome.runtime.lastError);
        onDone?.(false);
        return;
      }

      const current = parseStoredList(stored?.[STORAGE_KEY]);
      const merged = current.slice();
      let changed = false;

      for (const starter of STARTER_RESOURCES) {
        if (
          forceTargetId &&
          forceTargetId !== "all" &&
          starter.id !== forceTargetId &&
          normName(starter.name) !== normName(forceTargetId)
        ) {
          continue;
        }
        const index = merged.findIndex(
          (item) => item && (item.id === starter.id || normName(item.name) === normName(starter.name))
        );
        if (index === -1) {
          merged.push(JSON.parse(JSON.stringify(starter)));
          changed = true;
          continue;
        }
        const existing = merged[index];
        const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        const starterTime = starter.updatedAt ? new Date(starter.updatedAt).getTime() : 0;
        const hasValidInteractions = Array.isArray(existing?.interactions) && existing.interactions.length > 0;

        if (forceTargetId || !hasValidInteractions || starterTime > existingTime) {
          const clone = JSON.parse(JSON.stringify(starter));
          if (forceTargetId) clone.updatedAt = new Date().toISOString();
          merged[index] = clone;
          changed = true;
        } else if (starter.id === "d4c8e9f0-1234-4a5b-9c8d-7e6f5a4b3c21" && Array.isArray(existing?.interactions)) {
          let wonChanged = false;
          existing.interactions.forEach((step) => {
            if (step?.type === "CLICK" && /Close Date/i.test(String(step.key || ""))) {
              step.key =
                'button[title="Edit Stage"], button.test-id__inline-edit-trigger[title*="Stage"], [data-target-selection-name*="StageName"] button';
              wonChanged = true;
            }
            if (step?.type === "MULTIPLE_FIELDS" && Array.isArray(step.fields)) {
              const filtered = step.fields.filter(
                (f) => !/Close[\s_-]?Date/i.test(String(f?.key || "")) && f?.value !== "{{TODAY}}"
              );
              if (filtered.length !== step.fields.length) {
                step.fields = filtered;
                wonChanged = true;
              }
            }
          });
          if (wonChanged) changed = true;
        }
      }

      if (changed) {
        chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(merged) }, () => {
          if (chrome.runtime?.lastError) {
            console.warn("SalesSnap: failed to save starter resources", chrome.runtime.lastError);
          }
          onDone?.(true);
        });
      } else {
        onDone?.(true);
      }
      chrome.storage.local.remove(LEGACY_WRONG_KEY, () => {});
    });
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
      const data = await chrome.storage.local.get(["resources", "profiles"]);
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
    } catch {}
  };

  const scheduleMenuRebuild = () => {
    if (menuRebuildTimer) clearTimeout(menuRebuildTimer);
    menuRebuildTimer = setTimeout(rebuildContextMenus, 250);
  };

  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onInstalled?.addListener(() => {
      seedStarterResources();
      scheduleMenuRebuild();
    });
    chrome.runtime.onStartup?.addListener(() => {
      seedStarterResources();
      scheduleMenuRebuild();
    });
    chrome.tabs?.onUpdated?.addListener((_tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab?.active) {
        scheduleMenuRebuild();
      }
    });
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area === "local" && (changes.resources || changes.profiles)) {
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
      } catch {}
    });

    chrome.runtime.onMessage?.addListener((msg, _sender, sendResponse) => {
      if (!msg) return false;
      if (msg.name === "resetStarterResources") {
        seedStarterResources(msg.id || "all", (ok) => sendResponse({ ok }));
        return true;
      }
      if (msg.name === "saveDetectedProfile") {
        if (msg.body?.redirect && msg.body?.id) {
          chrome.tabs.create({ url: `/options.html#/lite/edit/${msg.body.id}` });
        }
        sendResponse({ message: "Saved" });
        return false;
      }
      return false;
    });

    seedStarterResources();
  }
})();
