const state = {
  sessionTasks: [],
  braindumpTasks: [],
  currentIndex: 0,
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
const braindumpList = document.getElementById('braindump-list');
const sessionList = document.getElementById('session-list');
const addBraindumpForm = document.getElementById('add-braindump-form');
const newBraindumpInput = document.getElementById('new-braindump-input');
const newBraindumpLimit = document.getElementById('new-braindump-limit');
const startBtn = document.getElementById('start-btn');
const addAllToSessionBtn = document.getElementById('add-all-to-session-btn');
const clearSessionBtn = document.getElementById('clear-session-btn');
const clearSessionModal = document.getElementById('clear-session-modal');
const clearSessionAllBtn = document.getElementById('clear-session-all-btn');
const clearSessionCompletedBtn = document.getElementById('clear-session-completed-btn');
const clearSessionCancelBtn = document.getElementById('clear-session-cancel-btn');
const backToEditBtn = document.getElementById('back-to-edit-btn');
const pauseBtn = document.getElementById('pause-btn');
const timerDisplay = document.getElementById('timer-display');
const focusStack = document.getElementById('focus-stack');
const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerList = document.getElementById('session-drawer-list');
const timerBar = document.getElementById('timer-bar');
const currentTaskEl = document.getElementById('current-task');
const completeBtn = document.getElementById('complete-btn');
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
  const firstIncomplete = getFirstIncompleteIndex();
  const barWidth = measureTimerBarWidth();
  const drawerWidth = Math.round(barWidth * 0.85);
  const drawerHeight = getDrawerContentHeight();

  const tasks = state.sessionTasks.map((task, index) => {
    let status = 'pending';
    let durationText = '';

    if (task.completed) {
      status = 'done';
      if (task.durationMs != null) durationText = formatTime(task.durationMs);
    } else if (index === firstIncomplete) {
      status = 'current';
      durationText = formatTime(state.elapsedMs);
    }

    return { text: task.text, status, durationText };
  });

  return { drawerWidth, drawerHeight, tasks };
}

function getDrawerContentHeight() {
  const firstIncomplete = getFirstIncompleteIndex();
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
    if (index === firstIncomplete) li.textContent += ' 0:00';
  });
  document.body.appendChild(tempList);
  const listHeight = tempList.scrollHeight;
  document.body.removeChild(tempList);
  return Math.min(180, listHeight) + 16;
}

function getFirstIncompleteIndex() {
  return state.sessionTasks.findIndex((task) => !task.completed);
}

