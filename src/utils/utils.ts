import type { SpawnOptions } from "bun";

import { logger } from "./logger.js";

export function getPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "empty";
  return (
    ["pnpm", "yarn", "bun", "npm"].find((pm) => userAgent.includes(pm)) ?? null
  );
}

let installedGlobally: boolean | null = null;

export function isMoonInstalledGlobally() {
  if (installedGlobally !== null) {
    return installedGlobally;
  }
  installedGlobally = Bun.spawnSync({
    cmd: ["which", "moon"],
    stdout: "ignore",
    stderr: "ignore",
    stdin: "inherit",
  }).success;
  return installedGlobally;
}

function getBaseCommand() {
  const pm = getPackageManager();
  switch (pm) {
    case "pnpm":
      return ["pnpm", "exec", "moon"];
    case "yarn":
      return ["yarn", "exec", "moon"];
    case "bun":
      return ["bun", "exec", "moon"];
    case "npm":
      return ["npm", "exec", "moon"];
    default: {
      if (isMoonInstalledGlobally()) {
        return ["moon"];
      }
      logger.error(
        "Could not find a package manager to run moon and moon is not installed globally",
      );
      process.exit(1);
    }
  }
}

export function moon(
  args: string[],
  options: Omit<SpawnOptions.OptionsObject, "cmd"> = {},
) {
  const baseCommand = getBaseCommand();
  return Bun.spawnSync({
    cmd: [...baseCommand, ...args],
    ...options,
  });
}
