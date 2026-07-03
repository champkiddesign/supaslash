const BRAINDUMP_SESSION_ID = 'braindump';

const state = {
  sessionTasks: [],
  plannedSessions: [],
  expandedSessionIds: new Set(),
  activeAddSessionIds: new Set(),
  addFocusSessionId: null,
  lastAddSessionId: null,
  renamingSessionId: null,
  activeSessionName: null,
  currentIndex: 0,
  focusTaskIndex: 0,
  elapsedMs: 0,
  isRunning: false,
  mode: 'edit',
  timerInterval: null,
  sessionStartMs: null,
  totalSessionMs: 0,
  timerView: 'task',
  limitExpired: false,
  limitExpiredKind: null,
  taskOvertimeMode: false,
  selectedTasks: new Set(),
  lastSelected: null,
  timerBarSize: 'normal',
  timerBarSizeBeforeHide: 'normal',
  focusPosition: null,
  focusPositionCustomized: false,
  sessionHistory: [],
  activeSessionRunId: null,
  activeSessionStartedAt: null,
  listTemplates: [],
  fullscreenTaskPanelOpen: false,
  invoiceSettings: {
    name: '',
    logoDataUrl: '',
    businessName: '',
    email: '',
    address: '',
  },
};

const editView = document.getElementById('edit-view');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const settingsShortcutsBtn = document.getElementById('settings-shortcuts-btn');
const settingsSoundEffectsBtn = document.getElementById('settings-sound-effects-btn');
const settingsSoundEffectsStatus = document.getElementById('settings-sound-effects-status');
const settingsDataBtn = document.getElementById('settings-data-btn');
const settingsInvoiceBtn = document.getElementById('settings-invoice-btn');
const settingsHistoryBtn = document.getElementById('settings-history-btn');
const settingsTemplatesBtn = document.getElementById('settings-templates-btn');
const settingsTutorialBtn = document.getElementById('settings-tutorial-btn');
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialDots = document.getElementById('tutorial-dots');
const tutorialTooltip = document.getElementById('tutorial-tooltip');
const tutorialTooltipTitle = document.getElementById('tutorial-tooltip-title');
const tutorialTooltipBody = document.getElementById('tutorial-tooltip-body');
const tutorialDoneBtn = document.getElementById('tutorial-done-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
const dataModal = document.getElementById('data-modal');
const dataModalStatus = document.getElementById('data-modal-status');
const dataBackupNowBtn = document.getElementById('data-backup-now-btn');
const dataRestoreBtn = document.getElementById('data-restore-btn');
const dataOpenFolderBtn = document.getElementById('data-open-folder-btn');
const dataCloseBtn = document.getElementById('data-close-btn');
const invoiceSettingsModal = document.getElementById('invoice-settings-modal');
const invoiceSettingsAvatarBtn = document.getElementById('invoice-settings-avatar-btn');
const invoiceSettingsAvatarPreview = document.getElementById('invoice-settings-avatar-preview');
const invoiceSettingsAvatarPlaceholder = document.getElementById('invoice-settings-avatar-placeholder');
const invoiceSettingsAvatarInput = document.getElementById('invoice-settings-avatar-input');
const invoiceSettingsAvatarRemoveBtn = document.getElementById('invoice-settings-avatar-remove-btn');
const invoiceSettingsNameInput = document.getElementById('invoice-settings-name');
const invoiceSettingsBusinessNameInput = document.getElementById('invoice-settings-business-name');
const invoiceSettingsEmailInput = document.getElementById('invoice-settings-email');
const invoiceSettingsAddressInput = document.getElementById('invoice-settings-address');
const invoiceSettingsDoneBtn = document.getElementById('invoice-settings-done-btn');
const invoiceSettingsCancelBtn = document.getElementById('invoice-settings-cancel-btn');
let invoiceSettingsFormLogoDataUrl = '';
const focusView = document.getElementById('focus-view');
const doneView = document.getElementById('done-view');
const plannedSessionsList = document.getElementById('planned-sessions-list');
const planSessionBtn = document.getElementById('plan-session-btn');
const sessionList = document.getElementById('session-list');
const startBtn = document.getElementById('start-btn');
const clearSessionBtn = document.getElementById('clear-session-btn');
const moveBackToListBtn = document.getElementById('move-back-to-list-btn');
const clearSessionModal = document.getElementById('clear-session-modal');
const clearSessionAllBtn = document.getElementById('clear-session-all-btn');
const clearSessionCompletedBtn = document.getElementById('clear-session-completed-btn');
const clearSessionCancelBtn = document.getElementById('clear-session-cancel-btn');
const deleteSessionModal = document.getElementById('delete-session-modal');
const deleteSessionMessage = document.getElementById('delete-session-message');
const deleteSessionConfirmBtn = document.getElementById('delete-session-confirm-btn');
const deleteSessionCancelBtn = document.getElementById('delete-session-cancel-btn');
const deleteHistoryModal = document.getElementById('delete-history-modal');
const deleteHistoryMessage = document.getElementById('delete-history-message');
const deleteHistoryConfirmBtn = document.getElementById('delete-history-confirm-btn');
const deleteHistoryCancelBtn = document.getElementById('delete-history-cancel-btn');
const billableModal = document.getElementById('billable-modal');
const billableModalTitle = document.getElementById('billable-modal-title');
const billableToggleBtn = document.getElementById('billable-toggle-btn');
const billableToggleStatus = document.getElementById('billable-toggle-status');
const billableRateRow = document.getElementById('billable-rate-row');
const billableRateInput = document.getElementById('billable-rate-input');
const billableRoundRow = document.getElementById('billable-round-row');
const billableRoundOptions = document.getElementById('billable-round-options');
const billableRoundScopeRow = document.getElementById('billable-round-scope-row');
const billableRoundScopeOptions = document.getElementById('billable-round-scope-options');
const billableDoneBtn = document.getElementById('billable-done-btn');
const billableCancelBtn = document.getElementById('billable-cancel-btn');
const backToEditBtn = document.getElementById('back-to-edit-btn');
const timerSizeBtn = document.getElementById('timer-size-btn');
const timerHideBtn = document.getElementById('timer-hide-btn');
const pauseBtn = document.getElementById('pause-btn');
const timerDisplay = document.getElementById('timer-display');
const timerModeLabel = document.getElementById('timer-mode-label');
const focusStack = document.getElementById('focus-stack');
const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerList = document.getElementById('session-drawer-list');
const timerBar = document.getElementById('timer-bar');
const timerTaskZone = document.getElementById('timer-task-zone');
const currentTaskEl = document.getElementById('current-task');
const completeBtn = document.getElementById('complete-btn');
const skipBtn = document.getElementById('skip-btn');
const expiredActions = document.getElementById('expired-actions');
const overtimeBtn = document.getElementById('overtime-btn');
const extendBtn = document.getElementById('extend-btn');
const extendPanel = document.getElementById('extend-panel');
const extendInput = document.getElementById('extend-input');
const extendConfirmBtn = document.getElementById('extend-confirm-btn');
const extendCancelBtn = document.getElementById('extend-cancel-btn');
const doneHeadline = document.getElementById('done-headline');
const doneSummary = document.getElementById('done-summary');
const doneTime = document.getElementById('done-time');
const celebrateBtn = document.getElementById('celebrate-btn');
const resetBtn = document.getElementById('reset-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const historyCloseBtn = document.getElementById('history-close-btn');
const historyTabSessionsBtn = document.getElementById('history-tab-sessions-btn');
const historyTabReportBtn = document.getElementById('history-tab-report-btn');
const historySessionsPanel = document.getElementById('history-sessions-panel');
const historyReportPanel = document.getElementById('history-report-panel');
const historyDateToolbar = document.getElementById('history-date-toolbar');
const historyReportStartInput = document.getElementById('history-report-start');
const historyReportEndInput = document.getElementById('history-report-end');
const historyReportSessionSelectWrap = document.getElementById('history-report-session-select-wrap');
const historyReportSessionTrigger = document.getElementById('history-report-session-trigger');
const historyReportSessionValue = document.getElementById('history-report-session-value');
const historyReportSessionMenu = document.getElementById('history-report-session-menu');
const historyReportSummary = document.getElementById('history-report-summary');
const historyReportDailyChart = document.getElementById('history-report-daily-chart');
const historyReportSessionChart = document.getElementById('history-report-session-chart');
const historyReportTableBody = document.getElementById('history-report-table-body');
const historyReportTableFoot = document.getElementById('history-report-table-foot');
const historyExportPdfBtn = document.getElementById('history-export-pdf-btn');
const historyExportInvoiceBtn = document.getElementById('history-export-invoice-btn');
const taskContextMenu = document.getElementById('task-context-menu');
const taskContextDuplicateBtn = document.getElementById('task-context-duplicate');
const taskContextDeleteBtn = document.getElementById('task-context-delete');
const fullscreenTaskToggleBtn = document.getElementById('fullscreen-task-toggle');
const sessionContextMenu = document.getElementById('session-context-menu');
const sessionContextSaveTemplateBtn = document.getElementById('session-context-save-template');
const templateAutocomplete = document.getElementById('template-autocomplete');
const saveTemplateModal = document.getElementById('save-template-modal');
const saveTemplateMessage = document.getElementById('save-template-message');
const saveTemplateNameInput = document.getElementById('save-template-name-input');
const saveTemplateError = document.getElementById('save-template-error');
const saveTemplateConfirmBtn = document.getElementById('save-template-confirm-btn');
const saveTemplateCancelBtn = document.getElementById('save-template-cancel-btn');
const templatesModal = document.getElementById('templates-modal');
const templatesModalBody = document.getElementById('templates-modal-body');
const templatesCloseBtn = document.getElementById('templates-close-btn');

let taskContextMenuTarget = null;
let sessionContextMenuTarget = null;
let pendingDeleteSessionId = null;
let pendingDeleteHistoryEntryId = null;
let pendingBillableSessionId = null;
let billableSnapshot = null;
let pendingSaveTemplate = null;
let templateAutocompleteState = null;
let templateEditorState = null;
let focusDimensionsRaf = null;
let drawerOpen = false;
let drawerCloseTimer = null;
let sessionExpandTimer = null;
let timerBarHideTimeout = null;
let focusBarWidthCache = null;
let lastEarningsSplitDisplayText = '';
let isInitializing = true;
let expandedHistoryEntryIds = new Set();
let historyHighlightRunId = null;
let historyModalTab = 'sessions';
let historyReportSessionFilter = '';
let historyReportSessionMenuOpen = false;

const SESSION_HISTORY_MAX = 200;

const FOCUS_BAR_BASE_HEIGHT = 56;
const FOCUS_BAR_BASE_MIN_WIDTH = 300;
const FOCUS_BAR_BASE_MAX_WIDTH = 450;
const FOCUS_BAR_SCALE_SMALL = 0.75;
const TIMER_BAR_HIDE_DURATION_MS = 5 * 60 * 1000;
const FOCUS_DRAWER_GAP = 6;
const DRAWER_CLOSE_DELAY_MS = 280;
const SESSION_EXPAND_DELAY_MS = 400;

const FUN_SESSION_NAMES = [
  'Research Flying Wombats',
  'Design a Tricycle',
  'Create a Language',
  'Invent Underwater Wi-Fi',
  'Train Secret Squirrels',
  'Build a Cloud Castle',
  'Study Moon Cheese',
  'Plan a Dragon Parade',
  'Draft Robot Poetry',
  'Organize Penguin Elections',
  'Develop Invisible Ink Recipes',
  'Map the Sock Dimension',
  'Negotiate with Houseplants',
  'Reverse Engineer Rainbows',
  'Assemble a Time Machine',
  'Catalog Mythical Traffic Laws',
  'Prototype a Hover Toaster',
  'Translate Whale Songs',
  'Choreograph Cloud Formations',
  'Invent Silent Fireworks',
  'Research Left-Handed Scissors',
  'Design Intergalactic Postcards',
  'Create a Spaghetti Algorithm',
  'Build a Haunted Spreadsheet',
  'Study Ancient Meme Archaeology',
  'Plan a Submarine Picnic',
  'Draft Laws for Fictional Towns',
  'Organize a Library of Smells',
  'Develop Self-Folding Laundry',
  'Map Emotion Color Codes',
  'Negotiate Nap Time Policies',
  'Reverse Engineer Dreams',
  'Assemble a Peanut Butter Engine',
  'Catalog Impossible Inventions',
  'Prototype Emotion-Powered Cars',
  'Translate Cat Disapproval',
  'Choreograph Ant Parades',
  'Invent Gravity-Optional Shoes',
  'Research Why Tuesdays Feel Long',
  'Design Furniture for Ghosts',
  'Create a Diplomatic Fruit Treaty',
  'Build a Museum of Lost Keys',
  'Study the Physics of Hugs',
  'Plan a Zero-Gravity Bake Sale',
  'Draft a Manifesto for Pigeons',
  'Organize a Tournament of Yawns',
  'Develop Edible Music Notes',
  'Map the Underground Tea Network',
  'Negotiate with Door Handles',
  'Reverse Engineer Laughter',
  'Assemble a Perpetual Snack Machine',
  'Catalog Rare Cloud Species',
  'Prototype a Mood-Reactive Hat',
  'Translate Dolphin Sarcasm',
  'Choreograph Falling Leaves',
  'Invent a Portable Sunrise',
  'Research Competitive Napping',
  'Design a Submarine Skyscraper',
  'Create Alphabet Soup Fonts',
  'Build a Secret Treehouse Embassy',
  'Study the History of Bubbles',
  'Plan a Mars Grocery Run',
  'Draft Rules for Polite Robots',
  'Organize a Socks Reunion',
  'Develop Self-Watering Books',
  'Map the Kingdom of Lost Buttons',
  'Negotiate with Alarm Clocks',
  'Reverse Engineer Déjà Vu',
  'Assemble a Sandwich Compass',
  'Catalog Imaginary Sports',
  'Prototype a Weather Machine',
  'Translate Owl Philosophy',
  'Choreograph Thunder Applause',
  'Invent Edible Bubble Wrap',
  'Research Invisible Paint',
  'Design a Roller Coaster for Turtles',
  'Create a Code of Hammock Ethics',
  'Build a Lighthouse on Mars',
  'Study the Aerodynamics of Paper Planes',
  'Plan a Festival of Unused Ideas',
  'Draft a Treaty with Robots',
  'Organize a Parade of Hats',
  'Develop Glow-in-the-Dark Soup',
  'Map Uncharted Fridge Territories',
  'Negotiate Lunch Break Extensions',
  'Reverse Engineer Magic Tricks',
  'Assemble a Robot Orchestra',
  'Catalog Forgotten Superpowers',
  'Prototype a Thinking Cap 2.0',
  'Translate Snowflake Opinions',
  'Choreograph Synchronized Blinking',
  'Invent Portable Night Mode for the Sun',
  'Research Competitive Whistling',
  'Design a Staircase to Nowhere',
  'Create a Museum of Almost Ideas',
  'Build a Submarine Bicycle',
  'Study the Lifecycle of Excuses',
  'Plan a Zero-Spam Email Utopia',
  'Draft a Constitution for Chairs',
  'Organize a Convention of Shadows',
];

const DONE_HEADLINES = [
  'You rock!',
  'Slayed it!',
  'Nailed it!',
  'Crushed it!',
  'Look at you go!',
  'Mission complete!',
  'Absolute legend!',
  "Chef's kiss!",
  'On fire today!',
  'Mic drop!',
  'Peak performance!',
  'No notes!',
  "That's a wrap!",
  'Unstoppable!',
  'Main character energy!',
  'Zero left behind!',
  'Fully slashed!',
  'All gas, no brakes!',
  'You showed up!',
  'Gold star energy!',
  'Done and dusted!',
  "That's the move!",
  'Beast mode!',
  'Big win energy!',
  'Consider it handled!',
  'Hat tip to you!',
];

let doneHeadlineIndex = Math.floor(Math.random() * DONE_HEADLINES.length);

function getNextDoneHeadline() {
  const headline = DONE_HEADLINES[doneHeadlineIndex];
  doneHeadlineIndex = (doneHeadlineIndex + 1) % DONE_HEADLINES.length;
  return headline;
}

function getRandomFunSessionName() {
  return FUN_SESSION_NAMES[Math.floor(Math.random() * FUN_SESSION_NAMES.length)];
}
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8;

function getTimerBarScale() {
  return state.timerBarSize === 'small' ? FOCUS_BAR_SCALE_SMALL : 1;
}

function isTimerBarFullscreen() {
  return state.timerBarSize === 'fullscreen';
}

function normalizeTimerBarSize(size) {
  if (size === 'small' || size === 'fullscreen') return size;
  return 'normal';
}

function getScaledFocusBarHeight() {
  return Math.round(FOCUS_BAR_BASE_HEIGHT * getTimerBarScale());
}

function getScaledFocusBarMinWidth() {
  return Math.round(FOCUS_BAR_BASE_MIN_WIDTH * getTimerBarScale());
}

function getScaledFocusBarMaxWidth() {
  return Math.round(FOCUS_BAR_BASE_MAX_WIDTH * getTimerBarScale());
}

function applyTimerBarSizeClass() {
  const inFocus = state.mode === 'focus';
  document.body.classList.toggle('timer-bar-size-small', inFocus && state.timerBarSize === 'small');
  document.body.classList.toggle('timer-bar-size-fullscreen', inFocus && state.timerBarSize === 'fullscreen');
}

function getFocusWindowModeOptions() {
  if (isTimerBarFullscreen()) {
    return { fullscreen: true };
  }
  return {
    height: getScaledFocusBarHeight(),
    focusPosition: state.focusPosition,
    focusPositionCustomized: state.focusPositionCustomized,
  };
}

function getFocusDimensionsPayload(barWidth) {
  if (isTimerBarFullscreen()) {
    return {
      fullscreen: true,
      preservePosition: false,
      focusPositionCustomized: false,
    };
  }
  return {
    width: barWidth,
    height: getScaledFocusBarHeight(),
    x: state.focusPosition?.x,
    y: state.focusPosition?.y,
    preservePosition: state.focusPositionCustomized,
    focusPositionCustomized: state.focusPositionCustomized,
  };
}

function clearTimerBarHideTimeout() {
  if (timerBarHideTimeout) {
    clearTimeout(timerBarHideTimeout);
    timerBarHideTimeout = null;
  }
}

function invalidateFocusBarWidthCache() {
  focusBarWidthCache = null;
}

function isTimerBarExpandedLayout() {
  return state.limitExpired;
}

function isTimerBarWideLayout() {
  return isTimerBarExpandedLayout()
    || (state.mode === 'focus'
      && state.timerView === 'earnings'
      && shouldShowEarningsRoundingDisplay());
}

function clampBarWidth(width, scale = getTimerBarScale()) {
  const minWidth = Math.round(FOCUS_BAR_BASE_MIN_WIDTH * scale);
  if (isTimerBarWideLayout()) {
    return Math.max(minWidth, width);
  }
  const maxWidth = Math.round(FOCUS_BAR_BASE_MAX_WIDTH * scale);
  return Math.max(minWidth, Math.min(maxWidth, width));
}

function updateTimerBarExpandedLayout() {
  const expanded = isTimerBarExpandedLayout();
  timerBar.classList.toggle('timer-bar--expanded', expanded);
  if (focusStack) focusStack.classList.toggle('focus-stack--expanded', expanded);
}

function measureTimerBarWidthFromDom() {
  applyTimerBarSizeClass();
  const clone = timerBar.cloneNode(true);
  clone.removeAttribute('id');
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.width = 'max-content';
  clone.style.maxWidth = 'none';
  document.body.appendChild(clone);

  const width = Math.ceil(clone.getBoundingClientRect().width);
  document.body.removeChild(clone);
  return width;
}

function updateTimerBarControlLabels() {
  if (timerSizeBtn) {
    timerSizeBtn.classList.remove('timer-size-btn--next-fullscreen');
    if (state.timerBarSize === 'small') {
      timerSizeBtn.title = 'Fullscreen timer';
      timerSizeBtn.setAttribute('aria-label', 'Enter fullscreen timer mode');
      timerSizeBtn.classList.add('timer-size-btn--next-fullscreen');
    } else if (state.timerBarSize === 'fullscreen') {
      timerSizeBtn.title = 'Normal timer bar';
      timerSizeBtn.setAttribute('aria-label', 'Return to normal timer bar size');
    } else {
      timerSizeBtn.title = 'Smaller timer bar';
      timerSizeBtn.setAttribute('aria-label', 'Make timer bar smaller');
    }
  }
  if (timerHideBtn) {
    timerHideBtn.title = 'Hide timer bar for 5 minutes';
    timerHideBtn.setAttribute('aria-label', 'Hide timer bar for 5 minutes');
  }
}

function measureTimerBarWidth() {
  const scale = getTimerBarScale();
  if (focusBarWidthCache != null) {
    return clampBarWidth(Math.round(focusBarWidthCache * scale), scale);
  }

  const width = measureTimerBarWidthFromDom();
  focusBarWidthCache = width / scale;
  return clampBarWidth(width, scale);
}

function notifyFocusWindowLayoutChanged() {
  window.dispatchEvent(new Event('resize'));
}

function applyFocusWindowSizeImmediate() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  const payload = isTimerBarFullscreen()
    ? getFocusDimensionsPayload()
    : getFocusDimensionsPayload(measureTimerBarWidth());
  void window.slashIt.setFocusDimensions(payload).then(() => {
    if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
    notifyFocusWindowLayoutChanged();
    if (drawerOpen && !isTimerBarFullscreen()) void window.slashIt.showSessionDrawer(getDrawerPayload());
  });
}

async function applyFocusWindowSize() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  const payload = isTimerBarFullscreen()
    ? getFocusDimensionsPayload()
    : getFocusDimensionsPayload(measureTimerBarWidth());
  await window.slashIt.setFocusDimensions(payload);
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  notifyFocusWindowLayoutChanged();
  if (drawerOpen && !isTimerBarFullscreen()) await window.slashIt.showSessionDrawer(getDrawerPayload());
}

function restoreTimerBarFromHide() {
  if (state.timerBarSize !== 'hidden') return;
  clearTimerBarHideTimeout();
  state.timerBarSize = state.timerBarSizeBeforeHide || 'normal';
  applyTimerBarSizeClass();
  updateTimerBarControlLabels();
  window.slashIt.showFocusWindow();
  applyFocusWindowSizeImmediate();
  persist();
}

function hideTimerBar() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  state.timerBarSizeBeforeHide = normalizeTimerBarSize(state.timerBarSize);
  state.timerBarSize = 'hidden';
  closeSessionDrawer({ immediate: true });
  window.slashIt.hideFocusWindow();
  clearTimerBarHideTimeout();
  timerBarHideTimeout = setTimeout(restoreTimerBarFromHide, TIMER_BAR_HIDE_DURATION_MS);
  persist();
}

function toggleTimerBarSize() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  if (state.timerBarSize === 'normal') {
    state.timerBarSize = 'small';
  } else if (state.timerBarSize === 'small') {
    state.timerBarSize = 'fullscreen';
    closeSessionDrawer({ immediate: true });
    state.fullscreenTaskPanelOpen = false;
  } else {
    state.timerBarSize = 'normal';
    state.fullscreenTaskPanelOpen = false;
  }
  invalidateFocusBarWidthCache();
  applyTimerBarSizeClass();
  updateTimerBarControlLabels();
  applyFocusWindowSizeImmediate();
  updateFullscreenTaskPanel();
  persist();
}

const FOCUS_SHELL_HEIGHT = FOCUS_BAR_BASE_HEIGHT + FOCUS_DRAWER_SLOT;

function scheduleFocusDimensionsUpdate() {
  if (state.mode !== 'focus') return;
  if (focusDimensionsRaf) cancelAnimationFrame(focusDimensionsRaf);
  focusDimensionsRaf = requestAnimationFrame(() => {
    focusDimensionsRaf = null;
    if (state.mode !== 'focus') return;
    applyFocusWindowSize();
  });
}

function cancelFocusDimensionsUpdate() {
  if (focusDimensionsRaf) {
    cancelAnimationFrame(focusDimensionsRaf);
    focusDimensionsRaf = null;
  }
}

function getDrawerPayload() {
  const focusIndex = getFocusTaskIndex();
  const barWidth = measureTimerBarWidth();
  const drawerWidth = Math.round(barWidth * 0.85);
  const drawerHeight = getDrawerContentHeight();

  const tasks = state.sessionTasks.map((task, index) => {
    let status = getDrawerTaskStatus(task, index, focusIndex);
    let durationText = '';

    if (task.completed) {
      if (task.durationMs != null) durationText = formatTime(task.durationMs);
    } else if (index === focusIndex) {
      durationText = formatTime(getTaskDisplayMs(task));
    } else if (task.elapsedMs) {
      durationText = formatTime(getTaskDisplayMsForElapsed(task, task.elapsedMs, task.taskOvertimeMode));
    }

    return { text: task.text, status, durationText, index };
  });

  return { drawerWidth, drawerHeight, sessionTitle: state.activeSessionName || 'Braindump', sessionDurationText: formatTime(getSessionDisplayMs()), tasks };
}

function getDrawerContentHeight() {
  const focusIndex = getFocusTaskIndex();

  const tempTitle = document.createElement('div');
  tempTitle.className = 'session-drawer-title-row';
  tempTitle.style.position = 'absolute';
  tempTitle.style.visibility = 'hidden';
  tempTitle.style.left = '-10000px';
  tempTitle.style.width = '240px';
  tempTitle.style.display = 'flex';
  tempTitle.style.alignItems = 'center';
  tempTitle.style.gap = '8px';
  tempTitle.innerHTML = `
    <span class="session-drawer-title-name">${escapeHtml(state.activeSessionName || 'Braindump')}</span>
    <span class="session-drawer-title-time">${formatTime(getSessionDisplayMs())}</span>
  `;
  document.body.appendChild(tempTitle);
  const titleHeight = tempTitle.offsetHeight + 8;
  document.body.removeChild(tempTitle);

  const tempList = document.createElement('ul');
  tempList.className = 'session-drawer-list';
  tempList.style.position = 'absolute';
  tempList.style.visibility = 'hidden';
  tempList.style.left = '-10000px';
  state.sessionTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'session-drawer-task';
    li.textContent = task.text;
    tempList.appendChild(li);
    if (index === focusIndex) li.textContent += ' 0:00';
  });
  document.body.appendChild(tempList);
  const listHeight = tempList.scrollHeight;
  document.body.removeChild(tempList);
  return Math.min(180, listHeight) + titleHeight + 16;
}

function getDrawerTaskStatus(task, index, focusIndex) {
  if (task.completed) return 'done';
  if (index === focusIndex) return 'current';
  if (task.skipped) return 'skipped';
  return 'pending';
}

function renderSessionDrawer() {
  const focusIndex = getFocusTaskIndex();

  sessionDrawerList.innerHTML = '';
  state.sessionTasks.forEach((task, index) => {
    const status = getDrawerTaskStatus(task, index, focusIndex);
    const statusClass = `session-drawer-task--${status}`;
    let durationText = '';

    if (task.completed) {
      if (task.durationMs != null) durationText = formatTime(task.durationMs);
    } else if (index === focusIndex) {
      durationText = formatTime(getTaskDisplayMs(task));
    } else if (task.elapsedMs) {
      durationText = formatTime(getTaskDisplayMsForElapsed(task, task.elapsedMs, task.taskOvertimeMode));
    }

    const li = document.createElement('li');
    li.className = `session-drawer-task ${statusClass}`;
    li.dataset.taskIndex = String(index);
    if (!task.completed) {
      li.classList.add('session-drawer-task--clickable');
    }
    li.innerHTML = `
      <span class="session-drawer-task-name">${escapeHtml(task.text)}</span>
      <span class="session-drawer-task-time">${durationText}</span>
    `;
    sessionDrawerList.appendChild(li);
  });
}

if (sessionDrawerList) {
  sessionDrawerList.addEventListener('click', (e) => {
    const li = e.target.closest('.session-drawer-task--clickable');
    if (!li) return;
    const index = parseInt(li.dataset.taskIndex, 10);
    if (Number.isInteger(index)) {
      playClickSound();
      switchToTask(index);
    }
  });
}

function closeFullscreenTaskPanel() {
  state.fullscreenTaskPanelOpen = false;
  updateFullscreenTaskPanel();
}