function renderSessionDrawer() {
  const firstIncomplete = getFirstIncompleteIndex();

  sessionDrawerList.innerHTML = '';
  state.sessionTasks.forEach((task, index) => {
    let statusClass = 'session-drawer-task--pending';
    let durationText = '';

    if (task.completed) {
      statusClass = 'session-drawer-task--done';
      if (task.durationMs != null) durationText = formatTime(task.durationMs);
    } else if (index === firstIncomplete) {
      statusClass = 'session-drawer-task--current';
      durationText = formatTime(state.elapsedMs);
    }

    const li = document.createElement('li');
    li.className = `session-drawer-task ${statusClass}`;
    li.innerHTML = `
      <span class="session-drawer-task-name">${escapeHtml(task.text)}</span>
      <span class="session-drawer-task-time">${durationText}</span>
    `;
    sessionDrawerList.appendChild(li);
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
  };
}

function normalizeBraindumpTask(task) {
  return { text: task.text || '', limitMs: task.limitMs ?? null };
}

function getTasksForList(listId) {
  return listId === 'braindump' ? state.braindumpTasks : state.sessionTasks;
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
    state.braindumpTasks.forEach((t, index) => {
      if (state.selectedTasks.has(t)) items.push({ list: 'braindump', index });
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

function decodeDragPayload(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      const valid = parsed.items.every(
        (item) => (item.list === 'braindump' || item.list === 'session') && Number.isInteger(item.index),
      );
      if (valid) return { items: parsed.items };
    }
    if ((parsed.list === 'braindump' || parsed.list === 'session') && Number.isInteger(parsed.index)) {
      return { items: [{ list: parsed.list, index: parsed.index }] };
    }
  } catch {
    // ignore
  }
  return null;
}

function persist() {
  window.slashIt.saveData({
    sessionTasks: state.sessionTasks,
    braindumpTasks: state.braindumpTasks,
    currentIndex: state.currentIndex,
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

function getCurrentTask() {
  return getIncompleteTasks()[0] || null;
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
  return { text: task.text, completed: false, limitMs: task.limitMs ?? null, durationMs: null };
}

function toBraindumpTaskFromSession(task) {
  return { text: task.text, limitMs: task.limitMs ?? null };
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

  const moved = resolved.map(({ fromList, task }) => {
    if (fromList === toList) return task;
    return fromList === 'braindump'
      ? toSessionTaskFromBraindump(task)
      : toBraindumpTaskFromSession(task);
  });

  const targetBefore = getTasksForList(toList);
  let insertAt = Math.max(0, Math.min(toIndex, targetBefore.length));
  const removedBeforeInsert = resolved.filter(
    ({ fromList, fromIndex }) => fromList === toList && fromIndex < toIndex,
  ).length;
  insertAt = Math.max(0, insertAt - removedBeforeInsert);

  const indicesByList = { braindump: [], session: [] };
  resolved.forEach(({ fromList, fromIndex }) => {
    indicesByList[fromList].push(fromIndex);
  });

  ['braindump', 'session'].forEach((listId) => {
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

function addAllToSession() {
  if (state.braindumpTasks.length === 0) return;

  const insertAt = getSessionActiveInsertIndex();
  state.sessionTasks.splice(
    insertAt,
    0,
    ...state.braindumpTasks.map(toSessionTaskFromBraindump),
  );
  state.braindumpTasks = [];
  persist();
  renderEditView();
}

function renderTaskList(listEl, listId) {
  listEl.innerHTML = '';
  const isSession = listId === 'session';
  const tasks = getTasksForList(listId);
  const indices = isSession
    ? getSessionEditIndices()
    : tasks.map((_, index) => index);
  const incompleteCount = isSession ? getSessionIncompleteIndices().length : 0;

  indices.forEach((taskIndex, displayIndex) => {
    const task = tasks[taskIndex];
    const isCompleted = isSession && task.completed;
    const li = document.createElement('li');
    li.className = `task-item task-item--${listId}`;
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
    const limitBadgeHtml = !isSession && task.limitMs
      ? `<span class="task-limit-badge">${formatLimitField(task.limitMs)}</span>`
      : '';
    const moveToSessionHtml = isSession
      ? ''
      : `<button class="task-move-to-session" type="button" title="Move to session" aria-label="Move to session">
          <span class="task-arrow"></span>
        </button>`;
    const leadControlHtml = isSession
      ? `<button class="task-move-to-braindump" type="button" title="Move to braindump" aria-label="Move to braindump">
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

    if (!isSession) {
      const moveBtn = li.querySelector('.task-move-to-session');
      moveBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      moveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTask('braindump', taskIndex, 'session', getSessionActiveInsertIndex());
      });
    }

    if (isSession) {
      const moveBackBtn = li.querySelector('.task-move-to-braindump');
      moveBackBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      moveBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTask('session', taskIndex, 'braindump', state.braindumpTasks.length);
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

function renderEditView() {
  hideTaskContextMenu();
  renderTaskList(braindumpList, 'braindump');
  renderTaskList(sessionList, 'session');
  startBtn.disabled = getSessionIncompleteIndices().length === 0;
  addAllToSessionBtn.disabled = state.braindumpTasks.length === 0;
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
  state.braindumpTasks.push(
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
  state.braindumpTasks.push({ text: parsed.text, limitMs: parsed.limitMs });
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
  return !!active?.matches('.task-text-input, .task-limit-input');
}

function handleBraindumpEnter(e) {
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;

  const meta = e.metaKey || e.ctrlKey || e.getModifierState('Meta') || e.getModifierState('Control');
  const shift = e.shiftKey || e.getModifierState('Shift');

  e.preventDefault();
  e.stopPropagation();

  if (meta && shift) {
    addAllToSession();
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

  const indicesByList = { braindump: [], session: [] };
  state.braindumpTasks.forEach((task, index) => {
    if (state.selectedTasks.has(task)) indicesByList.braindump.push(index);
  });
  state.sessionTasks.forEach((task, index) => {
    if (state.selectedTasks.has(task)) indicesByList.session.push(index);
  });

  indicesByList.braindump.sort((a, b) => b - a).forEach((index) => {
    state.braindumpTasks.splice(index, 1);
  });
  indicesByList.session.sort((a, b) => b - a).forEach((index) => {
    state.sessionTasks.splice(index, 1);
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
  const incomplete = getIncompleteTasks();
  if (incomplete.length === 0) return;

  const current = incomplete[0];
  const taskIndex = state.sessionTasks.findIndex((t) => t === current);
  state.sessionTasks[taskIndex].completed = true;
  state.sessionTasks[taskIndex].durationMs = state.elapsedMs;

  stopTimer();
  state.totalSessionMs += state.elapsedMs;
  resetTaskTimerState();

  persist();
  renderFocusView();

  const remaining = getIncompleteTasks();
  if (remaining.length > 0) startTimer();
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

  const taskIndex = state.sessionTasks.findIndex((t) => t === current);
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

  resetTaskTimerState();
  state.totalSessionMs = 0;
  state.isRunning = false;

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
  showView('edit');
  renderEditView();
  focusAddTaskInput();
}

addBraindumpForm.addEventListener('submit', (e) => {
  e.preventDefault();
});

addBraindumpForm.addEventListener('keydown', handleBraindumpEnter, true);

startBtn.addEventListener('click', startSlashing);
addAllToSessionBtn.addEventListener('click', addAllToSession);
clearSessionBtn.addEventListener('click', openClearSessionModal);
clearSessionAllBtn.addEventListener('click', clearAllSessionTasks);
clearSessionCompletedBtn.addEventListener('click', clearCompletedSessionTasks);
clearSessionCancelBtn.addEventListener('click', closeClearSessionModal);
clearSessionModal.addEventListener('click', (e) => {
  if (e.target === clearSessionModal) closeClearSessionModal();
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
completeBtn.addEventListener('click', completeCurrentTask);
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

setupListDropZone(braindumpList, 'braindump');
setupListDropZone(sessionList, 'session');
setupListSelectionClear(braindumpList);
setupListSelectionClear(sessionList);

async function init() {
  const saved = await window.slashIt.loadData();
  state.sessionTasks = (saved.sessionTasks || saved.tasks || []).map(normalizeSessionTask);
  state.braindumpTasks = (saved.braindumpTasks || []).map(normalizeBraindumpTask);
  state.currentIndex = saved.currentIndex || 0;
  state.elapsedMs = saved.elapsedMs || 0;
  state.isRunning = false;

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
