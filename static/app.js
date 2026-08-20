// ─── Element refs ─────────────────────────────────────────────────────────────

const panelInput  = document.getElementById('panel-input');
const panelVerify = document.getElementById('panel-verify');
const panelSaved  = document.getElementById('panel-saved');
const savedList   = document.getElementById('saved-list');
const savedCount  = document.getElementById('saved-count');

const mainLayout  = document.getElementById('main-layout');
const reportView  = document.getElementById('report-view');
const siteHeader  = document.querySelector('.site-header');
const studentBar  = document.getElementById('student-bar');

// Student name
const studentNameInput   = document.getElementById('student-name-input');
const studentCurrentName = document.getElementById('student-current-name');
const btnSetName         = document.getElementById('btn-set-name');

// Course form
const courseForm          = document.getElementById('course-form');
const btnFindDescription  = document.getElementById('btn-find-description');
const btnEnterDescription = document.getElementById('btn-enter-description');
const searchStatusText    = document.getElementById('search-status-text');

// Verify panel
const verifyHint      = document.getElementById('verify-hint');
const sourceLink      = document.getElementById('source-link');
const descriptionText = document.getElementById('description-text');
const btnApprove      = document.getElementById('btn-approve');
const btnPasteOwn     = document.getElementById('btn-paste-own');

// Results panel
const resultsPlaceholder     = document.getElementById('results-placeholder');
const resultsStatus          = document.getElementById('results-status');
const resultsStatusText      = document.getElementById('results-status-text');
const resultsList            = document.getElementById('results-list');
const saveMatchesBar         = document.getElementById('save-matches-bar');
const selectedCountLabel     = document.getElementById('selected-count-label');
const btnSaveMatches         = document.getElementById('btn-save-matches');
const btnAddWithoutMatch     = document.getElementById('btn-add-without-match');
const btnAddOtherCourse      = document.getElementById('btn-add-other-course');
const previousMatchesSection = document.getElementById('previous-matches-section');
const previousMatchesValue   = document.getElementById('previous-matches-value');

// No-match reason inline form
const noMatchReasonForm = document.getElementById('no-match-reason-form');
const noMatchReasonText = document.getElementById('no-match-reason-text');
const btnConfirmNoMatch = document.getElementById('btn-confirm-no-match');
const btnCancelNoMatch  = document.getElementById('btn-cancel-no-match');

// Add-other-course inline form
const addOtherCourseForm    = document.getElementById('add-other-course-form');
const otherCourseNameInput  = document.getElementById('other-course-name');
const otherCourseCodeInput  = document.getElementById('other-course-code');
const otherCourseSubjectInput = document.getElementById('other-course-subject');
const otherCourseReasonInput  = document.getElementById('other-course-reason');
const btnConfirmOtherCourse   = document.getElementById('btn-confirm-other-course');
const btnCancelOtherCourse    = document.getElementById('btn-cancel-other-course');

const btnReset          = document.getElementById('btn-reset');
const btnGenerateReport = document.getElementById('btn-generate-report');

// Report view
const btnBackToTool    = document.getElementById('btn-back-to-tool');
const reportDocStudent = document.getElementById('report-doc-student');
const reportDocCourses = document.getElementById('report-doc-courses');

// Config banner
const configBanner      = document.getElementById('config-banner');
const configBannerText  = document.getElementById('config-banner-text');
const btnBannerSettings = document.getElementById('btn-banner-settings');

// Settings panel
const btnSettings            = document.getElementById('btn-settings');
const settingsPanel          = document.getElementById('settings-panel');
const settingsOverlay        = document.getElementById('settings-overlay');
const btnSettingsClose       = document.getElementById('btn-settings-close');
const settingsApiKeyInput    = document.getElementById('settings-api-key');
const settingsBaseUrlInput   = document.getElementById('settings-base-url');
const settingsLlmApiKeyInput = document.getElementById('settings-llm-api-key');
const btnSaveApiKey          = document.getElementById('btn-save-api-key');
const apiKeyBadge            = document.getElementById('api-key-badge');
const baseUrlBadge           = document.getElementById('base-url-badge');
const apiKeyError            = document.getElementById('api-key-error');
const settingsCsvUpload      = document.getElementById('settings-csv-upload');
const settingsFileStatus     = document.getElementById('settings-file-status');
const btnCreateEmbeddings    = document.getElementById('btn-create-embeddings');
const settingsEmbeddingsStatus = document.getElementById('settings-embeddings-status');
const embeddingsError        = document.getElementById('embeddings-error');
const settingsProgress       = document.getElementById('settings-progress');
const settingsProgressText   = document.getElementById('settings-progress-text');

// Tab bar + add dropdown
const tabBar         = document.getElementById('tab-bar');
const tabAddDropdown = document.getElementById('tab-add-dropdown');
const btnAddOne      = document.getElementById('btn-add-one');
const btnAddMultiple = document.getElementById('btn-add-multiple');

// Bulk modal
const bulkModalOverlay = document.getElementById('bulk-modal-overlay');
const bulkModal        = document.getElementById('bulk-modal');
const bulkTableBody    = document.getElementById('bulk-table-body');
const btnBulkAddRow    = document.getElementById('btn-bulk-add-row');
const btnBulkConfirm   = document.getElementById('btn-bulk-confirm');
const btnBulkCancel    = document.getElementById('btn-bulk-cancel');
const btnBulkClose     = document.getElementById('btn-bulk-close');

// Delete confirm modal
const deleteConfirmOverlay = document.getElementById('delete-confirm-overlay');
const deleteConfirmModal   = document.getElementById('delete-confirm-modal');
const deleteConfirmMessage = document.getElementById('delete-confirm-message');
const btnDeleteCancel      = document.getElementById('btn-delete-cancel');
const btnDeleteConfirm     = document.getElementById('btn-delete-confirm');


// ─── Settings panel ────────────────────────────────────────────────────────────

function openSettings() {
  settingsPanel.classList.add('visible');
  settingsOverlay.classList.add('visible');
}

function closeSettings() {
  settingsPanel.classList.remove('visible');
  settingsOverlay.classList.remove('visible');
}

btnSettings.addEventListener('click', openSettings);
btnSettingsClose.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (settingsPanel.classList.contains('visible')) { closeSettings(); return; }
    if (!deleteConfirmModal.hidden) { closeDeleteConfirm(); return; }
    if (!bulkModal.hidden) { closeBulkModal(); return; }
    if (!tabAddDropdown.hidden) { tabAddDropdown.hidden = true; }
  }
});

btnBannerSettings.addEventListener('click', openSettings);

btnSaveApiKey.addEventListener('click', saveApiKey);
settingsApiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveApiKey();
});