function toggleFullscreenTaskPanel() {
  if (!isTimerBarFullscreen() || state.mode !== 'focus') return;
  state.fullscreenTaskPanelOpen = !state.fullscreenTaskPanelOpen;
  updateFullscreenTaskPanel();
}

function updateFullscreenTaskPanel() {
  if (!fullscreenTaskToggleBtn || !sessionDrawer) return;

  const inFullscreen = isTimerBarFullscreen() && state.mode === 'focus';
  fullscreenTaskToggleBtn.classList.toggle('hidden', !inFullscreen);

  if (!inFullscreen) {
    state.fullscreenTaskPanelOpen = false;
    sessionDrawer.classList.add('hidden');
    sessionDrawer.setAttribute('aria-hidden', 'true');
    fullscreenTaskToggleBtn.setAttribute('aria-expanded', 'false');
    fullscreenTaskToggleBtn.classList.remove('fullscreen-task-chevron--open');
    return;
  }

  renderSessionDrawer();

  const isOpen = state.fullscreenTaskPanelOpen;
  sessionDrawer.classList.toggle('hidden', !isOpen);
  sessionDrawer.setAttribute('aria-hidden', String(!isOpen));
  fullscreenTaskToggleBtn.setAttribute('aria-expanded', String(isOpen));
  fullscreenTaskToggleBtn.classList.toggle('fullscreen-task-chevron--open', isOpen);
  fullscreenTaskToggleBtn.setAttribute('aria-label', isOpen ? 'Hide session tasks' : 'Show session tasks');
}

async function openSessionDrawer() {
  if (drawerOpen || state.mode !== 'focus' || isTimerBarFullscreen()) return;
  clearTimeout(drawerCloseTimer);
  drawerOpen = true;
  const payload = getDrawerPayload();
  await window.slashIt.showSessionDrawer(payload);
}

function closeSessionDrawer({ immediate = false } = {}) {
  if (!drawerOpen) return;

  clearTimeout(drawerCloseTimer);
  drawerOpen = false;
  void window.slashIt.hideSessionDrawer(immediate);
}

function scheduleCloseSessionDrawer() {
  clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    closeSessionDrawer();
  }, DRAWER_CLOSE_DELAY_MS);
}

function isLeavingTaskZoneUpward(e) {
  const rect = timerTaskZone.getBoundingClientRect();
  return e.clientY <= rect.top;
}

function handleFocusStackMouseEnter() {
  clearTimeout(drawerCloseTimer);
  openSessionDrawer();
}

function blurTimerZoneMouseFocus(container) {
  const active = document.activeElement;
  if (!active || !container.contains(active) || active.matches(':focus-visible')) return;
  active.blur();
}

function handleFocusHoverMouseLeave(e) {
  if (isLeavingTaskZoneUpward(e)) return;
  scheduleCloseSessionDrawer();
  blurTimerZoneMouseFocus(timerTaskZone);
}

function handleTimerBarMouseLeave(e) {
  if (e.relatedTarget && timerBar.contains(e.relatedTarget)) return;
  blurTimerZoneMouseFocus(timerTaskZone);
}

function handleFocusViewMouseLeave(e) {
  if (isLeavingTaskZoneUpward(e)) return;
  scheduleCloseSessionDrawer();
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount) {
  return currencyFormatter.format(amount || 0);
}

const reportDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const reportDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatReportDate(timestamp) {
  if (!timestamp) return '—';
  return reportDateFormatter.format(new Date(timestamp));
}

function formatReportDay(timestamp) {
  if (!timestamp) return '—';
  return reportDayFormatter.format(new Date(timestamp));
}

function formatDateInputValue(ms) {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInputToStartMs(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

function parseDateInputToEndMs(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHourlyRate(rate) {
  if (rate == null) return '—';
  return `${formatCurrency(rate)}/hr`;
}

function limitUnitToMs(value, unit) {
  const u = unit.toLowerCase();
  if (u.startsWith('h')) return Math.round(value * 3600000);
  if (u.startsWith('s')) return Math.round(value * 1000);
  if (u.startsWith('m')) return Math.round(value * 60000);
  return null;
}

function formatLimitField(limitMs) {
  if (!limitMs) return '';
  if (limitMs >= 3600000) return `${limitMs / 3600000}h`;
  if (limitMs >= 60000) return `${Math.round(limitMs / 60000)}m`;
  return `${Math.round(limitMs / 1000)}s`;
}

function parseManualLimit(str) {
  if (!str || !str.trim()) return null;
  const match = str.trim().match(/^(\d+(?:\.\d+)?)\s*(h|hrs?|hours?|m|mins?|minutes?|s|secs?|seconds?)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'm';
  return limitUnitToMs(value, unit);
}

function parseClockTime(str) {
  const trimmed = str.trim().replace(/\.$/, '');
  const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?\s*m\.?)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toLowerCase().replace(/\./g, '').replace(/\s/g, '');
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (period.startsWith('p') && hour !== 12) hour += 12;
    if (period.startsWith('a') && hour === 12) hour = 0;
    return { hour, minute };
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  return null;
}

function msUntilClockTime(hour, minute, now = new Date()) {
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setMilliseconds(0);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

const CLOCK_TIME_PATTERN = '(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|a\\.?\\s*m\\.?)?|\\d{1,2}:\\d{2})';

function parseClockDeadlineMatch(text) {
  const trimmed = text.trim();
  const keywordMatch = trimmed.match(
    new RegExp(`^(.+?)\\s+(?:to|until|till|by)\\s+(${CLOCK_TIME_PATTERN})\\.?$`, 'i'),
  );
  if (keywordMatch) {
    return { cleanText: keywordMatch[1].trim(), timeStr: keywordMatch[2] };
  }

  const suffixMatch = trimmed.match(
    new RegExp(`^(.+?)\\s+(${CLOCK_TIME_PATTERN})\\.?$`, 'i'),
  );
  if (suffixMatch) {
    return { cleanText: suffixMatch[1].trim(), timeStr: suffixMatch[2] };
  }

  const onlyTimeMatch = trimmed.match(
    new RegExp(`^(${CLOCK_TIME_PATTERN})\\.?$`, 'i'),
  );
  if (onlyTimeMatch) {
    return { cleanText: onlyTimeMatch[1].trim(), timeStr: onlyTimeMatch[1] };
  }

  return null;
}

function parseClockDeadlineFromTitle(text) {
  const parsed = parseClockDeadlineMatch(text);
  if (!parsed) return null;

  const clock = parseClockTime(parsed.timeStr);
  if (!clock) return null;

  const limitMs = msUntilClockTime(clock.hour, clock.minute);
  if (!limitMs) return null;

  return { text: parsed.cleanText, limitMs };
}

function parseDurationFromTitle(text) {
  const clockParsed = parseClockDeadlineFromTitle(text);
  if (clockParsed) return clockParsed;

  const patterns = [
    /^(.+?)\s+for\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\.?$/i,
    /^(.+?)\s+for\s+(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)\.?$/i,
    /^(.+?)\s+for\s+(\d+(?:\.\d+)?)\s*(seconds?|secs?|s)\.?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const cleanText = match[1].trim();
    const value = parseFloat(match[2]);
    const unit = match[3].toLowerCase();
    const limitMs = limitUnitToMs(value, unit);
    if (limitMs === null) continue;
    return { text: cleanText, limitMs };
  }
  return null;
}

function parseTaskInput(text, manualLimit) {
  const manualMs = parseManualLimit(manualLimit);
  let cleanText = text.trim();
  let limitMs = manualMs;

  if (!limitMs) {
    const parsed = parseDurationFromTitle(cleanText);
    if (parsed) {
      cleanText = parsed.text;
      limitMs = parsed.limitMs;
    }
  }

  return { text: cleanText, completed: false, limitMs: limitMs || null };
}

function normalizeSessionTask(task) {
  const normalized = {
    text: task.text || '',
    completed: !!task.completed,
    limitMs: task.limitMs ?? null,
    durationMs: task.durationMs ?? null,
    elapsedMs: task.elapsedMs ?? 0,
    taskOvertimeMode: !!task.taskOvertimeMode,
    skipped: !!task.skipped,
  };
  if (task.sourceSessionId) {
    normalized.sourceSessionId = task.sourceSessionId;
    normalized.sourceSessionName = task.sourceSessionName || 'Session';
  }
  if (task.billableDurationMs != null) {
    normalized.billableDurationMs = task.billableDurationMs;
  }
  return normalized;
}

function normalizeBraindumpTask(task) {
  return { text: task.text || '', limitMs: task.limitMs ?? null };
}

function parseHourlyRate(value) {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatHourlyRateField(rate) {
  if (rate == null || !Number.isFinite(rate)) return '';
  return String(rate);
}

const BILLABLE_ROUND_OPTIONS = [10, 15, 20, 30];

function normalizeBillableRoundMinutes(value) {
  if (value == null || value === '' || value === 0) return null;
  const parsed = Number(value);
  return BILLABLE_ROUND_OPTIONS.includes(parsed) ? parsed : null;
}

function normalizeBillableRoundScope(value) {
  return value === 'task' ? 'task' : 'session';
}

function roundUpBillableMs(ms, roundMinutes) {
  if (!roundMinutes || ms <= 0) return ms;
  const intervalMs = roundMinutes * 60000;
  return Math.ceil(ms / intervalMs) * intervalMs;
}

function calculateBillableEarnings(durationMs, rate, roundMinutes) {
  if (!rate || durationMs == null || durationMs <= 0) return 0;
  const ms = roundUpBillableMs(durationMs, roundMinutes);
  return (ms / 3600000) * rate;
}

function calculateBillableEarningsFromMs(ms, rate) {
  if (!rate || ms == null || ms <= 0) return 0;
  return (ms / 3600000) * rate;
}

function getTaskBillableDurationMs(task, durationMs, roundMinutes, roundScope) {
  if (!durationMs || durationMs <= 0) return null;
  if (roundScope === 'task') {
    if (task.billableDurationMs != null) return task.billableDurationMs;
    if (roundMinutes) return roundUpBillableMs(durationMs, roundMinutes);
    return durationMs;
  }
  return roundUpBillableMs(durationMs, roundMinutes);
}

function normalizePlannedSession(session) {
  return {
    id: session.id || BRAINDUMP_SESSION_ID,
    name: session.name || 'Session',
    tasks: (session.tasks || []).map(normalizeBraindumpTask),
    hourlyRateEnabled: !!session.hourlyRateEnabled,
    hourlyRate: parseHourlyRate(session.hourlyRate),
    billableRoundMinutes: normalizeBillableRoundMinutes(session.billableRoundMinutes),
    billableRoundScope: normalizeBillableRoundScope(session.billableRoundScope),
  };
}

function normalizeListTemplate(template) {
  const now = Date.now();
  return {
    id: template.id || crypto.randomUUID(),
    name: template.name || 'List template',
    tasks: (template.tasks || []).map(normalizeBraindumpTask),
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || template.createdAt || now,
  };
}

function normalizeTemplateName(name) {
  return (name || '').trim();
}

function templateNamesMatch(a, b) {
  return normalizeTemplateName(a).toLowerCase() === normalizeTemplateName(b).toLowerCase();
}

function isListTemplateNameTaken(name, excludeId = null) {
  const normalized = normalizeTemplateName(name);
  if (!normalized) return false;
  return state.listTemplates.some(
    (template) => template.id !== excludeId && templateNamesMatch(template.name, normalized),
  );
}

function getSlashQuery(value) {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith('/')) return null;
  return trimmed.slice(1);
}

function isSlashInput(value) {
  return value.trimStart().startsWith('/');
}

function findTemplatesMatchingQuery(query) {
  const normalized = (query || '').trim().toLowerCase();
  const matches = [];

  state.listTemplates.forEach((template) => {
    if (!normalized || template.name.toLowerCase().includes(normalized)) {
      const count = template.tasks.length;
      matches.push({
        id: template.id,
        name: template.name,
        preview: count === 1 ? '1 task' : `${count} tasks`,
        template,
      });
    }
  });

  matches.sort((a, b) => a.name.localeCompare(b.name));
  return matches;
}

function findExactTemplateMatches(query) {
  const normalized = normalizeTemplateName(query);
  if (!normalized) return [];
  return findTemplatesMatchingQuery(normalized).filter(
    (match) => templateNamesMatch(match.name, normalized),
  );
}

function hideTemplateAutocomplete() {
  if (!templateAutocomplete) return;
  templateAutocomplete.classList.add('hidden');
  templateAutocomplete.innerHTML = '';
  templateAutocompleteState = null;
}

function renderTemplateAutocomplete() {
  if (!templateAutocomplete || !templateAutocompleteState) return;

  const { matches, highlightIndex } = templateAutocompleteState;
  if (matches.length === 0) {
    templateAutocomplete.innerHTML = '<div class="templates-empty">No matching templates</div>';
    templateAutocomplete.classList.remove('hidden');
    return;
  }

  templateAutocomplete.innerHTML = matches.map((match, index) => `
    <button
      type="button"
      class="template-autocomplete-item${index === highlightIndex ? ' template-autocomplete-item--highlight' : ''}"
      data-match-index="${index}"
      role="option"
      aria-selected="${index === highlightIndex}"
    >
      <span class="template-autocomplete-name">${escapeHtml(match.name)}</span>
      <span class="template-autocomplete-preview">${escapeHtml(match.preview)}</span>
    </button>
  `).join('');
  templateAutocomplete.classList.remove('hidden');
}

function positionTemplateAutocomplete(inputEl) {
  if (!templateAutocomplete || !inputEl) return;
  const rect = inputEl.getBoundingClientRect();
  const padding = 8;
  templateAutocomplete.style.left = `${Math.max(padding, rect.left)}px`;
  templateAutocomplete.style.top = `${rect.bottom + 4}px`;
  const menuRect = templateAutocomplete.getBoundingClientRect();
  if (rect.left + menuRect.width > window.innerWidth - padding) {
    templateAutocomplete.style.left = `${window.innerWidth - menuRect.width - padding}px`;
  }
}

function updateTemplateAutocomplete(inputEl, sessionId) {
  const query = getSlashQuery(inputEl.value);
  if (query === null) {
    hideTemplateAutocomplete();
    return;
  }

  const matches = findTemplatesMatchingQuery(query);
  templateAutocompleteState = {
    sessionId,
    inputEl,
    highlightIndex: matches.length > 0 ? 0 : -1,
    matches,
  };
  renderTemplateAutocomplete();
  positionTemplateAutocomplete(inputEl);
}

function moveTemplateAutocompleteHighlight(delta) {
  if (!templateAutocompleteState || templateAutocompleteState.matches.length === 0) return;
  const count = templateAutocompleteState.matches.length;
  let next = templateAutocompleteState.highlightIndex + delta;
  if (next < 0) next = count - 1;
  if (next >= count) next = 0;
  templateAutocompleteState.highlightIndex = next;
  renderTemplateAutocomplete();
}

function insertTaskIntoSession(sessionId, task) {
  const session = getPlannedSession(sessionId);
  if (!session) return;
  session.tasks.push({ text: task.text, limitMs: task.limitMs ?? null });
  state.addFocusSessionId = sessionId;
  state.lastAddSessionId = sessionId;
  state.activeAddSessionIds.add(sessionId);
  persist();
  renderEditView();
}

function insertTasksIntoSession(sessionId, tasks) {
  const session = getPlannedSession(sessionId);
  if (!session || tasks.length === 0) return;
  session.tasks.push(...tasks.map(normalizeBraindumpTask));
  state.addFocusSessionId = sessionId;
  state.lastAddSessionId = sessionId;
  state.activeAddSessionIds.add(sessionId);
  persist();
  renderEditView();
}

function insertTaskIntoQueue(sessionId, task) {
  const session = getPlannedSession(sessionId);
  if (!session) return;
  const sourceMeta = getSourceMetaFromSession(session);
  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    toSessionTaskFromBraindump({ text: task.text, limitMs: task.limitMs ?? null }, sourceMeta),
  );
  state.lastAddSessionId = sessionId;
  persist();
  renderEditView();
}

function insertTasksIntoQueue(sessionId, tasks) {
  const session = getPlannedSession(sessionId);
  if (!session || tasks.length === 0) return;
  const sourceMeta = getSourceMetaFromSession(session);
  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    ...tasks.map((task) => toSessionTaskFromBraindump(task, sourceMeta)),
  );
  state.lastAddSessionId = sessionId;
  persist();
  renderEditView();
}

function applyTemplateMatch(match, sessionId, { toQueue = false } = {}) {
  if (!match) return;
  applyListTemplate(match.template, sessionId, { toQueue });
}

function applyTemplateFromInput(inputEl, sessionId, { toQueue = false, match = null } = {}) {
  let selected = match;
  if (!selected && templateAutocompleteState?.inputEl === inputEl) {
    const { highlightIndex, matches } = templateAutocompleteState;
    if (highlightIndex >= 0 && matches[highlightIndex]) {
      selected = matches[highlightIndex];
    }
  }
  if (!selected) {
    const query = getSlashQuery(inputEl.value);
    const exactMatches = findExactTemplateMatches(query || '');
    if (exactMatches.length === 1) selected = exactMatches[0];
  }
  if (!selected) return false;

  applyTemplateMatch(selected, sessionId, { toQueue });
  inputEl.value = '';
  hideTemplateAutocomplete();
  requestAnimationFrame(() => inputEl.focus());
  return true;
}

function applyListTemplate(template, sessionId, { toQueue = false } = {}) {
  const tasks = template.tasks.map(normalizeBraindumpTask);
  if (toQueue) insertTasksIntoQueue(sessionId, tasks);
  else insertTasksIntoSession(sessionId, tasks);
}

function createListTemplate(name, tasks) {
  const now = Date.now();
  const template = normalizeListTemplate({
    id: crypto.randomUUID(),
    name: normalizeTemplateName(name),
    tasks: tasks.map(normalizeBraindumpTask),
    createdAt: now,
    updatedAt: now,
  });
  state.listTemplates.unshift(template);
  persist();
  return template;
}

function updateListTemplate(id, name, tasks) {
  const template = state.listTemplates.find((item) => item.id === id);
  if (!template) return false;
  template.name = normalizeTemplateName(name);
  template.tasks = tasks.map(normalizeBraindumpTask);
  template.updatedAt = Date.now();
  persist();
  return true;
}

function deleteListTemplate(id) {
  state.listTemplates = state.listTemplates.filter((item) => item.id !== id);
  persist();
}

function duplicateTask(listId, taskIndex) {
  const tasks = getTasksForList(listId);
  const task = tasks[taskIndex];
  if (!task) return;
  const copy = listId === 'session'
    ? normalizeSessionTask(task)
    : normalizeBraindumpTask(task);
  tasks.splice(taskIndex + 1, 0, copy);
  persist();
  renderEditView();
}

function openSaveTemplateModal(pending) {
  pendingSaveTemplate = pending;
  saveTemplateMessage.textContent = 'Save this session as a reusable list template.';
  saveTemplateNameInput.value = pending.defaultName || '';
  saveTemplateError.classList.add('hidden');
  saveTemplateError.textContent = '';
  saveTemplateModal.classList.remove('hidden');
  requestAnimationFrame(() => {
    saveTemplateNameInput.focus();
    saveTemplateNameInput.select();
  });
}

function closeSaveTemplateModal() {
  saveTemplateModal.classList.add('hidden');
  pendingSaveTemplate = null;
  saveTemplateNameInput.value = '';
  saveTemplateError.classList.add('hidden');
}

function confirmSaveTemplateModal() {
  if (!pendingSaveTemplate) return;
  const name = normalizeTemplateName(saveTemplateNameInput.value);
  if (!name) {
    saveTemplateError.textContent = 'Enter a template name.';
    saveTemplateError.classList.remove('hidden');
    return;
  }

  if (isListTemplateNameTaken(name)) {
    saveTemplateError.textContent = 'A list template with that name already exists.';
    saveTemplateError.classList.remove('hidden');
    return;
  }
  if (!pendingSaveTemplate.tasks || pendingSaveTemplate.tasks.length === 0) {
    saveTemplateError.textContent = 'Add at least one task before saving a list template.';
    saveTemplateError.classList.remove('hidden');
    return;
  }
  createListTemplate(name, pendingSaveTemplate.tasks);

  closeSaveTemplateModal();
  if (!templatesModal.classList.contains('hidden')) renderTemplatesModal();
}

function saveSessionAsTemplateFromContext(sessionId) {
  const session = getPlannedSession(sessionId);
  if (!session) return;
  openSaveTemplateModal({
    defaultName: session.name,
    tasks: session.tasks.map(normalizeBraindumpTask),
  });
}

function isPlannedList(listId) {
  return typeof listId === 'string' && listId.startsWith('planned:');
}

function isValidListId(listId) {
  return listId === 'session' || isPlannedList(listId);
}

function listIdForSession(sessionId) {
  return `planned:${sessionId}`;
}

function getPlannedSessionIdFromListId(listId) {
  return listId.slice('planned:'.length);
}

function getPlannedSession(sessionId) {
  return state.plannedSessions.find((session) => session.id === sessionId) || null;
}

function getPlannedSessionRateSettings(sessionId) {
  const session = getPlannedSession(sessionId || BRAINDUMP_SESSION_ID);
  if (!session) return { enabled: false, rate: null, roundMinutes: null, roundScope: 'session' };
  return {
    enabled: !!session.hourlyRateEnabled,
    rate: session.hourlyRate,
    roundMinutes: session.billableRoundMinutes,
    roundScope: normalizeBillableRoundScope(session.billableRoundScope),
  };
}

function getTaskEarningsMs(task, isCurrentTask) {
  if (task.completed) return task.durationMs || 0;
  if (isCurrentTask) return state.elapsedMs;
  if (!task.completed && task.elapsedMs > 0) return task.elapsedMs;
  return 0;
}

function getTaskEarnings(task, isCurrentTask) {
  const { enabled, rate, roundMinutes, roundScope } = getPlannedSessionRateSettings(task.sourceSessionId);
  if (!enabled || !rate) return 0;
  const ms = getTaskEarningsMs(task, isCurrentTask);
  if (!ms || ms <= 0) return 0;

  if (roundScope === 'task') {
    const billableMs = getTaskBillableDurationMs(task, ms, roundMinutes, roundScope);
    return calculateBillableEarningsFromMs(billableMs, rate);
  }

  return calculateBillableEarnings(ms, rate, roundMinutes);
}

function getPlannedSessionQueueEarnings(sessionId) {
  return state.sessionTasks.reduce((sum, task, index) => {
    const taskSessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    if (taskSessionId !== sessionId) return sum;
    const isCurrentTask = state.mode === 'focus' && index === state.focusTaskIndex;
    return sum + getTaskEarnings(task, isCurrentTask);
  }, 0);
}

function hasPlannedSessionQueueTasks(sessionId) {
  return state.sessionTasks.some(
    (task) => (task.sourceSessionId || BRAINDUMP_SESSION_ID) === sessionId,
  );
}

function getSessionEarnings() {
  saveCurrentTaskProgress();
  const currentIndex = state.focusTaskIndex;

  const groups = new Map();
  state.sessionTasks.forEach((task, index) => {
    const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    if (!groups.has(sessionId)) groups.set(sessionId, []);
    groups.get(sessionId).push({ task, index });
  });

  let total = 0;
  groups.forEach((items, sessionId) => {
    const { enabled, rate, roundMinutes, roundScope } = getPlannedSessionRateSettings(sessionId);
    if (!enabled || !rate) return;

    if (roundScope === 'task') {
      items.forEach(({ task, index }) => {
        total += getTaskEarnings(task, index === currentIndex);
      });
      return;
    }

    let totalMs = 0;
    items.forEach(({ task, index }) => {
      const ms = getTaskEarningsMs(task, index === currentIndex);
      if (ms > 0) totalMs += ms;
    });
    total += calculateBillableEarnings(totalMs, rate, roundMinutes);
  });
  return total;
}

function getRawTaskEarnings(task, isCurrentTask) {
  const { enabled, rate } = getPlannedSessionRateSettings(task.sourceSessionId);
  if (!enabled || !rate) return 0;
  const ms = getTaskEarningsMs(task, isCurrentTask);
  if (!ms || ms <= 0) return 0;
  return (ms / 3600000) * rate;
}

function getSessionEarningsLive() {
  saveCurrentTaskProgress();
  const currentIndex = state.focusTaskIndex;
  return state.sessionTasks.reduce(
    (sum, task, index) => sum + getRawTaskEarnings(task, index === currentIndex),
    0,
  );
}

function getQueueRoundingDisplaySettings() {
  const currentTask = getCurrentTask();
  if (currentTask) {
    const sessionId = currentTask.sourceSessionId || BRAINDUMP_SESSION_ID;
    const settings = getPlannedSessionRateSettings(sessionId);
    if (settings.enabled && settings.rate && settings.roundMinutes) {
      return settings;
    }
    if (state.mode === 'focus') {
      return null;
    }
  }

  for (const task of state.sessionTasks) {
    const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    const settings = getPlannedSessionRateSettings(sessionId);
    if (settings.enabled && settings.rate && settings.roundMinutes) {
      return settings;
    }
  }

  return null;
}

function getCurrentTaskRoundMinutes() {
  return getQueueRoundingDisplaySettings()?.roundMinutes ?? null;
}

function getCurrentTaskRoundScope() {
  return getQueueRoundingDisplaySettings()?.roundScope ?? 'session';
}

function shouldShowEarningsRoundingDisplay() {
  if (!canShowEarningsView()) return false;
  return !!getQueueRoundingDisplaySettings();
}

function formatBillableRoundLabel(roundMinutes) {
  return `${roundMinutes}M`;
}

function formatEarningsSplitDisplay(live, billed) {
  return `${formatCurrency(live)} / ${formatCurrency(billed)}`;
}

function renderEarningsSplitDisplay(live, billed) {
  timerDisplay.innerHTML = `
    <span class="timer-earnings-live">${escapeHtml(formatCurrency(live))}</span><span class="timer-earnings-sep"> / </span><span class="timer-earnings-billed-val">${escapeHtml(formatCurrency(billed))}</span>
  `;
}

function syncEarningsSplitBarWidth(displayText) {
  if (displayText === lastEarningsSplitDisplayText) return;
  lastEarningsSplitDisplayText = displayText;
  invalidateFocusBarWidthCache();
  scheduleFocusDimensionsUpdate();
}

function isTaskBillable(task) {
  if (!task) return false;
  const { enabled, rate } = getPlannedSessionRateSettings(task.sourceSessionId);
  return !!(enabled && rate > 0);
}

function isCurrentTaskBillable() {
  return isTaskBillable(getCurrentTask());
}

function canShowEarningsView() {
  return isCurrentTaskBillable();
}

function getBraindumpSession() {
  return getPlannedSession(BRAINDUMP_SESSION_ID);
}

function isSessionExpanded(sessionId) {
  return state.expandedSessionIds.has(sessionId);
}

function expandAllSessions() {
  state.expandedSessionIds = new Set(state.plannedSessions.map((session) => session.id));
}

function expandSession(sessionId) {
  if (!getPlannedSession(sessionId)) return;
  state.expandedSessionIds.add(sessionId);
  persist();
  renderEditView();
}

function collapseSession(sessionId) {
  if (!getPlannedSession(sessionId)) return;
  state.expandedSessionIds.delete(sessionId);
  persist();
  renderEditView();
}

function toggleSession(sessionId) {
  if (!getPlannedSession(sessionId)) return;
  if (state.expandedSessionIds.has(sessionId)) {
    state.expandedSessionIds.delete(sessionId);
  } else {
    state.expandedSessionIds.add(sessionId);
  }
  persist();
  renderEditView();
}

function getSourceListIdForTask(task) {
  const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
  return listIdForSession(sessionId);
}

function openSessionAddForm(sessionId) {
  state.activeAddSessionIds.add(sessionId);
  state.lastAddSessionId = sessionId;
}

function closeSessionAddForm(sessionId) {
  state.activeAddSessionIds.delete(sessionId);
}

function getFocusedAddSessionId() {
  const active = document.activeElement;
  const form = active?.closest('.session-add-task-form');
  if (form?.dataset.sessionId) return form.dataset.sessionId;
  return state.lastAddSessionId;
}

function getAllPlannedListIds() {
  return state.plannedSessions.map((session) => listIdForSession(session.id));
}

function ensureBraindumpSession() {
  if (!getBraindumpSession()) {
    state.plannedSessions.unshift({
      id: BRAINDUMP_SESSION_ID,
      name: 'Braindump',
      tasks: [],
    });
  }
}

function createPlannedSession() {
  const id = crypto.randomUUID();
  state.plannedSessions.push({
    id,
    name: getRandomFunSessionName(),
    tasks: [],
  });
  state.expandedSessionIds.add(id);
  state.renamingSessionId = id;
  persist();
  renderEditView();
}

function updateSourceSessionNameForSession(sessionId, name) {
  state.plannedSessions.forEach((session) => {
    session.tasks.forEach((task) => {
      if (task.sourceSessionId === sessionId) task.sourceSessionName = name;
    });
  });
  state.sessionTasks.forEach((task) => {
    if (task.sourceSessionId === sessionId) task.sourceSessionName = name;
  });
  state.sessionHistory.forEach((entry) => {
    if (getHistoryEntrySourceSessionId(entry) !== sessionId) return;
    entry.name = name;
    entry.tasks.forEach((task) => {
      if (task.sourceSessionId === sessionId) task.sourceSessionName = name;
    });
  });
  if (isSessionInProgress() && state.sessionTasks.some((task) => task.sourceSessionId === sessionId)) {
    state.activeSessionName = name;
  }
}

function savePlannedSessionName(sessionId, name) {
  const session = getPlannedSession(sessionId);
  if (!session || sessionId === BRAINDUMP_SESSION_ID) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  session.name = trimmed;
  updateSourceSessionNameForSession(sessionId, trimmed);
  state.renamingSessionId = null;
  persist();
  renderEditView();
  if (!historyModal.classList.contains('hidden')) {
    refreshHistoryModalPanels();
  }
}

function deletePlannedSession(sessionId) {
  if (sessionId === BRAINDUMP_SESSION_ID) return;

  const sessionIndex = state.plannedSessions.findIndex((session) => session.id === sessionId);
  if (sessionIndex === -1) return;

  const session = state.plannedSessions[sessionIndex];
  session.tasks.forEach((task) => state.selectedTasks.delete(task));

  state.plannedSessions.splice(sessionIndex, 1);

  state.expandedSessionIds.delete(sessionId);
  state.activeAddSessionIds.delete(sessionId);
  if (state.lastAddSessionId === sessionId) {
    state.lastAddSessionId = null;
  }
  if (state.renamingSessionId === sessionId) {
    state.renamingSessionId = null;
  }

  persist();
  renderEditView();
  closeDeleteSessionModal();
}

function openDeleteSessionModal(sessionId) {
  if (sessionId === BRAINDUMP_SESSION_ID) return;

  const session = getPlannedSession(sessionId);
  if (!session) return;

  pendingDeleteSessionId = sessionId;
  const taskCount = session.tasks.length;
  const taskLabel = taskCount === 1 ? 'task' : 'tasks';

  deleteSessionMessage.textContent = taskCount === 0
    ? `Delete ${session.name}? This cannot be undone.`
    : `Delete ${session.name} and its ${taskCount} ${taskLabel}? This cannot be undone.`;

  deleteSessionModal.classList.remove('hidden');
}

function closeDeleteSessionModal() {
  pendingDeleteSessionId = null;
  deleteSessionModal.classList.add('hidden');
}

function updateBillableModalUI(session) {
  const enabled = !!session.hourlyRateEnabled;
  billableToggleBtn.setAttribute('aria-checked', enabled ? 'true' : 'false');
  billableToggleStatus.textContent = enabled ? 'On' : 'Off';
  billableToggleStatus.classList.toggle('billable-toggle-status--on', enabled);
  billableRateRow.classList.toggle('hidden', !enabled);
  billableRoundRow.classList.toggle('hidden', !enabled);

  const roundMinutes = session.billableRoundMinutes;
  const showRoundScope = enabled && roundMinutes != null;
  billableRoundScopeRow.classList.toggle('hidden', !showRoundScope);
  billableRateInput.value = formatHourlyRateField(session.hourlyRate);

  billableRoundOptions.querySelectorAll('.billable-round-option').forEach((btn) => {
    const value = btn.dataset.roundMinutes;
    const isSelected = value === ''
      ? roundMinutes == null
      : Number(value) === roundMinutes;
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.classList.toggle('billable-round-option--selected', isSelected);
  });

  const roundScope = normalizeBillableRoundScope(session.billableRoundScope);
  billableRoundScopeOptions.querySelectorAll('.billable-round-scope-option').forEach((btn) => {
    const isSelected = btn.dataset.roundScope === roundScope;
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.classList.toggle('billable-round-scope-option--selected', isSelected);
  });
}

function openBillableModal(sessionId) {
  const session = getPlannedSession(sessionId);
  if (!session) return;

  pendingBillableSessionId = sessionId;
  billableSnapshot = {
    hourlyRateEnabled: session.hourlyRateEnabled,
    hourlyRate: session.hourlyRate,
    billableRoundMinutes: session.billableRoundMinutes,
    billableRoundScope: session.billableRoundScope,
  };

  billableModalTitle.textContent = `Billable · ${session.name}`;
  updateBillableModalUI(session);
  billableModal.classList.remove('hidden');

  if (session.hourlyRateEnabled) {
    requestAnimationFrame(() => {
      billableRateInput.focus();
      billableRateInput.select();
    });
  }
}

function closeBillableModal(revert = false) {
  if (revert && pendingBillableSessionId && billableSnapshot) {
    const session = getPlannedSession(pendingBillableSessionId);
    if (session) {
      session.hourlyRateEnabled = billableSnapshot.hourlyRateEnabled;
      session.hourlyRate = billableSnapshot.hourlyRate;
      session.billableRoundMinutes = billableSnapshot.billableRoundMinutes;
      session.billableRoundScope = billableSnapshot.billableRoundScope;
    }
  }

  pendingBillableSessionId = null;
  billableSnapshot = null;
  billableModal.classList.add('hidden');
  renderEditView();

  if (state.mode === 'focus') {
    if (state.timerView === 'earnings' && !canShowEarningsView()) {
      state.timerView = 'session';
    }
    updateTimerDisplay();
  }
}

function saveBillableModal() {
  const session = getPlannedSession(pendingBillableSessionId);
  if (!session) {
    closeBillableModal(false);
    return;
  }

  session.hourlyRate = parseHourlyRate(billableRateInput.value);
  persist();
  closeBillableModal(false);
}

function setBillableRoundMinutes(roundMinutes) {
  const session = getPlannedSession(pendingBillableSessionId);
  if (!session) return;
  session.billableRoundMinutes = normalizeBillableRoundMinutes(roundMinutes);
  updateBillableModalUI(session);
}

function setBillableRoundScope(roundScope) {
  const session = getPlannedSession(pendingBillableSessionId);
  if (!session) return;
  session.billableRoundScope = normalizeBillableRoundScope(roundScope);
  updateBillableModalUI(session);
}

function renderSessionBillableButton(session, tutorialAnchor) {
  const enabled = !!session.hourlyRateEnabled;
  const label = `Billable settings for ${session.name}`;
  const tutorialAttr = tutorialAnchor ? ` data-tutorial="${tutorialAnchor}"` : '';
  return `
    <button
      type="button"
      class="session-billable-btn${enabled ? ' session-billable-btn--active' : ''}"
      data-session-id="${escapeHtml(session.id)}"
      ${tutorialAttr}
      title="${escapeHtml(label)}"
      aria-label="${escapeHtml(label)}"
    >$</button>
  `;
}

function renderSessionEarningsBadge(session) {
  if (!session.hourlyRateEnabled || !session.hourlyRate) return '';
  if (!hasPlannedSessionQueueTasks(session.id)) return '';
  const earnings = getPlannedSessionQueueEarnings(session.id);
  return `<span class="session-earnings-badge" title="Earnings from queued tasks">${escapeHtml(formatCurrency(earnings))}</span>`;
}

function confirmDeletePlannedSession() {
  if (!pendingDeleteSessionId) return;
  deletePlannedSession(pendingDeleteSessionId);
}

function getTasksForList(listId) {
  if (listId === 'session') return state.sessionTasks;
  if (isPlannedList(listId)) {
    const session = getPlannedSession(getPlannedSessionIdFromListId(listId));
    return session ? session.tasks : [];
  }
  return [];
}

function clearSelection() {
  state.selectedTasks.clear();
  state.lastSelected = null;
  updateSelectionClasses();
}

function selectOnly(task, listId) {
  state.selectedTasks.clear();
  state.selectedTasks.add(task);
  state.lastSelected = { task, listId };
  updateSelectionClasses();
}

function toggleSelection(task, listId) {
  if (state.selectedTasks.has(task)) {
    state.selectedTasks.delete(task);
  } else {
    state.selectedTasks.add(task);
  }
  state.lastSelected = { task, listId };
  updateSelectionClasses();
}

function updateSelectionClasses() {
  document.querySelectorAll('.task-item[data-list-id]').forEach((li) => {
    const listId = li.dataset.listId;
    const taskIndex = parseInt(li.dataset.taskIndex, 10);
    const task = getTasksForList(listId)[taskIndex];
    li.classList.toggle('selected', !!task && state.selectedTasks.has(task));
  });
}

function getDragItems(listId, taskIndex) {
  const task = getTasksForList(listId)[taskIndex];
  if (state.selectedTasks.size > 1 && state.selectedTasks.has(task)) {
    const items = [];
    getAllPlannedListIds().forEach((plannedListId) => {
      getTasksForList(plannedListId).forEach((t, index) => {
        if (state.selectedTasks.has(t)) items.push({ list: plannedListId, index });
      });
    });
    state.sessionTasks.forEach((t, index) => {
      if (state.selectedTasks.has(t)) items.push({ list: 'session', index });
    });
    return items;
  }
  return [{ list: listId, index: taskIndex }];
}

function encodeDragPayload(items) {
  if (items.length === 1) {
    return JSON.stringify({ list: items[0].list, index: items[0].index });
  }
  return JSON.stringify({ items });
}

function normalizeListId(listId) {
  if (listId === 'braindump') return listIdForSession(BRAINDUMP_SESSION_ID);
  return listId;
}

function decodeDragPayload(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      const items = parsed.items.map((item) => ({
        list: normalizeListId(item.list),
        index: item.index,
      }));
      const valid = items.every(
        (item) => isValidListId(item.list) && Number.isInteger(item.index),
      );
      if (valid) return { items };
    }
    const listId = normalizeListId(parsed.list);
    if (isValidListId(listId) && Number.isInteger(parsed.index)) {
      return { items: [{ list: listId, index: parsed.index }] };
    }
  } catch {
    // ignore
  }
  return null;
}

