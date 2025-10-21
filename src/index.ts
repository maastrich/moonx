import { cac } from "cac";

import pkg from "../package.json" with { type: "json" };

import { clearCache, getCacheInfo } from "./utils/cache.js";
import { generateCompletion, type Shell } from "./cli/completion.js";
import { list } from "./cli/list.js";
import { help } from "./utils/help.js";
import { logReport } from "./utils/log-report.js";
import { logger } from "./utils/logger.js";
import { scan } from "./utils/scan-moon.js";
import { moon } from "./utils/utils.js";

const cli = cac("moonx");

// Check if this is a completion or cache command - skip scanning if so
const skipScanCommands = ["completion", "cache:clear", "cache:info"];
const shouldSkipScan = Bun.argv.some((arg) => skipScanCommands.includes(arg));

const commands = shouldSkipScan ? new Map<string, string[]>() : await scan();

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

cli.option("debug", "Enable debug mode", {
  default: process.env.MOONX_DEBUG === "true",
});

cli
  .command("_moonx_list [...params]", "List all available tasks")
  .action((arg) => {
    const result = list(arg, commands);
    const stdout = Bun.stdout.writer();
    stdout.write(result.join("\n"));
    stdout.end();
  });

cli
  .command("completion <shell>", "Generate shell completion script")
  .action((shell: string) => {
    const validShells = ["bash", "zsh", "fish"];
    if (!validShells.includes(shell)) {
      logger.error(
        `Invalid shell: ${shell}. Must be one of: ${validShells.join(", ")}`
      );
      process.exit(1);
    }
    const completionScript = generateCompletion(shell as Shell);
    const stdout = Bun.stdout.writer();
    stdout.write(completionScript);
    stdout.end();
  });

cli.command("cache:clear", "Clear the completion cache").action(() => {
  clearCache();
  logger.info("Cache cleared successfully");
});

cli.command("cache:info", "Show cache information").action(async () => {
  const info = await getCacheInfo();
  if (!info.exists) {
    logger.info("No cache found");
    logger.info(`Cache path: ${info.path}`);
  } else {
    const ageInSeconds = Math.floor((info.age ?? 0) / 1000);
    const ageInMinutes = Math.floor(ageInSeconds / 60);
    logger.info(`Cache age: ${ageInMinutes}m ${ageInSeconds % 60}s`);
    logger.info(`Cache path: ${info.path}`);
  }
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
  const res = cli.parse(Bun.argv, { run: false });
  logger.debugEnabled = res.options.debug;

  await cli.runMatchedCommand();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
  logger.error(String(error));
  process.exit(1);
}
