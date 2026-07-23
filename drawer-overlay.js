const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerTitleName = document.getElementById('session-drawer-title-name');
const sessionDrawerTitleTime = document.getElementById('session-drawer-title-time');
const sessionDrawerList = document.getElementById('session-drawer-list');
const sessionDrawerAdd = document.getElementById('session-drawer-add');
const sessionDrawerAddTrigger = document.getElementById('session-drawer-add-trigger');
const sessionDrawerAddForm = document.getElementById('session-drawer-add-form');
const sessionDrawerAddInput = document.getElementById('session-drawer-add-input');
const sessionDrawerAddLimit = document.getElementById('session-drawer-add-limit');

let addFormOpen = false;
let trayAddEnabled = false;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTaskClassName(task) {
  const classes = ['session-drawer-task', `session-drawer-task--${task.status}`];
  if (task.status !== 'done') classes.push('session-drawer-task--clickable');
  return classes.join(' ');
}

function needsFullRebuild(tasks) {
  const children = sessionDrawerList.children;
  if (children.length !== tasks.length) return true;
  for (let i = 0; i < tasks.length; i++) {
    if (children[i].dataset.taskIndex !== String(tasks[i].index)) return true;
  }
  return false;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.dataset.taskIndex = String(task.index);
  li.innerHTML = `
    <span class="session-drawer-task-name">${escapeHtml(task.text)}</span>
    <span class="session-drawer-task-time">${task.durationText || ''}</span>
  `;
  li.className = getTaskClassName(task);
  return li;
}

function updateTaskElement(li, task) {
  li.className = getTaskClassName(task);
  li.querySelector('.session-drawer-task-name').textContent = task.text;
  li.querySelector('.session-drawer-task-time').textContent = task.durationText || '';
}

function focusAddInput({ select = true } = {}) {
  requestAnimationFrame(() => {
    sessionDrawerAddInput?.focus();
    if (select) sessionDrawerAddInput?.select();
  });
}

function setAddFormOpen(open, { focus = false } = {}) {
  if (!trayAddEnabled) {
    addFormOpen = false;
    sessionDrawerAddTrigger?.classList.toggle('hidden', true);
    sessionDrawerAddForm?.classList.toggle('hidden', true);
    window.drawerOverlay.setAddFormOpen(false);
    return;
  }
  addFormOpen = !!open;
  sessionDrawerAddTrigger?.classList.toggle('hidden', addFormOpen);
  sessionDrawerAddForm?.classList.toggle('hidden', !addFormOpen);
  window.drawerOverlay.setAddFormOpen(addFormOpen);
  if (addFormOpen && focus) {
    // Input focus happens after main makes the overlay keyboard-capable.
    focusAddInput();
  }
}

function syncTrayAddFromPayload(data) {
  const enabled = !!data?.trayAddEnabled;
  trayAddEnabled = enabled;
  sessionDrawerAdd?.classList.toggle('hidden', !enabled);

  if (!enabled) {
    if (addFormOpen) {
      addFormOpen = false;
      window.drawerOverlay.setAddFormOpen(false);
    }
    sessionDrawerAddTrigger?.classList.add('hidden');
    sessionDrawerAddForm?.classList.add('hidden');
    return;
  }

  const shouldOpen = !!data?.addFormOpen;
  if (shouldOpen !== addFormOpen) {
    setAddFormOpen(shouldOpen, { focus: shouldOpen });
    return;
  }

  // Feature just turned on (or timer refresh) — restore trigger/form visibility.
  sessionDrawerAddTrigger?.classList.toggle('hidden', addFormOpen);
  sessionDrawerAddForm?.classList.toggle('hidden', !addFormOpen);
}

function submitAddTask() {
  const text = sessionDrawerAddInput?.value || '';
  const limitValue = sessionDrawerAddLimit?.value || '';
  if (!text.trim()) return;

  playClickSound();
  window.drawerOverlay.addTask({ text, limitValue });
  if (sessionDrawerAddInput) sessionDrawerAddInput.value = '';
  if (sessionDrawerAddLimit) sessionDrawerAddLimit.value = '';
  focusAddInput({ select: false });
}

function renderDrawer(data) {
  const tasks = data.tasks || [];
  sessionDrawerTitleName.textContent = data.sessionTitle || 'Braindump';
  sessionDrawerTitleTime.textContent = data.sessionDurationText || '';

  if (needsFullRebuild(tasks)) {
    sessionDrawerList.innerHTML = '';
    tasks.forEach((task) => {
      sessionDrawerList.appendChild(createTaskElement(task));
    });
  } else {
    tasks.forEach((task, i) => {
      updateTaskElement(sessionDrawerList.children[i], task);
    });
  }

  syncTrayAddFromPayload(data);
}

sessionDrawerList.addEventListener('click', (e) => {
  const li = e.target.closest('.session-drawer-task--clickable');
  if (!li) return;
  const index = parseInt(li.dataset.taskIndex, 10);
  if (Number.isInteger(index)) {
    playClickSound();
    window.drawerOverlay.selectTask(index);
  }
});

sessionDrawerAddTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!trayAddEnabled) return;
  playClickSound();
  setAddFormOpen(true, { focus: true });
});

sessionDrawerAddForm?.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (sessionDrawerAddInput) sessionDrawerAddInput.value = '';
    if (sessionDrawerAddLimit) sessionDrawerAddLimit.value = '';
    setAddFormOpen(false);
    return;
  }
  if (e.key !== 'Enter' && e.code !== 'NumpadEnter') return;
  e.preventDefault();
  e.stopPropagation();
  submitAddTask();
});

sessionDrawerAddForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  submitAddTask();
});

window.drawerOverlay.onKeyboardReady(() => {
  if (addFormOpen) focusAddInput();
});

window.drawerOverlay.onData((data) => {
  renderDrawer(data);
});

window.drawerOverlay.onOpen(() => {
  sessionDrawer.classList.add('is-open');
  sessionDrawer.setAttribute('aria-hidden', 'false');
});

window.drawerOverlay.onClose(() => {
  sessionDrawer.classList.remove('is-open');
  sessionDrawer.setAttribute('aria-hidden', 'true');
  if (addFormOpen) {
    if (sessionDrawerAddInput) sessionDrawerAddInput.value = '';
    if (sessionDrawerAddLimit) sessionDrawerAddLimit.value = '';
    setAddFormOpen(false);
  }
});

document.body.addEventListener('mouseenter', () => {
  window.drawerOverlay.notifyPointerEnter();
});

document.body.addEventListener('mouseleave', (e) => {
  const rect = document.body.getBoundingClientRect();
  // Leaving downward toward the timer bar — keep the drawer open.
  if (e.clientY >= rect.bottom - 2) return;
  if (addFormOpen) return;
  window.drawerOverlay.notifyPointerLeave();
});
