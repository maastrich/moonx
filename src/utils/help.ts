import chalk from "chalk";
import { renderString } from "nunjucks";

function style(text: string) {
  return text
    .replace(/([[<][A-Z_]+[\]>])/g, chalk.gray("$1"))
    .replace(/(?:(-[a-zA-Z]), )?(--[a-zA-Z-]+)/g, (_, short, long) => {
      if (!short) {
        return chalk.blue(long);
      }
      return `${chalk.blue(short)}, ${chalk.blue(long)}`;
    });
}

const _moonx = style(`
${chalk.bold.blue("moonx")}

${chalk.bold.magenta("Usage:")} ${chalk.yellow(
  "moonx"
)} <command> [...workspaces] [MOON_OPTIONS] -- [COMMAND_OPTIONS]

${chalk.bold(
  "Info:"
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

${chalk.bold("Moonx option:")}
    --log-report                    Print moon log report summary [env: MOONX_LOG_REPORT=] [default: false]
    --debug                         Enable debug mode [env: MOONX_DEBUG=] [default: false]

For more info, run any command with the --help flag
    e.g. ${chalk.yellow("moonx <command> --help")}
`);

function moonx(tasks: Array<[string, string[]]>) {
  const max = Math.max(...tasks.map(([task]) => task.length), 29);

  const renderCommand = (commands: string[], max: number) => {
    // join commands until length exceeds 50
    // if length exceeds 50, add "+N" at the end
    const { extras, content } = commands.reduce(
      (acc, current) => {
        if (acc.content.length + current.length + 1 <= max) {
          acc.content += (acc.content ? " " : "") + current;
        } else {
          acc.extras += 1;
        }
        return acc;
      },
      { extras: 0, content: "" }
    );
    return content + (extras > 0 ? ` ${chalk.magenta(`+${extras}`)}` : "");
  };

  console.log(process.env.COLUMNS);

  return renderString(_moonx, {
    tasks: tasks.map(([task, commands]) => ({
      name: task,
      spacing: " ".repeat(max - task.length + 1),
      commands: renderCommand(commands, process.stdout.columns - max - 10),
    })),
  });
}

const _task = style(`
${chalk.bold.blue("moonx")}

${chalk.bold.magenta("Usage:")} ${chalk.yellow(
  "moonx"
)} {command} [...workspaces] [MOON_OPTIONS] -- [COMMAND_OPTIONS]

${chalk.bold(
  "Info:"
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

Moonx options:
    --log-report                    Print moon log report summary [env: MOONX_LOG_REPORT=] [default: false]
    --debug                         Enable debug mode [env: MOONX_DEBUG=] [default: false]

For more info, run any command with the --help flag
`);

function task(workspaces: Array<string>) {
  return renderString(_task, { workspaces });
}

export const help = {
  moonx,
  task,
};
