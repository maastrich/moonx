import { cac } from "cac";

import pkg from "../package.json";

import { list } from "./cli/list.js";
import { help } from "./utils/help.js";
import { logReport } from "./utils/log-report.js";
import { logger } from "./utils/logger.js";
import { scan } from "./utils/scan-moon.js";
import { moon } from "./utils/utils.js";

const commands = await scan();

const cli = cac("moonx");

cli.option("cache", "");
cli.option("color", "");
cli.option("concurrency", "");
cli.option("c", "");
cli.option("log", "");
cli.option("logFile", "");
cli.option("moon-help", "");
cli.option("moon-version", "");
cli.option("logReport", "", {
  default: process.env.CI === "true" || process.env.MOONX_LOG_REPORT,
});

cli
  .command("_moonx_list [...params]", "List all available tasks")
  .action((arg) => {
    const result = list(arg, commands);
    const stdout = Bun.stdout.writer();
    stdout.write(result.join("\n"));
    stdout.end();
  });

for (const [name, workspaces] of commands) {
  cli
    .command(`${name} [...workspaces]`, workspaces.join(), {
      allowUnknownOptions: true,
    })
    .action(async (wss: Array<string>, options) => {
      const rest = ["--", ...options["--"]];
      if (wss.length === 0) {
        const result = moon([`:${name}`, rest].flat(), {
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
        await logReport({ enabled: options.logReport });
        process.exit(result.exitCode);
      }
      const filterd = wss.filter((ws) => {
        if (!workspaces.includes(ws)) {
          logger.warn(`task ${name} does not exist on workspace ${ws}`);
          return false;
        }
        return true;
      });
      if (filterd.length === 0) {
        logger.error(`no valid workspaces for task ${name}`);
        return;
      }

      const result = moon([filterd.map((ws) => `${ws}:${name}`), rest].flat(), {
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
      await logReport({ enabled: options.logReport });
      process.exit(result.exitCode);
    });
}

cli.help((sections) => {
  if (sections.some((section) => section.title === "Commands")) {
    return [{ body: help.moonx(Array.from(commands.entries())) }];
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

cli.version(pkg.version);

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
