import { Cache } from "@raycast/api";

const cache = new Cache();
export const INPUTTING_FLAG_KEY = "recordToNotion/inputting";

export function setInputtingFlag(): void {
  cache.set(INPUTTING_FLAG_KEY, "true");
}

export function getInputtingFlag(): string | undefined {
  return cache.get(INPUTTING_FLAG_KEY);
}

export function removeInputtingFlag(): boolean {
  return cache.remove(INPUTTING_FLAG_KEY);
}