async function saveApiKey() {
  const key       = settingsApiKeyInput.value.trim();
  const baseUrl   = settingsBaseUrlInput.value.trim();
  const llmApiKey = settingsLlmApiKeyInput.value.trim();
  if (!key) {
    showSettingsError(apiKeyError, 'Please enter an API key.');
    return;
  }

  setButtonLoading(btnSaveApiKey, true, 'Validating…');
  apiKeyError.hidden = true;

  try {
    const res = await fetch('/api/settings/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key, base_url: baseUrl || null, llm_api_key: llmApiKey || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      showSettingsError(apiKeyError, data.detail || 'Failed to save API key.');
    } else {
      apiKeyError.hidden = true;
      await loadSettingsStatus();
    }
  } catch (e) {
    showSettingsError(apiKeyError, 'Network error. Is the server running?');
  } finally {
    setButtonLoading(btnSaveApiKey, false, 'Save for this session');
  }
}

function showSettingsError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

settingsCsvUpload.addEventListener('change', uploadCsv);

async function uploadCsv() {
  const file = settingsCsvUpload.files[0];
  if (!file) {
    settingsFileStatus.textContent = 'No file loaded';
    settingsReady.csvLoaded = false;
    updateCreateEmbeddingsButton();
    return;
  }

  settingsFileStatus.textContent = `Uploading ${file.name}…`;
  embeddingsError.hidden = true;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/settings/upload-csv', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      settingsFileStatus.textContent = `Error: ${data.detail}`;
      settingsReady.csvLoaded = false;
    } else {
      const s = data.stats;
      const excluded = s.removed_duplicates + s.removed_U_suffix + s.removed_LAW + s.removed_500plus;
      let line = `${file.name} — ${s.rows_kept} courses loaded`;
      if (excluded > 0) {
        const parts = [];
        if (s.removed_U_suffix)   parts.push(`${s.removed_U_suffix} U-suffix`);
        if (s.removed_LAW)        parts.push(`${s.removed_LAW} LAW subject`);
        if (s.removed_500plus)    parts.push(`${s.removed_500plus} graduate-level`);
        if (s.removed_duplicates) parts.push(`${s.removed_duplicates} duplicate`);
        line += ` · removed: ${parts.join(', ')}`;
      }
      settingsFileStatus.textContent = line;
      settingsReady.csvLoaded = true;
    }
  } catch (e) {
    settingsFileStatus.textContent = 'Upload failed. Is the server running?';
    settingsReady.csvLoaded = false;
  }

  updateCreateEmbeddingsButton();
}

btnCreateEmbeddings.addEventListener('click', startEmbeddingGeneration);

const EMBEDDING_STATUS_MESSAGES = [
  'Generating embeddings… this may take a few minutes.',
  'Processing course titles and descriptions…',
  'Building content similarity index…',
  'Building identity similarity index…',
  'Almost there…',
];

let embeddingPollInterval = null;
let embeddingMsgInterval  = null;

async function startEmbeddingGeneration() {
  embeddingsError.hidden = true;
  setButtonLoading(btnCreateEmbeddings, true, 'Generating…');
  settingsProgress.hidden = false;
  settingsProgressText.textContent = EMBEDDING_STATUS_MESSAGES[0];

  let msgIndex = 0;
  embeddingMsgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % EMBEDDING_STATUS_MESSAGES.length;
    settingsProgressText.textContent = EMBEDDING_STATUS_MESSAGES[msgIndex];
  }, 8000);

  try {
    const res  = await fetch('/api/settings/create-embeddings', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      stopEmbeddingProgress();
      showSettingsError(embeddingsError, data.detail || 'Failed to start embedding generation.');
      return;
    }
    embeddingPollInterval = setInterval(pollEmbeddingStatus, 4000);
  } catch (e) {
    stopEmbeddingProgress();
    showSettingsError(embeddingsError, 'Network error. Is the server running?');
  }
}

async function pollEmbeddingStatus() {
  try {
    const res  = await fetch('/api/settings/status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();

    if (data.embedding_job_status === 'done') {
      clearInterval(embeddingPollInterval);
      embeddingPollInterval = null;
      stopEmbeddingProgress();
      applySettingsStatus(data);
    } else if (data.embedding_job_status && data.embedding_job_status.startsWith('error:')) {
      clearInterval(embeddingPollInterval);
      embeddingPollInterval = null;
      stopEmbeddingProgress();
      showSettingsError(embeddingsError, data.embedding_job_status.replace(/^error:\s*/, ''));
      applySettingsStatus(data);
    }
  } catch (_) {
    // transient network error — keep polling
  }
}

function stopEmbeddingProgress() {
  if (embeddingMsgInterval) { clearInterval(embeddingMsgInterval); embeddingMsgInterval = null; }
  settingsProgress.hidden = true;
  btnCreateEmbeddings.disabled = false;
  btnCreateEmbeddings.textContent = 'Create Embeddings';
}


// ─── Settings ready state ──────────────────────────────────────────────────────

const settingsReady = { apiKeySet: false, csvLoaded: false };

function updateCreateEmbeddingsButton() {
  btnCreateEmbeddings.disabled = !(settingsReady.apiKeySet && settingsReady.csvLoaded);
}


// ─── Settings status ───────────────────────────────────────────────────────────

async function loadSettingsStatus() {
  try {
    const res = await fetch('/api/settings/status', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    applySettingsStatus(data);
  } catch (e) {
    console.warn('Could not fetch settings status:', e);
  }
}

function applySettingsStatus(status) {
  settingsReady.apiKeySet = !!status.api_key_set;
  if (status.api_key_set) {
    apiKeyBadge.textContent = 'Set';
    apiKeyBadge.className = 'settings-badge settings-badge--set';
  } else {
    apiKeyBadge.textContent = 'Not set';
    apiKeyBadge.className = 'settings-badge settings-badge--unset';
  }
  baseUrlBadge.hidden = !status.base_url_set;
  updateCreateEmbeddingsButton();

  if (status.embeddings_available) {
    let line = 'Embeddings loaded';
    if (status.embeddings_generated_at) {
      const d = new Date(status.embeddings_generated_at);
      const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      line = `Last generated: ${formatted}`;
    }
    if (status.embeddings_course_count) {
      line += ` · ${status.embeddings_course_count} courses`;
    }
    settingsEmbeddingsStatus.textContent = line;
  } else {
    settingsEmbeddingsStatus.textContent = 'No embeddings stored';
  }

  const noKey        = !status.api_key_set;
  const noEmbeddings = !status.embeddings_available;

  if (!noKey && !noEmbeddings) {
    configBanner.hidden = true;
    return;
  }

  if (noKey && noEmbeddings) {
    configBannerText.textContent =
      'API key and course data are not configured. Open Settings before using this tool.';
  } else if (noKey) {
    configBannerText.textContent =
      'API key not set. Open Settings to add your key before using this tool.';
  } else {
    configBannerText.textContent =
      'No course data loaded. Open Settings to upload a CSV and create embeddings.';
  }
  configBanner.hidden = false;
}

loadSettingsStatus();


// ─── Tab state ─────────────────────────────────────────────────────────────────

const state = {
  studentName: null,
  savedCourses: [],   // [{ sourceTabId, outsideCourse, description, urMatches }]
  tabs: [],
  activeTabId: 1,
  nextTabId: 2,
};

function createTab(id, prefill = null) {
  return {
    id,
    // Logical state
    courseDetails: prefill ? { ...prefill } : null,
    description: null,
    descriptionDraft: '',
    verifyHint: '',
    sourceUrl: '',
    sourceLinkVisible: false,
    isManual: false,
    currentMatches: [],
    previousMatches: null,
    resultsState: 'placeholder',   // 'placeholder' | 'loading' | 'results'
    panelState: 'input',           // 'input' | 'verify' | 'verify-collapsed'
    inputExpanded: true,
    savedToReport: false,
    // Concurrency flags — set at fetch start, cleared at fetch end
    isFindingDescription: false,
    isEvaluating: false,
    // Monotonic token invalidates in-flight callbacks when the tab's course changes
    searchToken: 0,
    // Message rotation positions — saved on tab switch, restored on tab restore
    descMsgIndex: 0,
    statusMsgIndex: 0,
    // DOM snapshot of form field values (saved on tab switch)
    formValues: prefill ? {
      outside_university: prefill.outside_university || '',
      outside_subject:    prefill.outside_subject    || '',
      outside_code:       prefill.outside_code       || '',
      outside_title:      prefill.outside_title      || '',
      term:               prefill.term               || '',
      year:               prefill.year               || '',
    } : null,
  };
}

state.tabs.push(createTab(1));

function getTab(id) {
  return state.tabs.find(t => t.id === id) || null;
}

function getActiveTab() {
  return getTab(state.activeTabId);
}

function getTabLabel(tab, index) {
  if (tab.courseDetails && tab.courseDetails.outside_subject && tab.courseDetails.outside_code) {
    return `${tab.courseDetails.outside_subject} ${tab.courseDetails.outside_code}`.trim();
  }
  return String(index + 1);
}


// ─── Tab bar rendering ─────────────────────────────────────────────────────────

function renderTabs() {
  tabBar.innerHTML = '';

  state.tabs.forEach((tab, idx) => {
    const label = getTabLabel(tab, idx);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab' + (tab.id === state.activeTabId ? ' tab--active' : '');
    btn.dataset.tabId = String(tab.id);
    btn.setAttribute('aria-label', `Tab ${label}`);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    btn.appendChild(labelSpan);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tab-close';
    closeBtn.textContent = '×';
    closeBtn.disabled = state.tabs.length === 1;
    closeBtn.setAttribute('aria-label', `Close tab ${label}`);
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteTab(tab.id);
    });
    btn.appendChild(closeBtn);

    btn.addEventListener('click', () => switchToTab(tab.id));
    tabBar.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'tab-add';
  addBtn.id = 'btn-tab-add';
  addBtn.textContent = '+';
  addBtn.setAttribute('aria-label', 'Add course tab');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTabAddDropdown(addBtn);
  });
  tabBar.appendChild(addBtn);

  const manageBtn = document.createElement('button');
  manageBtn.type = 'button';
  manageBtn.className = 'btn-tab-manage';
  manageBtn.textContent = 'Manage All Courses';
  manageBtn.setAttribute('aria-label', 'Manage all courses');
  manageBtn.addEventListener('click', () => openBulkModal());
  tabBar.appendChild(manageBtn);
}


