import { parse } from "yaml";

import { logger } from "./logger.js";

type LoadOptions<T> =
  | {
      allowMissing?: never;
    }
  | {
      allowMissing: true;
      placeholder: T;
    };

export async function load<T extends object>(
  path: string,
  options?: LoadOptions<T>,
): Promise<T> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    if (options?.allowMissing) {
      logger.debug(`file ${path} does not exist`);
      return options.placeholder;
    }
    logger.error(`file ${path} does not exist`);
    process.exit(1);
  }

  const content = await file.text();
  logger.debug(`loaded ${path}`);
  return parse(content);
}
