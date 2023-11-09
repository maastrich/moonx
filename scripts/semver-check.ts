import { gt, valid } from "semver";

import pkg from "../package.json";

const infos = Bun.spawnSync({ cmd: ["pnpm", "info", "--json"] });
if (!infos.success) {
  console.error("Could not get package info, got:\n%s", infos.stderr);
  process.exit(1);
}

const current = pkg.version;
const previous = JSON.parse(infos.stdout.toString()).version;

if (!previous || !valid(previous) || !valid(current)) {
  console.error(
    "Could not compare versions, got: previous=%s, current=%s",
    previous,
    current,
  );
  process.exit(1);
}

if (!gt(current, previous)) {
  console.error(
    "Current version %s is not greater than previous version %s",
    current,
    previous,
  );
  process.exit(1);
}