// ─── "+" dropdown ──────────────────────────────────────────────────────────────

function toggleTabAddDropdown(anchorEl) {
  if (!tabAddDropdown.hidden) {
    tabAddDropdown.hidden = true;
    return;
  }
  const rect = anchorEl.getBoundingClientRect();
  tabAddDropdown.style.top  = (rect.bottom + window.scrollY + 4) + 'px';
  tabAddDropdown.style.left = rect.left + 'px';
  tabAddDropdown.hidden = false;
}

document.addEventListener('click', (e) => {
  if (!tabAddDropdown.hidden && !tabAddDropdown.contains(e.target)) {
    tabAddDropdown.hidden = true;
  }
});

btnAddOne.addEventListener('click', () => {
  tabAddDropdown.hidden = true;
  addTab();
});

btnAddMultiple.addEventListener('click', () => {
  tabAddDropdown.hidden = true;
  openBulkModal();
});


// ─── Tab management: add / delete ──────────────────────────────────────────────

function addTab(prefill = null) {
  const id = state.nextTabId++;
  state.tabs.push(createTab(id, prefill));
  renderTabs();
  switchToTab(id);
}

function deleteTab(id) {
  if (state.tabs.length === 1) return;

  // Remove any saved courses from this tab and update report
  state.savedCourses = state.savedCourses.filter(c => c.sourceTabId !== id);
  updateSavedPanel();
  updateReportButton();

  const idx = state.tabs.findIndex(t => t.id === id);
  state.tabs.splice(idx, 1);

  if (state.activeTabId === id) {
    // Switch to the tab immediately to the left, or the first tab if none
    const newTab = state.tabs[Math.max(0, idx - 1)];
    state.activeTabId = newTab.id;
    restoreTabState(newTab);
  }

  renderTabs();
}


// ─── Delete confirmation modal ─────────────────────────────────────────────────

let pendingDeleteTabId = null;

function confirmDeleteTab(id) {
  if (state.tabs.length === 1) return;
  pendingDeleteTabId = id;
  const tab = getTab(id);
  const idx = state.tabs.findIndex(t => t.id === id);
  const label = getTabLabel(tab, idx);
  const hasSaved = state.savedCourses.some(c => c.sourceTabId === id);
  deleteConfirmMessage.textContent = hasSaved
    ? `Delete "${label}"? This will also remove its saved matches from the report. This cannot be undone.`
    : `Delete "${label}"? This cannot be undone.`;
  deleteConfirmOverlay.hidden = false;
  deleteConfirmModal.hidden = false;
}

function closeDeleteConfirm() {
  deleteConfirmOverlay.hidden = true;
  deleteConfirmModal.hidden = true;
  pendingDeleteTabId = null;
}

btnDeleteCancel.addEventListener('click', closeDeleteConfirm);
deleteConfirmOverlay.addEventListener('click', closeDeleteConfirm);
btnDeleteConfirm.addEventListener('click', () => {
  if (pendingDeleteTabId !== null) deleteTab(pendingDeleteTabId);
  closeDeleteConfirm();
});


// ─── Tab switching: save → switch → restore ────────────────────────────────────

function saveActiveTabState() {
  const tab = getActiveTab();
  if (!tab) return;

  // Save form field values
  tab.formValues = {
    outside_university: document.getElementById('outside_university').value,
    outside_subject:    document.getElementById('outside_subject').value,
    outside_code:       document.getElementById('outside_code').value,
    outside_title:      document.getElementById('outside_title').value,
    term:               document.getElementById('term').value,
    year:               document.getElementById('year').value,
  };

  // Save textarea content
  tab.descriptionDraft = descriptionText.value;

  // Derive panel visibility from DOM
  tab.inputExpanded = !panelInput.classList.contains('panel--collapsed');
  if (panelVerify.hidden) {
    tab.panelState = 'input';
  } else if (panelVerify.classList.contains('panel--collapsed')) {
    tab.panelState = 'verify-collapsed';
  } else {
    tab.panelState = 'verify';
  }

  // Stop cosmetic rotation intervals — they restart when this tab is restored
  stopDescSearchRotation();
  stopStatusRotation();

  // Close any open inline sub-forms — they're transient UI, not per-tab state
  hideNoMatchReasonForm();
  hideAddOtherCourseForm();
}

