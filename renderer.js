const BRAINDUMP_SESSION_ID = 'braindump';

const state = {
  sessionTasks: [],
  plannedSessions: [],
  expandedSessionId: BRAINDUMP_SESSION_ID,
  renamingSessionId: null,
  currentIndex: 0,
  focusTaskIndex: 0,
  elapsedMs: 0,
  isRunning: false,
  mode: 'edit',
  timerInterval: null,
  sessionStartMs: null,
  totalSessionMs: 0,
  limitExpired: false,
  overtimeMode: false,
  selectedTasks: new Set(),
  lastSelected: null,
};

const editView = document.getElementById('edit-view');
const focusView = document.getElementById('focus-view');
const doneView = document.getElementById('done-view');
const plannedSessionsList = document.getElementById('planned-sessions-list');
const planSessionBtn = document.getElementById('plan-session-btn');
const sessionList = document.getElementById('session-list');
const addBraindumpForm = document.getElementById('add-braindump-form');
const newBraindumpInput = document.getElementById('new-braindump-input');
const newBraindumpLimit = document.getElementById('new-braindump-limit');
const startBtn = document.getElementById('start-btn');
const clearSessionBtn = document.getElementById('clear-session-btn');
const clearSessionModal = document.getElementById('clear-session-modal');
const clearSessionAllBtn = document.getElementById('clear-session-all-btn');
const clearSessionCompletedBtn = document.getElementById('clear-session-completed-btn');
const clearSessionCancelBtn = document.getElementById('clear-session-cancel-btn');
const deleteSessionModal = document.getElementById('delete-session-modal');
const deleteSessionMessage = document.getElementById('delete-session-message');
const deleteSessionConfirmBtn = document.getElementById('delete-session-confirm-btn');
const deleteSessionCancelBtn = document.getElementById('delete-session-cancel-btn');
const backToEditBtn = document.getElementById('back-to-edit-btn');
const pauseBtn = document.getElementById('pause-btn');
const timerDisplay = document.getElementById('timer-display');
const focusStack = document.getElementById('focus-stack');
const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerList = document.getElementById('session-drawer-list');
const timerBar = document.getElementById('timer-bar');
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
const resetBtn = document.getElementById('reset-btn');
const taskContextMenu = document.getElementById('task-context-menu');
const taskContextDeleteBtn = document.getElementById('task-context-delete');

let taskContextMenuTarget = null;
let pendingDeleteSessionId = null;
let focusDimensionsRaf = null;
let drawerOpen = false;
let drawerCloseTimer = null;

const FOCUS_BAR_HEIGHT = 56;
const FOCUS_DRAWER_GAP = 6;
const FOCUS_DRAWER_SLOT = 180 + 16 + 6 + 8;
const FOCUS_SHELL_HEIGHT = FOCUS_BAR_HEIGHT + FOCUS_DRAWER_SLOT;
const FOCUS_DRAWER_ANIM_MS = 350;

function measureTimerBarWidth() {
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

async function applyFocusWindowSize() {
  if (state.mode !== 'focus') return;
  const barWidth = measureTimerBarWidth();
  await window.slashIt.setFocusDimensions({ width: barWidth, height: FOCUS_BAR_HEIGHT });
  if (state.mode !== 'focus') return;
  if (drawerOpen) await window.slashIt.showSessionDrawer(getDrawerPayload());
}

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
      durationText = formatTime(state.elapsedMs);
    }

    return { text: task.text, status, durationText, index };
  });

  return { drawerWidth, drawerHeight, tasks };
}

function getDrawerContentHeight() {
  const focusIndex = getFocusTaskIndex();
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
  return Math.min(180, listHeight) + 16;
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
      durationText = formatTime(state.elapsedMs);
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

  if (immediate) {
    void window.slashIt.hideSessionDrawer();
    return;
  }

  drawerCloseTimer = setTimeout(() => {
    void window.slashIt.hideSessionDrawer();
  }, FOCUS_DRAWER_ANIM_MS);
}

