import { cac } from "cac";
import { spawnSync } from "child_process";

import { exec } from "./cli/exec.js";
import { list } from "./cli/list.js";
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

cli
  .command("_moonx_list [...params]", "List all available tasks")
  .action((arg) => {
    const result = list(arg, commands);
    const stdout = Bun.stdout.writer();
    stdout.write(result.join("\n"));
    stdout.end();
  });

for (const name of commands.keys()) {
  cli
    .command(`${name} [...workspaces]`, "", { allowUnknownOptions: true })
    .action(async (wss: Array<string>, options) => {
      console.log(wss);
      const workspaces = exec(name, wss, commands);
      const rest = ["--", ...options["--"]];
      return Bun.spawnSync({
        cmd: ["moon", "run", workspaces, rest].flat(),
        stdout: "inherit",
        stderr: "inherit",
        stdin: "inherit",
        onExit(_, exitCode) {
          if (exitCode) {
            logger.error(`task ${name} failed`);
            process.exit(exitCode);
          }
        },
      });
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

cli.on("command:*", () => {
  logger.error(`Invalid command: ${cli.args.join(" ")}`);
  cli.outputHelp();
  process.exit(1);
});

try {
  cli.parse(Bun.argv, { run: false });
  await cli.runMatchedCommand();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
  logger.error(String(error));
  process.exit(1);
}
