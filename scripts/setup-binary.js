const { platform, arch } = process;

// move bin/$platform-$arch to bin/moonx
const fs = require("node:fs");
const path = require("node:path");
const src = path.join(process.cwd(), "bin", `${platform}-${arch}`);
const dest = path.join(process.cwd(), "bin", "moonx");

fs.renameSync(src, dest);
