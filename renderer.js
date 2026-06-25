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
};

const editView = document.getElementById('edit-view');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const settingsShortcutsBtn = document.getElementById('settings-shortcuts-btn');
const settingsDataBtn = document.getElementById('settings-data-btn');
const settingsHistoryBtn = document.getElementById('settings-history-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const shortcutsCloseBtn = document.getElementById('shortcuts-close-btn');
const dataModal = document.getElementById('data-modal');
const dataModalStatus = document.getElementById('data-modal-status');
const dataBackupNowBtn = document.getElementById('data-backup-now-btn');
const dataRestoreBtn = document.getElementById('data-restore-btn');
const dataOpenFolderBtn = document.getElementById('data-open-folder-btn');
const dataCloseBtn = document.getElementById('data-close-btn');
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
const doneSummary = document.getElementById('done-summary');
const doneTime = document.getElementById('done-time');
const celebrateBtn = document.getElementById('celebrate-btn');
const resetBtn = document.getElementById('reset-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const historyCloseBtn = document.getElementById('history-close-btn');
const taskContextMenu = document.getElementById('task-context-menu');
const taskContextDeleteBtn = document.getElementById('task-context-delete');

let taskContextMenuTarget = null;
let pendingDeleteSessionId = null;
let focusDimensionsRaf = null;
let drawerOpen = false;
let drawerCloseTimer = null;
let sessionExpandTimer = null;
let timerBarHideTimeout = null;
let focusBarWidthCache = null;
let isInitializing = true;
let expandedHistoryEntryIds = new Set();
let historyHighlightRunId = null;

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

function getRandomFunSessionName() {
  return FUN_SESSION_NAMES[Math.floor(Math.random() * FUN_SESSION_NAMES.length)];
}
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8;

function getTimerBarScale() {
  return state.timerBarSize === 'small' ? FOCUS_BAR_SCALE_SMALL : 1;
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
  document.body.classList.toggle('timer-bar-size-small', state.mode === 'focus' && state.timerBarSize === 'small');
}

function getFocusWindowModeOptions() {
  return {
    height: getScaledFocusBarHeight(),
    focusPosition: state.focusPosition,
    focusPositionCustomized: state.focusPositionCustomized,
  };
}

function getFocusDimensionsPayload(barWidth) {
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

function clampBarWidth(width, scale = getTimerBarScale()) {
  const minWidth = Math.round(FOCUS_BAR_BASE_MIN_WIDTH * scale);
  if (isTimerBarExpandedLayout()) {
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
    if (state.timerBarSize === 'small') {
      timerSizeBtn.title = 'Normal size timer bar';
      timerSizeBtn.setAttribute('aria-label', 'Restore normal timer bar size');
      timerSizeBtn.classList.add('timer-size-btn--small');
    } else {
      timerSizeBtn.title = 'Smaller timer bar';
      timerSizeBtn.setAttribute('aria-label', 'Make timer bar smaller');
      timerSizeBtn.classList.remove('timer-size-btn--small');
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

function applyFocusWindowSizeImmediate() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  const barWidth = measureTimerBarWidth();
  void window.slashIt.setFocusDimensions(getFocusDimensionsPayload(barWidth)).then(() => {
    if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
    if (drawerOpen) void window.slashIt.showSessionDrawer(getDrawerPayload());
  });
}

async function applyFocusWindowSize() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  const barWidth = measureTimerBarWidth();
  await window.slashIt.setFocusDimensions(getFocusDimensionsPayload(barWidth));
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  if (drawerOpen) await window.slashIt.showSessionDrawer(getDrawerPayload());
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
  state.timerBarSizeBeforeHide = state.timerBarSize === 'small' ? 'small' : 'normal';
  state.timerBarSize = 'hidden';
  closeSessionDrawer({ immediate: true });
  window.slashIt.hideFocusWindow();
  clearTimerBarHideTimeout();
  timerBarHideTimeout = setTimeout(restoreTimerBarFromHide, TIMER_BAR_HIDE_DURATION_MS);
  persist();
}

function toggleTimerBarSize() {
  if (state.mode !== 'focus' || state.timerBarSize === 'hidden') return;
  state.timerBarSize = state.timerBarSize === 'small' ? 'normal' : 'small';
  applyTimerBarSizeClass();
  updateTimerBarControlLabels();
  applyFocusWindowSizeImmediate();
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
    if (Number.isInteger(index)) switchToTask(index);
  });
}

async function openSessionDrawer() {
  if (drawerOpen || state.mode !== 'focus') return;
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

function handleFocusHoverMouseLeave(e) {
  if (isLeavingTaskZoneUpward(e)) return;
  scheduleCloseSessionDrawer();
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
  return normalized;
}

function normalizeBraindumpTask(task) {
  return { text: task.text || '', limitMs: task.limitMs ?? null };
}

function normalizePlannedSession(session) {
  return {
    id: session.id || BRAINDUMP_SESSION_ID,
    name: session.name || 'Session',
    tasks: (session.tasks || []).map(normalizeBraindumpTask),
  };
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

function savePlannedSessionName(sessionId, name) {
  const session = getPlannedSession(sessionId);
  if (!session || sessionId === BRAINDUMP_SESSION_ID) return;
  const trimmed = name.trim();
  if (trimmed) session.name = trimmed;
  state.renamingSessionId = null;
  persist();
  renderEditView();
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
  });
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
    const entry = {
      text: task.text,
      status: getTaskArchiveStatus(task),
      durationMs: task.completed
        ? (task.durationMs ?? null)
        : (task.elapsedMs > 0 ? task.elapsedMs : null),
      limitMs: task.limitMs ?? null,
    };
    if (task.sourceSessionName) {
      entry.sourceSessionName = task.sourceSessionName;
    }
    return entry;
  });
}

