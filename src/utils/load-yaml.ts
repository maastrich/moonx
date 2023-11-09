import { parse } from "yaml";

import { logger } from "./logger.js";

async function loadOne<T extends object>(path: string): Promise<T> {
  const file = Bun.file(path);
  const content = await file.text();
  logger.debug(`loaded ${path}`);
  return parse(content);
}

export async function load<T extends object>(path: string): Promise<T>;
export async function load<T extends object[]>(...paths: string[]): Promise<T>;
export async function load(...paths: string[]) {
  try {
    if (paths.length === 0) {
      throw new Error("no path provided");
    }
    if (paths.length === 1) {
      const [path] = paths;
      return await loadOne(path);
    }
    return await Promise.all(paths.map((path) => loadOne(path)));
  } catch {
    return null;
  }
}
