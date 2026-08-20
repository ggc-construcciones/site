(function () {
  const section = document.querySelector('.hero-section.has-video');
  if (!section) return;

  const video = section.querySelector('.hero-video');
  const soundBtn = section.querySelector('.hero-sound-btn');
  const playBtn = section.querySelector('.hero-play-btn');
  const soundLabel = soundBtn ? soundBtn.querySelector('.hero-sound-label') : null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = 'connection' in navigator && navigator.connection.saveData;

  if (prefersReducedMotion || saveData) {
    section.classList.add('is-poster-only');
    video.pause();
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      section.classList.remove('is-poster-only');
      video.play();
    });
  }

  if (soundBtn && soundLabel) {
    soundBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      const isMuted = video.muted;
      soundBtn.setAttribute('aria-pressed', String(!isMuted));
      soundBtn.classList.toggle('is-unmuted', !isMuted);
      soundLabel.textContent = isMuted
        ? soundBtn.dataset.labelOff
        : soundBtn.dataset.labelOn;
    });
  }
})();