function normalizeSessionHistoryEntry(entry) {
  return {
    id: entry.id || crypto.randomUUID(),
    runId: entry.runId || crypto.randomUUID(),
    name: entry.name || 'Braindump',
    startedAt: entry.startedAt || entry.endedAt || Date.now(),
    endedAt: entry.endedAt || Date.now(),
    status: entry.status === 'abandoned' ? 'abandoned' : 'completed',
    totalMs: entry.totalMs || 0,
    completedCount: entry.completedCount ?? 0,
    totalCount: entry.totalCount ?? (entry.tasks?.length || 0),
    tasks: (entry.tasks || []).map((task) => ({
      text: task.text || '',
      status: task.status === 'skipped' || task.status === 'incomplete' ? task.status : 'completed',
      durationMs: task.durationMs ?? null,
      limitMs: task.limitMs ?? null,
      ...(task.sourceSessionName ? { sourceSessionName: task.sourceSessionName } : {}),
    })),
  };
}

function archiveCurrentSession(status) {
  if (!hasArchivableProgress()) return null;
  ensureActiveSessionRun(false);
  const runId = state.activeSessionRunId;
  if (!runId) return null;
  if (state.sessionHistory.some((entry) => entry.runId === runId)) return null;

  const entry = {
    id: crypto.randomUUID(),
    runId,
    name: state.activeSessionName || state.sessionTasks[0]?.sourceSessionName || 'Braindump',
    startedAt: state.activeSessionStartedAt || Date.now(),
    endedAt: Date.now(),
    status,
    totalMs: getArchiveTotalMs(),
    completedCount: getCompletedCount(),
    totalCount: state.sessionTasks.length,
    tasks: buildHistoryTasks(),
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
  return state.limitExpired && state.limitExpiredKind === state.timerView;
}

function updateTimerDisplay() {
  const current = getCurrentTask();
  if (timerModeLabel) {
    timerModeLabel.textContent = state.timerView === 'task' ? 'TASK' : 'SESSION';
    timerModeLabel.classList.toggle('timer-mode-label--session', state.timerView === 'session');
  }
  const displayMs = state.timerView === 'session'
    ? getSessionDisplayMs()
    : getTaskDisplayMs(current);
  timerDisplay.textContent = formatTime(displayMs);
  timerDisplay.classList.toggle('paused', !state.isRunning && !state.limitExpired);
  timerDisplay.classList.toggle('expired', isTimerDisplayExpired());
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
  dropIndicatorState = null;
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
    const payload = decodeDragPayload(e.dataTransfer.getData('text/plain'));
    if (!payload) return;
    moveTasks(payload.items, listId, getTasksForList(listId).length);
  });
}

