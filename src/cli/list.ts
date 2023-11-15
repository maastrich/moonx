export function list(
  [command, ...wss]: Array<string>,
  commands: Map<string, string[]>,
) {
  if (!commands.has(command) && wss.length) {
    console.log(`task ${command} does not exist`);
    return [];
  }
  if (!commands.has(command)) {
    return Array.from(commands.keys());
  }
  const workspaces = commands.get(command)!;
  if (!wss.length) {
    return workspaces;
  }
  return workspaces.filter((ws) => !wss.includes(ws));
}
