type PollingTask = () => Promise<unknown> | unknown;

interface SmartPollingOptions {
  activeInterval?: number;
  hiddenInterval?: number;
  maxInterval?: number;
  runImmediately?: boolean;
}

/**
 * Polling adaptativo para telas que não possuem SSE/WebSocket.
 * Evita sobreposição, pausa sem rede e reduz a frequência em segundo plano.
 */
export const startSmartPolling = (
  task: PollingTask,
  {
    activeInterval = 20_000,
    hiddenInterval = 90_000,
    maxInterval = 5 * 60_000,
    runImmediately = false,
  }: SmartPollingOptions = {},
) => {
  let stopped = false;
  let running = false;
  let timer: number | undefined;
  let failures = 0;
  let lastRun = 0;

  const baseInterval = () =>
    document.visibilityState === 'visible' ? activeInterval : hiddenInterval;

  const nextInterval = () =>
    Math.min(baseInterval() * Math.max(1, 2 ** failures), maxInterval);

  const schedule = (delay = nextInterval()) => {
    if (stopped) return;
    if (timer !== undefined) window.clearTimeout(timer);
    timer = window.setTimeout(run, delay);
  };

  const run = async () => {
    if (stopped) return;
    if (!navigator.onLine || running) {
      schedule();
      return;
    }

    running = true;
    lastRun = Date.now();
    try {
      await task();
      failures = 0;
    } catch {
      failures = Math.min(failures + 1, 4);
    } finally {
      running = false;
      schedule();
    }
  };

  const refreshWhenUseful = () => {
    if (
      document.visibilityState === 'visible'
      && navigator.onLine
      && Date.now() - lastRun >= activeInterval
    ) {
      void run();
    } else {
      schedule();
    }
  };

  document.addEventListener('visibilitychange', refreshWhenUseful);
  window.addEventListener('online', refreshWhenUseful);
  window.addEventListener('focus', refreshWhenUseful);

  if (runImmediately) void run();
  else schedule();

  return () => {
    stopped = true;
    if (timer !== undefined) window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', refreshWhenUseful);
    window.removeEventListener('online', refreshWhenUseful);
    window.removeEventListener('focus', refreshWhenUseful);
  };
};
