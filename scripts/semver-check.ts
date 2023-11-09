import { gt, valid } from "semver";

import pkg from "../package.json";

try {
  const response = await fetch(
    "https://raw.githubusercontent.com/maastrich/moonx/main/package.json",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const infos = await response.json();

  const current = pkg.version;
  const previous = infos.version;

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
} catch (error) {
  console.error("Could not resolve previous version:\n\t%s", error);
  process.exit(0);
}
