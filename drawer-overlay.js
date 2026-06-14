const sessionDrawer = document.getElementById('session-drawer');
const sessionDrawerList = document.getElementById('session-drawer-list');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

function renderDrawer(data) {
  sessionDrawerList.innerHTML = '';
  (data.tasks || []).forEach((task) => {
    const li = document.createElement('li');
    li.className = `session-drawer-task session-drawer-task--${task.status}`;
    li.innerHTML = `
      <span class="session-drawer-task-name">${escapeHtml(task.text)}</span>
      <span class="session-drawer-task-time">${task.durationText || ''}</span>
    `;
    sessionDrawerList.appendChild(li);
  });
}

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

document.body.addEventListener('mouseleave', () => {
  window.drawerOverlay.notifyPointerLeave();
});
