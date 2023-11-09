import { cac } from "cac";
import { spawnSync } from "child_process";

import { help } from "./utils/help.js";
import { logger } from "./utils/logger.js";
import { scan } from "./utils/scan-moon.js";

const isMoonInstalledGlobally = spawnSync("which", ["moon"]).status === 0;

if (!isMoonInstalledGlobally) {
  logger.error(
    "Moon is not installed globally. Please install it with: proto install moon",
  );
}

const commands = await scan();

const cli = cac("moonx");

for (const [name, workspaces] of commands) {
  cli
    .command(`${name} [...workspaces]`, "", { allowUnknownOptions: true })
    .usage(`${name} [...workspaces] [options]`)
    .action(async (wss: Array<string>, options) => {
      console.log(options);
      spawnSync("moon run");
      if (wss.length === 0) {
        return console.log(`running ${name} on ${workspaces.join(", ")}`);
      }
      wss = wss.filter((ws) => {
        if (!workspaces.includes(ws)) {
          logger.warn(`task ${name} does not exist on workspace ${ws}`);
          return false;
        }
        return true;
      });
      if (wss.length === 0) {
        return;
      }
      console.log(`running ${name} on ${wss.join(", ")}`);
    });
}

cli.help((sections) => {
  if (sections.some((section) => section.title === "Commands")) {
    return [{ body: help.moonx(Array.from(commands.keys())) }];
  }
  const usage = sections.find((section) => section.title === "Usage");
  if (!usage) {
    return [];
  }
  const [, command] =
    usage.body.match(/\$ moonx (.+) \[\.\.\.workspaces\] \[options\]/) ?? [];
  const workspaces = commands.get(command);
  if (!command || !workspaces) {
    return [];
  }
  return [{ body: help.task(workspaces) }];
});

cli.parse();
