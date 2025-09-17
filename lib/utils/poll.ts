export type PollOptions = {
  intervalMs: number;
  tick: () => Promise<void> | void;
  shouldStop: () => boolean;
  checkMs?: number;
  onStop?: () => void;
};

export function startPolling({ intervalMs, tick, shouldStop, checkMs = 1000, onStop }: PollOptions) {
  const pollInterval = setInterval(async () => {
    await tick();
  }, intervalMs);

  const stopCheck = setInterval(() => {
    if (shouldStop()) {
      clearInterval(pollInterval);
      clearInterval(stopCheck);
      if (onStop) onStop();
    }
  }, checkMs);

  return () => {
    clearInterval(pollInterval);
    clearInterval(stopCheck);
  };
}