function restoreTabState(tab) {
  // ── Form fields ──────────────────────────────────────────────────────────
  const fv = tab.formValues || {};
  document.getElementById('outside_university').value = fv.outside_university || '';
  document.getElementById('outside_subject').value    = fv.outside_subject    || '';
  document.getElementById('outside_code').value       = fv.outside_code       || '';
  document.getElementById('outside_title').value      = fv.outside_title      || '';
  document.getElementById('term').value               = fv.term               || '';
  document.getElementById('year').value               = fv.year               || '';

  // ── Panel-input accordion ────────────────────────────────────────────────
  if (tab.inputExpanded !== false) {
    expandPanel(panelInput);
  } else {
    collapsePanel(panelInput);
  }

  // ── Verify panel ─────────────────────────────────────────────────────────
  if (tab.panelState === 'input') {
    panelVerify.hidden = true;
    if (sourceLink) sourceLink.hidden = true;
    descriptionText.value = '';
  } else {
    panelVerify.hidden = false;
    descriptionText.value = tab.descriptionDraft || '';
    verifyHint.textContent = tab.verifyHint || '';
    if (tab.sourceLinkVisible && tab.sourceUrl) {
      if (sourceLink) { sourceLink.href = tab.sourceUrl; sourceLink.hidden = false; }
    } else {
      if (sourceLink) sourceLink.hidden = true;
    }
    if (tab.panelState === 'verify') {
      expandPanel(panelVerify);
    } else {
      collapsePanel(panelVerify);
    }
  }

  // ── Verify-panel button states (disabled while this tab is evaluating) ───
  const ev = tab.isEvaluating;
  descriptionText.disabled     = ev;
  btnApprove.disabled          = ev;
  btnPasteOwn.disabled         = ev;
  btnEnterDescription.disabled = ev;

  // ── Find-description button + spinner ────────────────────────────────────
  if (tab.isFindingDescription) {
    setButtonLoading(btnFindDescription, true, 'Searching…');
    startDescSearchRotation(tab.descMsgIndex || 0);
  } else {
    setButtonLoading(btnFindDescription, false, 'Find course description');
    stopDescSearchRotation();
    if (searchStatusText) searchStatusText.style.display = 'none';
  }

  // ── Right column ─────────────────────────────────────────────────────────
  if (tab.resultsState === 'placeholder') {
    resetResultsToPlaceholder();
  } else if (tab.resultsState === 'loading') {
    showResultsLoading(tab.statusMsgIndex || 0);
  } else if (tab.resultsState === 'results') {
    stopStatusRotation();
    resultsStatus.hidden = true;
    resultsPlaceholder.hidden = true;

    renderResults(tab.currentMatches);
    renderPreviousMatches(tab.previousMatches);

    if (tab.savedToReport) {
      saveMatchesBar.hidden = true;
    } else {
      saveMatchesBar.hidden = false;
      updateSelectionCount();
    }
  }
}

function switchToTab(id) {
  if (id === state.activeTabId) return;
  saveActiveTabState();
  state.activeTabId = id;
  renderTabs();
  restoreTabState(getTab(id));
}


// ─── Bulk entry modal ──────────────────────────────────────────────────────────

// Parallel array tracking which tab ID each row belongs to (null = new row)
let bulkRowTabIds = [];

function openBulkModal() {
  bulkRowTabIds = [];
  bulkTableBody.innerHTML = '';

  // Pre-populate one row per tab that has any data
  state.tabs.forEach(tab => {
    const fv = tab.formValues;
    const cd = tab.courseDetails;
    const source = fv || (cd ? {
      outside_university: cd.outside_university || '',
      outside_subject:    cd.outside_subject    || '',
      outside_code:       cd.outside_code       || '',
      outside_title:      cd.outside_title      || '',
      term:               cd.term               || '',
      year:               cd.year               || '',
    } : null);

    if (source && (source.outside_university || source.outside_subject ||
                   source.outside_code       || source.outside_title)) {
      appendBulkRow(source, tab.id);
    }
  });

  // Always provide at least one blank row
  appendBulkRow(null, null);

  bulkModalOverlay.hidden = false;
  bulkModal.hidden = false;
}

function appendBulkRow(values, sourceTabId) {
  bulkRowTabIds.push(sourceTabId);
  const rowIndex = bulkTableBody.rows.length;

  const tr = document.createElement('tr');

  // Row number cell
  const numTd = document.createElement('td');
  numTd.className = 'bulk-row-num';
  numTd.textContent = rowIndex + 1;
  tr.appendChild(numTd);

  // Field cells
  const FIELDS = [
    { key: 'outside_university', placeholder: 'e.g. UVA' },
    { key: 'outside_subject',    placeholder: 'e.g. ECON' },
    { key: 'outside_code',       placeholder: 'e.g. 201' },
    { key: 'outside_title',      placeholder: 'e.g. Microeconomics' },
    { key: 'term',               placeholder: 'e.g. Fall' },
    { key: 'year',               placeholder: 'e.g. 2023' },
  ];

  FIELDS.forEach(({ key, placeholder }) => {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.dataset.field = key;
    input.placeholder = placeholder;
    input.value = values ? (values[key] || '') : '';
    td.appendChild(input);
    tr.appendChild(td);
  });

  // Remove button cell
  const removeTd = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-bulk-remove';
  removeBtn.textContent = '×';
  removeBtn.setAttribute('aria-label', 'Remove row');
  removeBtn.addEventListener('click', () => {
    const idx = Array.from(bulkTableBody.rows).indexOf(tr);
    if (idx !== -1) {
      bulkRowTabIds.splice(idx, 1);
      tr.remove();
      renumberBulkRows();
    }
  });
  removeTd.appendChild(removeBtn);
  tr.appendChild(removeTd);

  bulkTableBody.appendChild(tr);
}

function renumberBulkRows() {
  Array.from(bulkTableBody.rows).forEach((r, i) => {
    const numCell = r.querySelector('.bulk-row-num');
    if (numCell) numCell.textContent = i + 1;
  });
}

function closeBulkModal() {
  bulkModal.hidden = true;
  bulkModalOverlay.hidden = true;
  bulkTableBody.innerHTML = '';
  bulkRowTabIds = [];
}

btnBulkAddRow.addEventListener('click', () => appendBulkRow(null, null));
btnBulkCancel.addEventListener('click', closeBulkModal);
btnBulkClose.addEventListener('click', closeBulkModal);
bulkModalOverlay.addEventListener('click', closeBulkModal);

