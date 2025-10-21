import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type CacheData = {
  commands: Array<[string, string[]]>;
  timestamp: number;
};

// Cache TTL in milliseconds (default: 5 minutes)
const CACHE_TTL = Number(process.env.MOONX_CACHE_TTL) || 5 * 60 * 1000;

function getCacheDir(): string {
  const cacheDir = join(homedir(), ".cache", "moonx");
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function getCachePath(): string {
  return join(getCacheDir(), "commands.json");
}

export async function readCache(): Promise<Map<string, string[]> | null> {
  const cachePath = getCachePath();

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const file = Bun.file(cachePath);
    const text = await file.text();
    const data: CacheData = JSON.parse(text);

    // Check if cache is expired
    const now = Date.now();
    if (now - data.timestamp > CACHE_TTL) {
      return null;
    }

    return new Map(data.commands);
  } catch {
    // If cache is corrupted, return null
    return null;
  }
}

export function writeCache(commands: Map<string, string[]>): void {
  const cachePath = getCachePath();

  const data: CacheData = {
    commands: Array.from(commands.entries()),
    timestamp: Date.now(),
  };

  try {
    Bun.write(cachePath, JSON.stringify(data, null, 2));
  } catch {
    // Silently fail if we can't write cache
    // This shouldn't block the main functionality
  }
}

export function clearCache(): void {
  const cachePath = getCachePath();

  if (existsSync(cachePath)) {
    try {
      Bun.write(cachePath, "");
    } catch {
      // Silently fail
    }
  }
}

export async function getCacheInfo(): Promise<{
  exists: boolean;
  age?: number;
  path: string;
}> {
  const cachePath = getCachePath();

  if (!existsSync(cachePath)) {
    return { exists: false, path: cachePath };
  }

  try {
    const file = Bun.file(cachePath);
    const text = await file.text();
    const data: CacheData = JSON.parse(text);
    const age = Date.now() - data.timestamp;

    return { exists: true, age, path: cachePath };
  } catch {
    return { exists: false, path: cachePath };
  }
}
