import chalk from "chalk";
import { renderString } from "nunjucks";

function style(text: string) {
  return text
    .replace(/([\[\<][A-Z_]+[\]\>])/g, chalk.gray("$1"))
    .replace(/(?:(\-[a-zA-Z]), )?(\-\-[a-zA-Z\-]+)/g, (_, short, long) => {
      if (!short) {
        return chalk.blue(long);
      }
      return `${chalk.blue(short)}, ${chalk.blue(long)}`;
    });
}

const _moonx = style(`
${chalk.bold.blue("moonx")}

${chalk.bold.magenta("Usage:")} ${chalk.yellow(
  "moonx",
)} <command> [...workspaces] [MOON_OPTIONS] -- [COMMAND_OPTIONS]

${chalk.bold(
  "Info:",
)} When no workspaces are specified, moonx will run the command on all available workspaces.

${chalk.bold("Commands:")}
  {% for task in tasks -%}
    ${chalk.blue("{{ task.name }}")}{{ task.spacing }}{{ task.commands }}
  {% endfor %}

${chalk.bold("Moon option:")}
    --cache <CACHE>                 Mode for cache operations [env: MOON_CACHE=] [default: read-write] [possible values: off, read, read-write, write]
    --color                         Force colored output for moon
    -c, --concurrency <CONCURRENCY> Maximum number of threads to utilize [env: MOON_CONCURRENCY=]
    --log <LOG>                     Lowest log level to output [env: MOON_LOG=] [default: info] [possible values: off, error, warn, info, debug, trace]
    --logFile <LOG_FILE>            Path to a file to dump the moon logs [env: MOON_LOG_FILE=]
    -h, --help                      Print help
    -v, --version                   Print moonx version
    --moon-version                  Print moon version
    --moon-help                     Print moon help

For more info, run any command with the --help flag
    e.g. ${chalk.yellow("moonx <command> --help")}
`);

function moonx(tasks: Array<[string, string[]]>) {
  return renderString(_moonx, {
    tasks: tasks.map(([task, commands]) => ({
      name: task,
      spacing: " ".repeat(30 - task.length),
      commands: commands.join(" "),
    })),
  });
}

const _task = style(`
${chalk.bold.blue("moonx")}

${chalk.bold.magenta("Usage:")} ${chalk.yellow(
  "moonx",
)} {command} [...workspaces] [MOON_OPTIONS] -- [COMMAND_OPTIONS]

${chalk.bold(
  "Info:",
)} When no workspaces are specified, moonx will run the command on all available workspaces.

${chalk.bold("Available workspaces:")}
  {% for workspace in workspaces %}
    ${chalk.blue("{{ workspace }}")}
  {% endfor %}

Moon options:
    --cache <CACHE>                 Mode for cache operations [env: MOON_CACHE=] [default: read-write] [possible values: off, read, read-write, write]
    --color                         Force colored output for moon
    -c, --concurrency <CONCURRENCY> Maximum number of threads to utilize [env: MOON_CONCURRENCY=]
    --log <LOG>                     Lowest log level to output [env: MOON_LOG=] [default: info] [possible values: off, error, warn, info, debug, trace]
    --logFile <LOG_FILE>            Path to a file to dump the moon logs [env: MOON_LOG_FILE=]
    -h, --help                      Print help
    -V, --version                   Print version

For more info, run any command with the --help flag
`);

function task(workspaces: Array<string>) {
  return renderString(_task, { workspaces });
}

export const help = {
  moonx,
  task,
};
