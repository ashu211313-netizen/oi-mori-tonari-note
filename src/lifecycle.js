export const RESUME_RECOVERY_DELAY_MS = 250;

/**
 * Coalesces the burst of pageshow/focus/visibility/online events produced by
 * Safari and installed PWAs. Recovery is single-flight; events received while
 * it is running become one follow-up pass instead of parallel work.
 *
 * @param {(reasons: readonly string[]) => Promise<void> | void} recover
 * @param {{
 *   delay?: number,
 *   setTimer?: typeof setTimeout,
 *   clearTimer?: typeof clearTimeout,
 *   onError?: (error: unknown) => void
 * }} options
 */
export function createResumeCoordinator(recover, options = {}) {
  const delay = options.delay ?? RESUME_RECOVERY_DELAY_MS;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  const onError = options.onError ?? ((error) => console.warn("Resume recovery failed", error));
  const reasons = new Set();
  const idleWaiters = new Set();
  let timer = null;
  let running = null;
  let queued = false;
  let disposed = false;

  function settleIdleWaiters() {
    if (timer || running || queued || reasons.size) return;
    for (const resolve of idleWaiters) resolve();
    idleWaiters.clear();
  }

  function armTimer() {
    if (disposed || timer) return;
    timer = setTimer(() => { void run(); }, delay);
  }

  async function run() {
    if (timer) {
      clearTimer(timer);
      timer = null;
    }
    if (disposed) {
      reasons.clear();
      queued = false;
      settleIdleWaiters();
      return;
    }
    if (running) {
      queued = true;
      return running;
    }

    const batch = [...reasons];
    reasons.clear();
    if (!batch.length) {
      settleIdleWaiters();
      return;
    }

    running = Promise.resolve().then(() => recover(batch));
    try {
      await running;
    } catch (error) {
      onError(error);
    } finally {
      running = null;
      if (!disposed && (queued || reasons.size)) {
        queued = false;
        armTimer();
      } else {
        queued = false;
        settleIdleWaiters();
      }
    }
  }

  function schedule(reason = "unspecified") {
    if (disposed) return;
    reasons.add(reason);
    if (running) {
      queued = true;
      return;
    }
    if (timer) {
      clearTimer(timer);
      timer = null;
    }
    armTimer();
  }

  function whenIdle() {
    if (!timer && !running && !queued && !reasons.size) return Promise.resolve();
    return new Promise((resolve) => idleWaiters.add(resolve));
  }

  function dispose() {
    disposed = true;
    reasons.clear();
    queued = false;
    if (timer) clearTimer(timer);
    timer = null;
    settleIdleWaiters();
  }

  return { schedule, whenIdle, dispose };
}
