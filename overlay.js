const edgeGlow = document.querySelector('.edge-glow');
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

window.screenOverlay.onExpiredShow(() => {
  edgeGlow.classList.add('is-visible');
  clearCelebration();
});

window.screenOverlay.onExpiredHide(() => {
  edgeGlow.classList.remove('is-visible');
});

window.screenOverlay.onCelebrationStart(() => {
  edgeGlow.classList.remove('is-visible');
  launchCelebration();
});

window.screenOverlay.onCelebrationStop(() => {
  clearCelebration();
});