btnBulkConfirm.addEventListener('click', () => {
  const rows = Array.from(bulkTableBody.rows);
  const modifiedTabIds = new Set();

  rows.forEach((tr, i) => {
    const inputs = tr.querySelectorAll('input[data-field]');
    const vals = {};
    inputs.forEach(inp => { vals[inp.dataset.field] = inp.value.trim(); });

    // Skip fully empty rows
    if (!vals.outside_university && !vals.outside_subject &&
        !vals.outside_code       && !vals.outside_title) return;

    const details = {
      outside_university: vals.outside_university || '',
      outside_subject:    vals.outside_subject    || '',
      outside_code:       vals.outside_code       || '',
      outside_title:      vals.outside_title      || '',
      term:               vals.term               || null,
      year:               vals.year               || null,
    };

    const formVals = { ...vals };

    const sourceTabId = bulkRowTabIds[i];

    if (sourceTabId !== null) {
      // Update existing tab if any value changed
      const tab = getTab(sourceTabId);
      if (!tab) return;

      const prevKey = JSON.stringify(tab.courseDetails);
      const nextKey = JSON.stringify(details);
      if (prevKey === nextKey) return;

      tab.courseDetails = details;
      tab.formValues    = formVals;
      // Clear all derived state — course data changed so previous results are stale
      tab.description       = null;
      tab.descriptionDraft  = '';
      tab.verifyHint        = '';
      tab.sourceUrl         = '';
      tab.sourceLinkVisible = false;
      tab.isManual          = false;
      tab.currentMatches    = [];
      tab.previousMatches   = null;
      tab.resultsState      = 'placeholder';
      tab.panelState        = 'input';
      tab.inputExpanded     = true;
      tab.savedToReport     = false;
      // Bump token so any in-flight callbacks for the old course become no-ops
      tab.searchToken      += 1;
      tab.isFindingDescription = false;
      tab.isEvaluating         = false;
      tab.descMsgIndex         = 0;
      tab.statusMsgIndex       = 0;

      // Remove stale saved courses for this tab
      state.savedCourses = state.savedCourses.filter(c => c.sourceTabId !== sourceTabId);
      modifiedTabIds.add(sourceTabId);

    } else {
      // Create a new tab pre-filled with this row's data
      const id = state.nextTabId++;
      const newTab = createTab(id, details);
      newTab.formValues = formVals;
      state.tabs.push(newTab);
    }
  });

  // Remove any tabs that still have no course data (e.g. the default empty
  // tab) so only the courses entered in the table remain. Guard against
  // pruning every tab away if nothing has ever been filled in.
  const emptyTabIds = state.tabs.filter(t => !t.courseDetails).map(t => t.id);
  let activeTabWasRemoved = false;
  if (emptyTabIds.length > 0 && emptyTabIds.length < state.tabs.length) {
    state.tabs = state.tabs.filter(t => t.courseDetails);
    if (emptyTabIds.includes(state.activeTabId)) {
      state.activeTabId = state.tabs[0].id;
      activeTabWasRemoved = true;
    }
  }

  updateSavedPanel();
  updateReportButton();
  renderTabs();

  // If the currently active tab was modified or replaced, restore its DOM state
  if (activeTabWasRemoved || modifiedTabIds.has(state.activeTabId)) {
    restoreTabState(getActiveTab());
  }

  closeBulkModal();
});


// ─── Student name ──────────────────────────────────────────────────────────────

btnSetName.addEventListener('click', commitStudentName);
studentNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') commitStudentName();
});

function commitStudentName() {
  const name = studentNameInput.value.trim();
  if (!name) {
    studentNameInput.focus();
    return;
  }
  if (state.studentName && state.studentName !== name) {
    // Different student: reset everything
    state.savedCourses = [];
    state.tabs = [createTab(1)];
    state.activeTabId = 1;
    state.nextTabId = 2;
    renderTabs();
    restoreTabState(getActiveTab());
    updateSavedPanel();
    btnGenerateReport.hidden = true;
  }
  state.studentName = name;
  studentCurrentName.textContent = `Currently set: ${name}`;
  studentCurrentName.hidden = false;
}


// ─── Accordion helpers ─────────────────────────────────────────────────────────

function expandPanel(panel) {
  panel.classList.remove('panel--collapsed');
  const toggle = panel.querySelector('.panel-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

function collapsePanel(panel) {
  panel.classList.add('panel--collapsed');
  const toggle = panel.querySelector('.panel-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

document.querySelectorAll('.panel-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('.panel');
    if (panel.classList.contains('panel--collapsed')) {
      expandPanel(panel);
    } else {
      collapsePanel(panel);
    }
  });
});


// ─── Course form submission ────────────────────────────────────────────────────

courseForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Capture tab ID at call time — all async callbacks close over this value
  const tabId = state.activeTabId;
  const tab   = getTab(tabId);
  if (!tab) return;

  resetResultsToPlaceholder();
  collapsePanel(panelVerify);
  panelVerify.hidden = true;
  if (sourceLink) sourceLink.hidden = true;

  const courseDetails = {
    outside_university: document.getElementById('outside_university').value.trim(),
    outside_subject:    document.getElementById('outside_subject').value.trim(),
    outside_code:       document.getElementById('outside_code').value.trim(),
    outside_title:      document.getElementById('outside_title').value.trim(),
    term: document.getElementById('term').value.trim() || null,
    year: document.getElementById('year').value.trim() || null,
  };
  tab.courseDetails = courseDetails;
  tab.isFindingDescription = true;
  tab.searchToken += 1;
  const myToken = tab.searchToken;
  renderTabs();

  setButtonLoading(btnFindDescription, true, 'Searching…');
  startDescSearchRotation();

  try {
    const response = await fetch('/api/search-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(courseDetails),
    });

    const currentTab = getTab(tabId);
    // Bail if the tab was deleted or the course was replaced (bulk edit)
    if (!currentTab || currentTab.searchToken !== myToken) return;
    currentTab.isFindingDescription = false;

    if (state.activeTabId === tabId) {
      setButtonLoading(btnFindDescription, false, 'Find course description');
      stopDescSearchRotation();
    }

    if (response.status === 403) {
      if (state.activeTabId === tabId) showSettingsRequiredMessage();
      return;
    }
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();
    const hasDesc = !!(data.description && data.description.trim());

    currentTab.verifyHint = hasDesc
      ? 'Found via web search. Edit if needed, then approve to continue.'
      : "We couldn't find a description automatically. Please paste one in, or type it manually.";
    currentTab.sourceUrl        = (data.found && data.source_url) ? data.source_url : '';
    currentTab.sourceLinkVisible = !!(data.found && hasDesc && data.source_url);
    currentTab.descriptionDraft  = data.description || '';
    currentTab.panelState        = 'verify';
    currentTab.inputExpanded     = false;

    if (state.activeTabId === tabId) {
      showVerifyPanel(data.description, data.found, data.source_url);
    }

  } catch (err) {
    console.error('search-description failed:', err);
    const currentTab = getTab(tabId);
    if (!currentTab || currentTab.searchToken !== myToken) return;
    currentTab.isFindingDescription = false;
    currentTab.verifyHint        = "We couldn't find a description automatically. Please paste one in, or type it manually.";
    currentTab.sourceLinkVisible = false;
    currentTab.descriptionDraft  = '';
    currentTab.panelState        = 'verify';
    currentTab.inputExpanded     = false;

    if (state.activeTabId === tabId) {
      setButtonLoading(btnFindDescription, false, 'Find course description');
      stopDescSearchRotation();
      showVerifyPanel('', false, '');
    }
  }
});