function hideTaskContextMenu() {
  taskContextMenu.classList.add('hidden');
  taskContextMenuTarget = null;
}

function showTaskContextMenu(e, listId, taskIndex) {
  e.preventDefault();
  taskContextMenuTarget = { listId, taskIndex };
  taskContextMenu.classList.remove('hidden');

  const menuRect = taskContextMenu.getBoundingClientRect();
  const padding = 8;
  let x = e.clientX;
  let y = e.clientY;

  if (x + menuRect.width > window.innerWidth - padding) {
    x = window.innerWidth - menuRect.width - padding;
  }
  if (y + menuRect.height > window.innerHeight - padding) {
    y = window.innerHeight - menuRect.height - padding;
  }

  taskContextMenu.style.left = `${Math.max(padding, x)}px`;
  taskContextMenu.style.top = `${Math.max(padding, y)}px`;
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
  if (!isOpen) {
    return `
      <button type="button" class="session-add-task-trigger" data-session-id="${escapeHtml(session.id)}">
        <span class="session-add-task-trigger-icon" aria-hidden="true">+</span>
        <span>NEW TASK</span>
      </button>
    `;
  }

  return `
    <form class="session-add-task-form" data-session-id="${escapeHtml(session.id)}">
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

    e.preventDefault();
    e.stopPropagation();

    if (meta) {
      submitPlannedTaskToQueue(session.id, textInput.value, limitInput.value);
      return;
    }

    submitPlannedSessionTask(session.id, textInput.value, limitInput.value);
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
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

  state.plannedSessions.forEach((session) => {
    const isExpanded = isSessionExpanded(session.id);
    const listId = listIdForSession(session.id);
    const block = document.createElement('div');
    block.className = `planned-session ${isExpanded ? 'planned-session--expanded' : 'planned-session--collapsed'}`;
    block.dataset.sessionId = session.id;
    const sendLabel = `Send all tasks from ${session.name} to Queue`;

    block.innerHTML = `
      <div class="planned-session-header">
        <button class="planned-session-toggle" type="button" aria-expanded="${isExpanded}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${escapeHtml(session.name)}">
          <span class="planned-session-toggle-icon" aria-hidden="true"></span>
        </button>
        ${renderPlannedSessionName(session, isExpanded)}
        <div class="planned-session-header-actions">
          ${renderPlannedSessionDeleteButton(session)}
          <button
            type="button"
            class="session-send-to-queue-btn"
            data-session-id="${escapeHtml(session.id)}"
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
    header.addEventListener('click', (e) => {
      if (e.target.closest('.planned-session-name-input, .planned-session-toggle, .planned-session-delete-btn, .session-send-to-queue-btn')) return;
      if (!isExpanded) expandSession(session.id);
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
    || !historyModal.classList.contains('hidden');
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

function showSettingsMenu() {
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
    hideTaskContextMenu();
    showSettingsMenu();
  } else {
    hideSettingsMenu();
  }
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

function renderHistoryTaskItem(task) {
  const statusClass = task.status === 'skipped'
    ? 'history-task-item--skipped'
    : task.status === 'incomplete'
      ? 'history-task-item--incomplete'
      : '';
  const statusLabel = getHistoryTaskStatusLabel(task.status);
  const duration = task.durationMs != null ? formatTime(task.durationMs) : '';
  const suffix = statusLabel ? ` (${statusLabel})` : '';
  return `
    <li class="history-task-item ${statusClass}">
      <span class="history-task-label">${escapeHtml(task.text)}${suffix}</span>
      ${duration ? `<span class="history-task-duration">${escapeHtml(duration)}</span>` : ''}
    </li>
  `;
}

function renderHistoryEntry(entry) {
  const isExpanded = expandedHistoryEntryIds.has(entry.id);
  const isHighlighted = historyHighlightRunId && entry.runId === historyHighlightRunId;
  const statusLabel = entry.status === 'abandoned' ? 'Abandoned' : 'Completed';
  const statusClass = entry.status === 'abandoned'
    ? 'history-status-badge--abandoned'
    : 'history-status-badge--completed';
  const taskSummary = `${entry.completedCount} of ${entry.totalCount} task${entry.totalCount === 1 ? '' : 's'}`;

  return `
    <article class="history-entry${isExpanded ? ' history-entry--expanded' : ''}${isHighlighted ? ' history-entry--highlight' : ''}" data-entry-id="${escapeHtml(entry.id)}">
      <button type="button" class="history-entry-header" aria-expanded="${isExpanded}">
        <div class="history-entry-main">
          <div class="history-entry-top">
            <span class="history-entry-name">${escapeHtml(entry.name)}</span>
            <span class="history-status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="history-entry-meta">
            ${escapeHtml(formatRelativeBackupTime(entry.endedAt))} · ${escapeHtml(formatTime(entry.totalMs))} · ${escapeHtml(taskSummary)}
          </div>
        </div>
        <span class="history-entry-chevron" aria-hidden="true">›</span>
      </button>
      <div class="history-entry-detail">
        <ul class="history-task-list">
          ${entry.tasks.map(renderHistoryTaskItem).join('')}
        </ul>
        <div class="history-entry-actions">
          <button type="button" class="history-delete-btn" data-delete-id="${escapeHtml(entry.id)}">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderHistoryModal() {
  if (!historyList) return;

  if (state.sessionHistory.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No sessions yet. Finish or abandon a focus run to see it here.</p>';
    return;
  }

  historyList.innerHTML = state.sessionHistory.map(renderHistoryEntry).join('');

  if (historyHighlightRunId) {
    const highlighted = historyList.querySelector('.history-entry--highlight');
    highlighted?.scrollIntoView({ block: 'nearest' });
  }
}

function openHistoryModal(highlightRunId = null) {
  hideSettingsMenu();
  historyHighlightRunId = highlightRunId;
  if (highlightRunId) {
    const entry = state.sessionHistory.find((item) => item.runId === highlightRunId);
    if (entry) expandedHistoryEntryIds.add(entry.id);
  }
  renderHistoryModal();
  historyModal.classList.remove('hidden');
}

function closeHistoryModal() {
  historyModal.classList.add('hidden');
  historyHighlightRunId = null;
}

function deleteHistoryEntry(entryId) {
  const entry = state.sessionHistory.find((item) => item.id === entryId);
  if (!entry) return;
  const label = entry.name || 'this session';
  if (!window.confirm(`Delete "${label}" from session history?`)) return;

  state.sessionHistory = state.sessionHistory.filter((item) => item.id !== entryId);
  expandedHistoryEntryIds.delete(entryId);
  persist();
  renderHistoryModal();
}

function handleHistoryListClick(event) {
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
    expandedHistoryEntryIds.add(entryId);
  }
  renderHistoryModal();
}

function applySavedData(saved) {
  state.sessionTasks = (saved.sessionTasks || saved.tasks || []).map(normalizeSessionTask);
  loadPlannedSessionsFromSaved(saved);
  state.activeSessionName = saved.activeSessionName || null;
  state.totalSessionMs = saved.totalSessionMs || 0;
  state.timerView = saved.timerView === 'session' ? 'session' : 'task';
  state.limitExpired = saved.limitExpiredKind === 'task' ? !!saved.limitExpired : false;
  state.limitExpiredKind = saved.limitExpiredKind === 'task' && saved.limitExpired ? 'task' : null;
  state.taskOvertimeMode = !!saved.taskOvertimeMode;
  state.currentIndex = saved.currentIndex || 0;
  state.focusTaskIndex = Number.isInteger(saved.focusTaskIndex) ? saved.focusTaskIndex : 0;
  state.elapsedMs = saved.elapsedMs || 0;
  state.isRunning = false;
  state.timerBarSize = saved.timerBarSize === 'small' ? 'small' : 'normal';
  state.timerBarSizeBeforeHide = saved.timerBarSizeBeforeHide === 'small' ? 'small' : 'normal';
  state.focusPosition = saved.focusPosition && Number.isFinite(saved.focusPosition.x) && Number.isFinite(saved.focusPosition.y)
    ? { x: saved.focusPosition.x, y: saved.focusPosition.y }
    : null;
  state.focusPositionCustomized = !!saved.focusPositionCustomized;
  state.sessionHistory = Array.isArray(saved.sessionHistory)
    ? saved.sessionHistory.map(normalizeSessionHistoryEntry)
    : [];
  state.activeSessionRunId = saved.activeSessionRunId || null;
  state.activeSessionStartedAt = saved.activeSessionStartedAt || null;

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
  startBtn.disabled = getSessionIncompleteIndices().length === 0;
  startBtn.textContent = isSessionInProgress() ? 'Resume Session' : 'Start Session';
  clearSessionBtn.disabled = state.sessionTasks.length === 0;
  moveBackToListBtn.disabled = state.sessionTasks.length === 0;
  clearSessionCompletedBtn.disabled = getCompletedCount() === 0;
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

function isInlineTaskInputFocused() {
  const active = document.activeElement;
  return !!active?.matches('.task-text-input, .task-limit-input, .planned-session-name-input, .session-add-task-input, .session-add-limit-input');
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
    if (isInlineTaskInputFocused()) return;

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
    showDoneView();
    return;
  }

  currentTaskEl.textContent = current.text.toUpperCase();
  invalidateFocusBarWidthCache();
  updateTimerDisplay();
  updateSkipButtonState();
  scheduleFocusDimensionsUpdate();
}

function showDoneView() {
  archiveCurrentSession('completed');
  doneSummary.textContent = `You completed ${getCompletedCount()} task${getCompletedCount() === 1 ? '' : 's'}.`;
  doneTime.textContent = formatTime(state.totalSessionMs);
  showView('done');
}

function launchCelebration() {
  window.slashIt.triggerCelebration();
}

function handleLimitExpired() {
  if (state.limitExpired) return;
  state.limitExpired = true;
  state.limitExpiredKind = 'task';
  setExpiredUI(true);
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
  state.timerView = state.timerView === 'task' ? 'session' : 'task';
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
  state.totalSessionMs += completedElapsedMs;

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
settingsHistoryBtn.addEventListener('click', () => openHistoryModal());
settingsShortcutsBtn.addEventListener('click', openShortcutsModal);
shortcutsCloseBtn.addEventListener('click', closeShortcutsModal);
dataCloseBtn.addEventListener('click', closeDataModal);
historyCloseBtn.addEventListener('click', closeHistoryModal);
historyList.addEventListener('click', handleHistoryListClick);
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

deleteSessionConfirmBtn.addEventListener('click', confirmDeletePlannedSession);
deleteSessionCancelBtn.addEventListener('click', closeDeleteSessionModal);
deleteSessionModal.addEventListener('click', (e) => {
  if (e.target === deleteSessionModal) closeDeleteSessionModal();
});

taskContextDeleteBtn.addEventListener('click', () => {
  if (!taskContextMenuTarget) return;
  const { listId, taskIndex } = taskContextMenuTarget;
  hideTaskContextMenu();
  removeTask(listId, taskIndex);
});

document.addEventListener('click', (e) => {
  if (!taskContextMenu.classList.contains('hidden')
    && !taskContextMenu.contains(e.target)) {
    hideTaskContextMenu();
  }
  if (!settingsMenu.classList.contains('hidden')
    && !settingsMenu.contains(e.target)
    && !settingsBtn.contains(e.target)) {
    hideSettingsMenu();
  }
  if (state.mode === 'edit'
    && !e.target.closest('.task-item')
    && !e.target.closest('#task-context-menu')
    && e.target.closest('#edit-view')) {
    clearSelection();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideTaskContextMenu();
    if (!shortcutsModal.classList.contains('hidden')) {
      closeShortcutsModal();
      return;
    }
    if (!dataModal.classList.contains('hidden')) {
      closeDataModal();
      return;
    }
    if (!historyModal.classList.contains('hidden')) {
      closeHistoryModal();
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
  if (!taskContextMenu.classList.contains('hidden')
    && !taskContextMenu.contains(e.target)) {
    hideTaskContextMenu();
  }
});

backToEditBtn.addEventListener('click', backToEdit);
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
