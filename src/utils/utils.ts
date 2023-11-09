import { glob } from "glob";
import { basename } from "path";

export async function mapFromGlob(patterns?: Array<string>) {
  const map = new Map<string, string>();
  if (!patterns) {
    return map;
  }
  const files = await glob(patterns);
  for (const file of files) {
    map.set(basename(file), file);
  }
  return map;
}
