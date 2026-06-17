const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerTitleName = document.getElementById('session-drawer-title-name');
const sessionDrawerTitleTime = document.getElementById('session-drawer-title-time');
const sessionDrawerList = document.getElementById('session-drawer-list');

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

function renderDrawer(data) {
  const tasks = data.tasks || [];
  sessionDrawerTitleName.textContent = data.sessionTitle || 'Braindump';
  sessionDrawerTitleTime.textContent = data.sessionDurationText || '';

  if (needsFullRebuild(tasks)) {
    sessionDrawerList.innerHTML = '';
    tasks.forEach((task) => {
      sessionDrawerList.appendChild(createTaskElement(task));
    });
    return;
  }

  tasks.forEach((task, i) => {
    updateTaskElement(sessionDrawerList.children[i], task);
  });
}

sessionDrawerList.addEventListener('click', (e) => {
  const li = e.target.closest('.session-drawer-task--clickable');
  if (!li) return;
  const index = parseInt(li.dataset.taskIndex, 10);
  if (Number.isInteger(index)) {
    window.drawerOverlay.selectTask(index);
  }
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
});

document.body.addEventListener('mouseenter', () => {
  window.drawerOverlay.notifyPointerEnter();
});

document.body.addEventListener('mouseleave', (e) => {
  const rect = document.body.getBoundingClientRect();
  // Leaving downward toward the timer bar — keep the drawer open.
  if (e.clientY >= rect.bottom - 2) return;
  window.drawerOverlay.notifyPointerLeave();
});