function scheduleCloseSessionDrawer() {
  clearTimeout(drawerCloseTimer);
  drawerCloseTimer = setTimeout(() => {
    closeSessionDrawer();
  }, 80);
}

function handleFocusStackMouseEnter() {
  clearTimeout(drawerCloseTimer);
  openSessionDrawer();
}

function handleFocusHoverMouseLeave() {
  scheduleCloseSessionDrawer();
}

function handleFocusViewMouseLeave() {
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

function parseDurationFromTitle(text) {
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
  return {
    text: task.text || '',
    completed: !!task.completed,
    limitMs: task.limitMs ?? null,
    durationMs: task.durationMs ?? null,
    skipped: !!task.skipped,
  };
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

function getExpandedSession() {
  return getPlannedSession(state.expandedSessionId) || getBraindumpSession();
}

function getExpandedPlannedListId() {
  const session = getExpandedSession();
  return session ? listIdForSession(session.id) : listIdForSession(BRAINDUMP_SESSION_ID);
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

function expandSession(sessionId) {
  if (!getPlannedSession(sessionId)) return;
  state.expandedSessionId = sessionId;
  persist();
  renderEditView();
}

function createPlannedSession() {
  const id = crypto.randomUUID();
  state.plannedSessions.push({
    id,
    name: 'New Session',
    tasks: [],
  });
  state.expandedSessionId = id;
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

  if (state.expandedSessionId === sessionId) {
    state.expandedSessionId = BRAINDUMP_SESSION_ID;
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
  window.slashIt.saveData({
    sessionTasks: state.sessionTasks,
    plannedSessions: state.plannedSessions,
    expandedSessionId: state.expandedSessionId,
    currentIndex: state.currentIndex,
    focusTaskIndex: state.focusTaskIndex,
    elapsedMs: state.elapsedMs,
    isRunning: state.isRunning,
    mode: state.mode,
  });
}

function showView(mode) {
  state.mode = mode;
  document.body.classList.toggle('mode-focus', mode === 'focus');
  document.body.classList.toggle('mode-edit', mode === 'edit');
  editView.classList.toggle('hidden', mode !== 'edit');
  focusView.classList.toggle('hidden', mode !== 'focus');
  doneView.classList.toggle('hidden', mode !== 'done');
  if (mode !== 'focus') cancelFocusDimensionsUpdate();
  window.slashIt.setWindowMode(mode);
  if (mode === 'focus') scheduleFocusDimensionsUpdate();
  else closeSessionDrawer({ immediate: true });
  persist();
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

function getDisplayMs(task) {
  if (!task) return state.elapsedMs;
  if (task.limitMs && (state.overtimeMode || state.limitExpired)) {
    return Math.max(0, state.elapsedMs - task.limitMs);
  }
  if (task.limitMs) {
    return Math.max(0, task.limitMs - state.elapsedMs);
  }
  return state.elapsedMs;
}

function updateTimerDisplay() {
  const current = getCurrentTask();
  timerDisplay.textContent = formatTime(getDisplayMs(current));
  timerDisplay.classList.toggle('paused', !state.isRunning && !state.limitExpired);
  timerDisplay.classList.toggle('expired', state.limitExpired);
  timerBar.classList.toggle('is-running', state.isRunning);
  pauseBtn.classList.toggle('is-paused', !state.isRunning);
  pauseBtn.title = state.isRunning ? 'Pause' : 'Resume';
  pauseBtn.setAttribute('aria-label', state.isRunning ? 'Pause' : 'Resume');
  updateSkipButtonState();
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
  updateTimerDisplay();
  scheduleFocusDimensionsUpdate();
}

function showExtendPanel() {
  expiredActions.classList.add('hidden');
  extendPanel.classList.remove('hidden');
  extendInput.value = '5m';
  extendInput.focus();
  extendInput.select();
  scheduleFocusDimensionsUpdate();
}

function hideExtendPanel() {
  extendPanel.classList.add('hidden');
  if (state.limitExpired) {
    expiredActions.classList.remove('hidden');
  }
  scheduleFocusDimensionsUpdate();
}

function resetTaskTimerState() {
  state.elapsedMs = 0;
  state.limitExpired = false;
  state.overtimeMode = false;
  setExpiredUI(false);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toSessionTaskFromBraindump(task) {
  return {
    text: task.text,
    completed: false,
    limitMs: task.limitMs ?? null,
    durationMs: null,
    skipped: false,
  };
}

function toBraindumpTaskFromSession(task) {
  return { text: task.text, limitMs: task.limitMs ?? null };
}

function convertTaskForMove(task, fromList, toList) {
  if (fromList === toList) return task;
  if (toList === 'session') return toSessionTaskFromBraindump(task);
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

function setupListDropZone(listEl, listId) {
  listEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    listEl.classList.add('drag-over-list');
  });
  listEl.addEventListener('dragleave', (e) => {
    if (!listEl.contains(e.relatedTarget)) {
      listEl.classList.remove('drag-over-list');
    }
  });
  listEl.addEventListener('drop', (e) => {
    e.preventDefault();
    listEl.classList.remove('drag-over-list');
    const payload = decodeDragPayload(e.dataTransfer.getData('text/plain'));
    if (!payload) return;
    const insertAt = listId === 'session'
      ? getSessionActiveInsertIndex()
      : getTasksForList(listId).length;
    moveTasks(payload.items, listId, insertAt);
  });
}

function setupListSelectionClear(listEl) {
  listEl.addEventListener('click', (e) => {
    if (e.target.closest('.task-item')) return;
    clearSelection();
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

function addAllFromExpandedSession() {
  const session = getExpandedSession();
  if (!session || session.tasks.length === 0) return;

  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    ...session.tasks.map(toSessionTaskFromBraindump),
  );
  session.tasks = [];
  persist();
  renderEditView();
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

  indices.forEach((taskIndex, displayIndex) => {
    const task = tasks[taskIndex];
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

    const limitFieldValue = isSession ? formatLimitField(task.limitMs) : '';
    const limitFieldHtml = isSession
      ? (isCompleted
        ? (task.durationMs != null
          ? `<span class="task-duration-badge">${formatTime(task.durationMs)}</span>`
          : '')
        : (task.limitMs
          ? `<span class="task-limit-badge">${limitFieldValue}</span>`
          : `<input class="task-limit-input" type="text" value="" title="Time limit" />`))
      : '';
    const limitBadgeHtml = isPlanned && task.limitMs
      ? `<span class="task-limit-badge">${formatLimitField(task.limitMs)}</span>`
      : '';
    const moveToSessionHtml = isSession
      ? ''
      : `<button class="task-move-to-session" type="button" title="Move to session" aria-label="Move to session">
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
        const targetListId = getExpandedPlannedListId();
        moveTask('session', taskIndex, targetListId, getTasksForList(targetListId).length);
      });

      const limitEl = li.querySelector('.task-limit-input, .task-limit-badge');
      if (!isCompleted && limitEl?.classList.contains('task-limit-input')) {
        limitEl.addEventListener('change', () => {
          state.sessionTasks[taskIndex].limitMs = parseManualLimit(limitEl.value);
          persist();
          renderEditView();
        });
        limitEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') limitEl.blur();
        });
      } else if (!isCompleted && limitEl) {
        limitEl.addEventListener('dblclick', () => {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'task-limit-input';
          input.value = formatLimitField(task.limitMs);
          limitEl.replaceWith(input);
          input.focus();
          input.select();
          const save = () => {
            state.sessionTasks[taskIndex].limitMs = parseManualLimit(input.value);
            persist();
            renderEditView();
          };
          input.addEventListener('blur', save);
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
          });
        });
      }
    }

    li.addEventListener('dragstart', (e) => {
      if (isCompleted) {
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
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      li.classList.remove('drag-over');
      const payload = decodeDragPayload(e.dataTransfer.getData('text/plain'));
      if (!payload) return;
      const insertAt = isSession && task.completed
        ? getSessionActiveInsertIndex()
        : taskIndex;
      moveTasks(payload.items, listId, insertAt);
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

function renderPlannedSessions() {
  plannedSessionsList.innerHTML = '';

  state.plannedSessions.forEach((session) => {
    const isExpanded = session.id === state.expandedSessionId;
    const listId = listIdForSession(session.id);
    const block = document.createElement('div');
    block.className = `planned-session ${isExpanded ? 'planned-session--expanded' : 'planned-session--collapsed'}`;
    block.dataset.sessionId = session.id;

    block.innerHTML = `
      <div class="planned-session-header">
        <button class="planned-session-toggle" type="button" aria-expanded="${isExpanded}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} ${escapeHtml(session.name)}">
          <span class="planned-session-toggle-icon" aria-hidden="true"></span>
        </button>
        ${renderPlannedSessionName(session, isExpanded)}
        <div class="planned-session-header-actions">
          ${renderPlannedSessionDeleteButton(session)}
          ${isExpanded ? `<button class="section-action-btn planned-add-all-btn" type="button" ${session.tasks.length === 0 ? 'disabled' : ''}>Add all to session</button>` : ''}
        </div>
      </div>
      <div class="planned-session-body">
        <ul class="task-list" data-list="${escapeHtml(listId)}"></ul>
      </div>
    `;

    const toggleBtn = block.querySelector('.planned-session-toggle');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isExpanded) expandSession(session.id);
    });

    const header = block.querySelector('.planned-session-header');
    header.addEventListener('click', (e) => {
      if (e.target.closest('.planned-add-all-btn, .planned-session-name-input, .planned-session-toggle, .planned-session-delete-btn')) return;
      if (!isExpanded) expandSession(session.id);
    });

    const deleteBtn = block.querySelector('.planned-session-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteSessionModal(session.id);
      });
    }

    if (isExpanded) {
      const addAllBtn = block.querySelector('.planned-add-all-btn');
      addAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addAllFromExpandedSession();
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
    if (isExpanded) {
      renderTaskList(listEl, listId);
      setupListDropZone(listEl, listId);
      setupListSelectionClear(listEl);
    }

    plannedSessionsList.appendChild(block);
  });
}

function renderEditView() {
  hideTaskContextMenu();
  renderPlannedSessions();
  renderTaskList(sessionList, 'session');
  startBtn.disabled = getSessionIncompleteIndices().length === 0;
  clearSessionBtn.disabled = state.sessionTasks.length === 0;
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
  ensureBraindumpSession();
  const braindump = getBraindumpSession();
  braindump.tasks.push(
    ...state.sessionTasks
      .filter((task) => !task.completed)
      .map(toBraindumpTaskFromSession),
  );
  state.sessionTasks = [];
  state.currentIndex = 0;
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

function focusAddTaskInput() {
  requestAnimationFrame(() => {
    if (state.mode === 'edit') {
      newBraindumpInput.focus();
    }
  });
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
        const limitBadge = li.querySelector('.task-limit-badge');
        const manualLimit = limitInput
          ? limitInput.value
          : (limitBadge ? limitBadge.textContent : '');
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

function submitBraindumpForm() {
  const parsed = parseTaskInput(newBraindumpInput.value, newBraindumpLimit.value);
  if (!parsed.text) return;
  const session = getExpandedSession();
  if (!session) return;
  session.tasks.push({ text: parsed.text, limitMs: parsed.limitMs });
  persist();
  renderEditView();
  newBraindumpInput.value = '';
  newBraindumpLimit.value = '';
  focusAddTaskInput();
}

function submitToSessionForm() {
  const parsed = parseTaskInput(newBraindumpInput.value, newBraindumpLimit.value);
  if (!parsed.text) return;
  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    toSessionTaskFromBraindump({ text: parsed.text, limitMs: parsed.limitMs }),
  );
  persist();
  renderEditView();
  newBraindumpInput.value = '';
  newBraindumpLimit.value = '';
  focusAddTaskInput();
}

function isAddFormFocused() {
  const active = document.activeElement;
  return active === newBraindumpInput || active === newBraindumpLimit;
}

function isTaskInputFocused() {
  if (isAddFormFocused()) return true;
  const active = document.activeElement;
  return !!active?.matches('.task-text-input, .task-limit-input, .planned-session-name-input');
}

function isInlineTaskInputFocused() {
  const active = document.activeElement;
  return !!active?.matches('.task-text-input, .task-limit-input, .planned-session-name-input');
}

function handleBraindumpEnter(e) {
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;

  const meta = e.metaKey || e.ctrlKey || e.getModifierState('Meta') || e.getModifierState('Control');
  const shift = e.shiftKey || e.getModifierState('Shift');

  e.preventDefault();
  e.stopPropagation();

  if (meta && shift) {
    addAllFromExpandedSession();
    return;
  }

  if (meta) {
    submitToSessionForm();
    return;
  }

  submitBraindumpForm();
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
  updateTimerDisplay();
  updateSkipButtonState();
  scheduleFocusDimensionsUpdate();
}

function showDoneView() {
  doneSummary.textContent = `You completed ${getCompletedCount()} task${getCompletedCount() === 1 ? '' : 's'}.`;
  doneTime.textContent = formatTime(state.totalSessionMs);
  showView('done');
}

function handleLimitExpired() {
  if (state.limitExpired) return;
  state.limitExpired = true;
  state.overtimeMode = true;
  setExpiredUI(true);
  persist();
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  state.sessionStartMs = Date.now() - state.elapsedMs;
  state.timerInterval = setInterval(() => {
    state.elapsedMs = Date.now() - state.sessionStartMs;
    const current = getCurrentTask();
    if (current?.limitMs && !state.overtimeMode && state.elapsedMs >= current.limitMs) {
      handleLimitExpired();
    }
    updateTimerDisplay();
  }, 250);
  updateTimerDisplay();
  persist();
}

function stopTimer() {
  state.isRunning = false;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
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

  state.sessionTasks[taskIndex].completed = true;
  state.sessionTasks[taskIndex].durationMs = state.elapsedMs;
  state.sessionTasks[taskIndex].skipped = false;

  stopTimer();
  state.totalSessionMs += state.elapsedMs;
  resetTaskTimerState();

  state.focusTaskIndex = getNextFocusTaskIndex();
  persist();
  renderFocusView();

  if (getCurrentTask()) startTimer();
}

function skipCurrentTask() {
  const taskIndex = getFocusTaskIndex();
  if (taskIndex < 0 || getIncompleteCount() <= 1) return;

  state.sessionTasks[taskIndex].skipped = true;
  stopTimer();
  resetTaskTimerState();
  state.focusTaskIndex = getNextFocusTaskIndex({ excludeIndex: taskIndex });
  persist();
  renderFocusView();

  if (getCurrentTask()) startTimer();
}

function switchToTask(index) {
  if (state.mode !== 'focus') return;
  const task = state.sessionTasks[index];
  if (!task || task.completed) return;
  if (index === getFocusTaskIndex()) return;

  task.skipped = false;
  stopTimer();
  resetTaskTimerState();
  state.focusTaskIndex = index;
  persist();
  renderFocusView();
  startTimer();
}

function startOvertime() {
  window.slashIt.setScreenOverlay(false);
  if (!state.isRunning) startTimer();
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
  state.overtimeMode = false;
  state.limitExpired = false;
  hideExtendPanel();
  setExpiredUI(false);
  startTimer();
  persist();
}

function startSlashing() {
  if (getIncompleteTasks().length === 0) return;

  clearAllSkippedFlags();
  resetTaskTimerState();
  state.totalSessionMs = 0;
  state.isRunning = false;
  state.focusTaskIndex = getNextFocusTaskIndex();

  showView('focus');
  renderFocusView();
  startTimer();
}

function backToEdit() {
  closeSessionDrawer({ immediate: true });
  stopTimer();
  state.limitExpired = false;
  state.overtimeMode = false;
  setExpiredUI(false);
  clearAllSkippedFlags();
  showView('edit');
  renderEditView();
  focusAddTaskInput();
}

addBraindumpForm.addEventListener('submit', (e) => {
  e.preventDefault();
});

addBraindumpForm.addEventListener('keydown', handleBraindumpEnter, true);

startBtn.addEventListener('click', startSlashing);

document.addEventListener('keydown', (e) => {
  if (state.mode !== 'edit') return;
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;
  if (!e.shiftKey || e.metaKey || e.ctrlKey) return;
  if (startBtn.disabled) return;
  if (isInlineTaskInputFocused()) return;
  if (!clearSessionModal.classList.contains('hidden')) return;
  if (!deleteSessionModal.classList.contains('hidden')) return;

  e.preventDefault();
  e.stopPropagation();
  startSlashing();
}, true);

planSessionBtn.addEventListener('click', createPlannedSession);
clearSessionBtn.addEventListener('click', openClearSessionModal);
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
pauseBtn.addEventListener('click', toggleTimer);
timerDisplay.addEventListener('click', toggleTimer);
timerBar.addEventListener('mouseenter', handleFocusStackMouseEnter);
timerBar.addEventListener('mouseleave', handleFocusHoverMouseLeave);
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
resetBtn.addEventListener('click', () => {
  state.sessionTasks = state.sessionTasks.filter((t) => !t.completed);
  state.elapsedMs = 0;
  state.totalSessionMs = 0;
  resetTaskTimerState();
  showView('edit');
  renderEditView();
  focusAddTaskInput();
});

setupListDropZone(sessionList, 'session');
setupListSelectionClear(sessionList);

function loadPlannedSessionsFromSaved(saved) {
  if (Array.isArray(saved.plannedSessions) && saved.plannedSessions.length > 0) {
    state.plannedSessions = saved.plannedSessions.map(normalizePlannedSession);
    ensureBraindumpSession();
    const expandedId = saved.expandedSessionId;
    state.expandedSessionId = getPlannedSession(expandedId)
      ? expandedId
      : BRAINDUMP_SESSION_ID;
    return;
  }

  state.plannedSessions = [{
    id: BRAINDUMP_SESSION_ID,
    name: 'Braindump',
    tasks: (saved.braindumpTasks || []).map(normalizeBraindumpTask),
  }];
  state.expandedSessionId = BRAINDUMP_SESSION_ID;
}

async function init() {
  const saved = await window.slashIt.loadData();
  state.sessionTasks = (saved.sessionTasks || saved.tasks || []).map(normalizeSessionTask);
  loadPlannedSessionsFromSaved(saved);
  state.currentIndex = saved.currentIndex || 0;
  state.focusTaskIndex = Number.isInteger(saved.focusTaskIndex) ? saved.focusTaskIndex : 0;
  state.elapsedMs = saved.elapsedMs || 0;
  state.isRunning = false;

  const focusTask = state.sessionTasks[state.focusTaskIndex];
  if (!focusTask || focusTask.completed) {
    state.focusTaskIndex = Math.max(0, getNextFocusTaskIndex());
  }

  if (saved.mode === 'focus' && getIncompleteTasks().length > 0) {
    showView('focus');
    renderFocusView();
    if (saved.isRunning) startTimer();
  } else if (saved.mode === 'done' && getIncompleteTasks().length === 0 && state.sessionTasks.length > 0) {
    showDoneView();
  } else {
    showView('edit');
    renderEditView();
    focusAddTaskInput();
  }
}

init();
