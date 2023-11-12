export function exec(
  command: string,
  wss: Array<string>,
  commands: Map<string, string[]>,
) {
  const wokspaces = commands.get(command);
  if (!wokspaces) {
    throw new Error(`task ${command} does not exist`);
  }
  if (!wss.length) {
    return [`:${command}`];
  }
  return wss
    .filter((ws) => wokspaces.includes(ws))
    .map((ws) => `${ws}:${command}`);
}
