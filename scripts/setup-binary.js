import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
} from "node:fs";
import { get } from "node:https";
import { join, dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const { platform, arch } = process;

console.log(process.env.INIT_CWD, process.cwd());

// Skip installation in development workspace
// INIT_CWD is the directory where npm install was initiated
// If it differs from cwd, we're in a workspace install
if (process.env.INIT_CWD && process.env.INIT_CWD === process.cwd()) {
  console.log("Skipping binary download in workspace install");
  process.exit(0);
}

// Get package version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const binaryName = `${platform}-${arch}`;
const src = join(process.cwd(), "bin", binaryName, binaryName);
const dest = join(process.cwd(), "bin", "moonx");

// If binary already exists locally (from build), use it
if (existsSync(src)) {
  renameSync(src, dest);
  chmodSync(dest, 0o755);
  console.log(`Binary installed successfully from local build`);
  process.exit(0);
}

// Download from GitHub releases
console.log(`Downloading binary for ${platform}-${arch}...`);

const downloadUrl = `https://github.com/maastrich/moonx/releases/download/v${version}/${binaryName}`;

async function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadBinary(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(`Failed to download binary: HTTP ${response.statusCode}`)
        );
        return;
      }

      // Ensure directory exists
      mkdirSync(dirname(destPath), { recursive: true });

      const fileStream = createWriteStream(destPath);
      pipeline(response, fileStream)
        .then(() => {
          chmodSync(destPath, 0o755);
          resolve();
        })
        .catch(reject);
    }).on("error", reject);
  });
}

try {
  await downloadBinary(downloadUrl, dest);
  console.log(`Binary downloaded and installed successfully`);
} catch (error) {
  console.error(`Failed to download binary: ${error.message}`);
  console.error(`Tried to download from: ${downloadUrl}`);
  console.error(`Please ensure the release v${version} exists on GitHub`);
  console.error(`\tsee: https://github.com/maastrich/moonx/releases`);
  process.exit(1);
}