let sessionReorderDragId = null;
let sessionDropIndicatorState = null;

function encodeSessionReorderPayload(sessionId) {
  return JSON.stringify({ type: 'session-reorder', sessionId });
}

function decodeSessionReorderPayload(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === 'session-reorder' && typeof parsed.sessionId === 'string') {
      return parsed.sessionId;
    }
  } catch {
    // ignore
  }
  return null;
}

function isSessionReorderDragActive() {
  return sessionReorderDragId != null;
}

function getPlannedSessionIndex(sessionId) {
  return state.plannedSessions.findIndex((session) => session.id === sessionId);
}

function movePlannedSession(sessionId, insertAt) {
  const fromIndex = getPlannedSessionIndex(sessionId);
  if (fromIndex < 1) return;

  let toIndex = Math.max(1, Math.min(insertAt, state.plannedSessions.length));
  if (fromIndex === toIndex) return;

  const [session] = state.plannedSessions.splice(fromIndex, 1);
  if (fromIndex < toIndex) toIndex -= 1;
  state.plannedSessions.splice(toIndex, 0, session);
  persist();
  renderEditView();
}

function persist() {
  saveCurrentTaskProgress();
  window.slashIt.saveData({
    sessionTasks: state.sessionTasks,
    plannedSessions: state.plannedSessions,
    expandedSessionIds: [...state.expandedSessionIds],
    activeSessionName: state.activeSessionName,
    totalSessionMs: state.totalSessionMs,
    timerView: state.timerView,
    limitExpiredKind: state.limitExpiredKind,
    taskOvertimeMode: state.taskOvertimeMode,
    currentIndex: state.currentIndex,
    focusTaskIndex: state.focusTaskIndex,
    elapsedMs: state.elapsedMs,
    isRunning: state.isRunning,
    limitExpired: state.limitExpired,
    mode: state.mode,
    timerBarSize: state.timerBarSize === 'hidden' ? 'hidden' : state.timerBarSize,
    timerBarSizeBeforeHide: state.timerBarSizeBeforeHide,
    focusPosition: state.focusPosition,
    focusPositionCustomized: state.focusPositionCustomized,
    sessionHistory: state.sessionHistory,
    activeSessionRunId: state.activeSessionRunId,
    activeSessionStartedAt: state.activeSessionStartedAt,
    listTemplates: state.listTemplates,
    soundEffectsEnabled: window.slashItSounds.isEnabled(),
    invoiceSettings: state.invoiceSettings,
  });
}

function normalizeInvoiceSettings(settings) {
  const source = settings && typeof settings === 'object' ? settings : {};
  return {
    name: typeof source.name === 'string' ? source.name.trim() : '',
    logoDataUrl: typeof source.logoDataUrl === 'string' && source.logoDataUrl.startsWith('data:image/')
      ? source.logoDataUrl
      : '',
    businessName: typeof source.businessName === 'string' ? source.businessName.trim() : '',
    email: typeof source.email === 'string' ? source.email.trim() : '',
    address: typeof source.address === 'string' ? source.address.trim() : '',
  };
}

function showView(mode) {
  if (state.mode === 'focus' && mode !== 'focus') {
    saveCurrentTaskProgress();
  }
  state.mode = mode;
  document.body.classList.toggle('mode-focus', mode === 'focus');
  document.body.classList.toggle('mode-edit', mode === 'edit');
  document.body.classList.toggle('mode-done', mode === 'done');
  editView.classList.toggle('hidden', mode !== 'edit');
  focusView.classList.toggle('hidden', mode !== 'focus');
  doneView.classList.toggle('hidden', mode !== 'done');

  if (mode !== 'focus') {
    cancelFocusDimensionsUpdate();
    clearTimerBarHideTimeout();
    if (state.timerBarSize === 'hidden') {
      state.timerBarSize = state.timerBarSizeBeforeHide || 'normal';
      window.slashIt.showFocusWindow();
    }
    applyTimerBarSizeClass();
    window.slashIt.setWindowMode(mode);
    closeSessionDrawer({ immediate: true });
    updateFullscreenTaskPanel();
  } else {
    applyTimerBarSizeClass();
    updateTimerBarControlLabels();
    window.slashIt.setWindowMode(mode, getFocusWindowModeOptions());
    if (state.timerBarSize === 'hidden') {
      window.slashIt.hideFocusWindow();
      clearTimerBarHideTimeout();
      timerBarHideTimeout = setTimeout(restoreTimerBarFromHide, TIMER_BAR_HIDE_DURATION_MS);
    } else {
      scheduleFocusDimensionsUpdate();
    }
  }
  if (!isInitializing) persist();
}

function getIncompleteTasks() {
  return state.sessionTasks.filter((t) => !t.completed);
}

function getSessionIncompleteIndices() {
  return state.sessionTasks.reduce((acc, task, index) => {
    if (!task.completed) acc.push(index);
    return acc;
  }, []);
}

function getSessionEditIndices() {
  const incomplete = [];
  const completed = [];
  state.sessionTasks.forEach((task, index) => {
    if (task.completed) completed.push(index);
    else incomplete.push(index);
  });
  return [...incomplete, ...completed];
}

function getFirstCompletedIndex() {
  return state.sessionTasks.findIndex((task) => task.completed);
}

function getSessionActiveInsertIndex() {
  const firstCompleted = getFirstCompletedIndex();
  return firstCompleted === -1 ? state.sessionTasks.length : firstCompleted;
}

function getCompletedCount() {
  return state.sessionTasks.filter((t) => t.completed).length;
}

function getIncompleteCount() {
  return state.sessionTasks.filter((t) => !t.completed).length;
}

function clearAllSkippedFlags() {
  state.sessionTasks.forEach((task) => {
    task.skipped = false;
  });
}

function getNextFocusTaskIndex({ excludeIndex = -1 } = {}) {
  for (let i = 0; i < state.sessionTasks.length; i++) {
    const task = state.sessionTasks[i];
    if (!task.completed && !task.skipped && i !== excludeIndex) return i;
  }
  for (let i = 0; i < state.sessionTasks.length; i++) {
    const task = state.sessionTasks[i];
    if (!task.completed && task.skipped && i !== excludeIndex) return i;
  }
  return -1;
}

function getFocusTaskIndex() {
  const task = state.sessionTasks[state.focusTaskIndex];
  if (task && !task.completed) return state.focusTaskIndex;
  const next = getNextFocusTaskIndex();
  if (next >= 0) state.focusTaskIndex = next;
  return next;
}

function getCurrentTask() {
  const index = getFocusTaskIndex();
  return index >= 0 ? state.sessionTasks[index] : null;
}

function updateSkipButtonState() {
  if (!skipBtn) return;
  skipBtn.disabled = getIncompleteCount() <= 1;
}

function getSessionElapsedMs() {
  return state.totalSessionMs + state.elapsedMs;
}

function isSessionInProgress() {
  if (getCompletedCount() > 0) return true;
  return state.sessionTasks.some((task) => !task.completed && task.elapsedMs > 0);
}

function isSessionReadyToComplete() {
  return getSessionIncompleteIndices().length === 0
    && getCompletedCount() > 0
    && isSessionInProgress();
}

function resetSessionProgressState() {
  state.totalSessionMs = 0;
  state.elapsedMs = 0;
  state.focusTaskIndex = 0;
  state.activeSessionName = null;
  state.activeSessionRunId = null;
  state.activeSessionStartedAt = null;
}

function ensureActiveSessionRun(forceNew = false) {
  if (forceNew || !state.activeSessionRunId) {
    state.activeSessionRunId = crypto.randomUUID();
    state.activeSessionStartedAt = Date.now();
  } else if (!state.activeSessionStartedAt) {
    state.activeSessionStartedAt = Date.now();
  }
}

function hasArchivableProgress() {
  if (isSessionInProgress()) return true;
  if (state.totalSessionMs > 0) return true;
  return state.sessionTasks.some((task) => task.completed);
}

function getTaskArchiveStatus(task) {
  if (task.completed) return 'completed';
  if (task.skipped) return 'skipped';
  return 'incomplete';
}

function getArchiveTotalMs() {
  saveCurrentTaskProgress();
  let total = state.totalSessionMs;
  state.sessionTasks.forEach((task) => {
    if (!task.completed && task.elapsedMs > 0) {
      total += task.elapsedMs;
    }
  });
  return total;
}

function buildHistoryTasks() {
  saveCurrentTaskProgress();
  return state.sessionTasks.map((task) => {
    const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    const { enabled, rate, roundMinutes, roundScope } = getPlannedSessionRateSettings(sessionId);
    const durationMs = task.completed
      ? (task.durationMs ?? null)
      : (task.elapsedMs > 0 ? task.elapsedMs : null);
    const entry = {
      text: task.text,
      status: getTaskArchiveStatus(task),
      durationMs,
      limitMs: task.limitMs ?? null,
      sourceSessionId: sessionId,
    };
    if (task.sourceSessionName) {
      entry.sourceSessionName = task.sourceSessionName;
    }
    if (enabled && rate) {
      entry.hourlyRateEnabled = true;
      entry.hourlyRate = rate;
      entry.billableRoundMinutes = roundMinutes;
      entry.billableRoundScope = roundScope;
      if (roundScope === 'task' && durationMs) {
        entry.billableDurationMs = task.billableDurationMs
          ?? roundUpBillableMs(durationMs, roundMinutes);
        entry.earnings = calculateBillableEarningsFromMs(entry.billableDurationMs, rate);
      } else {
        entry.earnings = calculateBillableEarnings(durationMs, rate, roundMinutes);
      }
    }
    return entry;
  });
}

function normalizeSessionHistoryTask(task) {
  const normalized = {
    text: task.text || '',
    status: task.status === 'skipped' || task.status === 'incomplete' ? task.status : 'completed',
    durationMs: task.durationMs ?? null,
    limitMs: task.limitMs ?? null,
    sourceSessionId: task.sourceSessionId || null,
    ...(task.sourceSessionName ? { sourceSessionName: task.sourceSessionName } : {}),
  };

  if (task.hourlyRateEnabled) {
    normalized.hourlyRateEnabled = true;
    normalized.hourlyRate = parseHourlyRate(task.hourlyRate);
    normalized.billableRoundMinutes = normalizeBillableRoundMinutes(task.billableRoundMinutes);
    normalized.billableRoundScope = normalizeBillableRoundScope(task.billableRoundScope);
    if (task.billableDurationMs != null) {
      normalized.billableDurationMs = task.billableDurationMs;
    }
    normalized.earnings = task.earnings ?? getHistoryTaskEarnings(normalized);
  }

  return normalized;
}

function getHistoryTaskRateSettings(task) {
  if (task.hourlyRateEnabled) {
    return {
      enabled: true,
      rate: task.hourlyRate,
      roundMinutes: task.billableRoundMinutes ?? null,
      roundScope: normalizeBillableRoundScope(task.billableRoundScope),
    };
  }
  return getPlannedSessionRateSettings(task.sourceSessionId);
}

function getHistoryTaskEarnings(task) {
  const { enabled, rate, roundMinutes, roundScope } = getHistoryTaskRateSettings(task);
  if (!enabled || !rate) return 0;
  if (!task.durationMs || task.durationMs <= 0) return 0;

  if (roundScope === 'task') {
    const billableMs = task.billableDurationMs ?? roundUpBillableMs(task.durationMs, roundMinutes);
    return calculateBillableEarningsFromMs(billableMs, rate);
  }

  return calculateBillableEarnings(task.durationMs, rate, roundMinutes);
}

function getHistoryEntryEarnings(entry) {
  if (!entry.billable) return 0;
  return entry.tasks.reduce((sum, task) => sum + getHistoryTaskEarnings(task), 0);
}

function getHistoryEntryTotalMs(entry) {
  if (!entry?.tasks?.length) return entry?.totalMs || 0;

  let hasTaskDuration = false;
  const taskTotal = entry.tasks.reduce((sum, task) => {
    if (task.durationMs == null || task.durationMs <= 0) return sum;
    hasTaskDuration = true;
    return sum + task.durationMs;
  }, 0);

  if (hasTaskDuration) return taskTotal;
  return entry.totalMs || 0;
}

function getHistoryTaskBillableDurationMs(task) {
  const { enabled, rate, roundMinutes, roundScope } = getHistoryTaskRateSettings(task);
  if (!enabled || !rate || !task.durationMs || task.durationMs <= 0) return 0;
  if (!roundMinutes) return task.durationMs;
  if (roundScope === 'task') {
    return task.billableDurationMs ?? roundUpBillableMs(task.durationMs, roundMinutes);
  }
  return roundUpBillableMs(task.durationMs, roundMinutes);
}

function getHistoryEntryBillableTotalMs(entry) {
  if (!entry.billable) return getHistoryEntryTotalMs(entry);
  if (!entry?.tasks?.length) return entry?.totalMs || 0;

  let total = 0;
  let hasDuration = false;
  for (const task of entry.tasks) {
    const ms = getHistoryTaskBillableDurationMs(task);
    if (ms > 0) {
      total += ms;
      hasDuration = true;
    }
  }
  return hasDuration ? total : getHistoryEntryTotalMs(entry);
}

function getHistoryEntryDisplayHourlyRate(entry) {
  if (!entry.billable) return null;
  if (sessionHasMixedRates(entry)) return null;
  const task = entry.tasks.find((t) => t.hourlyRateEnabled && t.hourlyRate);
  return task?.hourlyRate ?? null;
}

function formatReportHourlyRate(displayRate, hasMixedRates = false) {
  if (hasMixedRates) return 'Mixed';
  return formatHourlyRate(displayRate);
}

function getReportTotalsDisplayRate(billableSessions) {
  if (!billableSessions.length) return null;

  const rates = new Set();
  for (const session of billableSessions) {
    if (session.hasMixedRates) return null;
    if (session.displayRate != null) rates.add(session.displayRate);
  }

  if (rates.size === 0) return null;
  if (rates.size === 1) return [...rates][0];
  return null;
}

function sessionHasMixedRates(entry) {
  if (!entry.billable) return false;
  const rates = new Set(
    entry.tasks
      .filter((task) => task.hourlyRateEnabled && task.hourlyRate)
      .map((task) => task.hourlyRate),
  );
  return rates.size > 1;
}

function filterSessionHistoryByRange(history, startMs, endMs) {
  return history.filter((entry) => {
    const endedAt = entry.endedAt;
    if (!endedAt) return false;
    return endedAt >= startMs && endedAt <= endMs;
  });
}

function getHistoryEntryName(entry) {
  return (entry.name || 'Session').trim() || 'Session';
}

function getHistoryEntrySourceSessionId(entry) {
  return entry.sourceSessionId || entry.tasks?.[0]?.sourceSessionId || BRAINDUMP_SESSION_ID;
}

function formatHistorySessionName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'SESSION';
  return trimmed.toUpperCase();
}

function getHistoryEntryDisplayName(entry) {
  const sessionId = getHistoryEntrySourceSessionId(entry);
  const planned = getPlannedSession(sessionId);
  const plannedName = (planned?.name || '').trim();
  if (plannedName) return formatHistorySessionName(plannedName);
  return formatHistorySessionName(getHistoryEntryName(entry));
}

