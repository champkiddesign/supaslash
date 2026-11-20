const edgeGlow = document.querySelector('.edge-glow');
const approachGlow = document.querySelector('.approach-glow');
const celebrationLayer = document.getElementById('celebration-layer');

const CELEBRATION_EMOJIS = ['🎉', '🎊', '✨', '🙌', '🥳', '⭐', '💪', '🔥'];

function clearCelebration() {
  celebrationLayer.replaceChildren();
  celebrationLayer.classList.remove('is-active');
}

function launchCelebration() {
  clearCelebration();
  celebrationLayer.classList.add('is-active');
  const count = 60 + Math.floor(Math.random() * 21);

  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'celebration-particle';
    particle.textContent = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
    particle.style.setProperty('--x', `${Math.random() * 100}%`);
    particle.style.setProperty('--size', `${28 + Math.random() * 28}px`);
    particle.style.setProperty('--duration', `${1.8 + Math.random() * 1.4}s`);
    particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    particle.style.setProperty('--drift', `${-80 + Math.random() * 160}px`);
    particle.style.setProperty('--spin', `${-45 + Math.random() * 90}deg`);
    celebrationLayer.appendChild(particle);

    const durationMs = parseFloat(particle.style.getPropertyValue('--duration')) * 1000;
    const delayMs = parseFloat(particle.style.getPropertyValue('--delay')) * 1000;
    setTimeout(() => particle.remove(), durationMs + delayMs + 50);
  }
}

function hideApproachGlow() {
  if (!approachGlow) return;
  approachGlow.classList.remove('is-on', 'is-break');
  approachGlow.style.removeProperty('opacity');
  approachGlow.style.setProperty('--approach-opacity', '0');
  approachGlow.setAttribute('aria-hidden', 'true');
}

function showApproachGlow({ opacity, tone } = {}) {
  if (!approachGlow) return;
  const amount = Math.min(1, Math.max(0, Number(opacity) || 0));
  approachGlow.classList.toggle('is-break', tone === 'break');
  approachGlow.classList.add('is-on');
  approachGlow.style.removeProperty('opacity');
  approachGlow.style.setProperty('--approach-opacity', amount.toFixed(4));
  approachGlow.setAttribute('aria-hidden', 'false');
}

window.screenOverlay.onExpiredShow(() => {
  hideApproachGlow();
  edgeGlow.classList.add('is-visible');
  clearCelebration();
});

window.screenOverlay.onExpiredHide(() => {
  edgeGlow.classList.remove('is-visible');
});

window.screenOverlay.onApproachShow((payload) => {
  showApproachGlow(payload);
});

window.screenOverlay.onApproachHide(() => {
  hideApproachGlow();
});

window.screenOverlay.onCelebrationStart(() => {
  hideApproachGlow();
  edgeGlow.classList.remove('is-visible');
  launchCelebration();
});

window.screenOverlay.onCelebrationStop(() => {
  clearCelebration();
});