// ─── Manual description entry ──────────────────────────────────────────────────

btnEnterDescription.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;

  const university = document.getElementById('outside_university').value.trim();
  const subject    = document.getElementById('outside_subject').value.trim();
  const code       = document.getElementById('outside_code').value.trim();
  const title      = document.getElementById('outside_title').value.trim();

  if (!university || !subject || !code || !title) {
    alert('Please fill in the university, subject, course code, and course title before entering a description.');
    return;
  }

  resetResultsToPlaceholder();

  tab.courseDetails = {
    outside_university: university,
    outside_subject:    subject,
    outside_code:       code,
    outside_title:      title,
    term: document.getElementById('term').value.trim() || null,
    year: document.getElementById('year').value.trim() || null,
  };
  tab.verifyHint       = 'Type or paste the course description below, then approve to continue.';
  tab.sourceUrl        = '';
  tab.sourceLinkVisible = false;
  tab.descriptionDraft = '';
  tab.isManual         = true;
  tab.panelState       = 'verify';
  tab.inputExpanded    = false;
  renderTabs();

  showVerifyPanel('', false, '', true);
});


// ─── Verify panel ──────────────────────────────────────────────────────────────

function showVerifyPanel(description, foundOnline, sourceUrl, isManual = false) {
  descriptionText.value = description;

  const hasDescription = description && description.trim().length > 0;
  if (isManual) {
    verifyHint.textContent = 'Type or paste the course description below, then approve to continue.';
    descriptionText.placeholder = 'Type or paste the course description here.';
  } else {
    verifyHint.textContent = hasDescription
      ? 'Found via web search. Edit if needed, then approve to continue.'
      : "We couldn't find a description automatically. Please paste one in, or type it manually.";
    descriptionText.placeholder = 'Course description will appear here.';
  }

  if (sourceLink) {
    const showSource = !isManual && foundOnline && hasDescription && sourceUrl && sourceUrl.trim().length > 0;
    if (showSource) {
      sourceLink.href = sourceUrl;
      sourceLink.hidden = false;
    } else {
      sourceLink.hidden = true;
    }
  }

  panelVerify.hidden = false;
  panelVerify.offsetHeight; // force reflow so transition fires
  expandPanel(panelVerify);
  collapsePanel(panelInput);
  if (isManual) descriptionText.focus();
}

btnPasteOwn.addEventListener('click', () => {
  const tab = getActiveTab();
  descriptionText.value = '';
  descriptionText.placeholder = 'Paste or type the course description here.';
  if (sourceLink) sourceLink.hidden = true;
  if (tab) { tab.sourceLinkVisible = false; tab.descriptionDraft = ''; }
  descriptionText.focus();
});


// ─── Approve and evaluate ──────────────────────────────────────────────────────

btnApprove.addEventListener('click', async () => {
  const description = descriptionText.value.trim();
  if (!description) {
    alert('Please enter or approve a course description before continuing.');
    return;
  }

  // Capture tab ID at call time
  const tabId = state.activeTabId;
  const tab   = getTab(tabId);
  if (!tab) return;

  tab.description      = description;
  tab.descriptionDraft = description;
  tab.isEvaluating     = true;
  tab.resultsState     = 'loading';
  tab.searchToken += 1;
  const myToken = tab.searchToken;

  descriptionText.disabled     = true;
  btnApprove.disabled          = true;
  btnPasteOwn.disabled         = true;
  btnEnterDescription.disabled = true;

  showResultsLoading();

  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        ...tab.courseDetails,
        description: tab.description,
      }),
    });

    const currentTab = getTab(tabId);
    if (!currentTab || currentTab.searchToken !== myToken) return;
    currentTab.isEvaluating = false;

    if (state.activeTabId === tabId) {
      descriptionText.disabled     = false;
      btnApprove.disabled          = false;
      btnPasteOwn.disabled         = false;
      btnEnterDescription.disabled = false;
    }

    if (response.status === 403 || response.status === 503) {
      currentTab.resultsState = 'placeholder';
      if (state.activeTabId === tabId) {
        stopStatusRotation();
        resultsStatus.hidden = true;
        showSettingsRequiredMessage();
      }
      return;
    }
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();
    currentTab.currentMatches  = data.matches;
    currentTab.previousMatches = data.previous_ur_matches;
    currentTab.resultsState    = 'results';

    if (state.activeTabId === tabId) {
      renderResults(data.matches);
      renderPreviousMatches(data.previous_ur_matches);
    }

  } catch (err) {
    console.error('evaluate failed:', err);
    const currentTab = getTab(tabId);
    if (!currentTab || currentTab.searchToken !== myToken) return;
    currentTab.isEvaluating = false;
    currentTab.resultsState = 'placeholder';

    if (state.activeTabId === tabId) {
      descriptionText.disabled     = false;
      btnApprove.disabled          = false;
      btnPasteOwn.disabled         = false;
      btnEnterDescription.disabled = false;
      stopStatusRotation();
      resultsStatus.hidden = true;
      resultsPlaceholder.hidden = false;
      resultsPlaceholder.querySelector('p').textContent =
        'Something went wrong while evaluating matches. Please try again.';
    }
  }
});


// ─── Results rendering ─────────────────────────────────────────────────────────

function confidenceEmoji(confidence) {
  return { High: '🟢', Medium: '🟡', Low: '🔴' }[confidence] || '';
}

function buildResultRow(match, index, checked = false) {
  const li = document.createElement('li');
  li.className = 'result-row';

  li.innerHTML = `
    <div class="result-summary">
      <label class="match-checkbox-wrap" for="match-cb-${index}" title="Select this match">
        <input type="checkbox" class="match-checkbox" data-index="${index}" id="match-cb-${index}" />
      </label>
      <div class="result-info">
        <span class="result-code">${escapeHtml(match.course_code)} <span class="confidence-tag" aria-label="${escapeHtml(match.confidence)} confidence" title="${escapeHtml(match.confidence)} confidence">${confidenceEmoji(match.confidence)}</span></span>
        <span class="result-title">${escapeHtml(match.course_title)}</span>
      </div>
      <span class="result-chevron" aria-hidden="true">&#9662;</span>
    </div>
    <div class="result-detail">
      <table>
        <tr><td>Subject</td><td>${escapeHtml(match.subject_alignment)}</td></tr>
        <tr><td>Level</td><td>${escapeHtml(match.course_level_alignment)}</td></tr>
        <tr><td>Overlap</td><td>${escapeHtml(match.content_overlap)}</td></tr>
        <tr><td>Reason</td><td>${escapeHtml(match.reason)}</td></tr>
        <tr><td>Confidence</td><td>${escapeHtml(match.confidence)}</td></tr>
        ${match.course_description ? `<tr class="result-desc-row"><td>UR description</td><td>${escapeHtml(match.course_description)}</td></tr>` : ''}
      </table>
    </div>
  `;

  li.querySelector('.result-summary').addEventListener('click', (e) => {
    if (e.target.closest('.match-checkbox-wrap')) return;
    li.classList.toggle('expanded');
  });

  const checkbox = li.querySelector('.match-checkbox');
  checkbox.checked = checked;
  checkbox.addEventListener('change', updateSelectionCount);

  return li;
}

