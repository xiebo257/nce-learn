(() => {
  const config = window.NCE_LESSON_PLAYER || {};
  const subtitles = Array.isArray(config.subtitles) ? config.subtitles : [];
  const audio = document.getElementById("lesson-audio");
  const dockPlay = document.getElementById("dock-play");
  const previousButton = document.getElementById("dock-prev-lesson");
  const nextButton = document.getElementById("dock-next-lesson");
  const continuousInput = document.getElementById("dock-continuous");
  const loopInput = document.getElementById("dock-loop");
  const speedSelect = document.getElementById("dock-speed");
  const subtitleEl = document.getElementById("dock-subtitle");
  const currentEl = document.getElementById("dock-current");
  const durationEl = document.getElementById("dock-duration");
  const trackEl = document.getElementById("dock-track");
  const fillEl = document.getElementById("dock-fill");
  const sentenceCards = Array.from(document.querySelectorAll(".sentence-card"));
  const sentenceToggleButtons = Array.from(document.querySelectorAll(".sentence-toggle"));
  const STORAGE = {
    continuous: "ncePlayerContinuous",
    loop: "ncePlayerLoop",
    speed: "ncePlayerSpeed",
    autoplay: "ncePlayerAutoplayNext",
  };
  const SPEEDS = new Set(["0.75", "1", "1.25", "1.5", "2"]);

  if (!audio || !dockPlay) return;

  function safeLocalGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeLocalSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  }

  function safeSessionGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSessionSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {}
  }

  function safeSessionRemove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {}
  }

  function formatTime(value) {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return minutes + ":" + seconds;
  }

  function activeSubtitle(time) {
    return subtitles.find((item) => time >= item.start && time < item.end) ?? subtitles[subtitles.length - 1];
  }

  function setActiveSentence(item) {
    sentenceCards.forEach((card) => card.classList.toggle("is-active", card.id === "sentence-" + item?.index));
    if (item && subtitleEl) subtitleEl.textContent = item.text;
  }

  function updateProgress(time) {
    const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0;
    if (currentEl) currentEl.textContent = formatTime(time);
    if (durationEl) durationEl.textContent = formatTime(duration);
    if (fillEl) fillEl.style.width = duration ? Math.min(100, (time / duration) * 100) + "%" : "0%";
    const item = activeSubtitle(time);
    if (item) setActiveSentence(item);
  }

  function seekTo(time) {
    audio.currentTime = time;
    updateProgress(time);
  }

  function whenAudioReady(callback) {
    if (audio.readyState >= 2) {
      callback();
      return;
    }
    let done = false;
    const runOnce = () => {
      if (done) return;
      done = true;
      callback();
    };
    audio.addEventListener("canplay", runOnce, { once: true });
    audio.addEventListener("loadedmetadata", runOnce, { once: true });
  }

  function playFrom(index) {
    const item = subtitles.find((entry) => entry.index === index);
    if (!item) return;
    setActiveSentence(item);
    whenAudioReady(() => {
      seekTo(item.start);
      audio.play().catch(() => {});
    });
  }

  function isTimeInSentence(item) {
    const time = audio.currentTime;
    return item && time >= item.start && time < item.end;
  }

  function refreshSentenceToggleButtons() {
    const current = activeSubtitle(audio.currentTime);
    sentenceToggleButtons.forEach((button) => {
      const isCurrent = current && Number(button.dataset.sentence) === current.index;
      const isPause = isCurrent && !audio.paused;
      button.textContent = isPause ? "Ⅱ" : "▶";
      button.setAttribute("aria-label", (isPause ? "Pause" : "Resume") + " sentence " + button.dataset.sentence);
    });
  }

  function toggleSentence(index) {
    const item = subtitles.find((entry) => entry.index === index);
    if (!item) return;
    if (!audio.paused && isTimeInSentence(item)) {
      audio.pause();
      refreshSentenceToggleButtons();
      return;
    }
    if (audio.paused && isTimeInSentence(item)) {
      setActiveSentence(item);
      audio.play().catch(() => {});
      return;
    }
    setActiveSentence(item);
    whenAudioReady(() => {
      seekTo(item.start);
      audio.play().catch(() => {});
    });
  }

  function navigateToLesson(href, autoplay) {
    if (!href) return;
    if (autoplay) safeSessionSet(STORAGE.autoplay, "1");
    window.location.href = href;
  }

  function applySpeed(value) {
    const normalized = SPEEDS.has(String(value)) ? String(value) : "1";
    audio.playbackRate = Number(normalized);
    if (speedSelect) speedSelect.value = normalized;
    safeLocalSet(STORAGE.speed, normalized);
  }

  function setContinuousChecked(checked) {
    if (continuousInput) continuousInput.checked = checked;
    safeLocalSet(STORAGE.continuous, checked ? "1" : "0");
  }

  function setLoopChecked(checked) {
    if (loopInput) loopInput.checked = checked;
    safeLocalSet(STORAGE.loop, checked ? "1" : "0");
  }

  function initializeStoredControls() {
    const loopEnabled = safeLocalGet(STORAGE.loop) === "1";
    const continuousEnabled = safeLocalGet(STORAGE.continuous) === "1" && !loopEnabled;
    setLoopChecked(loopEnabled);
    setContinuousChecked(continuousEnabled);
    if (loopEnabled && safeLocalGet(STORAGE.continuous) === "1") setContinuousChecked(false);
    applySpeed(safeLocalGet(STORAGE.speed) || "1");
  }

  function initializeLessonNavigation() {
    if (previousButton) {
      previousButton.disabled = !config.previousHref;
      previousButton.addEventListener("click", () => navigateToLesson(config.previousHref, false));
    }
    if (nextButton) {
      nextButton.disabled = !config.nextHref;
      nextButton.addEventListener("click", () => navigateToLesson(config.nextHref, false));
    }
  }

  function handleEnded() {
    refreshSentenceToggleButtons();
    if (loopInput?.checked) {
      seekTo(0);
      audio.play().catch(() => {});
      return;
    }
    if (continuousInput?.checked && config.nextHref) {
      navigateToLesson(config.nextHref, true);
    }
  }

  document.querySelectorAll(".sentence-play").forEach((button) => {
    button.addEventListener("click", () => playFrom(Number(button.dataset.sentence)));
  });

  sentenceToggleButtons.forEach((button) => {
    button.addEventListener("click", () => toggleSentence(Number(button.dataset.sentence)));
  });

  dockPlay.addEventListener("click", () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });

  continuousInput?.addEventListener("change", () => {
    const checked = continuousInput.checked;
    if (checked) setLoopChecked(false);
    setContinuousChecked(checked);
  });
  loopInput?.addEventListener("change", () => {
    const checked = loopInput.checked;
    if (checked) setContinuousChecked(false);
    setLoopChecked(checked);
  });
  speedSelect?.addEventListener("change", () => applySpeed(speedSelect.value));
  previousButton?.setAttribute("aria-label", "Previous lesson");
  nextButton?.setAttribute("aria-label", "Next lesson");

  audio.addEventListener("play", () => {
    dockPlay.textContent = "Ⅱ";
    refreshSentenceToggleButtons();
  });

  audio.addEventListener("pause", () => {
    dockPlay.textContent = "▶";
    refreshSentenceToggleButtons();
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    updateProgress(audio.currentTime);
    refreshSentenceToggleButtons();
  });

  audio.addEventListener("ended", handleEnded);

  trackEl?.addEventListener("click", (event) => {
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const duration = audio.duration || subtitles[subtitles.length - 1]?.end || 0;
    audio.currentTime = ratio * duration;
    updateProgress(audio.currentTime);
  });

  initializeStoredControls();
  initializeLessonNavigation();
  if (safeSessionGet(STORAGE.autoplay) === "1") {
    safeSessionRemove(STORAGE.autoplay);
    whenAudioReady(() => {
      seekTo(0);
      audio.play().catch(() => {});
    });
  }

  window.NCELessonPlayer = { playFrom, toggleSentence, seekTo };
})();
