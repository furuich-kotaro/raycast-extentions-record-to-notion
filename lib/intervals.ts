import { Cache } from "@raycast/api";

type Part = {
  startedAt: number;
  pausedAt?: number;
};

export type Interval = {
  parts: Part[];
  length: number;
};

const cache = new Cache();
const CACHE_KEY = "recordToNotion/1.1";

const currentTimestamp = () => Math.round(new Date().valueOf() / 1000);

export function duration({ parts }: Interval): number {
  return parts.reduce((acc, part) => {
    return (
      (typeof part.pausedAt !== "undefined" ? part.pausedAt - part.startedAt : currentTimestamp() - part.startedAt) +
      acc
    );
  }, 0);
}

export function progress(interval: Interval): number {
  return (duration(interval) / interval.length) * 100;
}

export function createInterval(taskMinutes: number): Interval {
  const interval = {
    length: taskMinutes * 60,
    parts: [
      {
        startedAt: currentTimestamp(),
      },
    ],
  };
  cache.set(CACHE_KEY, JSON.stringify(interval));
  return interval;
}

export function resetInterval() {
  cache.remove(CACHE_KEY);
}

export function getCurrentInterval(): Interval | undefined {
  const result = cache.get(CACHE_KEY);
  if (result) {
    return JSON.parse(result);
  }
}