function renderResults(matches) {
  stopStatusRotation();
  resultsStatus.hidden = true;
  resultsPlaceholder.hidden = true;

  resultsList.innerHTML = '';

  matches.forEach((match, index) => {
    resultsList.appendChild(buildResultRow(match, index));
  });

  resultsList.hidden = false;
  saveMatchesBar.hidden = false;
  hideNoMatchReasonForm();
  hideAddOtherCourseForm();
  updateSelectionCount();
}

function updateSelectionCount() {
  const count = resultsList.querySelectorAll('.match-checkbox:checked').length;
  selectedCountLabel.textContent = count === 1 ? '1 selected' : `${count} selected`;
  btnSaveMatches.disabled = count === 0;
  btnAddWithoutMatch.disabled = count > 0;
  if (count > 0) hideNoMatchReasonForm();
}


// ─── Save matches for current course ──────────────────────────────────────────

function finishSavingCourse(tab, urMatches, noMatchReason) {
  state.savedCourses.push({
    sourceTabId:   tab.id,
    outsideCourse: { ...tab.courseDetails },
    description:   tab.description,
    urMatches,
    noMatchReason: noMatchReason || '',
  });

  tab.savedToReport = true;
  updateSavedPanel();
  saveMatchesBar.hidden = true;
  hideNoMatchReasonForm();
  hideAddOtherCourseForm();
  updateReportButton();
}

btnSaveMatches.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;

  const checked = resultsList.querySelectorAll('.match-checkbox:checked');
  const selectedMatches = [];
  checked.forEach((cb) => {
    selectedMatches.push(tab.currentMatches[parseInt(cb.dataset.index, 10)]);
  });

  finishSavingCourse(tab, selectedMatches, '');
});


// ─── Add without a match (with optional reason) ───────────────────────────────

function showNoMatchReasonForm() {
  hideAddOtherCourseForm();
  noMatchReasonText.value = '';
  noMatchReasonForm.hidden = false;
  noMatchReasonText.focus();
}

function hideNoMatchReasonForm() {
  noMatchReasonForm.hidden = true;
}

btnAddWithoutMatch.addEventListener('click', showNoMatchReasonForm);
btnCancelNoMatch.addEventListener('click', hideNoMatchReasonForm);

btnConfirmNoMatch.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  finishSavingCourse(tab, [], noMatchReasonText.value.trim());
});


// ─── Add Other Course (manually add a UR match) ────────────────────────────────

function showAddOtherCourseForm() {
  hideNoMatchReasonForm();
  otherCourseNameInput.value = '';
  otherCourseCodeInput.value = '';
  otherCourseSubjectInput.value = '';
  otherCourseReasonInput.value = '';
  addOtherCourseForm.hidden = false;
  otherCourseNameInput.focus();
}

function hideAddOtherCourseForm() {
  addOtherCourseForm.hidden = true;
}

btnAddOtherCourse.addEventListener('click', showAddOtherCourseForm);
btnCancelOtherCourse.addEventListener('click', hideAddOtherCourseForm);

btnConfirmOtherCourse.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;

  const name    = otherCourseNameInput.value.trim();
  const code    = otherCourseCodeInput.value.trim();
  const subject = otherCourseSubjectInput.value.trim();
  const reason  = otherCourseReasonInput.value.trim();

  if (!name || !code || !subject || !reason) {
    alert('Please fill in the course name, code, subject, and reason for the match.');
    return;
  }

  const manualMatch = {
    course_code: `${subject} ${code}`.trim(),
    course_title: name,
    subject_alignment: '',
    course_level_alignment: '',
    content_overlap: '',
    reason,
    confidence: '',
    course_description: null,
  };

  tab.currentMatches.push(manualMatch);
  const newIndex = tab.currentMatches.length - 1;
  resultsList.appendChild(buildResultRow(manualMatch, newIndex, true));

  hideAddOtherCourseForm();
  updateSelectionCount();
});

function updateReportButton() {
  btnGenerateReport.hidden = state.savedCourses.length === 0;
}

function updateSavedPanel() {
  const count = state.savedCourses.length;
  savedCount.textContent = count;

  if (count === 0) {
    panelSaved.hidden = true;
    savedList.innerHTML = '';
    return;
  }

  panelSaved.hidden = false;
  savedList.innerHTML = '';

  state.savedCourses.forEach((entry, i) => {
    const { outsideCourse: oc, urMatches, noMatchReason } = entry;
    const courseLabel = `${oc.outside_subject} ${oc.outside_code} — ${oc.outside_title}`;
    const matchCodes  = urMatches.length > 0
      ? urMatches.map(m => m.course_code).join(', ')
      : 'No UR match selected';
    const reasonHtml = (urMatches.length === 0 && noMatchReason)
      ? `<p class="saved-entry-reason">${escapeHtml(noMatchReason)}</p>`
      : '';

    const div = document.createElement('div');
    div.className = 'saved-entry';
    div.innerHTML = `
      <p class="saved-entry-outside">${escapeHtml(courseLabel)}</p>
      <p class="saved-entry-matches">&rarr; ${escapeHtml(matchCodes)}</p>
      ${reasonHtml}
    `;
    savedList.appendChild(div);

    if (i < state.savedCourses.length - 1) {
      const hr = document.createElement('hr');
      hr.className = 'saved-entry-divider';
      savedList.appendChild(hr);
    }
  });
}


// ─── Reset: clear current tab only ────────────────────────────────────────────

function resetCourseSearch() {
  const tab = getActiveTab();
  if (!tab) return;

  // Remove saved courses from this tab
  state.savedCourses = state.savedCourses.filter(c => c.sourceTabId !== tab.id);
  updateSavedPanel();
  updateReportButton();

  // Reset tab logical state
  tab.courseDetails        = null;
  tab.description          = null;
  tab.descriptionDraft     = '';
  tab.verifyHint           = '';
  tab.sourceUrl            = '';
  tab.sourceLinkVisible    = false;
  tab.isManual             = false;
  tab.currentMatches       = [];
  tab.previousMatches      = null;
  tab.resultsState         = 'placeholder';
  tab.panelState           = 'input';
  tab.inputExpanded        = true;
  tab.savedToReport        = false;
  tab.formValues           = null;
  // Bump token so any in-flight callbacks for this tab become no-ops
  tab.searchToken         += 1;
  tab.isFindingDescription = false;
  tab.isEvaluating         = false;

  // Reset DOM
  courseForm.reset();
  expandPanel(panelInput);
  collapsePanel(panelVerify);
  panelVerify.hidden = true;
  if (sourceLink) sourceLink.hidden = true;
  descriptionText.value        = '';
  descriptionText.disabled     = false;
  btnApprove.disabled          = false;
  btnPasteOwn.disabled         = false;
  btnEnterDescription.disabled = false;
  setButtonLoading(btnFindDescription, false, 'Find course description');
  stopDescSearchRotation();
  resetResultsToPlaceholder();
  // Reset rotation indices after stop calls (stop may have saved a stale index)
  tab.descMsgIndex   = 0;
  tab.statusMsgIndex = 0;
  renderTabs();

  document.getElementById('outside_university').focus();
}

