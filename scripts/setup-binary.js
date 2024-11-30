import { renameSync } from "node:fs";
import { join } from "node:path";

const { platform, arch } = process;

const src = join(process.cwd(), "bin", `${platform}-${arch}`);
const dest = join(process.cwd(), "bin", "moonx");

renameSync(src, dest);
