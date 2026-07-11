const promptView = document.getElementById('prompt-view');
const progressView = document.getElementById('progress-view');
const promptTitle = document.getElementById('prompt-title');
const promptMessage = document.getElementById('prompt-message');
const promptDetail = document.getElementById('prompt-detail');
const promptActions = document.getElementById('prompt-actions');
const progressFill = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');

function showPrompt(payload) {
  progressView.classList.add('hidden');
  promptView.classList.remove('hidden');

  promptTitle.textContent = payload.title || 'Update';
  promptMessage.textContent = payload.message || '';
  promptDetail.textContent = payload.detail || '';
  promptDetail.classList.toggle('hidden', !payload.detail);

  promptActions.replaceChildren();
  (payload.buttons || []).forEach((button, index) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'update-btn';
    if (button.primary) el.classList.add('update-btn--primary');
    if (button.cancel) el.classList.add('update-btn--cancel');
    el.textContent = button.label;
    el.addEventListener('click', () => window.updateWindow.respond(index));
    promptActions.appendChild(el);
  });
}

function showProgress(payload) {
  promptView.classList.add('hidden');
  progressView.classList.remove('hidden');
  updateProgress(payload.percent ?? 0, payload.status);
}

function updateProgress(percent, status) {
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  progressFill.style.width = `${rounded}%`;
  progressStatus.textContent = status || `${rounded}% complete`;
}

window.updateWindow.onInit((payload) => {
  if (payload.mode === 'progress') {
    showProgress(payload);
    return;
  }
  showPrompt(payload);
});

window.updateWindow.onProgress((payload) => {
  updateProgress(payload.percent ?? 0, payload.status);
});
