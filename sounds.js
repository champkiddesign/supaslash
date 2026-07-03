const SOUND_POOL_SIZE = 3;
const SOUND_EFFECTS_STORAGE_KEY = 'supaslash-sound-effects';
const LEGACY_SOUND_EFFECTS_STORAGE_KEY = 'slash-it-sound-effects';

let soundEffectsEnabled = localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) !== 'false';
if (localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) === null && localStorage.getItem(LEGACY_SOUND_EFFECTS_STORAGE_KEY) !== null) {
  soundEffectsEnabled = localStorage.getItem(LEGACY_SOUND_EFFECTS_STORAGE_KEY) !== 'false';
  localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, soundEffectsEnabled ? 'true' : 'false');
}

function setSoundEffectsEnabled(enabled) {
  soundEffectsEnabled = !!enabled;
  localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, soundEffectsEnabled ? 'true' : 'false');
}

function isSoundEffectsEnabled() {
  return soundEffectsEnabled;
}

window.addEventListener('storage', (e) => {
  if (e.key === SOUND_EFFECTS_STORAGE_KEY) {
    soundEffectsEnabled = e.newValue !== 'false';
  }
});

window.slashItSounds = {
  setEnabled: setSoundEffectsEnabled,
  isEnabled: isSoundEffectsEnabled,
};
const WHOOSH_BUTTON_SELECTOR = '.task-move-to-session, .task-move-to-braindump, .session-send-to-queue-btn';
const POP_BUTTON_SELECTOR = '#plan-session-btn';
const DESTRUCTIVE_BUTTON_SELECTOR = [
  '#clear-session-btn',
  '#clear-session-all-btn',
  '#clear-session-completed-btn',
  '#delete-session-confirm-btn',
  '#task-context-delete',
  '#data-restore-btn',
  '#shortcuts-close-btn',
  '#data-close-btn',
  '#templates-close-btn',
  '#history-close-btn',
  '.planned-session-delete-btn',
  '.history-delete-btn',
  '[data-delete-list-template]',
  '[data-remove-task-row]',
].join(', ');

function createSoundPool(url, volume = 1) {
  const pool = [];
  let index = 0;

  function ensurePool() {
    if (pool.length > 0) return;
    for (let i = 0; i < SOUND_POOL_SIZE; i++) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = volume;
      audio.load();
      pool.push(audio);
    }
  }

  function play() {
    if (!soundEffectsEnabled) return;
    ensurePool();
    const audio = pool[index];
    index = (index + 1) % SOUND_POOL_SIZE;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }

  function warmUp() {
    ensurePool();
    const audio = pool[0];
    const previousVolume = audio.volume;
    audio.volume = 0;
    audio.currentTime = 0;
    void audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
      })
      .catch(() => {
        audio.volume = previousVolume;
      });
  }

  ensurePool();
  return { play, warmUp };
}

const clickSound = createSoundPool('assets/sounds/click.m4a');
const whooshSound = createSoundPool('assets/sounds/whoosh.m4a');
const popSound = createSoundPool('assets/sounds/pop2.m4a', 0.25);
const doubleSound = createSoundPool('assets/sounds/double.m4a', 0.55);
const alarmSound = createSoundPool('assets/sounds/alarm.m4a');
const completeSound = createSoundPool('assets/sounds/complete.m4a', 0.35);
const tasksCompleteSound = createSoundPool('assets/sounds/tasks-complete.m4a');

let warmedUp = false;

function warmUpSounds() {
  if (warmedUp) return;
  warmedUp = true;
  clickSound.warmUp();
  whooshSound.warmUp();
  popSound.warmUp();
  doubleSound.warmUp();
  alarmSound.warmUp();
  completeSound.warmUp();
  tasksCompleteSound.warmUp();
}

function playClickSound() {
  clickSound.play();
}

function playWhooshSound() {
  whooshSound.play();
}

function playPopSound() {
  popSound.play();
}

function playDoubleSound() {
  doubleSound.play();
}

function playAlarmSound() {
  alarmSound.play();
}

function playCompleteSound() {
  completeSound.play();
}

function playTasksCompleteSound() {
  tasksCompleteSound.play();
}

const HOVER_CLICK_SOUND_SELECTORS = [
  '.settings-menu-item:not(.settings-menu-item--disabled)',
  '#timer-bar button:not(:disabled):not(#timer-display)',
  '.session-drawer-task--clickable',
  '#done-view .done-actions button:not(:disabled)',
];

function getHoverClickTarget(target) {
  for (const selector of HOVER_CLICK_SOUND_SELECTORS) {
    const match = target.closest(selector);
    if (match) return match;
  }
  return null;
}

function shouldPlayHoverClickSound(item, relatedTarget) {
  if (!item || item.disabled) return false;
  if (relatedTarget && item.contains(relatedTarget)) return false;
  return true;
}

document.addEventListener('pointerdown', warmUpSounds, { capture: true, once: true });

document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.matches(WHOOSH_BUTTON_SELECTOR)) {
    playWhooshSound();
    return;
  }
  if (button.matches(POP_BUTTON_SELECTOR)) {
    playPopSound();
    return;
  }
  if (button.matches(DESTRUCTIVE_BUTTON_SELECTOR)) {
    playDoubleSound();
    return;
  }
  playClickSound();
}, { capture: true });

document.addEventListener('mouseover', (e) => {
  const item = getHoverClickTarget(e.target);
  if (!shouldPlayHoverClickSound(item, e.relatedTarget)) return;
  playClickSound();
});