function resolveArchiveSourceSessionId(tasks) {
  const counts = new Map();
  tasks.forEach((task) => {
    const id = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    counts.set(id, (counts.get(id) || 0) + 1);
  });

  let bestId = null;
  let bestCount = 0;
  counts.forEach((count, id) => {
    if (id !== BRAINDUMP_SESSION_ID && count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  });

  if (bestId) return bestId;
  return tasks[0]?.sourceSessionId || BRAINDUMP_SESSION_ID;
}

function getReportSessionOptions() {
  const byId = new Map();

  state.sessionHistory.forEach((entry) => {
    const id = getHistoryEntrySourceSessionId(entry);
    if (!byId.has(id)) {
      byId.set(id, { id, label: getHistoryEntryDisplayName(entry) });
    }
  });

  state.plannedSessions.forEach((session) => {
    const id = session.id;
    const label = (session.name || '').trim() || (id === BRAINDUMP_SESSION_ID ? 'Braindump' : 'Session');
    byId.set(id, { id, label: formatHistorySessionName(label) });
  });

  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

function resolveHistoryReportSessionFilterId(filterValue) {
  const trimmed = (filterValue || '').trim();
  if (!trimmed) return '';

  const options = getReportSessionOptions();
  if (options.some((option) => option.id === trimmed)) return trimmed;

  const normalized = trimmed.toLowerCase();
  const byName = options.filter((option) => option.label.toLowerCase() === normalized);
  if (byName.length === 1) return byName[0].id;

  const historyMatch = state.sessionHistory.find((entry) => getHistoryEntryName(entry).toLowerCase() === normalized);
  if (historyMatch) return getHistoryEntrySourceSessionId(historyMatch);

  const plannedMatch = state.plannedSessions.find((session) => (session.name || '').trim().toLowerCase() === normalized);
  if (plannedMatch) return plannedMatch.id;

  return '';
}

function filterSessionHistoryBySessionId(history, sessionId) {
  const trimmed = (sessionId || '').trim();
  if (!trimmed) return history;
  return history.filter((entry) => getHistoryEntrySourceSessionId(entry) === trimmed);
}

function populateHistoryReportSessionFilter() {
  historyReportSessionFilter = resolveHistoryReportSessionFilterId(historyReportSessionFilter);
  const options = getReportSessionOptions();
  if (historyReportSessionFilter && !options.some((option) => option.id === historyReportSessionFilter)) {
    historyReportSessionFilter = '';
  }
  renderHistoryReportSessionMenuOptions();
  updateHistoryReportSessionTriggerLabel();
}

function renderHistoryReportSessionMenuOptions() {
  if (!historyReportSessionMenu) return;

  const options = getReportSessionOptions();
  const selected = historyReportSessionFilter;
  const items = [{ value: '', label: 'All sessions' }, ...options.map((option) => ({ value: option.id, label: option.label }))];

  historyReportSessionMenu.innerHTML = items.map((item) => {
    const isSelected = selected === item.value;
    return `
      <button
        type="button"
        class="history-report-session-option${isSelected ? ' history-report-session-option--selected' : ''}"
        role="option"
        aria-selected="${isSelected}"
        data-session-filter="${escapeHtml(item.value)}"
      >
        <span class="history-report-session-option-check" aria-hidden="true">${isSelected ? '✓' : ''}</span>
        <span class="history-report-session-option-label">${escapeHtml(item.label)}</span>
      </button>
    `;
  }).join('');
}

function updateHistoryReportSessionTriggerLabel() {
  if (!historyReportSessionValue) return;
  if (!historyReportSessionFilter) {
    historyReportSessionValue.textContent = 'All sessions';
    return;
  }
  const option = getReportSessionOptions().find((item) => item.id === historyReportSessionFilter);
  historyReportSessionValue.textContent = option?.label || 'All sessions';
}

function positionHistoryReportSessionMenu() {
  if (!historyReportSessionTrigger || !historyReportSessionMenu) return;

  const rect = historyReportSessionTrigger.getBoundingClientRect();
  historyReportSessionMenu.style.top = `${rect.bottom + 4}px`;
  historyReportSessionMenu.style.left = `${rect.left}px`;
  historyReportSessionMenu.style.width = `${rect.width}px`;
}

function openHistoryReportSessionMenu() {
  if (!historyReportSessionMenu || !historyReportSessionTrigger) return;

  positionHistoryReportSessionMenu();
  historyReportSessionMenu.classList.remove('hidden');
  historyReportSessionTrigger.setAttribute('aria-expanded', 'true');
  historyReportSessionMenuOpen = true;
  requestAnimationFrame(() => {
    document.addEventListener('click', handleHistoryReportSessionOutsideClick, true);
  });
}

function closeHistoryReportSessionMenu() {
  if (!historyReportSessionMenu || !historyReportSessionTrigger) return;

  historyReportSessionMenu.classList.add('hidden');
  historyReportSessionTrigger.setAttribute('aria-expanded', 'false');
  historyReportSessionMenuOpen = false;
  document.removeEventListener('click', handleHistoryReportSessionOutsideClick, true);
}

function handleHistoryReportSessionOutsideClick(event) {
  if (historyReportSessionSelectWrap?.contains(event.target)) return;
  closeHistoryReportSessionMenu();
}

function handleHistoryReportSessionTriggerClick(event) {
  event.stopPropagation();
  if (historyReportSessionMenuOpen) {
    closeHistoryReportSessionMenu();
    return;
  }

  populateHistoryReportSessionFilter();
  openHistoryReportSessionMenu();
}

function handleHistoryReportSessionOptionClick(event) {
  const option = event.target.closest('.history-report-session-option');
  if (!option) return;

  event.stopPropagation();
  historyReportSessionFilter = option.getAttribute('data-session-filter') ?? '';
  closeHistoryReportSessionMenu();
  updateHistoryReportSessionTriggerLabel();
  refreshHistoryModalPanels();
}

function sanitizeFileNamePart(value) {
  return (value || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
}

function formatInvoiceNumberDate(ms) {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${day}${year}`;
}

function sessionNameToInvoicePrefix(name) {
  const prefix = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return prefix || 'SESSION';
}

function generateInvoiceNumber(sessionName, invoiceDateMs) {
  const datePart = formatInvoiceNumberDate(invoiceDateMs);
  const trimmed = (sessionName || '').trim();
  if (!trimmed) return datePart;
  return `${sessionNameToInvoicePrefix(trimmed)}-${datePart}`;
}

function formatInvoiceHours(durationMs) {
  if (!durationMs || durationMs <= 0) return '0.00';
  return (durationMs / 3600000).toFixed(2);
}

function getInvoiceBillableLines(report) {
  if (!report?.sessions?.length) return [];
  return report.sessions.filter((session) => session.billable && (session.earnings || 0) > 0);
}

function getInvoiceBillableTotal(report) {
  return getInvoiceBillableLines(report).reduce((sum, session) => sum + (session.earnings || 0), 0);
}

function groupEarningsByDay(entries) {
  const buckets = new Map();

  for (const entry of entries) {
    const dateKey = getLocalDateKey(entry.endedAt);
    const earnings = entry.billable ? getHistoryEntryEarnings(entry) : 0;
    const existing = buckets.get(dateKey) || {
      dateKey,
      dateMs: parseDateInputToStartMs(dateKey),
      earnings: 0,
      totalMs: 0,
      sessionCount: 0,
    };

    existing.earnings += earnings;
    existing.totalMs += getHistoryEntryTotalMs(entry);
    existing.sessionCount += 1;
    buckets.set(dateKey, existing);
  }

  return Array.from(buckets.values()).sort((a, b) => a.dateMs - b.dateMs);
}

function buildEarningsReportData(entries, range) {
  const sessions = entries.map((entry) => ({
    id: entry.id,
    date: entry.endedAt,
    name: getHistoryEntryDisplayName(entry),
    durationMs: entry.billable
      ? getHistoryEntryBillableTotalMs(entry)
      : getHistoryEntryTotalMs(entry),
    earnings: entry.billable ? getHistoryEntryEarnings(entry) : null,
    displayRate: getHistoryEntryDisplayHourlyRate(entry),
    hasMixedRates: sessionHasMixedRates(entry),
    status: entry.status === 'abandoned' ? 'Abandoned' : 'Completed',
    billable: !!entry.billable,
  }));

  const dailyBars = groupEarningsByDay(entries).map((day) => ({
    label: formatReportDay(day.dateMs),
    dateKey: day.dateKey,
    value: day.earnings,
    sessionCount: day.sessionCount,
  }));

  const sessionBars = sessions
    .filter((session) => session.billable)
    .map((session) => ({
      label: `${session.name} · ${formatReportDay(session.date)}`,
      value: session.earnings || 0,
    }));

  const billableSessions = sessions.filter((session) => session.billable);
  const totalEarnings = billableSessions.reduce((sum, session) => sum + (session.earnings || 0), 0);
  const totalMs = sessions.reduce((sum, session) => sum + (session.durationMs || 0), 0);
  const reportDisplayRate = getReportTotalsDisplayRate(billableSessions);
  const hasMixedReportRates = billableSessions.some((session) => session.hasMixedRates)
    || (billableSessions.length > 0 && reportDisplayRate == null && totalEarnings > 0);

  return {
    range,
    totals: {
      sessionCount: entries.length,
      totalMs,
      totalEarnings,
      reportDisplayRate,
      hasMixedReportRates,
      billableSessionCount: billableSessions.length,
    },
    dailyBars,
    sessionBars,
    sessions,
    hasMixedRatesNote: sessions.some((session) => session.hasMixedRates),
  };
}

function getReportRangePreset(preset) {
  const now = new Date();
  const endMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
  let startMs;

  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    startMs = start.getTime();
  } else if (preset === 'month') {
    startMs = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
  } else {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    startMs = start.getTime();
  }

  return { startMs, endMs };
}

function getCurrentReportRange() {
  const startMs = parseDateInputToStartMs(historyReportStartInput?.value);
  const endMs = parseDateInputToEndMs(historyReportEndInput?.value);
  if (startMs == null || endMs == null || startMs > endMs) return null;
  return {
    startMs,
    endMs,
    startLabel: formatReportDate(startMs),
    endLabel: formatReportDate(endMs),
  };
}

function getFilteredSessionHistoryEntries() {
  const range = getCurrentReportRange();
  if (!range) return [];
  let entries = filterSessionHistoryByRange(state.sessionHistory, range.startMs, range.endMs);
  entries = filterSessionHistoryBySessionId(entries, historyReportSessionFilter?.trim() || '');
  return entries;
}

function getFilteredReportEntries() {
  const range = getCurrentReportRange();
  if (!range) return { range: null, entries: [], report: null };

  const sessionId = historyReportSessionFilter?.trim() || '';
  let entries = filterSessionHistoryByRange(state.sessionHistory, range.startMs, range.endMs);
  entries = filterSessionHistoryBySessionId(entries, sessionId);

  const sessionLabel = sessionId
    ? getReportSessionOptions().find((option) => option.id === sessionId)?.label || ''
    : '';
  const reportRange = sessionLabel ? { ...range, sessionName: sessionLabel } : range;

  return {
    range: reportRange,
    entries,
    report: buildEarningsReportData(entries, reportRange),
  };
}

function recalculateHistoryEntryBillable(entry) {
  if (!entry.billable) {
    entry.totalEarnings = null;
    entry.totalMs = getHistoryEntryTotalMs(entry);
    return;
  }

  entry.totalEarnings = entry.tasks.reduce((sum, task) => {
    if (task.hourlyRateEnabled && task.hourlyRate) {
      const roundScope = normalizeBillableRoundScope(task.billableRoundScope);
      if (roundScope === 'task' && task.durationMs && task.billableRoundMinutes) {
        task.billableDurationMs = roundUpBillableMs(task.durationMs, task.billableRoundMinutes);
      } else {
        delete task.billableDurationMs;
      }
      task.earnings = getHistoryTaskEarnings(task);
      return sum + (task.earnings || 0);
    }
    return sum;
  }, 0);
  entry.totalMs = getHistoryEntryTotalMs(entry);
}

function normalizeSessionHistoryEntry(entry) {
  const tasks = (entry.tasks || []).map(normalizeSessionHistoryTask);
  const billable = entry.billable ?? tasks.some((task) => task.hourlyRateEnabled && task.hourlyRate);
  const sourceSessionId = entry.sourceSessionId || tasks[0]?.sourceSessionId || BRAINDUMP_SESSION_ID;
  const normalized = {
    id: entry.id || crypto.randomUUID(),
    runId: entry.runId || crypto.randomUUID(),
    sourceSessionId,
    name: entry.name || 'Braindump',
    startedAt: entry.startedAt || entry.endedAt || Date.now(),
    endedAt: entry.endedAt || Date.now(),
    status: entry.status === 'abandoned' ? 'abandoned' : 'completed',
    totalMs: entry.totalMs || 0,
    completedCount: entry.completedCount ?? 0,
    totalCount: entry.totalCount ?? (entry.tasks?.length || 0),
    billable: !!billable,
    tasks,
  };

  normalized.totalEarnings = billable
    ? (entry.totalEarnings ?? getHistoryEntryEarnings(normalized))
    : null;
  normalized.totalMs = getHistoryEntryTotalMs(normalized);

  return normalized;
}

function updateHistoryTaskDuration(entryId, taskIndex, durationMs) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry || !entry.tasks[taskIndex]) return;

  const task = entry.tasks[taskIndex];
  task.durationMs = durationMs;
  recalculateHistoryEntryBillable(entry);
  persist();
  refreshHistoryModalPanels();
}

function applyDateToTimestamp(timestamp, dateStr) {
  const dayStart = parseDateInputToStartMs(dateStr);
  if (dayStart == null || !timestamp) return null;
  const old = new Date(timestamp);
  const next = new Date(dayStart);
  next.setHours(old.getHours(), old.getMinutes(), old.getSeconds(), old.getMilliseconds());
  return next.getTime();
}

function updateHistoryEntryDate(entryId, dateStr) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry || !dateStr) return;

  const nextEndedAt = applyDateToTimestamp(entry.endedAt, dateStr);
  if (nextEndedAt == null || nextEndedAt === entry.endedAt) return;

  const delta = nextEndedAt - entry.endedAt;
  entry.endedAt = nextEndedAt;
  entry.startedAt = (entry.startedAt ?? entry.endedAt) + delta;

  persist();
  ensureHistoryRangeIncludesEntry(entry);
  refreshHistoryModalPanels();
}

function historyTaskToPlannedTask(task) {
  return normalizeBraindumpTask({ text: task.text, limitMs: task.limitMs });
}

function restoreHistoryEntryToList(entryId) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry?.tasks?.length) return;

  ensureBraindumpSession();
  const tasksBySessionId = new Map();

  entry.tasks.forEach((task) => {
    const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    const targetSession = getPlannedSession(sessionId) || getBraindumpSession();
    const targetId = targetSession.id;
    if (!tasksBySessionId.has(targetId)) tasksBySessionId.set(targetId, []);
    tasksBySessionId.get(targetId).push(historyTaskToPlannedTask(task));
  });

  tasksBySessionId.forEach((tasks, sessionId) => {
    const session = getPlannedSession(sessionId);
    if (!session) return;
    session.tasks.push(...tasks);
    state.expandedSessionIds.add(sessionId);
  });

  persist();
  if (state.mode === 'edit') renderEditView();
  refreshDrawerIfOpen();
}

function archiveCurrentSession(status) {
  if (!hasArchivableProgress()) return null;
  ensureActiveSessionRun(false);
  const runId = state.activeSessionRunId;
  if (!runId) return null;
  if (state.sessionHistory.some((entry) => entry.runId === runId)) return null;

  const tasks = buildHistoryTasks();
  const billable = tasks.some((task) => task.hourlyRateEnabled && task.hourlyRate);
  const totalEarnings = billable
    ? tasks.reduce((sum, task) => sum + (task.earnings || 0), 0)
    : null;

  const sourceSessionId = resolveArchiveSourceSessionId(tasks);
  const entry = {
    id: crypto.randomUUID(),
    runId,
    sourceSessionId,
    name: state.activeSessionName || state.sessionTasks[0]?.sourceSessionName || 'Braindump',
    startedAt: state.activeSessionStartedAt || Date.now(),
    endedAt: Date.now(),
    status,
    totalMs: getArchiveTotalMs(),
    completedCount: getCompletedCount(),
    totalCount: state.sessionTasks.length,
    billable,
    totalEarnings,
    tasks,
  };

  state.sessionHistory.unshift(entry);
  if (state.sessionHistory.length > SESSION_HISTORY_MAX) {
    state.sessionHistory.length = SESSION_HISTORY_MAX;
  }
  persist();
  return entry;
}

function getEditTaskTimeHtml(task, isCompleted) {
  if (isCompleted) {
    return task.durationMs != null
      ? `<span class="task-duration-badge">${formatTime(task.durationMs)}</span>`
      : '';
  }
  const limitValue = escapeHtml(formatLimitField(task.limitMs));
  return `<input class="task-limit-input" type="text" value="${limitValue}" placeholder="20m" title="Time limit" autocomplete="off" />`;
}

function isTaskOvertimeActive() {
  return state.taskOvertimeMode || (state.limitExpired && state.limitExpiredKind === 'task');
}

function getTaskDisplayMs(task) {
  if (!task) return state.elapsedMs;
  return getTaskDisplayMsForElapsed(task, state.elapsedMs, isTaskOvertimeActive());
}

function getTaskDisplayMsForElapsed(task, elapsedMs, overtimeActive) {
  if (task.limitMs && overtimeActive) {
    return Math.max(0, elapsedMs - task.limitMs);
  }
  if (task.limitMs) {
    return Math.max(0, task.limitMs - elapsedMs);
  }
  return elapsedMs;
}

function saveCurrentTaskProgress() {
  if (state.mode !== 'focus') return;
  const taskIndex = state.focusTaskIndex;
  if (taskIndex < 0) return;
  const task = state.sessionTasks[taskIndex];
  if (!task || task.completed) return;
  task.elapsedMs = state.elapsedMs;
  task.taskOvertimeMode = state.taskOvertimeMode;
}

function getSessionDisplayMs() {
  return getSessionElapsedMs();
}

function isTimerDisplayExpired() {
  if (state.timerView === 'earnings') return false;
  return state.limitExpired && state.limitExpiredKind === state.timerView;
}

function updateTimerDisplay() {
  if (state.timerView === 'earnings' && !canShowEarningsView()) {
    state.timerView = 'session';
  }

  const current = getCurrentTask();
  const showEarningsRounding = state.timerView === 'earnings' && shouldShowEarningsRoundingDisplay();
  const roundMinutes = showEarningsRounding ? getCurrentTaskRoundMinutes() : null;

  if (timerModeLabel) {
    if (state.timerView === 'task') {
      timerModeLabel.textContent = 'TASK';
    } else if (state.timerView === 'session') {
      timerModeLabel.textContent = 'SESSION';
    } else if (showEarningsRounding && roundMinutes) {
      const roundScope = getCurrentTaskRoundScope();
      const scopeLabel = roundScope === 'task' ? ' · TASK' : '';
      timerModeLabel.textContent = `EARNINGS · ${formatBillableRoundLabel(roundMinutes)}${scopeLabel}`;
    } else {
      timerModeLabel.textContent = 'EARNINGS';
    }
    timerModeLabel.classList.toggle('timer-mode-label--session', state.timerView === 'session');
    timerModeLabel.classList.toggle('timer-mode-label--earnings', state.timerView === 'earnings');
  }

  if (state.timerView === 'earnings') {
    timerBar.classList.toggle('timer-bar--earnings-split', showEarningsRounding);
    timerDisplay.classList.toggle('timer-display--earnings-split', showEarningsRounding);

    if (showEarningsRounding) {
      const live = getSessionEarningsLive();
      const billed = getSessionEarnings();
      const displayText = formatEarningsSplitDisplay(live, billed);
      renderEarningsSplitDisplay(live, billed);
      timerDisplay.title = `Live meter: ${formatCurrency(live)}. Billed if you stop now: ${formatCurrency(billed)}.`;
      syncEarningsSplitBarWidth(displayText);
    } else {
      if (lastEarningsSplitDisplayText !== '') {
        lastEarningsSplitDisplayText = '';
        invalidateFocusBarWidthCache();
        scheduleFocusDimensionsUpdate();
      }
      timerDisplay.textContent = formatCurrency(getSessionEarnings());
      timerDisplay.title = 'Switch between task, session, and earnings';
    }
    timerDisplay.classList.remove('paused', 'expired');
  } else {
    if (lastEarningsSplitDisplayText !== '') {
      lastEarningsSplitDisplayText = '';
      invalidateFocusBarWidthCache();
      scheduleFocusDimensionsUpdate();
    }
    timerBar.classList.remove('timer-bar--earnings-split');
    timerDisplay.classList.remove('timer-display--earnings-split');
    timerDisplay.title = 'Switch between task, session, and earnings';
    const displayMs = state.timerView === 'session'
      ? getSessionDisplayMs()
      : getTaskDisplayMs(current);
    timerDisplay.textContent = formatTime(displayMs);
    timerDisplay.classList.toggle('paused', !state.isRunning && !state.limitExpired);
    timerDisplay.classList.toggle('expired', isTimerDisplayExpired());
  }
  timerBar.classList.toggle('is-running', state.isRunning);
  pauseBtn.classList.toggle('is-paused', !state.isRunning);
  pauseBtn.title = state.isRunning ? 'Pause' : 'Resume';
  pauseBtn.setAttribute('aria-label', state.isRunning ? 'Pause' : 'Resume');
  updateSkipButtonState();
  updateTimerBarControlLabels();
  if (drawerOpen) {
    void window.slashIt.updateSessionDrawer(getDrawerPayload());
  }
}

function setExpiredUI(active) {
  state.limitExpired = active;
  backToEditBtn.classList.toggle('hidden', active);
  window.slashIt.setScreenOverlay(active);
  if (!active) {
    expiredActions.classList.add('hidden');
    extendPanel.classList.add('hidden');
  } else if (extendPanel.classList.contains('hidden')) {
    expiredActions.classList.remove('hidden');
  }
  updateTimerBarExpandedLayout();
  invalidateFocusBarWidthCache();
  updateTimerDisplay();
  scheduleFocusDimensionsUpdate();
}

function showExtendPanel() {
  expiredActions.classList.add('hidden');
  extendPanel.classList.remove('hidden');
  extendInput.value = '5m';
  extendInput.focus();
  extendInput.select();
  invalidateFocusBarWidthCache();
  scheduleFocusDimensionsUpdate();
}

function hideExtendPanel() {
  extendPanel.classList.add('hidden');
  if (state.limitExpired) {
    expiredActions.classList.remove('hidden');
  }
  invalidateFocusBarWidthCache();
  scheduleFocusDimensionsUpdate();
}

function resetTaskTimerState() {
  state.elapsedMs = 0;
  state.taskOvertimeMode = false;
  clearTaskAlertAndOvertimeState();
}

function clearTaskAlertAndOvertimeState() {
  state.taskOvertimeMode = false;
  if (state.limitExpiredKind !== 'task') return;
  state.limitExpired = false;
  state.limitExpiredKind = null;
  setExpiredUI(false);
}

function startNextTaskFresh(task) {
  task.elapsedMs = 0;
  task.taskOvertimeMode = false;
  task.skipped = false;
  state.elapsedMs = 0;
  state.taskOvertimeMode = false;
  state.sessionStartMs = null;
  if (state.limitExpiredKind === 'task') {
    state.limitExpired = false;
    state.limitExpiredKind = null;
    setExpiredUI(false);
  }
}

function restoreTaskTimerFromTask(task) {
  state.elapsedMs = task.elapsedMs || 0;
  state.taskOvertimeMode = !!task.taskOvertimeMode;

  const taskAtLimit = task.limitMs && !state.taskOvertimeMode && state.elapsedMs >= task.limitMs;

  if (taskAtLimit) {
    state.limitExpired = true;
    state.limitExpiredKind = 'task';
    setExpiredUI(true);
  } else {
    clearTaskAlertAndOvertimeState();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getSourceMetaFromSession(session) {
  if (!session) return null;
  return {
    sourceSessionId: session.id,
    sourceSessionName: session.name,
  };
}

function getSourceMetaFromListId(listId) {
  if (!isPlannedList(listId)) return null;
  return getSourceMetaFromSession(getPlannedSession(getPlannedSessionIdFromListId(listId)));
}

function toSessionTaskFromBraindump(task, sourceMeta = null) {
  const sessionTask = {
    text: task.text,
    completed: false,
    limitMs: task.limitMs ?? null,
    durationMs: null,
    elapsedMs: 0,
    taskOvertimeMode: false,
    skipped: false,
  };
  if (sourceMeta) {
    sessionTask.sourceSessionId = sourceMeta.sourceSessionId;
    sessionTask.sourceSessionName = sourceMeta.sourceSessionName;
  }
  return sessionTask;
}

function toBraindumpTaskFromSession(task) {
  return { text: task.text, limitMs: task.limitMs ?? null };
}

function convertTaskForMove(task, fromList, toList) {
  if (fromList === toList) return task;
  if (toList === 'session') {
    const sourceMeta = isPlannedList(fromList) ? getSourceMetaFromListId(fromList) : null;
    return toSessionTaskFromBraindump(task, sourceMeta);
  }
  if (fromList === 'session') return toBraindumpTaskFromSession(task);
  return task;
}

function moveTasks(items, toList, toIndex) {
  const resolved = items
    .map(({ list, index }) => ({
      fromList: list,
      fromIndex: index,
      task: getTasksForList(list)[index],
    }))
    .filter((entry) => entry.task);

  if (resolved.length === 0) return;

  const moved = resolved.map(({ fromList, task }) => convertTaskForMove(task, fromList, toList));

  const targetBefore = getTasksForList(toList);
  let insertAt = Math.max(0, Math.min(toIndex, targetBefore.length));
  const removedBeforeInsert = resolved.filter(
    ({ fromList, fromIndex }) => fromList === toList && fromIndex < toIndex,
  ).length;
  insertAt = Math.max(0, insertAt - removedBeforeInsert);

  const indicesByList = {};
  resolved.forEach(({ fromList, fromIndex }) => {
    if (!indicesByList[fromList]) indicesByList[fromList] = [];
    indicesByList[fromList].push(fromIndex);
  });

  Object.keys(indicesByList).forEach((listId) => {
    const uniqueIndices = [...new Set(indicesByList[listId])].sort((a, b) => b - a);
    const source = getTasksForList(listId);
    uniqueIndices.forEach((index) => {
      if (index >= 0 && index < source.length) source.splice(index, 1);
    });
  });

  const target = getTasksForList(toList);
  target.splice(Math.min(insertAt, target.length), 0, ...moved);
  clearSelection();
  persist();
  renderEditView();
}

function moveTask(fromList, fromIndex, toList, toIndex) {
  moveTasks([{ list: fromList, index: fromIndex }], toList, toIndex);
}

const DROP_LINE_GAP_PX = 5;
const DROP_LINE_HEIGHT_PX = 1;
const DROP_LINE_SLOT_PX = DROP_LINE_GAP_PX * 2 + DROP_LINE_HEIGHT_PX;
const DROP_HYSTERESIS_PX = 12;

let dropIndicatorState = null;

function clearDropIndicators() {
  document.querySelectorAll('.task-drop-indicator').forEach((el) => el.remove());
  document.querySelectorAll('.session-drop-indicator').forEach((el) => el.remove());
  dropIndicatorState = null;
  sessionDropIndicatorState = null;
}

function getInsertAtForTaskPosition(listId, taskIndex, task, insertBefore) {
  const isSession = listId === 'session';
  const isCompleted = isSession && task.completed;
  if (isSession && isCompleted) {
    if (insertBefore) return getSessionActiveInsertIndex();
    return taskIndex + 1;
  }
  return insertBefore ? taskIndex : taskIndex + 1;
}

function showDropIndicatorAbsolute(listEl, top, insertAt) {
  let indicator = listEl.querySelector('.task-drop-indicator');
  if (!indicator) {
    indicator = document.createElement('li');
    indicator.className = 'task-drop-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    listEl.appendChild(indicator);
  }
  const topPx = `${top}px`;
  if (indicator.dataset.insertAt === String(insertAt) && indicator.style.top === topPx) return;
  indicator.dataset.insertAt = String(insertAt);
  indicator.style.top = topPx;
}

function getInsertIndexFromIndicator(listEl, listId) {
  const indicator = listEl.querySelector('.task-drop-indicator');
  if (indicator?.dataset.insertAt != null) {
    return Number(indicator.dataset.insertAt);
  }
  return getListEndInsertIndex(listEl, listId);
}

function makeDropGap(insertAt, gapStart, gapEnd, centerY) {
  const gapSize = Math.max(0, gapEnd - gapStart);
  const top = gapStart + (gapSize - DROP_LINE_SLOT_PX) / 2;
  return { insertAt, centerY, top };
}

function buildDropGaps(listEl, listId) {
  const taskItems = [...listEl.querySelectorAll(':scope > .task-item')];
  if (taskItems.length === 0) {
    const listRect = listEl.getBoundingClientRect();
    return [{ insertAt: 0, centerY: listRect.top, top: 0 }];
  }

  const gaps = [];
  const first = taskItems[0];
  const firstIndex = Number(first.dataset.taskIndex);
  const firstTask = getTasksForList(listId)[firstIndex];
  const firstRect = first.getBoundingClientRect();
  const beforeFirstEnd = first.offsetTop;
  const beforeFirstStart = Math.max(0, beforeFirstEnd - DROP_LINE_SLOT_PX);
  gaps.push(makeDropGap(
    getInsertAtForTaskPosition(listId, firstIndex, firstTask, true),
    beforeFirstStart,
    beforeFirstEnd,
    firstRect.top - DROP_LINE_SLOT_PX / 2,
  ));

  for (let i = 0; i < taskItems.length - 1; i += 1) {
    const curr = taskItems[i];
    const next = taskItems[i + 1];
    const nextIndex = Number(next.dataset.taskIndex);
    const nextTask = getTasksForList(listId)[nextIndex];
    const currRect = curr.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const gapStart = curr.offsetTop + curr.offsetHeight;
    const gapEnd = next.offsetTop;
    gaps.push(makeDropGap(
      getInsertAtForTaskPosition(listId, nextIndex, nextTask, true),
      gapStart,
      gapEnd,
      (currRect.bottom + nextRect.top) / 2,
    ));
  }

  const last = taskItems[taskItems.length - 1];
  const lastRect = last.getBoundingClientRect();
  const afterLastStart = last.offsetTop + last.offsetHeight;
  const afterLastEnd = afterLastStart + DROP_LINE_SLOT_PX;
  gaps.push(makeDropGap(
    getListEndInsertIndex(listEl, listId),
    afterLastStart,
    afterLastEnd,
    lastRect.bottom + DROP_LINE_SLOT_PX / 2,
  ));

  return gaps;
}

function showSessionDropIndicator(listEl, top, insertAt) {
  let indicator = listEl.querySelector('.session-drop-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'session-drop-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    listEl.appendChild(indicator);
  }
  const topPx = `${top}px`;
  if (indicator.dataset.insertAt === String(insertAt) && indicator.style.top === topPx) return;
  indicator.dataset.insertAt = String(insertAt);
  indicator.style.top = topPx;
}

function buildSessionDropGaps(listEl) {
  const blocks = [...listEl.querySelectorAll(':scope > .planned-session')];
  if (blocks.length <= 1) return [];

  const gaps = [];
  for (let i = 0; i < blocks.length - 1; i += 1) {
    const curr = blocks[i];
    const next = blocks[i + 1];
    const currRect = curr.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const gapStart = curr.offsetTop + curr.offsetHeight;
    const gapEnd = next.offsetTop;
    gaps.push(makeDropGap(
      i + 1,
      gapStart,
      gapEnd,
      (currRect.bottom + nextRect.top) / 2,
    ));
  }

  const last = blocks[blocks.length - 1];
  const lastRect = last.getBoundingClientRect();
  const afterLastStart = last.offsetTop + last.offsetHeight;
  const afterLastEnd = afterLastStart + DROP_LINE_SLOT_PX;
  gaps.push(makeDropGap(
    blocks.length,
    afterLastStart,
    afterLastEnd,
    lastRect.bottom + DROP_LINE_SLOT_PX / 2,
  ));

  return gaps;
}

function pickSessionDropGap(gaps, clientY, listEl) {
  let closest = gaps[0];
  let closestDist = Math.abs(clientY - closest.centerY);
  for (let i = 1; i < gaps.length; i += 1) {
    const dist = Math.abs(clientY - gaps[i].centerY);
    if (dist < closestDist) {
      closest = gaps[i];
      closestDist = dist;
    }
  }

  if (sessionDropIndicatorState?.listEl === listEl) {
    const currentDist = Math.abs(clientY - sessionDropIndicatorState.centerY);
    if (closest.insertAt !== sessionDropIndicatorState.insertAt
      && closestDist + DROP_HYSTERESIS_PX >= currentDist) {
      return sessionDropIndicatorState;
    }
  }

  return closest;
}

function updateSessionDropIndicator(listEl, clientY) {
  const gaps = buildSessionDropGaps(listEl);
  if (gaps.length === 0) return;
  const chosen = pickSessionDropGap(gaps, clientY, listEl);
  sessionDropIndicatorState = {
    listEl,
    insertAt: chosen.insertAt,
    top: chosen.top,
    centerY: chosen.centerY,
  };
  showSessionDropIndicator(listEl, chosen.top, chosen.insertAt);
}

function getSessionInsertIndexFromDrop(listEl) {
  const indicator = listEl.querySelector('.session-drop-indicator');
  if (indicator?.dataset.insertAt != null) {
    return Number(indicator.dataset.insertAt);
  }
  return state.plannedSessions.length;
}

function setupPlannedSessionsReorder() {
  if (!plannedSessionsList || plannedSessionsList.dataset.reorderSetup) return;
  plannedSessionsList.dataset.reorderSetup = 'true';

  plannedSessionsList.addEventListener('dragover', (e) => {
    if (!isSessionReorderDragActive()) return;
    e.preventDefault();
    updateSessionDropIndicator(plannedSessionsList, e.clientY);
  });

  plannedSessionsList.addEventListener('dragleave', (e) => {
    if (!plannedSessionsList.contains(e.relatedTarget)) {
      document.querySelectorAll('.session-drop-indicator').forEach((el) => el.remove());
      sessionDropIndicatorState = null;
    }
  });

  plannedSessionsList.addEventListener('drop', (e) => {
    if (!isSessionReorderDragActive()) return;
    e.preventDefault();
    const sessionId = decodeSessionReorderPayload(e.dataTransfer.getData('text/plain'));
    if (!sessionId) {
      clearDropIndicators();
      sessionReorderDragId = null;
      return;
    }
    const insertAt = getSessionInsertIndexFromDrop(plannedSessionsList);
    clearDropIndicators();
    sessionReorderDragId = null;
    movePlannedSession(sessionId, insertAt);
  });
}

function pickDropGap(gaps, clientY, listEl) {
  let closest = gaps[0];
  let closestDist = Math.abs(clientY - closest.centerY);
  for (let i = 1; i < gaps.length; i += 1) {
    const dist = Math.abs(clientY - gaps[i].centerY);
    if (dist < closestDist) {
      closest = gaps[i];
      closestDist = dist;
    }
  }

  if (dropIndicatorState?.listEl === listEl) {
    const currentDist = Math.abs(clientY - dropIndicatorState.centerY);
    if (closest.insertAt !== dropIndicatorState.insertAt
      && closestDist + DROP_HYSTERESIS_PX >= currentDist) {
      return dropIndicatorState;
    }
  }

  return closest;
}

function updateListDropIndicator(listEl, listId, clientY) {
  const chosen = pickDropGap(buildDropGaps(listEl, listId), clientY, listEl);
  dropIndicatorState = {
    listEl,
    insertAt: chosen.insertAt,
    top: chosen.top,
    centerY: chosen.centerY,
  };
  showDropIndicatorAbsolute(listEl, chosen.top, chosen.insertAt);
}

function getListEndInsertIndex(listEl, listId) {
  if (listId !== 'session') return getTasksForList(listId).length;
  const taskItems = [...listEl.querySelectorAll(':scope > .task-item')];
  const lastItem = taskItems[taskItems.length - 1];
  if (lastItem?.classList.contains('task-item--completed')) {
    return getTasksForList(listId).length;
  }
  return getSessionActiveInsertIndex();
}

function getInsertIndexFromListDrop(listEl, listId) {
  return getInsertIndexFromIndicator(listEl, listId);
}

function setupListDropZone(listEl, listId) {
  listEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    updateListDropIndicator(listEl, listId, e.clientY);
  });
  listEl.addEventListener('dragleave', (e) => {
    if (!listEl.contains(e.relatedTarget)) {
      clearDropIndicators();
    }
  });
  listEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (decodeSessionReorderPayload(e.dataTransfer.getData('text/plain'))) {
      clearDropIndicators();
      return;
    }
    const payload = decodeDragPayload(e.dataTransfer.getData('text/plain'));
    if (!payload) {
      clearDropIndicators();
      return;
    }
    const insertAt = getInsertIndexFromListDrop(listEl, listId);
    clearDropIndicators();
    moveTasks(payload.items, listId, insertAt);
  });
}

function setupListSelectionClear(listEl) {
  listEl.addEventListener('click', (e) => {
    if (e.target.closest('.task-item')) return;
    clearSelection();
  });
}

function clearSessionExpandTimer() {
  if (sessionExpandTimer) {
    clearTimeout(sessionExpandTimer);
    sessionExpandTimer = null;
  }
}

function setupSessionHeaderDropZone(sessionBlock, listId, sessionId, isExpanded) {
  const header = sessionBlock.querySelector('.planned-session-header');
  if (!header) return;

  header.addEventListener('dragover', (e) => {
    if (isSessionReorderDragActive()) return;
    e.preventDefault();
    e.stopPropagation();
    header.classList.add('drag-over-session');
    if (!isExpanded) {
      clearSessionExpandTimer();
      sessionExpandTimer = setTimeout(() => {
        sessionExpandTimer = null;
        expandSession(sessionId);
      }, SESSION_EXPAND_DELAY_MS);
    }
  });

  header.addEventListener('dragleave', (e) => {
    if (!header.contains(e.relatedTarget)) {
      header.classList.remove('drag-over-session');
      clearSessionExpandTimer();
    }
  });

  header.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    header.classList.remove('drag-over-session');
    clearSessionExpandTimer();
    if (decodeSessionReorderPayload(e.dataTransfer.getData('text/plain'))) return;
    const payload = decodeDragPayload(e.dataTransfer.getData('text/plain'));
    if (!payload) return;
    moveTasks(payload.items, listId, getTasksForList(listId).length);
  });
}

function hideTaskContextMenu() {
  taskContextMenu.classList.add('hidden');
  taskContextMenu.style.visibility = '';
  taskContextMenuTarget = null;
}

function hideSessionContextMenu() {
  sessionContextMenu.classList.add('hidden');
  sessionContextMenu.style.visibility = '';
  sessionContextMenuTarget = null;
}

function hideAllContextMenus() {
  hideTaskContextMenu();
  hideSessionContextMenu();
}

function positionContextMenu(menuEl, clientX, clientY) {
  menuEl.classList.remove('hidden');
  menuEl.style.visibility = 'hidden';
  menuEl.style.left = '0px';
  menuEl.style.top = '0px';

  const menuRect = menuEl.getBoundingClientRect();
  const padding = 8;
  let x = clientX;
  let y = clientY;

  if (x + menuRect.width > window.innerWidth - padding) {
    x = window.innerWidth - menuRect.width - padding;
  }
  if (y + menuRect.height > window.innerHeight - padding) {
    y = window.innerHeight - menuRect.height - padding;
  }

  menuEl.style.left = `${Math.max(padding, x)}px`;
  menuEl.style.top = `${Math.max(padding, y)}px`;
  menuEl.style.visibility = 'visible';
}

function showTaskContextMenu(e, listId, taskIndex) {
  e.preventDefault();
  e.stopPropagation();
  hideSessionContextMenu();
  hideTemplateAutocomplete();
  taskContextMenuTarget = { listId, taskIndex };
  positionContextMenu(taskContextMenu, e.clientX, e.clientY);
}

function showSessionContextMenu(e, sessionId) {
  e.preventDefault();
  e.stopPropagation();
  hideTaskContextMenu();
  hideTemplateAutocomplete();
  sessionContextMenuTarget = { sessionId };
  positionContextMenu(sessionContextMenu, e.clientX, e.clientY);
}

function addAllFromSession(sessionId) {
  const session = getPlannedSession(sessionId);
  if (!session || session.tasks.length === 0) return;

  const sourceMeta = getSourceMetaFromSession(session);
  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    ...session.tasks.map((task) => toSessionTaskFromBraindump(task, sourceMeta)),
  );
  session.tasks = [];
  persist();
  renderEditView();
}

function appendQueueGroupHeader(listEl, task) {
  const li = document.createElement('li');
  li.className = 'queue-session-group-header';
  li.innerHTML = `
    <span class="queue-session-group-name">${escapeHtml(task.sourceSessionName || 'Session')}</span>
  `;
  listEl.appendChild(li);
}

function renderTaskList(listEl, listId) {
  listEl.innerHTML = '';
  const isSession = listId === 'session';
  const isPlanned = isPlannedList(listId);
  const tasks = getTasksForList(listId);
  const indices = isSession
    ? getSessionEditIndices()
    : tasks.map((_, index) => index);
  const incompleteCount = isSession ? getSessionIncompleteIndices().length : 0;
  let previousSourceSessionId;

  indices.forEach((taskIndex, displayIndex) => {
    const task = tasks[taskIndex];
    if (isSession && task.sourceSessionId && task.sourceSessionId !== previousSourceSessionId) {
      appendQueueGroupHeader(listEl, task);
      previousSourceSessionId = task.sourceSessionId;
    } else if (isSession && task.sourceSessionId) {
      previousSourceSessionId = task.sourceSessionId;
    }

    const isCompleted = isSession && task.completed;
    const li = document.createElement('li');
    li.className = `task-item task-item--${isSession ? 'session' : 'planned'}`;
    if (isCompleted) li.classList.add('task-item--completed');
    if (isCompleted && displayIndex === incompleteCount && incompleteCount > 0) {
      li.classList.add('task-item--completed-first');
    }
    li.draggable = !isCompleted;
    li.dataset.listId = listId;
    li.dataset.taskIndex = String(taskIndex);
    if (state.selectedTasks.has(task)) {
      li.classList.add('selected');
    }

    const limitFieldHtml = isSession ? getEditTaskTimeHtml(task, isCompleted) : '';
    const limitBadgeHtml = isPlanned && task.limitMs
      ? `<span class="task-limit-badge">${formatLimitField(task.limitMs)}</span>`
      : '';
    const moveToSessionHtml = isSession
      ? ''
      : `<button class="task-move-to-session" type="button" title="Move to queue" aria-label="Move to queue">
          <span class="task-arrow"></span>
        </button>`;
    const leadControlHtml = isSession
      ? `<button class="task-move-to-braindump" type="button" title="Move to planned session" aria-label="Move to planned session">
          <span class="task-arrow task-arrow--back"></span>
        </button>`
      : '';

    li.innerHTML = `
      ${leadControlHtml}
      <span class="task-text">${escapeHtml(task.text)}</span>
      ${limitFieldHtml}
      ${limitBadgeHtml}
      ${moveToSessionHtml}
    `;

    li.querySelector('.task-text').addEventListener('dblclick', () => {
      startEditingTask(li, listId, taskIndex);
    });
    li.addEventListener('contextmenu', (e) => {
      showTaskContextMenu(e, listId, taskIndex);
    });
    li.addEventListener('click', (e) => {
      if (e.target.closest('button, input, .task-limit-badge')) return;
      playClickSound();
      if (e.metaKey || e.ctrlKey) {
        toggleSelection(task, listId);
      } else {
        selectOnly(task, listId);
      }
    });

    if (isPlanned) {
      const moveBtn = li.querySelector('.task-move-to-session');
      moveBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      moveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTask(listId, taskIndex, 'session', getSessionActiveInsertIndex());
      });
    }

    if (isSession) {
      const moveBackBtn = li.querySelector('.task-move-to-braindump');
      moveBackBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      moveBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetListId = getSourceListIdForTask(task);
        moveTask('session', taskIndex, targetListId, getTasksForList(targetListId).length);
      });

      const limitInput = li.querySelector('.task-limit-input');
      if (!isCompleted && limitInput) {
        const saveLimit = () => {
          state.sessionTasks[taskIndex].limitMs = parseManualLimit(limitInput.value);
          persist();
          renderEditView();
        };
        limitInput.addEventListener('mousedown', (e) => e.stopPropagation());
        limitInput.addEventListener('blur', saveLimit);
        limitInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') limitInput.blur();
        });
      }
    }

    li.addEventListener('dragstart', (e) => {
      if (isCompleted || e.target.closest('button, input')) {
        e.preventDefault();
        return;
      }
      const dragItems = getDragItems(listId, taskIndex);
      li.classList.add('dragging');
      if (dragItems.length > 1) {
        document.querySelectorAll('.task-item.selected').forEach((el) => el.classList.add('dragging'));
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', encodeDragPayload(dragItems));
    });
    li.addEventListener('dragend', () => {
      document.querySelectorAll('.task-item.dragging').forEach((el) => el.classList.remove('dragging'));
      clearSessionExpandTimer();
      clearDropIndicators();
      document.querySelectorAll('.planned-session-header.drag-over-session').forEach((el) => {
        el.classList.remove('drag-over-session');
      });
    });

    listEl.appendChild(li);
  });
}

function renderPlannedSessionName(session, isExpanded) {
  const isRenaming = state.renamingSessionId === session.id && session.id !== BRAINDUMP_SESSION_ID;
  if (isRenaming) {
    return `<input
      class="planned-session-name-input"
      type="text"
      value="${escapeHtml(session.name)}"
      data-session-id="${escapeHtml(session.id)}"
      aria-label="Session name"
    />`;
  }
  return `<span class="planned-session-name">${escapeHtml(session.name)}</span>`;
}

function renderPlannedSessionDeleteButton(session) {
  if (session.id === BRAINDUMP_SESSION_ID) return '';
  return `<button class="planned-session-delete-btn" type="button" aria-label="Delete session" title="Delete session">×</button>`;
}

function renderSessionAddTask(session) {
  const isOpen = state.activeAddSessionIds.has(session.id);
  const tutorialAttr = session.id === BRAINDUMP_SESSION_ID ? ' data-tutorial="new-task"' : '';
  if (!isOpen) {
    return `
      <button type="button" class="session-add-task-trigger" data-session-id="${escapeHtml(session.id)}"${tutorialAttr}>
        <span class="session-add-task-trigger-icon" aria-hidden="true">+</span>
        <span>NEW TASK</span>
      </button>
    `;
  }

  return `
    <form class="session-add-task-form" data-session-id="${escapeHtml(session.id)}"${tutorialAttr}>
      <input
        type="text"
        class="session-add-task-input"
        placeholder="New task"
        autocomplete="off"
        spellcheck="true"
      />
      <input
        type="text"
        class="session-add-limit-input limit-input"
        placeholder="20m"
        title="Optional time limit"
        autocomplete="off"
      />
    </form>
  `;
}

function setupSessionAddTask(block, session) {
  const trigger = block.querySelector('.session-add-task-trigger');
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openSessionAddForm(session.id);
      state.addFocusSessionId = session.id;
      renderEditView();
    });
    return;
  }

  const form = block.querySelector('.session-add-task-form');
  if (!form) return;

  const textInput = form.querySelector('.session-add-task-input');
  const limitInput = form.querySelector('.session-add-limit-input');

  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;

    const meta = e.metaKey || e.ctrlKey || e.getModifierState('Meta') || e.getModifierState('Control');
    const shift = e.shiftKey || e.getModifierState('Shift');
    if (shift && meta) return;
    if (shift && !meta) return;

    if (isSlashInput(textInput.value)) {
      e.preventDefault();
      e.stopPropagation();
      applyTemplateFromInput(textInput, session.id, { toQueue: meta });
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (meta) {
      submitPlannedTaskToQueue(session.id, textInput.value, limitInput.value);
      return;
    }

    submitPlannedSessionTask(session.id, textInput.value, limitInput.value);
  });

  textInput.addEventListener('input', () => {
    updateTemplateAutocomplete(textInput, session.id);
  });

  textInput.addEventListener('keydown', (e) => {
    if (templateAutocompleteState?.inputEl === textInput && !templateAutocomplete.classList.contains('hidden')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        moveTemplateAutocompleteHighlight(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        moveTemplateAutocompleteHighlight(-1);
        return;
      }
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        const meta = e.metaKey || e.ctrlKey || e.getModifierState('Meta') || e.getModifierState('Control');
        e.preventDefault();
        e.stopPropagation();
        applyTemplateFromInput(textInput, session.id, { toQueue: meta });
        return;
      }
    }

    if (e.key === 'Escape') {
      if (templateAutocompleteState?.inputEl === textInput && !templateAutocomplete.classList.contains('hidden')) {
        e.preventDefault();
        e.stopPropagation();
        hideTemplateAutocomplete();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      closeSessionAddForm(session.id);
      renderEditView();
    }
  });

  limitInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeSessionAddForm(session.id);
      renderEditView();
    }
  });
}

function renderPlannedSessions() {
  plannedSessionsList.innerHTML = '';

  state.plannedSessions.forEach((session, sessionIndex) => {
    const isExpanded = isSessionExpanded(session.id);
    const listId = listIdForSession(session.id);
    const block = document.createElement('div');
    block.className = `planned-session ${isExpanded ? 'planned-session--expanded' : 'planned-session--collapsed'}`;
    block.dataset.sessionId = session.id;
    const sendLabel = `Send all tasks from ${session.name} to Queue`;
    const sendTutorialAttr = sessionIndex === 0 ? ' data-tutorial="send-all-queue"' : '';

    block.innerHTML = `
      <div class="planned-session-header">
        <button class="planned-session-toggle" type="button" aria-expanded="${isExpanded}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${escapeHtml(session.name)}">
          <span class="planned-session-toggle-icon" aria-hidden="true"></span>
        </button>
        ${renderPlannedSessionName(session, isExpanded)}
        ${renderSessionEarningsBadge(session)}
        <div class="planned-session-header-actions">
          ${renderPlannedSessionDeleteButton(session)}
          ${renderSessionBillableButton(session, sessionIndex === 0 ? 'billable' : null)}
          <button
            type="button"
            class="session-send-to-queue-btn"
            data-session-id="${escapeHtml(session.id)}"
            ${sendTutorialAttr}
            ${session.tasks.length === 0 ? 'disabled' : ''}
            title="${escapeHtml(sendLabel)}"
            aria-label="${escapeHtml(sendLabel)}"
          ><span class="task-arrow" aria-hidden="true"></span></button>
        </div>
      </div>
      <div class="planned-session-body">
        <ul class="task-list" data-list="${escapeHtml(listId)}"></ul>
        <div class="planned-session-footer">
          <div class="session-add-task">
            ${renderSessionAddTask(session)}
          </div>
        </div>
      </div>
    `;

    const toggleBtn = block.querySelector('.planned-session-toggle');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSession(session.id);
    });

    const header = block.querySelector('.planned-session-header');
    if (session.id !== BRAINDUMP_SESSION_ID) {
      header.setAttribute('draggable', 'true');
      header.addEventListener('dragstart', (e) => {
        if (e.target.closest('button, input, .planned-session-name-input')) {
          e.preventDefault();
          return;
        }
        sessionReorderDragId = session.id;
        block.classList.add('dragging-session');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', encodeSessionReorderPayload(session.id));
      });
    }

    block.addEventListener('dragend', () => {
      block.classList.remove('dragging-session');
      sessionReorderDragId = null;
      clearDropIndicators();
      document.querySelectorAll('.planned-session-header.drag-over-session').forEach((el) => {
        el.classList.remove('drag-over-session');
      });
    });

    header.addEventListener('click', (e) => {
      if (e.target.closest('.planned-session-name-input, .planned-session-toggle, .planned-session-delete-btn, .session-billable-btn, .session-send-to-queue-btn')) return;
      if (!isExpanded) expandSession(session.id);
    });
    header.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.planned-session-name-input, .planned-session-toggle, .planned-session-delete-btn, .session-billable-btn, .session-send-to-queue-btn')) return;
      showSessionContextMenu(e, session.id);
    });

    const deleteBtn = block.querySelector('.planned-session-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteSessionModal(session.id);
      });
    }

    const sendBtn = block.querySelector('.session-send-to-queue-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addAllFromSession(session.id);
      });
    }

    const billableBtn = block.querySelector('.session-billable-btn');
    if (billableBtn) {
      billableBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBillableModal(session.id);
      });
    }

    const nameInput = block.querySelector('.planned-session-name-input');
    if (nameInput) {
      const saveName = () => savePlannedSessionName(session.id, nameInput.value);
      nameInput.addEventListener('blur', saveName);
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameInput.blur();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          state.renamingSessionId = null;
          renderEditView();
        }
      });
      requestAnimationFrame(() => {
        nameInput.focus();
        nameInput.select();
      });
    } else if (session.id !== BRAINDUMP_SESSION_ID) {
      const nameEl = block.querySelector('.planned-session-name');
      nameEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        state.renamingSessionId = session.id;
        renderEditView();
      });
    }

    const listEl = block.querySelector('.task-list');
    setupSessionHeaderDropZone(block, listId, session.id, isExpanded);
    if (isExpanded) {
      renderTaskList(listEl, listId);
      setupListDropZone(listEl, listId);
      setupListSelectionClear(listEl);
      setupSessionAddTask(block, session);
    }

    plannedSessionsList.appendChild(block);
  });

  setupPlannedSessionsReorder();
  restoreSessionAddFocus();
}

function restoreSessionAddFocus() {
  if (!state.addFocusSessionId || state.renamingSessionId) return;
  const sessionId = state.addFocusSessionId;
  state.addFocusSessionId = null;
  requestAnimationFrame(() => {
    const input = plannedSessionsList.querySelector(
      `.session-add-task-form[data-session-id="${sessionId}"] .session-add-task-input`,
    );
    input?.focus();
  });
}

function isSettingsUiOpen() {
  return !settingsMenu.classList.contains('hidden')
    || !shortcutsModal.classList.contains('hidden')
    || !dataModal.classList.contains('hidden')
    || !invoiceSettingsModal.classList.contains('hidden')
    || !historyModal.classList.contains('hidden')
    || !templatesModal.classList.contains('hidden')
    || !saveTemplateModal.classList.contains('hidden')
    || !billableModal.classList.contains('hidden');
}

function formatRelativeBackupTime(timestamp) {
  if (!timestamp) return 'Not yet backed up';
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60000) return 'Just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

async function refreshDataModalStatus() {
  if (!dataModalStatus) return;
  const info = await window.slashIt.getDataInfo();
  dataModalStatus.textContent = `Last backed up: ${formatRelativeBackupTime(info.lastDocumentsBackupAt)}`;
}

function openDataModal() {
  hideSettingsMenu();
  dataModal.classList.remove('hidden');
  void refreshDataModalStatus();
}

function closeDataModal() {
  dataModal.classList.add('hidden');
}

function populateInvoiceSettingsForm() {
  invoiceSettingsFormLogoDataUrl = state.invoiceSettings.logoDataUrl || '';
  updateInvoiceSettingsAvatarPreview(invoiceSettingsFormLogoDataUrl);
  if (invoiceSettingsNameInput) {
    invoiceSettingsNameInput.value = state.invoiceSettings.name || '';
  }
  if (invoiceSettingsBusinessNameInput) {
    invoiceSettingsBusinessNameInput.value = state.invoiceSettings.businessName || '';
  }
  if (invoiceSettingsEmailInput) {
    invoiceSettingsEmailInput.value = state.invoiceSettings.email || '';
  }
  if (invoiceSettingsAddressInput) {
    invoiceSettingsAddressInput.value = state.invoiceSettings.address || '';
  }
}

function updateInvoiceSettingsAvatarPreview(logoDataUrl) {
  const hasLogo = !!logoDataUrl;
  if (invoiceSettingsAvatarPreview) {
    if (hasLogo) {
      invoiceSettingsAvatarPreview.src = logoDataUrl;
      invoiceSettingsAvatarPreview.classList.remove('hidden');
    } else {
      invoiceSettingsAvatarPreview.removeAttribute('src');
      invoiceSettingsAvatarPreview.classList.add('hidden');
    }
  }
  invoiceSettingsAvatarPlaceholder?.classList.toggle('hidden', hasLogo);
  invoiceSettingsAvatarRemoveBtn?.classList.toggle('hidden', !hasLogo);
}

const INVOICE_LOGO_MAX_FILE_BYTES = 10 * 1024 * 1024;
const INVOICE_LOGO_OUTPUT_SIZE = 1024;
const INVOICE_LOGO_ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function isAcceptedInvoiceLogoFile(file) {
  if (!file) return false;
  if (INVOICE_LOGO_ACCEPTED_TYPES.has(file.type)) return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name || '');
}

async function loadInvoiceLogoSource(file) {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error('Could not load the selected image.');
  }
}

async function processInvoiceLogoFile(file) {
  if (!isAcceptedInvoiceLogoFile(file)) {
    throw new Error('Please choose a PNG, JPEG, or WebP image.');
  }
  if (file.size > INVOICE_LOGO_MAX_FILE_BYTES) {
    throw new Error('That image is too large. Please choose a file under 10 MB.');
  }

  const source = await loadInvoiceLogoSource(file);
  const canvas = document.createElement('canvas');
  canvas.width = INVOICE_LOGO_OUTPUT_SIZE;
  canvas.height = INVOICE_LOGO_OUTPUT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) {
    source.close?.();
    throw new Error('Could not process the selected image.');
  }

  const scale = Math.max(
    INVOICE_LOGO_OUTPUT_SIZE / source.width,
    INVOICE_LOGO_OUTPUT_SIZE / source.height,
  );
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const offsetX = (INVOICE_LOGO_OUTPUT_SIZE - drawWidth) / 2;
  const offsetY = (INVOICE_LOGO_OUTPUT_SIZE - drawHeight) / 2;
  context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
  source.close?.();

  return canvas.toDataURL('image/png');
}

async function handleInvoiceSettingsAvatarChange() {
  const file = invoiceSettingsAvatarInput?.files?.[0];
  if (!file) return;

  try {
    invoiceSettingsFormLogoDataUrl = await processInvoiceLogoFile(file);
    updateInvoiceSettingsAvatarPreview(invoiceSettingsFormLogoDataUrl);
  } catch (err) {
    window.alert(err?.message || 'Could not use that image.');
  } finally {
    if (invoiceSettingsAvatarInput) {
      invoiceSettingsAvatarInput.value = '';
    }
  }
}

function handleInvoiceSettingsAvatarRemove() {
  invoiceSettingsFormLogoDataUrl = '';
  updateInvoiceSettingsAvatarPreview('');
  if (invoiceSettingsAvatarInput) {
    invoiceSettingsAvatarInput.value = '';
  }
}

function openInvoiceSettingsModal() {
  hideSettingsMenu();
  populateInvoiceSettingsForm();
  invoiceSettingsModal.classList.remove('hidden');
  invoiceSettingsNameInput?.focus();
}

function closeInvoiceSettingsModal() {
  invoiceSettingsModal.classList.add('hidden');
}

function saveInvoiceSettingsModal() {
  state.invoiceSettings = normalizeInvoiceSettings({
    name: invoiceSettingsNameInput?.value || '',
    logoDataUrl: invoiceSettingsFormLogoDataUrl,
    businessName: invoiceSettingsBusinessNameInput?.value || '',
    email: invoiceSettingsEmailInput?.value || '',
    address: invoiceSettingsAddressInput?.value || '',
  });
  persist();
  closeInvoiceSettingsModal();
}

async function handleBackupNow() {
  dataBackupNowBtn.disabled = true;
  try {
    const result = await window.slashIt.backupDataNow();
    dataModalStatus.textContent = `Last backed up: ${formatRelativeBackupTime(result.lastDocumentsBackupAt)}`;
  } finally {
    dataBackupNowBtn.disabled = false;
  }
}

async function handleRestoreFromBackup() {
  const result = await window.slashIt.restoreDataFromFile();
  if (result.canceled) return;
  if (result.error) {
    window.alert(result.error);
    return;
  }
  closeDataModal();
  await applyRestoredData(result.data);
}

async function handleOpenBackupFolder() {
  await window.slashIt.openDocumentsDataFolder();
}

function positionSettingsMenu() {
  const btnRect = settingsBtn.getBoundingClientRect();
  const menuRect = settingsMenu.getBoundingClientRect();
  const padding = 8;
  let left = btnRect.right - menuRect.width;
  let top = btnRect.bottom + 6;

  if (left < padding) left = padding;
  if (left + menuRect.width > window.innerWidth - padding) {
    left = window.innerWidth - menuRect.width - padding;
  }
  if (top + menuRect.height > window.innerHeight - padding) {
    top = btnRect.top - menuRect.height - 6;
  }

  settingsMenu.style.left = `${left}px`;
  settingsMenu.style.top = `${top}px`;
}

function updateSettingsSoundEffectsMenuItem() {
  const enabled = window.slashItSounds.isEnabled();
  settingsSoundEffectsBtn.setAttribute('aria-checked', enabled ? 'true' : 'false');
  settingsSoundEffectsStatus.textContent = enabled ? 'On' : 'Off';
  settingsSoundEffectsStatus.classList.toggle('settings-menu-item-note--on', enabled);
}

function toggleSoundEffects() {
  window.slashItSounds.setEnabled(!window.slashItSounds.isEnabled());
  updateSettingsSoundEffectsMenuItem();
  persist();
}

function showSettingsMenu() {
  updateSettingsSoundEffectsMenuItem();
  settingsMenu.classList.remove('hidden');
  settingsBtn.setAttribute('aria-expanded', 'true');
  positionSettingsMenu();
}

function hideSettingsMenu() {
  settingsMenu.classList.add('hidden');
  settingsBtn.setAttribute('aria-expanded', 'false');
}

function toggleSettingsMenu() {
  if (settingsMenu.classList.contains('hidden')) {
    hideAllContextMenus();
    hideTemplateAutocomplete();
    showSettingsMenu();
  } else {
    hideSettingsMenu();
  }
}

const TUTORIAL_STEPS = [
  {
    id: 'create-session',
    selector: '[data-tutorial="create-session"]',
    title: 'Spin up a new session!',
    body: 'Got a client project? A side hustle? A "finally organize the garage" vibe? Hit <strong>+ Create New Session</strong> and give your chaos a name. Future-you will send a thank-you note.',
  },
  {
    id: 'settings-menu',
    selector: '[data-tutorial="settings-menu"]',
    arrowPlacement: 'above-heading',
    title: 'Your command center',
    body: 'Tap the <strong>menu</strong> anytime for the good stuff: <strong>Templates</strong> for reusable task lists, <strong>Session history</strong> for past work and invoices, <strong>Personal Profile</strong> for your business info, <strong>Keyboard shortcuts</strong> for speed, <strong>Sound effects</strong> on/off, and <strong>Data &amp; backup</strong> to protect your progress. Replay this tour anytime from <strong>Tutorial</strong> at the bottom. More power features are landing soon — watch this space!',
  },
  {
    id: 'sessions-panel',
    selector: '[data-tutorial="sessions-panel"]',
    arrowPlacement: 'above-heading',
    title: 'Your idea parking lot',
    body: 'This is <strong>Sessions</strong> — Braindump lives here by default. Dump every task, thought, and "I should probably…" without overthinking order. Collect now, curate later!',
  },
  {
    id: 'new-task',
    selector: '[data-tutorial="new-task"]',
    title: 'Capture tasks FAST',
    body: 'Click <strong>+ NEW TASK</strong>, type what you need to do, optionally add a time cap like <strong>20m</strong> — or use natural language right in the task name, like <strong>Write proposal for 45 minutes</strong>. Then smash <strong>Enter</strong>. Pro move: type <strong>/</strong> for templates, or <strong>⌘ Enter</strong> to send the task straight into the Queue!',
  },
  {
    id: 'send-all-queue',
    selector: '[data-tutorial="send-all-queue"]',
    title: 'Bulk or cherry-pick — your call!',
    body: 'Ready to load up the Queue? Hit the <strong>→</strong> on a session header to move <strong>ALL</strong> its tasks at once (<strong>⌘ ⇧ Enter</strong> works too!). Only want one? Click the <strong>→</strong> on any individual task instead. Bulk blast or surgical strike — you pick.',
  },
  {
    id: 'billable',
    selector: '[data-tutorial="billable"]',
    title: 'Billable = get paid vibes',
    body: 'Freelancer mode: activate! Tap the <strong>$</strong> on any session to turn on billable tracking, set your <strong>hourly rate</strong>, and pick how to <strong>round up</strong> task time (10m, 15m, 30m — your call). Choose <strong>Per session</strong> or <strong>Per task</strong> to control when rounding applies. Slash through tasks and watch earnings stack up. Export invoices later from <strong>Session history</strong>!',
  },
  {
    id: 'queue-panel',
    selector: '[data-tutorial="queue-panel"]',
    arrowPlacement: 'above-heading',
    title: 'Your launch lineup',
    body: 'The <strong>Queue</strong> is your ordered hit list — drag to reorder, double-click to rename, right-click for duplicate/delete. What\'s on top is what you slash through first when you start.',
  },
  {
    id: 'move-back',
    selector: '[data-tutorial="move-back"]',
    title: 'Oops? Send it back!',
    body: 'Queue feeling wrong? <strong>Move back to list</strong> returns everything to where it came from (Braindump or its session). No shame — just a quick undo button for your planning brain.',
  },
  {
    id: 'start-session',
    selector: '[data-tutorial="start-session"]',
    title: 'GO TIME — Start Session',
    body: 'Queue locked in? Hit <strong>Start Session</strong> (or <strong>⇧ Enter</strong>) and watch the timer bar take over. One task at a time. Pure focus. Let\'s slash it!',
  },
  {
    id: 'clear-tasks',
    selector: '[data-tutorial="clear-tasks"]',
    title: 'Clean slate energy',
    body: 'Finished or need a reset? <strong>Clear tasks</strong> wipes completed items or the whole Queue. Declutter so the next session starts fresh.',
  },
];

let tutorialActiveStepId = null;
let tutorialVisitedSteps = new Set();
let tutorialTooltipHideTimeout = null;

const TUTORIAL_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h12"/><path d="M13 6l6 6-6 6"/></svg>';
const TUTORIAL_ARROW_OFFSET = 10;

function getTutorialArrowJitter(stepId, maxPx) {
  let hash = 0;
  for (let i = 0; i < stepId.length; i += 1) {
    hash += stepId.charCodeAt(i);
  }
  return ((hash % 100) / 100 - 0.5) * 2 * maxPx;
}

function getTutorialArrowPlacement(rect, step) {
  const stepId = step.id;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (step.arrowPlacement === 'above-heading') {
    return {
      x: cx,
      y: rect.top - TUTORIAL_ARROW_OFFSET,
      direction: 'down',
      targetX: cx,
      targetY: cy,
    };
  }

  const padding = 20;
  const space = {
    top: cy - padding,
    bottom: window.innerHeight - cy - padding,
    left: cx - padding,
    right: window.innerWidth - cx - padding,
  };
  const bestSide = Object.entries(space).sort((a, b) => b[1] - a[1])[0][0];

  let x;
  let y;
  let direction;

  switch (bestSide) {
    case 'top':
      x = cx + getTutorialArrowJitter(stepId, 8);
      y = rect.top - TUTORIAL_ARROW_OFFSET;
      direction = 'down';
      break;
    case 'bottom':
      x = cx + getTutorialArrowJitter(stepId, 8);
      y = rect.bottom + TUTORIAL_ARROW_OFFSET;
      direction = 'up';
      break;
    case 'left':
      x = rect.left - TUTORIAL_ARROW_OFFSET;
      y = cy + getTutorialArrowJitter(stepId, 6);
      direction = 'right';
      break;
    default:
      x = rect.right + TUTORIAL_ARROW_OFFSET;
      y = cy + getTutorialArrowJitter(stepId, 6);
      direction = 'left';
      break;
  }

  return {
    x,
    y,
    direction,
    targetX: cx,
    targetY: cy,
  };
}

function isTutorialActive() {
  return tutorialOverlay && !tutorialOverlay.classList.contains('hidden');
}

function getTutorialTarget(step) {
  return document.querySelector(step.selector);
}

function hideTutorialTooltip() {
  clearTimeout(tutorialTooltipHideTimeout);
  tutorialTooltipHideTimeout = null;
  tutorialTooltip.classList.add('hidden');
  tutorialActiveStepId = null;
}

function scheduleHideTutorialTooltip() {
  clearTimeout(tutorialTooltipHideTimeout);
  tutorialTooltipHideTimeout = setTimeout(hideTutorialTooltip, 120);
}

function cancelHideTutorialTooltip() {
  clearTimeout(tutorialTooltipHideTimeout);
  tutorialTooltipHideTimeout = null;
}

function positionTutorialTooltip(anchorX, anchorY) {
  tutorialTooltip.classList.remove('hidden');
  tutorialTooltip.style.left = '0px';
  tutorialTooltip.style.top = '0px';
  const padding = 12;
  const gap = 16;
  const tooltipRect = tutorialTooltip.getBoundingClientRect();
  let left = anchorX - tooltipRect.width / 2;
  let top = anchorY + gap;

  if (left < padding) left = padding;
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  if (top + tooltipRect.height > window.innerHeight - padding - 28) {
    top = anchorY - tooltipRect.height - gap;
  }
  if (top < padding) top = padding;

  tutorialTooltip.style.left = `${left}px`;
  tutorialTooltip.style.top = `${top}px`;
}

function refreshTutorialTooltipPosition() {
  if (!tutorialActiveStepId || tutorialTooltip.classList.contains('hidden')) return;
  const step = TUTORIAL_STEPS.find((s) => s.id === tutorialActiveStepId);
  if (!step) return;
  const target = getTutorialTarget(step);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  positionTutorialTooltip(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function showTutorialTooltip(stepId, anchorX, anchorY) {
  const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
  if (!step) return;
  tutorialActiveStepId = stepId;
  tutorialVisitedSteps.add(stepId);
  tutorialTooltipTitle.textContent = step.title;
  tutorialTooltipBody.innerHTML = step.body;
  positionTutorialTooltip(anchorX, anchorY);
  tutorialDots.querySelectorAll('.tutorial-arrow').forEach((arrow) => {
    arrow.classList.toggle('tutorial-arrow--visited', tutorialVisitedSteps.has(arrow.dataset.tutorialStep));
  });
}

function positionTutorialDots() {
  if (!isTutorialActive()) return;

  tutorialDots.innerHTML = '';

  TUTORIAL_STEPS.forEach((step) => {
    const target = getTutorialTarget(step);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const { x, y, direction, targetX, targetY } = getTutorialArrowPlacement(rect, step);

    const arrow = document.createElement('div');
    arrow.className = `tutorial-arrow tutorial-arrow--${direction}`;
    if (tutorialVisitedSteps.has(step.id)) {
      arrow.classList.add('tutorial-arrow--visited');
    }
    arrow.dataset.tutorialStep = step.id;
    arrow.setAttribute('role', 'note');
    arrow.setAttribute('aria-label', step.title);
    arrow.style.left = `${x}px`;
    arrow.style.top = `${y}px`;
    arrow.innerHTML = `<span class="tutorial-arrow-icon">${TUTORIAL_ARROW_SVG}</span>`;
    arrow.addEventListener('mouseenter', () => {
      cancelHideTutorialTooltip();
      showTutorialTooltip(step.id, targetX, targetY);
    });
    arrow.addEventListener('mouseleave', scheduleHideTutorialTooltip);
    tutorialDots.appendChild(arrow);
  });

  refreshTutorialTooltipPosition();
}

function stopTutorial() {
  if (!tutorialOverlay) return;
  tutorialOverlay.classList.add('hidden');
  tutorialOverlay.setAttribute('aria-hidden', 'true');
  hideTutorialTooltip();
  tutorialVisitedSteps = new Set();
  tutorialDots.innerHTML = '';
  window.removeEventListener('resize', positionTutorialDots);
}

function startTutorial() {
  hideSettingsMenu();
  if (!state.expandedSessionIds.has(BRAINDUMP_SESSION_ID)) {
    state.expandedSessionIds.add(BRAINDUMP_SESSION_ID);
  }
  state.activeAddSessionIds.delete(BRAINDUMP_SESSION_ID);
  tutorialActiveStepId = null;
  tutorialVisitedSteps = new Set();
  hideTutorialTooltip();
  renderEditView();
  tutorialOverlay.classList.remove('hidden');
  tutorialOverlay.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => positionTutorialDots());
  window.addEventListener('resize', positionTutorialDots);
}

function openShortcutsModal() {
  hideSettingsMenu();
  shortcutsModal.classList.remove('hidden');
}

function closeShortcutsModal() {
  shortcutsModal.classList.add('hidden');
}

function getHistoryTaskStatusLabel(status) {
  if (status === 'skipped') return 'Skipped';
  if (status === 'incomplete') return 'Incomplete';
  return '';
}

function renderHistoryTaskItem(task, entryId, taskIndex) {
  const statusClass = task.status === 'skipped'
    ? 'history-task-item--skipped'
    : task.status === 'incomplete'
      ? 'history-task-item--incomplete'
      : '';
  const statusLabel = getHistoryTaskStatusLabel(task.status);
  const suffix = statusLabel ? ` (${statusLabel})` : '';
  const durationValue = escapeHtml(formatLimitField(task.durationMs));
  const showBillable = task.hourlyRateEnabled && task.hourlyRate;
  const earnings = showBillable ? formatCurrency(getHistoryTaskEarnings(task)) : '';

  return `
    <li class="history-task-item ${statusClass}" data-entry-id="${escapeHtml(entryId)}" data-task-index="${taskIndex}">
      <span class="history-task-label">${escapeHtml(task.text)}${suffix}</span>
      <div class="history-task-meta">
        <input
          type="text"
          class="history-task-duration-input"
          value="${durationValue}"
          placeholder="0m"
          title="Time worked"
          autocomplete="off"
        />
        ${showBillable ? `<span class="history-task-earnings">${escapeHtml(earnings)}</span>` : ''}
      </div>
    </li>
  `;
}

function renderReportBarChart(bars, emptyMessage) {
  if (!bars.length) {
    return `<p class="history-report-chart-empty">${escapeHtml(emptyMessage)}</p>`;
  }

  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return bars.map((bar) => {
    const width = maxValue > 0 ? (bar.value / maxValue) * 100 : 0;
    return `
      <div class="report-bar-row">
        <span class="report-bar-label" title="${escapeHtml(bar.label)}">${escapeHtml(bar.label)}</span>
        <div class="report-bar-track"><div class="report-bar-fill" style="width: ${width}%"></div></div>
        <span class="report-bar-value">${escapeHtml(formatCurrency(bar.value))}</span>
      </div>
    `;
  }).join('');
}

function renderReportSummary(report) {
  if (!report) return '';

  const { totals } = report;
  const rateSummary = totals.hasMixedReportRates
    ? '<span class="history-report-summary-item"><strong>Mixed</strong> rates</span>'
    : totals.reportDisplayRate != null
      ? `<span class="history-report-summary-item"><strong>${escapeHtml(formatHourlyRate(totals.reportDisplayRate))}</strong> rate</span>`
      : '';
  return `
    <span class="history-report-summary-item"><strong>${totals.sessionCount}</strong> session${totals.sessionCount === 1 ? '' : 's'}</span>
    <span class="history-report-summary-item"><strong>${escapeHtml(formatTime(totals.totalMs))}</strong> tracked</span>
    <span class="history-report-summary-item history-report-summary-item--earnings"><strong>${escapeHtml(formatCurrency(totals.totalEarnings))}</strong> earned</span>
    ${rateSummary}
  `;
}

function renderReportTable(report) {
  if (!report || !report.sessions.length) {
    historyReportTableBody.innerHTML = '';
    historyReportTableFoot.innerHTML = '';
    return;
  }

  historyReportTableBody.innerHTML = report.sessions.map((session) => `
    <tr>
      <td>${escapeHtml(formatReportDate(session.date))}</td>
      <td>${escapeHtml(session.name)}</td>
      <td>${escapeHtml(formatTime(session.durationMs))}</td>
      <td class="history-report-earnings">${session.billable ? escapeHtml(formatCurrency(session.earnings || 0)) : '—'}</td>
      <td>${session.billable ? escapeHtml(formatReportHourlyRate(session.displayRate, session.hasMixedRates)) : '—'}</td>
      <td>${escapeHtml(session.status)}</td>
    </tr>
  `).join('');

  historyReportTableFoot.innerHTML = `
    <tr>
      <td colspan="2">Range total</td>
      <td>${escapeHtml(formatTime(report.totals.totalMs))}</td>
      <td class="history-report-earnings">${escapeHtml(formatCurrency(report.totals.totalEarnings))}</td>
      <td>${report.totals.hasMixedReportRates
    ? 'Mixed'
    : report.totals.reportDisplayRate != null
      ? escapeHtml(formatHourlyRate(report.totals.reportDisplayRate))
      : '—'}</td>
      <td>${report.totals.sessionCount} session${report.totals.sessionCount === 1 ? '' : 's'}</td>
    </tr>
  `;
}

function renderHistoryReportPanel() {
  if (!historyReportPanel) return;

  populateHistoryReportSessionFilter();

  const { range, report } = getFilteredReportEntries();
  const hasSessions = !!report?.sessions.length;

  if (historyReportSummary) {
    historyReportSummary.innerHTML = range && report ? renderReportSummary(report) : '';
  }

  if (historyReportDailyChart) {
    historyReportDailyChart.innerHTML = hasSessions
      ? renderReportBarChart(report.dailyBars, 'No billable earnings in this range.')
      : '';
  }

  if (historyReportSessionChart) {
    historyReportSessionChart.innerHTML = hasSessions
      ? renderReportBarChart(report.sessionBars, 'No billable sessions in this range.')
      : '';
  }

  renderReportTable(hasSessions ? report : null);

  if (historyExportPdfBtn) {
    historyExportPdfBtn.disabled = !hasSessions;
    historyExportPdfBtn.classList.toggle('hidden', historyModalTab !== 'report');
  }

  const hasBillableInvoiceLines = !!report && getInvoiceBillableLines(report).length > 0;
  if (historyExportInvoiceBtn) {
    historyExportInvoiceBtn.disabled = !hasBillableInvoiceLines;
    historyExportInvoiceBtn.classList.toggle('hidden', historyModalTab !== 'report');
  }
}

function setHistoryModalTab(tab) {
  historyModalTab = tab === 'report' ? 'report' : 'sessions';
  closeHistoryReportSessionMenu();

  historyTabSessionsBtn?.classList.toggle('history-modal-tab--active', historyModalTab === 'sessions');
  historyTabReportBtn?.classList.toggle('history-modal-tab--active', historyModalTab === 'report');
  historyTabSessionsBtn?.setAttribute('aria-selected', historyModalTab === 'sessions' ? 'true' : 'false');
  historyTabReportBtn?.setAttribute('aria-selected', historyModalTab === 'report' ? 'true' : 'false');
  historySessionsPanel?.classList.toggle('hidden', historyModalTab !== 'sessions');
  historyReportPanel?.classList.toggle('hidden', historyModalTab !== 'report');
  historyExportPdfBtn?.classList.toggle('hidden', historyModalTab !== 'report');
  historyExportInvoiceBtn?.classList.toggle('hidden', historyModalTab !== 'report');

  refreshHistoryModalPanels();
}

function refreshHistoryModalPanels() {
  populateHistoryReportSessionFilter();
  renderHistoryModal();
  if (historyModalTab === 'report') {
    renderHistoryReportPanel();
  }
}

function initializeHistoryReportRange(preset = 'last30') {
  const range = getReportRangePreset(preset);
  if (historyReportStartInput) historyReportStartInput.value = formatDateInputValue(range.startMs);
  if (historyReportEndInput) historyReportEndInput.value = formatDateInputValue(range.endMs);
}

function wrapPdfHtml(title, styles, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

const PDF_BASE_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #111;
    background: #fff;
    font-size: 12px;
    line-height: 1.4;
  }
`;

const EARNINGS_REPORT_PDF_STYLES = `
  ${PDF_BASE_STYLES}
  h1 {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 700;
  }
  .subtitle {
    margin: 0 0 20px;
    color: #666;
    font-size: 13px;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin-bottom: 24px;
    padding: 12px 14px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
  }
  .summary strong { color: #111; }
  .summary .earnings strong { color: #15803d; }
  h2 {
    margin: 0 0 8px;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #666;
  }
  .section {
    margin-bottom: 20px;
    break-inside: avoid;
  }
  .report-bar-row {
    display: grid;
    grid-template-columns: 96px 1fr 72px;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .report-bar-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #555;
  }
  .report-bar-track {
    height: 10px;
    border-radius: 4px;
    background: #ececec;
    overflow: hidden;
  }
  .report-bar-fill {
    height: 100%;
    min-width: 2px;
    border-radius: 4px;
    background: #30d158;
  }
  .report-bar-value {
    text-align: right;
    color: #15803d;
    font-weight: 600;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  th, td {
    padding: 6px 8px;
    border-bottom: 1px solid #e5e5e5;
    text-align: left;
  }
  th {
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #666;
  }
  td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
  .earnings { color: #15803d; font-weight: 600; }
  tfoot td {
    font-weight: 700;
    border-top: 1px solid #bbb;
    border-bottom: none;
  }
  tr { break-inside: avoid; }
  .footnote {
    margin-top: 12px;
    color: #666;
    font-size: 11px;
  }
  .history-report-chart-empty {
    margin: 0;
    color: #666;
  }
`;

const EARNINGS_REPORT_SCOPED_PDF_STYLES = EARNINGS_REPORT_PDF_STYLES
  .replace(/(^|\n)([^{}\n][^{]*)\{/g, (match, prefix, selector) => {
    if (selector.trim().startsWith('*') || selector.trim().startsWith('body')) {
      return match;
    }
    return `${prefix}.report-page ${selector.trim()} {`;
  });

const INVOICE_PDF_STYLES = `
  ${PDF_BASE_STYLES}
  body { line-height: 1.5; }
  h1 {
    margin: 0 0 24px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .meta-block h2 {
    margin: 0 0 8px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #666;
    font-weight: 600;
  }
  .meta-block p {
    margin: 0;
    color: #111;
    white-space: pre-line;
  }
  .invoice-details {
    text-align: right;
  }
  .invoice-details p {
    margin: 0 0 4px;
    color: #333;
  }
  .invoice-details strong {
    color: #111;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  th, td {
    padding: 8px 10px;
    border-bottom: 1px solid #e5e5e5;
    text-align: left;
  }
  th {
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #666;
    font-weight: 600;
  }
  td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
  th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
  .amount { font-weight: 600; }
  tfoot td {
    font-weight: 700;
    border-top: 2px solid #111;
    border-bottom: none;
    font-size: 13px;
  }
  .footnote {
    margin-top: 16px;
    color: #666;
    font-size: 11px;
  }
  .invoice-logo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin-bottom: 12px;
  }
`;

const PDF_PAGE_BREAK_STYLES = `
  .pdf-page-break {
    page-break-after: always;
    break-after: page;
  }
`;

function buildEarningsReportContent(report) {
  const dailyChart = renderReportBarChart(
    report.dailyBars,
    'No billable earnings in this range.',
  );
  const sessionChart = renderReportBarChart(
    report.sessionBars,
    'No billable sessions in this range.',
  );
  const tableRows = report.sessions.map((session) => `
    <tr>
      <td>${escapeHtml(formatReportDate(session.date))}</td>
      <td>${escapeHtml(session.name)}</td>
      <td>${escapeHtml(formatTime(session.durationMs))}</td>
      <td class="earnings">${session.billable ? escapeHtml(formatCurrency(session.earnings || 0)) : '—'}</td>
      <td>${session.billable ? escapeHtml(formatReportHourlyRate(session.displayRate, session.hasMixedRates)) : '—'}</td>
      <td>${escapeHtml(session.status)}</td>
    </tr>
  `).join('');

  const footnote = report.hasMixedRatesNote
    ? '<p class="footnote">Sessions with mixed billing rates show "Mixed" in the hourly rate column.</p>'
    : '';

  const rateSummary = report.totals.hasMixedReportRates
    ? '<span><strong>Mixed</strong> rates</span>'
    : report.totals.reportDisplayRate != null
      ? `<span><strong>${escapeHtml(formatHourlyRate(report.totals.reportDisplayRate))}</strong> rate</span>`
      : '';

  return `
  <h1>Earnings Report</h1>
  <p class="subtitle">${escapeHtml(report.range.startLabel)} – ${escapeHtml(report.range.endLabel)}${report.range.sessionName ? `<br />Session: ${escapeHtml(report.range.sessionName)}` : ''}</p>
  <div class="summary">
    <span><strong>${report.totals.sessionCount}</strong> session${report.totals.sessionCount === 1 ? '' : 's'}</span>
    <span><strong>${escapeHtml(formatTime(report.totals.totalMs))}</strong> tracked</span>
    <span class="earnings"><strong>${escapeHtml(formatCurrency(report.totals.totalEarnings))}</strong> earned</span>
    ${rateSummary}
  </div>
  <div class="section">
    <h2>Daily earnings</h2>
    ${dailyChart}
  </div>
  <div class="section">
    <h2>Earnings by session</h2>
    ${sessionChart}
  </div>
  <div class="section">
    <h2>Sessions</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Session</th>
          <th>Duration</th>
          <th>Earnings</th>
          <th>Hourly rate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2">Range total</td>
          <td>${escapeHtml(formatTime(report.totals.totalMs))}</td>
          <td class="earnings">${escapeHtml(formatCurrency(report.totals.totalEarnings))}</td>
          <td>${report.totals.hasMixedReportRates
    ? 'Mixed'
    : report.totals.reportDisplayRate != null
      ? escapeHtml(formatHourlyRate(report.totals.reportDisplayRate))
      : '—'}</td>
          <td>${report.totals.sessionCount} session${report.totals.sessionCount === 1 ? '' : 's'}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  ${footnote}`;
}

function buildEarningsReportHtml(report) {
  return wrapPdfHtml(
    'Earnings Report',
    EARNINGS_REPORT_PDF_STYLES,
    buildEarningsReportContent(report),
  );
}

function buildInvoiceFromBlock(invoiceSettings) {
  const parts = [];
  if (invoiceSettings.logoDataUrl) {
    parts.push(`<img class="invoice-logo" src="${invoiceSettings.logoDataUrl}" alt="" />`);
  }
  if (invoiceSettings.name) parts.push(escapeHtml(invoiceSettings.name));
  if (invoiceSettings.businessName) parts.push(escapeHtml(invoiceSettings.businessName));
  if (invoiceSettings.email) parts.push(escapeHtml(invoiceSettings.email));
  if (invoiceSettings.address) {
    parts.push(escapeHtml(invoiceSettings.address).replace(/\n/g, '<br />'));
  }
  if (!parts.length) return '—';
  return parts.join('<br />');
}

function buildInvoiceContent(report, invoiceSettings, invoiceDateMs = Date.now()) {
  const invoiceNumber = generateInvoiceNumber(report.range.sessionName, invoiceDateMs);
  const billableLines = getInvoiceBillableLines(report);
  const totalDue = getInvoiceBillableTotal(report);
  const billTo = (report.range.sessionName || '').trim() || 'Multiple sessions';
  const hasMixedRatesNote = billableLines.some((session) => session.hasMixedRates);

  const lineRows = billableLines.map((session) => `
    <tr>
      <td>${escapeHtml(formatReportDate(session.date))}</td>
      <td>${escapeHtml(session.name)}</td>
      <td>${escapeHtml(formatInvoiceHours(session.durationMs))}</td>
      <td>${escapeHtml(formatReportHourlyRate(session.displayRate, session.hasMixedRates))}</td>
      <td class="amount">${escapeHtml(formatCurrency(session.earnings || 0))}</td>
    </tr>
  `).join('');

  const footnote = hasMixedRatesNote
    ? '<p class="footnote">Sessions with mixed billing rates show "Mixed" in the rate column.</p>'
    : '';

  return `
  <h1>Invoice</h1>
  <div class="meta-grid">
    <div class="meta-block">
      <h2>Bill From</h2>
      <p>${buildInvoiceFromBlock(invoiceSettings)}</p>
    </div>
    <div class="meta-block invoice-details">
      <p><strong>Invoice #</strong> ${escapeHtml(invoiceNumber)}</p>
      <p><strong>Date</strong> ${escapeHtml(formatReportDate(invoiceDateMs))}</p>
      <p><strong>Service period</strong> ${escapeHtml(report.range.startLabel)} – ${escapeHtml(report.range.endLabel)}</p>
    </div>
  </div>
  <div class="meta-block">
    <h2>Bill To</h2>
    <p>${escapeHtml(billTo)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Hours</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">Total due</td>
        <td class="amount">${escapeHtml(formatCurrency(totalDue))}</td>
      </tr>
    </tfoot>
  </table>
  ${footnote}`;
}

function buildInvoiceHtml(report, invoiceSettings) {
  const invoiceDateMs = Date.now();
  const invoiceNumber = generateInvoiceNumber(report.range.sessionName, invoiceDateMs);
  return wrapPdfHtml(
    `Invoice ${invoiceNumber}`,
    INVOICE_PDF_STYLES,
    buildInvoiceContent(report, invoiceSettings, invoiceDateMs),
  );
}

function buildInvoiceWithReportHtml(report, invoiceSettings) {
  const invoiceDateMs = Date.now();
  const invoiceNumber = generateInvoiceNumber(report.range.sessionName, invoiceDateMs);
  const styles = `${INVOICE_PDF_STYLES}${PDF_PAGE_BREAK_STYLES}${EARNINGS_REPORT_SCOPED_PDF_STYLES}`;
  const bodyHtml = `
    <div class="invoice-page pdf-page-break">
      ${buildInvoiceContent(report, invoiceSettings, invoiceDateMs)}
    </div>
    <div class="report-page">
      ${buildEarningsReportContent(report)}
    </div>
  `;
  return wrapPdfHtml(`Invoice ${invoiceNumber}`, styles, bodyHtml);
}

async function handleExportEarningsReportPdf() {
  const { report } = getFilteredReportEntries();
  if (!report?.sessions.length) return;

  const defaultFileName = report.range.sessionName
    ? `Earnings Report ${sanitizeFileNamePart(report.range.sessionName)} ${formatDateInputValue(report.range.startMs)} to ${formatDateInputValue(report.range.endMs)}.pdf`
    : `Earnings Report ${formatDateInputValue(report.range.startMs)} to ${formatDateInputValue(report.range.endMs)}.pdf`;
  const html = buildEarningsReportHtml(report);

  historyExportPdfBtn.disabled = true;
  try {
    const result = await window.slashIt.exportEarningsReportPdf({
      html,
      defaultFileName,
      dialogTitle: 'Create report',
    });
    if (result.error) {
      window.alert(result.error);
    }
  } finally {
    const { report: latestReport } = getFilteredReportEntries();
    historyExportPdfBtn.disabled = !latestReport?.sessions.length;
  }
}

async function handleExportInvoicePdf() {
  const { report } = getFilteredReportEntries();
  const billableLines = report ? getInvoiceBillableLines(report) : [];
  if (!billableLines.length) return;

  const invoiceDateMs = Date.now();
  const defaultFileName = report.range.sessionName
    ? `Invoice ${sanitizeFileNamePart(sessionNameToInvoicePrefix(report.range.sessionName))} ${formatInvoiceNumberDate(invoiceDateMs)}.pdf`
    : `Invoice ${formatInvoiceNumberDate(invoiceDateMs)}.pdf`;
  const html = buildInvoiceWithReportHtml(report, state.invoiceSettings);

  historyExportInvoiceBtn.disabled = true;
  try {
    const result = await window.slashIt.exportEarningsReportPdf({
      html,
      defaultFileName,
      dialogTitle: 'Create invoice',
    });
    if (result.error) {
      window.alert(result.error);
    }
  } finally {
    const { report: latestReport } = getFilteredReportEntries();
    historyExportInvoiceBtn.disabled = !getInvoiceBillableLines(latestReport).length;
  }
}

function handleHistoryDatePresetClick(event) {
  const preset = event.target.closest('[data-report-preset]')?.dataset.reportPreset;
  if (!preset) return;
  closeHistoryReportSessionMenu();
  initializeHistoryReportRange(preset);
  refreshHistoryModalPanels();
}

function handleHistoryDateChange() {
  closeHistoryReportSessionMenu();
  refreshHistoryModalPanels();
}

function handleHistoryDateIconClick(event) {
  const btn = event.target.closest('.history-report-date-icon-btn');
  if (!btn) return;
  event.preventDefault();

  const input = document.getElementById(btn.dataset.dateTarget);
  if (!input) return;

  if (typeof input.showPicker === 'function') {
    input.showPicker();
    return;
  }

  input.focus();
  input.click();
}

function renderHistoryEntry(entry) {
  const isExpanded = expandedHistoryEntryIds.has(entry.id);
  const isHighlighted = historyHighlightRunId && entry.runId === historyHighlightRunId;
  const statusLabel = entry.status === 'abandoned' ? 'Abandoned' : 'Completed';
  const statusClass = entry.status === 'abandoned'
    ? 'history-status-badge--abandoned'
    : 'history-status-badge--completed';
  const taskSummary = `${entry.completedCount} of ${entry.totalCount} task${entry.totalCount === 1 ? '' : 's'}`;
  const earningsSummary = entry.billable
    ? ` · ${formatCurrency(entry.totalEarnings ?? getHistoryEntryEarnings(entry))}`
    : '';

  return `
    <article class="history-entry${isExpanded ? ' history-entry--expanded' : ''}${isHighlighted ? ' history-entry--highlight' : ''}" data-entry-id="${escapeHtml(entry.id)}">
      <button type="button" class="history-entry-header" aria-expanded="${isExpanded}">
        <div class="history-entry-main">
          <div class="history-entry-top">
            <span class="history-entry-name">${escapeHtml(getHistoryEntryDisplayName(entry))}</span>
            <span class="history-status-badge ${statusClass}">${statusLabel}</span>
            ${entry.billable ? '<span class="history-status-badge history-status-badge--billable">Billable</span>' : ''}
          </div>
          <div class="history-entry-meta">
            ${escapeHtml(formatRelativeBackupTime(entry.endedAt))} · ${escapeHtml(formatTime(getHistoryEntryTotalMs(entry)))} · ${escapeHtml(taskSummary)}${escapeHtml(earningsSummary)}
          </div>
        </div>
        <span class="history-entry-chevron" aria-hidden="true">›</span>
      </button>
      <div class="history-entry-detail">
        <div class="history-entry-date-row">
          <label class="history-entry-date-label" for="history-entry-date-${escapeHtml(entry.id)}">Session date</label>
          <input
            id="history-entry-date-${escapeHtml(entry.id)}"
            type="date"
            class="history-entry-date-input"
            value="${escapeHtml(formatDateInputValue(entry.endedAt))}"
            title="Session date"
          />
        </div>
        <ul class="history-task-list">
          ${entry.tasks.map((task, taskIndex) => renderHistoryTaskItem(task, entry.id, taskIndex)).join('')}
        </ul>
        ${entry.billable ? `
          <div class="history-entry-billable-summary">
            <span class="history-entry-billable-label">Total earnings</span>
            <span class="history-entry-billable-amount">${escapeHtml(formatCurrency(entry.totalEarnings ?? getHistoryEntryEarnings(entry)))}</span>
          </div>
        ` : ''}
        <div class="history-entry-actions">
          <button type="button" class="history-restore-btn" data-restore-id="${escapeHtml(entry.id)}" title="Add these tasks back to your session list">Copy to list</button>
          <button type="button" class="history-delete-btn" data-delete-id="${escapeHtml(entry.id)}">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderHistoryModal() {
  if (!historyList) return;

  const entries = getFilteredSessionHistoryEntries();
  if (entries.length === 0) {
    if (state.sessionHistory.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No sessions yet. Finish or abandon a focus run to see it here.</p>';
    } else if (historyReportSessionFilter) {
      historyList.innerHTML = '<p class="history-empty">No sessions match this session filter.</p>';
    } else {
      historyList.innerHTML = '<p class="history-empty">No sessions in this date range.</p>';
    }
    return;
  }

  historyList.innerHTML = entries.map(renderHistoryEntry).join('');

  if (historyHighlightRunId) {
    const highlighted = historyList.querySelector('.history-entry--highlight');
    highlighted?.scrollIntoView({ block: 'nearest' });
  }
}

function ensureHistoryRangeIncludesEntry(entry) {
  if (!entry?.endedAt || !historyReportStartInput || !historyReportEndInput) return;

  const range = getCurrentReportRange();
  if (!range) {
    initializeHistoryReportRange('last30');
    return;
  }

  if (entry.endedAt >= range.startMs && entry.endedAt <= range.endMs) return;

  const entryDayStartMs = parseDateInputToStartMs(formatDateInputValue(entry.endedAt));
  if (entryDayStartMs == null) return;

  if (entry.endedAt < range.startMs) {
    historyReportStartInput.value = formatDateInputValue(Math.min(entryDayStartMs, range.startMs));
  }
  if (entry.endedAt > range.endMs) {
    historyReportEndInput.value = formatDateInputValue(entry.endedAt);
  }
}

function openHistoryModal(highlightRunId = null) {
  hideSettingsMenu();
  historyHighlightRunId = highlightRunId;

  if (!historyReportStartInput?.value) {
    initializeHistoryReportRange('last30');
  }

  if (highlightRunId) {
    const entry = state.sessionHistory.find((item) => item.runId === highlightRunId);
    if (entry) {
      expandedHistoryEntryIds.clear();
      expandedHistoryEntryIds.add(entry.id);
      ensureHistoryRangeIncludesEntry(entry);
    }
  }

  if (highlightRunId) {
    setHistoryModalTab('sessions');
  } else {
    refreshHistoryModalPanels();
  }

  historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
  closeHistoryReportSessionMenu();
  if (!deleteHistoryModal.classList.contains('hidden')) {
    closeDeleteHistoryModal();
  }
  historyModal.classList.add('hidden');
  historyHighlightRunId = null;
}

function openDeleteHistoryModal(entryId) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry) return;

  pendingDeleteHistoryEntryId = entryId;
  const label = getHistoryEntryDisplayName(entry) || 'this session';
  deleteHistoryMessage.textContent = `Delete ${label} from session history? This cannot be undone.`;
  deleteHistoryModal.classList.remove('hidden');
}

function closeDeleteHistoryModal() {
  pendingDeleteHistoryEntryId = null;
  deleteHistoryModal.classList.add('hidden');
}

function confirmDeleteHistoryEntry() {
  if (!pendingDeleteHistoryEntryId) return;
  performDeleteHistoryEntry(pendingDeleteHistoryEntryId);
  closeDeleteHistoryModal();
}

function performDeleteHistoryEntry(entryId) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry) return;

  state.sessionHistory = state.sessionHistory.filter((item) => item.id !== entryId);
  expandedHistoryEntryIds.delete(entryId);
  persist();
  refreshHistoryModalPanels();
}

function deleteHistoryEntry(entryId) {
  openDeleteHistoryModal(entryId);
}

function handleHistoryListClick(event) {
  if (event.target.closest('.history-task-duration-input') || event.target.closest('.history-entry-date-input')) return;

  const restoreBtn = event.target.closest('.history-restore-btn');
  if (restoreBtn) {
    event.stopPropagation();
    restoreHistoryEntryToList(restoreBtn.dataset.restoreId);
    return;
  }

  const deleteBtn = event.target.closest('.history-delete-btn');
  if (deleteBtn) {
    event.stopPropagation();
    deleteHistoryEntry(deleteBtn.dataset.deleteId);
    return;
  }

  const header = event.target.closest('.history-entry-header');
  if (!header) return;

  const entryEl = header.closest('.history-entry');
  const entryId = entryEl?.dataset.entryId;
  if (!entryId) return;

  if (expandedHistoryEntryIds.has(entryId)) {
    expandedHistoryEntryIds.delete(entryId);
  } else {
    expandedHistoryEntryIds.clear();
    expandedHistoryEntryIds.add(entryId);
  }
  renderHistoryModal();
}

function handleHistoryDurationInput(event) {
  const input = event.target.closest('.history-task-duration-input');
  if (!input) return;

  if (event.type === 'keydown') {
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
    return;
  }

  if (event.type !== 'blur') return;

  const item = input.closest('.history-task-item');
  const entryId = item?.dataset.entryId;
  const taskIndex = Number(item?.dataset.taskIndex);
  if (!entryId || !Number.isInteger(taskIndex)) return;

  const durationMs = parseManualLimit(input.value);
  updateHistoryTaskDuration(entryId, taskIndex, durationMs);
}

function handleHistoryEntryDateInput(event) {
  const input = event.target.closest('.history-entry-date-input');
  if (!input || event.type !== 'change') return;

  const entryEl = input.closest('.history-entry');
  const entryId = entryEl?.dataset.entryId;
  if (!entryId) return;

  updateHistoryEntryDate(entryId, input.value);
}

function renderTemplateEditor() {
  if (!templateEditorState) return '';

  if (templateEditorState.mode === 'list-new' || templateEditorState.mode === 'list-edit') {
    const isEdit = templateEditorState.mode === 'list-edit';
    const template = isEdit
      ? state.listTemplates.find((item) => item.id === templateEditorState.id)
      : { name: '', tasks: [{ text: '', limitMs: null }] };
    if (isEdit && !template) return '';
    const tasks = isEdit ? template.tasks : templateEditorState.draftTasks || [{ text: '', limitMs: null }];

    return `
      <div class="template-editor" data-editor="list">
        <label class="template-editor-label" for="template-editor-list-name">Template name</label>
        <input id="template-editor-list-name" class="template-editor-input" type="text" value="${escapeHtml(template.name)}" autocomplete="off" />
        <span class="template-editor-label">Tasks</span>
        <div class="template-editor-task-list" id="template-editor-list-tasks">
          ${tasks.map((task, index) => `
            <div class="template-editor-row" data-task-row="${index}">
              <input class="template-editor-input template-editor-task-text" type="text" value="${escapeHtml(task.text)}" placeholder="Task" autocomplete="off" />
              <input class="template-editor-input template-editor-limit template-editor-task-limit" type="text" value="${escapeHtml(formatLimitField(task.limitMs))}" placeholder="20m" autocomplete="off" />
              <button type="button" class="template-row-btn template-row-btn--danger" data-remove-task-row="${index}" aria-label="Remove task">×</button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="templates-add-btn" data-add-task-row>+ Add task</button>
        <div class="template-editor-actions">
          <button type="button" class="template-row-btn" data-template-editor-cancel>Cancel</button>
          <button type="button" class="template-row-btn" data-template-editor-save-list>${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </div>
    `;
  }

  return '';
}

function appendListTemplateEditorRow(listEl, { focus = true } = {}) {
  if (!listEl) return null;
  const index = listEl.querySelectorAll('[data-task-row]').length;
  const row = document.createElement('div');
  row.className = 'template-editor-row';
  row.dataset.taskRow = String(index);
  row.innerHTML = `
    <input class="template-editor-input template-editor-task-text" type="text" value="" placeholder="Task" autocomplete="off" />
    <input class="template-editor-input template-editor-limit template-editor-task-limit" type="text" value="" placeholder="20m" autocomplete="off" />
    <button type="button" class="template-row-btn template-row-btn--danger" data-remove-task-row="${index}" aria-label="Remove task">×</button>
  `;
  listEl.appendChild(row);
  const textInput = row.querySelector('.template-editor-task-text');
  if (focus && textInput) textInput.focus();
  return row;
}

function handleListTemplateEditorKeydown(e) {
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;

  const target = e.target;
  if (!target.matches('.template-editor-task-text, .template-editor-task-limit')) return;

  const row = target.closest('[data-task-row]');
  if (!row) return;

  const text = row.querySelector('.template-editor-task-text')?.value?.trim();
  if (!text) return;

  e.preventDefault();
  e.stopPropagation();

  const listEl = row.closest('#template-editor-list-tasks');
  appendListTemplateEditorRow(listEl, { focus: true });
}

function bindListTemplateEditorKeyboard() {
  const listEl = templatesModalBody?.querySelector('#template-editor-list-tasks');
  if (!listEl) return;
  listEl.addEventListener('keydown', handleListTemplateEditorKeydown, true);
}

function renderTemplatesModal() {
  if (!templatesModalBody) return;

  const editorHtml = renderTemplateEditor();

  const listRows = state.listTemplates.map((template) => `
    <div class="template-row" data-list-template-id="${escapeHtml(template.id)}">
      <div class="template-row-main">
        <div class="template-row-name">${escapeHtml(template.name)}</div>
        <div class="template-row-preview">${template.tasks.length} task${template.tasks.length === 1 ? '' : 's'}</div>
      </div>
      <div class="template-row-actions">
        <button type="button" class="template-row-btn" data-edit-list-template="${escapeHtml(template.id)}">Edit</button>
        <button type="button" class="template-row-btn template-row-btn--danger" data-delete-list-template="${escapeHtml(template.id)}">Delete</button>
      </div>
    </div>
  `).join('');

  templatesModalBody.innerHTML = `
    ${editorHtml}
    <section class="templates-section">
      <h4 class="templates-section-title">List templates</h4>
      <div class="templates-list">
        ${listRows || '<p class="templates-empty">No list templates yet.</p>'}
      </div>
      ${templateEditorState ? '' : '<button type="button" class="templates-add-btn" data-new-list-template>+ New list template</button>'}
    </section>
  `;

  if (templateEditorState?.mode === 'list-new' || templateEditorState?.mode === 'list-edit') {
    bindListTemplateEditorKeyboard();
  }
}

function openTemplatesModal() {
  hideSettingsMenu();
  templateEditorState = null;
  renderTemplatesModal();
  templatesModal.classList.remove('hidden');
}

function closeTemplatesModal() {
  templatesModal.classList.add('hidden');
  templateEditorState = null;
}

function collectListEditorTasks() {
  const rows = templatesModalBody?.querySelectorAll('[data-task-row]') || [];
  return [...rows].map((row) => {
    const text = row.querySelector('.template-editor-task-text')?.value || '';
    const limitValue = row.querySelector('.template-editor-task-limit')?.value || '';
    const parsed = parseTaskInput(text, limitValue);
    return { text: parsed.text, limitMs: parsed.limitMs };
  }).filter((task) => task.text);
}

function handleTemplatesModalClick(event) {
  const target = event.target.closest('[data-new-list-template], [data-edit-list-template], [data-delete-list-template], [data-template-editor-cancel], [data-template-editor-save-list], [data-add-task-row], [data-remove-task-row]');
  if (!target) return;

  if (target.matches('[data-new-list-template]')) {
    templateEditorState = { mode: 'list-new', draftTasks: [{ text: '', limitMs: null }] };
    renderTemplatesModal();
    templatesModalBody.querySelector('#template-editor-list-name')?.focus();
    return;
  }

  if (target.matches('[data-edit-list-template]')) {
    templateEditorState = { mode: 'list-edit', id: target.dataset.editListTemplate };
    renderTemplatesModal();
    templatesModalBody.querySelector('#template-editor-list-name')?.focus();
    return;
  }

  if (target.matches('[data-delete-list-template]')) {
    const template = state.listTemplates.find((item) => item.id === target.dataset.deleteListTemplate);
    if (template && window.confirm(`Delete list template "${template.name}"?`)) {
      deleteListTemplate(template.id);
      renderTemplatesModal();
    }
    return;
  }

  if (target.matches('[data-template-editor-cancel]')) {
    templateEditorState = null;
    renderTemplatesModal();
    return;
  }

  if (target.matches('[data-add-task-row]')) {
    const listEl = templatesModalBody.querySelector('#template-editor-list-tasks');
    appendListTemplateEditorRow(listEl, { focus: true });
    return;
  }

  if (target.matches('[data-remove-task-row]')) {
    const row = target.closest('[data-task-row]');
    row?.remove();
    return;
  }

  if (target.matches('[data-template-editor-save-list]')) {
    const name = normalizeTemplateName(templatesModalBody.querySelector('#template-editor-list-name')?.value);
    const tasks = collectListEditorTasks();
    const excludeId = templateEditorState?.mode === 'list-edit' ? templateEditorState.id : null;

    if (!name) {
      window.alert('Enter a template name.');
      return;
    }
    if (tasks.length === 0) {
      window.alert('Add at least one task.');
      return;
    }
    if (isListTemplateNameTaken(name, excludeId)) {
      window.alert('A list template with that name already exists.');
      return;
    }

    if (templateEditorState?.mode === 'list-edit') {
      updateListTemplate(templateEditorState.id, name, tasks);
    } else {
      createListTemplate(name, tasks);
    }
    templateEditorState = null;
    renderTemplatesModal();
  }
}

function handleTemplateAutocompleteClick(event) {
  const item = event.target.closest('.template-autocomplete-item');
  if (!item || !templateAutocompleteState) return;
  const index = Number(item.dataset.matchIndex);
  const match = templateAutocompleteState.matches[index];
  if (!match) return;
  const { sessionId, inputEl } = templateAutocompleteState;
  applyTemplateMatch(match, sessionId, { toQueue: false });
  inputEl.value = '';
  hideTemplateAutocomplete();
  requestAnimationFrame(() => inputEl.focus());
}

function migrateLegacyTaskTemplates(savedTaskTemplates) {
  if (!Array.isArray(savedTaskTemplates)) return;
  savedTaskTemplates.forEach((raw) => {
    const name = normalizeTemplateName(raw?.name);
    if (!name || isListTemplateNameTaken(name)) return;
    const text = (raw?.text || '').trim();
    if (!text) return;
    state.listTemplates.unshift(normalizeListTemplate({
      id: raw?.id || crypto.randomUUID(),
      name,
      tasks: [{ text, limitMs: raw?.limitMs ?? null }],
      createdAt: raw?.createdAt,
      updatedAt: raw?.updatedAt,
    }));
  });
}

function applySavedData(saved) {
  state.sessionTasks = (saved.sessionTasks || saved.tasks || []).map(normalizeSessionTask);
  loadPlannedSessionsFromSaved(saved);
  state.activeSessionName = saved.activeSessionName || null;
  state.totalSessionMs = saved.totalSessionMs || 0;
  if (saved.timerView === 'earnings') {
    state.timerView = 'earnings';
  } else if (saved.timerView === 'session') {
    state.timerView = 'session';
  } else {
    state.timerView = 'task';
  }
  if (state.timerView === 'earnings' && !canShowEarningsView()) {
    state.timerView = 'task';
  }
  state.limitExpired = saved.limitExpiredKind === 'task' ? !!saved.limitExpired : false;
  state.limitExpiredKind = saved.limitExpiredKind === 'task' && saved.limitExpired ? 'task' : null;
  state.taskOvertimeMode = !!saved.taskOvertimeMode;
  state.currentIndex = saved.currentIndex || 0;
  state.focusTaskIndex = Number.isInteger(saved.focusTaskIndex) ? saved.focusTaskIndex : 0;
  state.elapsedMs = saved.elapsedMs || 0;
  state.isRunning = false;
  state.timerBarSize = normalizeTimerBarSize(saved.timerBarSize);
  state.timerBarSizeBeforeHide = normalizeTimerBarSize(saved.timerBarSizeBeforeHide);
  state.focusPosition = saved.focusPosition && Number.isFinite(saved.focusPosition.x) && Number.isFinite(saved.focusPosition.y)
    ? { x: saved.focusPosition.x, y: saved.focusPosition.y }
    : null;
  state.focusPositionCustomized = !!saved.focusPositionCustomized;
  state.sessionHistory = Array.isArray(saved.sessionHistory)
    ? saved.sessionHistory.map(normalizeSessionHistoryEntry)
    : [];
  state.activeSessionRunId = saved.activeSessionRunId || null;
  state.activeSessionStartedAt = saved.activeSessionStartedAt || null;
  state.listTemplates = Array.isArray(saved.listTemplates)
    ? saved.listTemplates.map(normalizeListTemplate)
    : [];
  migrateLegacyTaskTemplates(saved.taskTemplates);
  window.slashItSounds.setEnabled(saved.soundEffectsEnabled !== false);
  state.invoiceSettings = normalizeInvoiceSettings(saved.invoiceSettings);

  if (saved.timerBarSize === 'hidden') {
    state.timerBarSize = state.timerBarSizeBeforeHide;
  }

  if (!state.sessionTasks[state.focusTaskIndex] || state.sessionTasks[state.focusTaskIndex].completed) {
    state.focusTaskIndex = Math.max(0, getNextFocusTaskIndex());
  }
}

function routeToSavedMode(saved) {
  if (saved.mode === 'focus' && getIncompleteTasks().length > 0) {
    const current = getCurrentTask();
    if (current) {
      state.elapsedMs = current.elapsedMs || saved.elapsedMs || 0;
      current.elapsedMs = state.elapsedMs;
      state.taskOvertimeMode = current.taskOvertimeMode || state.taskOvertimeMode;
      current.taskOvertimeMode = state.taskOvertimeMode;
    }
    showView('focus');
    renderFocusView();
    if (current) restoreTaskTimerFromTask(current);
    else if (state.limitExpired) setExpiredUI(true);
    if (saved.isRunning) startTimer();
    return;
  }

  if (saved.mode === 'done' && getIncompleteTasks().length === 0 && state.sessionTasks.length > 0) {
    showDoneView();
    return;
  }

  showView('edit');
  renderEditView();
  focusSessionAddInput();
}

async function applyRestoredData(saved) {
  stopTimer();
  clearTimerBarHideTimeout();
  closeSessionDrawer({ immediate: true });
  state.limitExpired = false;
  state.limitExpiredKind = null;
  setExpiredUI(false);
  applySavedData(saved);
  routeToSavedMode(saved);
  persist();
}

function renderEditView() {
  hideTaskContextMenu();
  renderPlannedSessions();
  renderTaskList(sessionList, 'session');
  if (isSessionReadyToComplete()) {
    startBtn.disabled = false;
    startBtn.textContent = 'Complete Session';
  } else {
    const incompleteCount = getSessionIncompleteIndices().length;
    startBtn.disabled = incompleteCount === 0;
    startBtn.textContent = isSessionInProgress() ? 'Resume Session' : 'Start Session';
  }
  clearSessionBtn.disabled = state.sessionTasks.length === 0;
  moveBackToListBtn.disabled = state.sessionTasks.length === 0;
  clearSessionCompletedBtn.disabled = getCompletedCount() === 0;
  if (isTutorialActive()) {
    requestAnimationFrame(() => positionTutorialDots());
  }
}

function refreshDrawerIfOpen() {
  if (drawerOpen) {
    void window.slashIt.updateSessionDrawer(getDrawerPayload());
  }
}

function openClearSessionModal() {
  clearSessionCompletedBtn.disabled = getCompletedCount() === 0;
  clearSessionModal.classList.remove('hidden');
}

function closeClearSessionModal() {
  clearSessionModal.classList.add('hidden');
}

function clearAllSessionTasks() {
  archiveCurrentSession('abandoned');
  ensureBraindumpSession();
  const braindump = getBraindumpSession();
  braindump.tasks.push(
    ...state.sessionTasks
      .filter((task) => !task.completed)
      .map(toBraindumpTaskFromSession),
  );
  state.sessionTasks = [];
  state.currentIndex = 0;
  resetSessionProgressState();
  clearSelection();
  closeClearSessionModal();
  persist();
  renderEditView();
  refreshDrawerIfOpen();
}

function clearCompletedSessionTasks() {
  state.sessionTasks = state.sessionTasks.filter((task) => !task.completed);
  if (state.currentIndex >= state.sessionTasks.length) {
    state.currentIndex = Math.max(0, state.sessionTasks.length - 1);
  }
  clearSelection();
  closeClearSessionModal();
  persist();
  renderEditView();
  refreshDrawerIfOpen();
}

function moveAllSessionTasksBackToLists() {
  if (state.sessionTasks.length === 0) return;

  archiveCurrentSession('abandoned');

  ensureBraindumpSession();
  const tasksBySessionId = new Map();

  state.sessionTasks.forEach((task) => {
    const sessionId = task.sourceSessionId || BRAINDUMP_SESSION_ID;
    if (!tasksBySessionId.has(sessionId)) {
      tasksBySessionId.set(sessionId, []);
    }
    tasksBySessionId.get(sessionId).push(toBraindumpTaskFromSession(task));
  });

  tasksBySessionId.forEach((tasks, sessionId) => {
    const targetSession = getPlannedSession(sessionId) || getBraindumpSession();
    targetSession.tasks.push(...tasks);
  });

  state.sessionTasks = [];
  state.currentIndex = 0;
  resetSessionProgressState();
  clearSelection();
  persist();
  renderEditView();
  refreshDrawerIfOpen();
}

function focusSessionAddInput(sessionId = BRAINDUMP_SESSION_ID) {
  openSessionAddForm(sessionId);
  state.addFocusSessionId = sessionId;
  state.lastAddSessionId = sessionId;
  if (state.mode === 'edit') {
    if (!isSessionExpanded(sessionId)) {
      state.expandedSessionIds.add(sessionId);
    }
    renderEditView();
  }
}

function submitPlannedSessionTask(sessionId, text, limitValue) {
  const parsed = parseTaskInput(text, limitValue);
  if (!parsed.text) return;

  const session = getPlannedSession(sessionId);
  if (!session) return;

  session.tasks.push({ text: parsed.text, limitMs: parsed.limitMs });
  state.addFocusSessionId = sessionId;
  state.lastAddSessionId = sessionId;
  state.activeAddSessionIds.add(sessionId);
  persist();
  renderEditView();
}

function submitPlannedTaskToQueue(sessionId, text, limitValue) {
  const parsed = parseTaskInput(text, limitValue);
  if (!parsed.text) return;

  const session = getPlannedSession(sessionId);
  if (!session) return;

  const sourceMeta = getSourceMetaFromSession(session);
  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    toSessionTaskFromBraindump({ text: parsed.text, limitMs: parsed.limitMs }, sourceMeta),
  );
  state.addFocusSessionId = sessionId;
  state.lastAddSessionId = sessionId;
  state.activeAddSessionIds.add(sessionId);
  persist();
  renderEditView();
}

function isAddFormFocused() {
  const active = document.activeElement;
  return !!active?.matches('.session-add-task-input, .session-add-limit-input');
}

function isTaskInputFocused() {
  if (isAddFormFocused()) return true;
  const active = document.activeElement;
  return !!active?.matches('.task-text-input, .task-limit-input, .planned-session-name-input');
}

function startEditingTask(li, listId, index) {
  const tasks = getTasksForList(listId);
  const textEl = li.querySelector('.task-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-text-input';
  input.value = tasks[index].text;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  const save = () => {
    const value = input.value.trim();
    if (value) {
      if (listId === 'session') {
        const limitInput = li.querySelector('.task-limit-input');
        const manualLimit = limitInput ? limitInput.value : '';
        const parsed = parseTaskInput(value, manualLimit);
        tasks[index].text = parsed.text;
        if (parsed.limitMs) tasks[index].limitMs = parsed.limitMs;
      } else {
        const parsed = parseTaskInput(value, '');
        tasks[index].text = parsed.text;
        if (parsed.limitMs) tasks[index].limitMs = parsed.limitMs;
      }
    } else {
      tasks.splice(index, 1);
    }
    persist();
    renderEditView();
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') {
      input.value = tasks[index].text;
      input.blur();
    }
  });
}

function isEditShortcutBlocked() {
  if (!clearSessionModal.classList.contains('hidden')) return true;
  if (!deleteSessionModal.classList.contains('hidden')) return true;
  if (!billableModal.classList.contains('hidden')) return true;
  if (isSettingsUiOpen()) return true;
  return false;
}

function handleEditModeEnterShortcuts(e) {
  if (state.mode !== 'edit') return;
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;

  const meta = e.metaKey || e.ctrlKey || e.getModifierState('Meta') || e.getModifierState('Control');
  const shift = e.shiftKey || e.getModifierState('Shift');

  if (meta && shift) {
    if (isEditShortcutBlocked()) return;

    const sessionId = getFocusedAddSessionId();
    const session = sessionId ? getPlannedSession(sessionId) : null;
    if (!session || session.tasks.length === 0) return;

    e.preventDefault();
    e.stopPropagation();
    addAllFromSession(sessionId);
    return;
  }

  if (shift && !meta) {
    if (isEditShortcutBlocked()) return;
    if (startBtn.disabled) return;

    e.preventDefault();
    e.stopPropagation();
    startSlashing();
  }
}

function removeTask(listId, index) {
  const task = getTasksForList(listId)[index];
  if (task) state.selectedTasks.delete(task);
  getTasksForList(listId).splice(index, 1);
  if (listId === 'session' && state.currentIndex >= state.sessionTasks.length) {
    state.currentIndex = Math.max(0, state.sessionTasks.length - 1);
  }
  persist();
  renderEditView();
}

function removeSelectedTasks() {
  if (state.selectedTasks.size === 0) return;

  const indicesByList = {};
  getAllPlannedListIds().forEach((listId) => {
    getTasksForList(listId).forEach((task, index) => {
      if (state.selectedTasks.has(task)) {
        if (!indicesByList[listId]) indicesByList[listId] = [];
        indicesByList[listId].push(index);
      }
    });
  });
  state.sessionTasks.forEach((task, index) => {
    if (state.selectedTasks.has(task)) {
      if (!indicesByList.session) indicesByList.session = [];
      indicesByList.session.push(index);
    }
  });

  Object.keys(indicesByList).forEach((listId) => {
    indicesByList[listId].sort((a, b) => b - a).forEach((index) => {
      getTasksForList(listId).splice(index, 1);
    });
  });

  if (state.currentIndex >= state.sessionTasks.length) {
    state.currentIndex = Math.max(0, state.sessionTasks.length - 1);
  }

  clearSelection();
  persist();
  renderEditView();
}

function renderFocusView() {
  const current = getCurrentTask();

  if (!current) {
    stopTimer();
    showDoneView({ playSound: true });
    return;
  }

  currentTaskEl.textContent = current.text.toUpperCase();
  invalidateFocusBarWidthCache();
  updateTimerDisplay();
  updateSkipButtonState();
  scheduleFocusDimensionsUpdate();
  updateFullscreenTaskPanel();
}

function showDoneView({ playSound = false } = {}) {
  archiveCurrentSession('completed');
  if (doneHeadline) doneHeadline.textContent = getNextDoneHeadline();
  doneSummary.textContent = `You completed ${getCompletedCount()} task${getCompletedCount() === 1 ? '' : 's'}.`;
  doneTime.textContent = formatTime(state.totalSessionMs);
  showView('done');
  if (playSound) playTasksCompleteSound();
}

function launchCelebration() {
  window.slashIt.triggerCelebration();
}

function handleLimitExpired() {
  if (state.limitExpired) return;
  state.limitExpired = true;
  state.limitExpiredKind = 'task';
  setExpiredUI(true);
  playAlarmSound();
  persist();
}

function checkLimitExpiry() {
  const current = getCurrentTask();
  if (current?.limitMs && !isTaskOvertimeActive() && state.elapsedMs >= current.limitMs) {
    handleLimitExpired();
  }
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  state.sessionStartMs = Date.now() - state.elapsedMs;
  state.timerInterval = setInterval(() => {
    state.elapsedMs = Date.now() - state.sessionStartMs;
    checkLimitExpiry();
    updateTimerDisplay();
  }, 250);
  updateTimerDisplay();
  persist();
}

function stopTimer() {
  if (state.isRunning && state.sessionStartMs) {
    state.elapsedMs = Date.now() - state.sessionStartMs;
    saveCurrentTaskProgress();
  }
  state.isRunning = false;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  updateTimerDisplay();
  persist();
}

function toggleTimerView() {
  if (state.timerView === 'task') {
    state.timerView = 'session';
  } else if (state.timerView === 'session') {
    state.timerView = canShowEarningsView() ? 'earnings' : 'task';
  } else {
    state.timerView = 'task';
  }
  updateTimerDisplay();
  persist();
}

function toggleTimer() {
  if (state.isRunning) stopTimer();
  else startTimer();
}

function completeCurrentTask() {
  const taskIndex = getFocusTaskIndex();
  if (taskIndex < 0) return;

  const completedElapsedMs = state.elapsedMs;

  state.isRunning = false;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  state.sessionTasks[taskIndex].completed = true;
  state.sessionTasks[taskIndex].durationMs = completedElapsedMs;
  state.sessionTasks[taskIndex].elapsedMs = 0;
  state.sessionTasks[taskIndex].taskOvertimeMode = false;
  state.sessionTasks[taskIndex].skipped = false;

  const completedTask = state.sessionTasks[taskIndex];
  const { enabled, rate, roundMinutes, roundScope } = getPlannedSessionRateSettings(completedTask.sourceSessionId);
  if (enabled && rate && roundScope === 'task' && roundMinutes) {
    completedTask.billableDurationMs = roundUpBillableMs(completedElapsedMs, roundMinutes);
  }

  state.totalSessionMs += completedElapsedMs;
  playCompleteSound();

  state.focusTaskIndex = getNextFocusTaskIndex();
  const next = state.focusTaskIndex >= 0 ? state.sessionTasks[state.focusTaskIndex] : null;
  if (next) startNextTaskFresh(next);
  else resetTaskTimerState();

  persist();
  renderFocusView();

  if (next) startTimer();
}

function skipCurrentTask() {
  const taskIndex = getFocusTaskIndex();
  if (taskIndex < 0 || getIncompleteCount() <= 1) return;

  saveCurrentTaskProgress();
  state.sessionTasks[taskIndex].skipped = true;
  stopTimer();
  state.focusTaskIndex = getNextFocusTaskIndex({ excludeIndex: taskIndex });
  const next = getCurrentTask();
  if (next) restoreTaskTimerFromTask(next);
  else resetTaskTimerState();
  persist();
  renderFocusView();

  if (next) startTimer();
}

function switchToTask(index) {
  if (state.mode !== 'focus') return;
  const task = state.sessionTasks[index];
  if (!task || task.completed) return;
  if (index === getFocusTaskIndex()) return;

  saveCurrentTaskProgress();
  stopTimer();

  task.skipped = false;
  state.focusTaskIndex = index;
  restoreTaskTimerFromTask(task);
  persist();
  renderFocusView();
  startTimer();
}

function startOvertime() {
  state.taskOvertimeMode = true;
  const taskIndex = getFocusTaskIndex();
  if (taskIndex >= 0) state.sessionTasks[taskIndex].taskOvertimeMode = true;
  state.limitExpiredKind = null;
  extendPanel.classList.add('hidden');
  setExpiredUI(false);
  if (!state.isRunning) startTimer();
  persist();
}

function extendTime() {
  showExtendPanel();
}

function confirmExtend() {
  const extraMs = parseManualLimit(extendInput.value);
  if (!extraMs) {
    extendInput.focus();
    return;
  }

  const current = getCurrentTask();
  if (!current) return;
  const taskIndex = getFocusTaskIndex();
  state.sessionTasks[taskIndex].limitMs = (state.sessionTasks[taskIndex].limitMs || 0) + extraMs;
  state.taskOvertimeMode = false;
  state.sessionTasks[taskIndex].taskOvertimeMode = false;

  state.limitExpired = false;
  state.limitExpiredKind = null;
  hideExtendPanel();
  setExpiredUI(false);
  startTimer();
  persist();
}

function enterFocusMode() {
  showView('focus');
  renderFocusView();
  startTimer();
}

function beginFreshSession() {
  const first = getIncompleteTasks()[0];
  ensureActiveSessionRun(true);
  state.activeSessionName = first?.sourceSessionName || 'Braindump';
  state.timerView = 'task';
  state.limitExpiredKind = null;
  state.taskOvertimeMode = false;
  clearAllSkippedFlags();
  state.sessionTasks.forEach((task) => {
    if (!task.completed) {
      task.elapsedMs = 0;
      task.taskOvertimeMode = false;
    }
  });
  resetTaskTimerState();
  state.totalSessionMs = 0;
  state.limitExpired = false;
  setExpiredUI(false);
  state.isRunning = false;
  state.focusTaskIndex = getNextFocusTaskIndex();
  enterFocusMode();
}

function resumeSession() {
  ensureActiveSessionRun(false);
  clearAllSkippedFlags();
  state.isRunning = false;

  if (!state.sessionTasks[state.focusTaskIndex] || state.sessionTasks[state.focusTaskIndex].completed) {
    state.focusTaskIndex = getNextFocusTaskIndex();
  }

  const current = getCurrentTask();
  if (current) {
    restoreTaskTimerFromTask(current);
  } else {
    resetTaskTimerState();
  }

  enterFocusMode();
}

function startSlashing() {
  if (isSessionReadyToComplete()) {
    showDoneView({ playSound: true });
    return;
  }

  if (getIncompleteTasks().length === 0) return;

  if (isSessionInProgress()) {
    resumeSession();
    return;
  }

  beginFreshSession();
}

function backToEdit() {
  closeSessionDrawer({ immediate: true });
  stopTimer();
  saveCurrentTaskProgress();
  state.limitExpired = false;
  state.limitExpiredKind = null;
  state.taskOvertimeMode = false;
  state.timerView = 'task';
  setExpiredUI(false);
  clearAllSkippedFlags();
  showView('edit');
  renderEditView();
  focusSessionAddInput();
}

planSessionBtn.addEventListener('click', createPlannedSession);

startBtn.addEventListener('click', startSlashing);

document.addEventListener('keydown', handleEditModeEnterShortcuts, true);

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSettingsMenu();
});
settingsDataBtn.addEventListener('click', openDataModal);
settingsInvoiceBtn.addEventListener('click', openInvoiceSettingsModal);
settingsTemplatesBtn.addEventListener('click', openTemplatesModal);
settingsHistoryBtn.addEventListener('click', () => openHistoryModal());
settingsShortcutsBtn.addEventListener('click', openShortcutsModal);
settingsTutorialBtn.addEventListener('click', startTutorial);
settingsSoundEffectsBtn.addEventListener('click', toggleSoundEffects);
shortcutsCloseBtn.addEventListener('click', closeShortcutsModal);
dataCloseBtn.addEventListener('click', closeDataModal);
invoiceSettingsDoneBtn.addEventListener('click', saveInvoiceSettingsModal);
invoiceSettingsCancelBtn.addEventListener('click', closeInvoiceSettingsModal);
invoiceSettingsAvatarBtn?.addEventListener('click', () => invoiceSettingsAvatarInput?.click());
invoiceSettingsAvatarInput?.addEventListener('change', handleInvoiceSettingsAvatarChange);
invoiceSettingsAvatarRemoveBtn?.addEventListener('click', handleInvoiceSettingsAvatarRemove);
invoiceSettingsModal.addEventListener('click', (e) => {
  if (e.target === invoiceSettingsModal) closeInvoiceSettingsModal();
});
historyCloseBtn.addEventListener('click', closeHistoryModal);
historyTabSessionsBtn?.addEventListener('click', () => setHistoryModalTab('sessions'));
historyTabReportBtn?.addEventListener('click', () => setHistoryModalTab('report'));
historyDateToolbar?.addEventListener('click', handleHistoryDatePresetClick);
historyDateToolbar?.addEventListener('click', handleHistoryDateIconClick);
historyReportStartInput?.addEventListener('change', handleHistoryDateChange);
historyReportEndInput?.addEventListener('change', handleHistoryDateChange);
historyReportSessionTrigger?.addEventListener('click', handleHistoryReportSessionTriggerClick);
historyReportSessionMenu?.addEventListener('click', handleHistoryReportSessionOptionClick);
historyExportInvoiceBtn?.addEventListener('click', handleExportInvoicePdf);
historyExportPdfBtn?.addEventListener('click', handleExportEarningsReportPdf);
historyList.addEventListener('click', handleHistoryListClick);
historyList.addEventListener('change', handleHistoryEntryDateInput);
historyList.addEventListener('blur', handleHistoryDurationInput, true);
historyList.addEventListener('keydown', handleHistoryDurationInput, true);
templatesCloseBtn.addEventListener('click', closeTemplatesModal);
templatesModalBody.addEventListener('click', handleTemplatesModalClick);
templatesModal.addEventListener('click', (e) => {
  if (e.target === templatesModal) closeTemplatesModal();
});
saveTemplateConfirmBtn.addEventListener('click', confirmSaveTemplateModal);
saveTemplateCancelBtn.addEventListener('click', closeSaveTemplateModal);
saveTemplateModal.addEventListener('click', (e) => {
  if (e.target === saveTemplateModal) closeSaveTemplateModal();
});
saveTemplateNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmSaveTemplateModal();
  if (e.key === 'Escape') closeSaveTemplateModal();
});
templateAutocomplete.addEventListener('click', handleTemplateAutocompleteClick);
dataBackupNowBtn.addEventListener('click', handleBackupNow);
dataRestoreBtn.addEventListener('click', handleRestoreFromBackup);
dataOpenFolderBtn.addEventListener('click', handleOpenBackupFolder);
shortcutsModal.addEventListener('click', (e) => {
  if (e.target === shortcutsModal) closeShortcutsModal();
});
dataModal.addEventListener('click', (e) => {
  if (e.target === dataModal) closeDataModal();
});
clearSessionBtn.addEventListener('click', openClearSessionModal);
moveBackToListBtn.addEventListener('click', moveAllSessionTasksBackToLists);
clearSessionAllBtn.addEventListener('click', clearAllSessionTasks);
clearSessionCompletedBtn.addEventListener('click', clearCompletedSessionTasks);
clearSessionCancelBtn.addEventListener('click', closeClearSessionModal);
clearSessionModal.addEventListener('click', (e) => {
  if (e.target === clearSessionModal) closeClearSessionModal();
});

tutorialDoneBtn.addEventListener('click', stopTutorial);
tutorialTooltip.addEventListener('mouseenter', cancelHideTutorialTooltip);
tutorialTooltip.addEventListener('mouseleave', scheduleHideTutorialTooltip);

deleteSessionConfirmBtn.addEventListener('click', confirmDeletePlannedSession);
deleteSessionCancelBtn.addEventListener('click', closeDeleteSessionModal);
deleteSessionModal.addEventListener('click', (e) => {
  if (e.target === deleteSessionModal) closeDeleteSessionModal();
});
deleteHistoryConfirmBtn.addEventListener('click', confirmDeleteHistoryEntry);
deleteHistoryCancelBtn.addEventListener('click', closeDeleteHistoryModal);
deleteHistoryModal.addEventListener('click', (e) => {
  if (e.target === deleteHistoryModal) closeDeleteHistoryModal();
});

billableToggleBtn.addEventListener('click', () => {
  const session = getPlannedSession(pendingBillableSessionId);
  if (!session) return;
  session.hourlyRateEnabled = !session.hourlyRateEnabled;
  updateBillableModalUI(session);
  if (session.hourlyRateEnabled) {
    requestAnimationFrame(() => {
      billableRateInput.focus();
      billableRateInput.select();
    });
  }
});

billableRoundOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.billable-round-option');
  if (!btn) return;
  const value = btn.dataset.roundMinutes;
  setBillableRoundMinutes(value === '' ? null : Number(value));
});

billableRoundScopeOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('.billable-round-scope-option');
  if (!btn) return;
  setBillableRoundScope(btn.dataset.roundScope);
});

billableDoneBtn.addEventListener('click', saveBillableModal);
billableCancelBtn.addEventListener('click', () => closeBillableModal(true));
billableModal.addEventListener('click', (e) => {
  if (e.target === billableModal) closeBillableModal(true);
});
billableRateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveBillableModal();
  }
});

taskContextDuplicateBtn.addEventListener('click', () => {
  if (!taskContextMenuTarget) return;
  const { listId, taskIndex } = taskContextMenuTarget;
  hideTaskContextMenu();
  duplicateTask(listId, taskIndex);
});

taskContextDeleteBtn.addEventListener('click', () => {
  if (!taskContextMenuTarget) return;
  const { listId, taskIndex } = taskContextMenuTarget;
  hideTaskContextMenu();
  removeTask(listId, taskIndex);
});

sessionContextSaveTemplateBtn.addEventListener('click', () => {
  if (!sessionContextMenuTarget) return;
  const { sessionId } = sessionContextMenuTarget;
  hideSessionContextMenu();
  saveSessionAsTemplateFromContext(sessionId);
});

document.addEventListener('click', (e) => {
  if (!taskContextMenu.classList.contains('hidden')
    && !taskContextMenu.contains(e.target)) {
    hideTaskContextMenu();
  }
  if (!sessionContextMenu.classList.contains('hidden')
    && !sessionContextMenu.contains(e.target)) {
    hideSessionContextMenu();
  }
  if (!templateAutocomplete.classList.contains('hidden')
    && !templateAutocomplete.contains(e.target)
    && !e.target.closest('.session-add-task-input')) {
    hideTemplateAutocomplete();
  }
  if (!settingsMenu.classList.contains('hidden')
    && !settingsMenu.contains(e.target)
    && !settingsBtn.contains(e.target)) {
    hideSettingsMenu();
  }
  if (state.mode === 'edit'
    && !e.target.closest('.task-item')
    && !e.target.closest('#task-context-menu')
    && !e.target.closest('#session-context-menu')
    && e.target.closest('#edit-view')) {
    clearSelection();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideAllContextMenus();
    hideTemplateAutocomplete();
    if (!saveTemplateModal.classList.contains('hidden')) {
      closeSaveTemplateModal();
      return;
    }
    if (!templatesModal.classList.contains('hidden')) {
      if (templateEditorState) {
        templateEditorState = null;
        renderTemplatesModal();
        return;
      }
      closeTemplatesModal();
      return;
    }
    if (!shortcutsModal.classList.contains('hidden')) {
      closeShortcutsModal();
      return;
    }
    if (!dataModal.classList.contains('hidden')) {
      closeDataModal();
      return;
    }
    if (!invoiceSettingsModal.classList.contains('hidden')) {
      closeInvoiceSettingsModal();
      return;
    }
    if (!deleteHistoryModal.classList.contains('hidden')) {
      closeDeleteHistoryModal();
      return;
    }
    if (historyReportSessionMenuOpen) {
      closeHistoryReportSessionMenu();
      return;
    }
    if (!historyModal.classList.contains('hidden')) {
      closeHistoryModal();
      return;
    }
    if (isTutorialActive()) {
      if (!tutorialTooltip.classList.contains('hidden')) {
        hideTutorialTooltip();
      }
      return;
    }
    if (!settingsMenu.classList.contains('hidden')) {
      hideSettingsMenu();
      return;
    }
    if (!deleteSessionModal.classList.contains('hidden')) {
      closeDeleteSessionModal();
      return;
    }
    if (!billableModal.classList.contains('hidden')) {
      closeBillableModal(true);
      return;
    }
    if (!clearSessionModal.classList.contains('hidden')) {
      closeClearSessionModal();
    }
  }

  if (state.mode !== 'edit') return;
  if (e.key !== 'Backspace' && e.key !== 'Delete') return;
  if (isTaskInputFocused()) return;
  if (state.selectedTasks.size === 0) return;

  e.preventDefault();
  removeSelectedTasks();
});

