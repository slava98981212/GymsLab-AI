// Single-Source-of-Truth Real-Time Global Timer Engine for GymsLab AI

if (typeof window !== 'undefined' && !window.__GYMSLAB_TIMERS__) {
  window.__GYMSLAB_TIMERS__ = {
    workoutStartMs: null,
    restTargetEndMs: null,
    restSeconds: 0,
    restActive: false,
    restExpired: false
  };
}

// ---------------- REST TIMER API ----------------

export function triggerGlobalRestTimer(secs) {
  if (!secs || secs <= 0) return;
  const targetEnd = Date.now() + secs * 1000;
  window.__GYMSLAB_TIMERS__.restTargetEndMs = targetEnd;
  window.__GYMSLAB_TIMERS__.restActive = true;
  window.__GYMSLAB_TIMERS__.restExpired = false;
  window.__GYMSLAB_TIMERS__.restSeconds = secs;
}

export function getGlobalRestState() {
  if (typeof window === 'undefined') return { active: false, expired: false, seconds: 0 };
  const t = window.__GYMSLAB_TIMERS__;

  if (t.restExpired) {
    return { active: false, expired: true, seconds: 0 };
  }

  if (!t.restActive || !t.restTargetEndMs) {
    return { active: false, expired: false, seconds: t.restSeconds || 0 };
  }

  const now = Date.now();
  const diffSecs = Math.ceil((t.restTargetEndMs - now) / 1000);

  if (diffSecs <= 0) {
    t.restActive = false;
    t.restTargetEndMs = null;
    t.restSeconds = 0;
    t.restExpired = true;

    // Trigger audio chime alert
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio chime error:', e);
    }

    return { active: false, expired: true, seconds: 0 };
  }

  t.restSeconds = diffSecs;
  return { active: true, expired: false, seconds: diffSecs };
}

export function pauseGlobalRestTimer() {
  const t = window.__GYMSLAB_TIMERS__;
  if (t.restActive && t.restTargetEndMs) {
    const remaining = Math.max(0, Math.ceil((t.restTargetEndMs - Date.now()) / 1000));
    t.restActive = false;
    t.restTargetEndMs = null;
    t.restSeconds = remaining;
  }
}

export function resumeGlobalRestTimer() {
  const t = window.__GYMSLAB_TIMERS__;
  if (!t.restActive && t.restSeconds > 0) {
    t.restTargetEndMs = Date.now() + t.restSeconds * 1000;
    t.restActive = true;
    t.restExpired = false;
  }
}

export function clearGlobalRestTimer() {
  const t = window.__GYMSLAB_TIMERS__;
  t.restActive = false;
  t.restTargetEndMs = null;
  t.restSeconds = 0;
  t.restExpired = false;
}

export function dismissRestExpiredAlert() {
  const t = window.__GYMSLAB_TIMERS__;
  t.restExpired = false;
  t.restSeconds = 0;
}

// ---------------- WORKOUT DURATION API ----------------

export function startGlobalWorkoutClock(savedStartMs, currentElapsedSecs) {
  const t = window.__GYMSLAB_TIMERS__;
  const startMs = savedStartMs || (Date.now() - (currentElapsedSecs || 0) * 1000);
  t.workoutStartMs = startMs;
  return startMs;
}

export function stopGlobalWorkoutClock() {
  const t = window.__GYMSLAB_TIMERS__;
  t.workoutStartMs = null;
}

export function getGlobalWorkoutDurationSecs(savedStartMs, currentElapsedSecs, workoutActive) {
  if (!workoutActive) return currentElapsedSecs || 0;
  const t = window.__GYMSLAB_TIMERS__;
  if (!t.workoutStartMs) {
    t.workoutStartMs = savedStartMs || (Date.now() - (currentElapsedSecs || 0) * 1000);
  }
  return Math.max(0, Math.floor((Date.now() - t.workoutStartMs) / 1000));
}