if (btnReset) btnReset.addEventListener('click', resetCourseSearch);


// ─── Generate report ───────────────────────────────────────────────────────────

btnGenerateReport.addEventListener('click', () => {
  if (state.savedCourses.length === 0) return;
  renderReport();
  siteHeader.hidden = true;
  studentBar.hidden = true;
  mainLayout.hidden = true;
  reportView.hidden = false;
  window.scrollTo(0, 0);
});

btnBackToTool.addEventListener('click', () => {
  reportView.hidden = true;
  siteHeader.hidden = false;
  studentBar.hidden = false;
  mainLayout.hidden = false;
});

function renderReport() {
  const nameForReport = state.studentName || studentNameInput.value.trim() || '—';
  reportDocStudent.textContent = `Student: ${nameForReport}`;
  reportDocCourses.innerHTML = '';

  state.savedCourses.forEach((entry) => {
    const { outsideCourse: oc, description, urMatches, noMatchReason } = entry;
    const termYear = [oc.term, oc.year].filter(Boolean).join(' ');

    const matchesHtml = urMatches.length === 0
      ? `<p class="report-no-match">No UR course match selected.</p>${noMatchReason ? `<p class="report-no-match-reason">Reason: ${escapeHtml(noMatchReason)}</p>` : ''}`
      : urMatches.map(m => `
          <div class="report-match-block">
            <p class="report-match-code">${escapeHtml(m.course_code)} &mdash; ${escapeHtml(m.course_title)}</p>
            <table class="report-match-table">
              <tr><td>University</td><td>University of Richmond</td></tr>
              ${m.course_description ? `<tr><td>Description</td><td>${escapeHtml(m.course_description)}</td></tr>` : ''}
              <tr><td>Reason</td><td>${escapeHtml(m.reason)}</td></tr>
            </table>
          </div>
        `).join('');

    const section = document.createElement('div');
    section.className = 'report-course-block';
    section.innerHTML = `
      <div class="report-course-header">
        <h3 class="report-course-name">${escapeHtml(oc.outside_subject)} ${escapeHtml(oc.outside_code)} &mdash; ${escapeHtml(oc.outside_title)}</h3>
        <p class="report-course-meta">${escapeHtml(oc.outside_university)}${termYear ? ` &middot; ${escapeHtml(termYear)}` : ''}</p>
      </div>
      ${description ? `<p class="report-outside-desc">${escapeHtml(description)}</p>` : ''}
      <p class="report-matches-label">UR Equivalent(s)</p>
      ${matchesHtml}
    `;
    reportDocCourses.appendChild(section);
  });
}


// ─── Previous matches (backend-provided) ──────────────────────────────────────

function renderPreviousMatches(value) {
  previousMatchesValue.textContent = value !== null && value !== undefined ? String(value) : 'None';
  previousMatchesSection.hidden = false;
}


// ─── Right column: placeholder / loading / results ────────────────────────────

const DESC_SEARCH_MESSAGES = [
  'Searching for course description. This may take 30–45 seconds.',
  'Going through university catalog…',
  'Locating matching course names…',
  'Matching course codes…',
  'Collecting description…',
];

let descSearchInterval = null;
let currentDescMsgIndex = 0;

function startDescSearchRotation(startIndex = 0) {
  if (!searchStatusText) return;
  stopDescSearchRotation();
  currentDescMsgIndex = startIndex;
  searchStatusText.textContent = DESC_SEARCH_MESSAGES[currentDescMsgIndex];
  searchStatusText.style.display = 'flex';
  descSearchInterval = setInterval(() => {
    currentDescMsgIndex = (currentDescMsgIndex + 1) % DESC_SEARCH_MESSAGES.length;
    searchStatusText.textContent = DESC_SEARCH_MESSAGES[currentDescMsgIndex];
  }, 7000);
}

function stopDescSearchRotation() {
  if (descSearchInterval) {
    clearInterval(descSearchInterval);
    descSearchInterval = null;
    const tab = getActiveTab();
    if (tab) tab.descMsgIndex = currentDescMsgIndex;
  }
  if (searchStatusText) searchStatusText.style.display = 'none';
}

const STATUS_MESSAGES = [
  'Finding matching UR courses. This can take 90–120 seconds…',
  'Matching course titles…',
  'Comparing course descriptions…',
  'Assessing match between courses…',
  'Shortlisting potential equivalent courses…',
  'Ranking courses…',
  'Finalizing suggestions…',
];

let statusInterval = null;
let currentStatusMsgIndex = 0;

function showResultsLoading(startIndex = 0) {
  resultsPlaceholder.hidden = true;
  resultsList.hidden = true;
  saveMatchesBar.hidden = true;
  resultsStatus.hidden = false;

  stopStatusRotation();
  currentStatusMsgIndex = startIndex;
  resultsStatusText.textContent = STATUS_MESSAGES[currentStatusMsgIndex];
  statusInterval = setInterval(() => {
    currentStatusMsgIndex = (currentStatusMsgIndex + 1) % STATUS_MESSAGES.length;
    resultsStatusText.textContent = STATUS_MESSAGES[currentStatusMsgIndex];
  }, 12000);
}

function stopStatusRotation() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
    const tab = getActiveTab();
    if (tab) tab.statusMsgIndex = currentStatusMsgIndex;
  }
}

function resetResultsToPlaceholder() {
  stopStatusRotation();
  resultsStatus.hidden = true;
  resultsList.hidden = true;
  resultsList.innerHTML = '';
  resultsPlaceholder.hidden = false;
  resultsPlaceholder.querySelector('p').textContent =
    'Results will appear here once a course description has been approved.';
  previousMatchesSection.hidden = true;
  previousMatchesValue.textContent = '';
  saveMatchesBar.hidden = true;
  hideNoMatchReasonForm();
  hideAddOtherCourseForm();
}


// ─── Shared helpers ────────────────────────────────────────────────────────────

function showSettingsRequiredMessage() {
  resultsPlaceholder.hidden = false;
  resultsPlaceholder.querySelector('p').textContent =
    'Please check Settings to ensure all required information has been provided.';
}

function setButtonLoading(button, isLoading, label) {
  button.disabled = isLoading;
  button.textContent = label;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}


// ─── Initialise tab bar ────────────────────────────────────────────────────────

renderTabs();