document.addEventListener('contextmenu', (e) => {
  const onTask = e.target.closest('.task-item');
  const onSessionHeader = e.target.closest('.planned-session-header');
  if (onTask || onSessionHeader) return;

  if (!taskContextMenu.classList.contains('hidden')) {
    hideTaskContextMenu();
  }
  if (!sessionContextMenu.classList.contains('hidden')) {
    hideSessionContextMenu();
  }
});

backToEditBtn.addEventListener('click', backToEdit);
fullscreenTaskToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFullscreenTaskPanel();
});
timerSizeBtn.addEventListener('click', toggleTimerBarSize);
timerHideBtn.addEventListener('click', hideTimerBar);
pauseBtn.addEventListener('click', toggleTimer);
timerDisplay.addEventListener('click', toggleTimerView);

window.slashIt.onFocusPositionChanged(({ x, y }) => {
  state.focusPosition = { x, y };
  state.focusPositionCustomized = true;
  persist();
  if (drawerOpen && state.mode === 'focus') {
    window.slashIt.showSessionDrawer(getDrawerPayload());
  }
});

window.slashIt.onFocusWindowRestoreRequest(() => {
  if (state.mode === 'focus' && state.timerBarSize === 'hidden') {
    restoreTimerBarFromHide();
  }
});
timerTaskZone.addEventListener('mouseenter', handleFocusStackMouseEnter);
timerTaskZone.addEventListener('mouseleave', handleFocusHoverMouseLeave);
timerBar.addEventListener('mouseleave', handleTimerBarMouseLeave);
focusView.addEventListener('mouseleave', handleFocusViewMouseLeave);
window.slashIt.onDrawerPointerEnter(() => {
  clearTimeout(drawerCloseTimer);
});
window.slashIt.onDrawerPointerLeave(() => {
  scheduleCloseSessionDrawer();
});
window.slashIt.onDrawerSelectTask((index) => switchToTask(index));
completeBtn.addEventListener('click', completeCurrentTask);
skipBtn.addEventListener('click', skipCurrentTask);
overtimeBtn.addEventListener('click', startOvertime);
extendBtn.addEventListener('click', extendTime);
extendConfirmBtn.addEventListener('click', confirmExtend);
extendCancelBtn.addEventListener('click', hideExtendPanel);
extendInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmExtend();
  if (e.key === 'Escape') hideExtendPanel();
});
celebrateBtn.addEventListener('click', launchCelebration);
viewHistoryBtn.addEventListener('click', () => openHistoryModal(state.activeSessionRunId));
resetBtn.addEventListener('click', () => {
  window.slashIt.stopCelebration();
  state.sessionTasks = state.sessionTasks.filter((t) => !t.completed);
  resetSessionProgressState();
  resetTaskTimerState();
  showView('edit');
  renderEditView();
  focusSessionAddInput();
  persist();
});

setupListDropZone(sessionList, 'session');
setupListSelectionClear(sessionList);

function loadExpandedSessionIds(saved) {
  if (Array.isArray(saved.expandedSessionIds) && saved.expandedSessionIds.length > 0) {
    state.expandedSessionIds = new Set(
      saved.expandedSessionIds.filter((id) => getPlannedSession(id)),
    );
    if (state.expandedSessionIds.size === 0) {
      expandAllSessions();
    }
  } else {
    expandAllSessions();
  }
}

function loadPlannedSessionsFromSaved(saved) {
  if (Array.isArray(saved.plannedSessions) && saved.plannedSessions.length > 0) {
    state.plannedSessions = saved.plannedSessions.map(normalizePlannedSession);
    ensureBraindumpSession();
    loadExpandedSessionIds(saved);
    return;
  }

  state.plannedSessions = [{
    id: BRAINDUMP_SESSION_ID,
    name: 'Braindump',
    tasks: (saved.braindumpTasks || []).map(normalizeBraindumpTask),
  }];
  expandAllSessions();
}

async function init() {
  const saved = await window.slashIt.loadData();
  applySavedData(saved);
  routeToSavedMode(saved);
  isInitializing = false;
}

init();
