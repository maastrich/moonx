import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";

const { platform, arch } = process;

const src = join(process.cwd(), "bin", `${platform}-${arch}`);
const dest = join(process.cwd(), "bin", "moonx");

if (!existsSync(src)) {
  console.error(`Binary not found: ${src}`);
  process.exit(0);
}

renameSync(src, dest);
