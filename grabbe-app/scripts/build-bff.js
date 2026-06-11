import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../');
const bffProject = path.join(projectRoot, 'grabbe-bff/src/Grabbe.API/Grabbe.API.csproj');
const tauriBinDir = path.join(projectRoot, 'grabbe-app/src-tauri/bin');

// Detect platform and target triple
const platform = process.platform;
const arch = process.arch;

let targetTriple = '';
let runtimeIdentifier = '';

if (platform === 'win32') {
  if (arch === 'x64') {
    targetTriple = 'x86_64-pc-windows-msvc';
    runtimeIdentifier = 'win-x64';
  } else if (arch === 'arm64') {
    targetTriple = 'aarch64-pc-windows-msvc';
    runtimeIdentifier = 'win-arm64';
  }
} else if (platform === 'darwin') {
  if (arch === 'x64') {
    targetTriple = 'x86_64-apple-darwin';
    runtimeIdentifier = 'osx-x64';
  } else if (arch === 'arm64') {
    targetTriple = 'aarch64-apple-darwin';
    runtimeIdentifier = 'osx-arm64';
  }
} else if (platform === 'linux') {
  if (arch === 'x64') {
    targetTriple = 'x86_64-unknown-linux-gnu';
    runtimeIdentifier = 'linux-x64';
  } else if (arch === 'arm64') {
    targetTriple = 'aarch64-unknown-linux-gnu';
    runtimeIdentifier = 'linux-arm64';
  }
}

if (!targetTriple || !runtimeIdentifier) {
  console.error(`Unsupported platform/architecture: ${platform}/${arch}`);
  process.exit(1);
}

console.log(`Building C# BFF for ${runtimeIdentifier} (${targetTriple})...`);

// Create src-tauri/bin directory if it doesn't exist
if (!fs.existsSync(tauriBinDir)) {
  fs.mkdirSync(tauriBinDir, { recursive: true });
}

// Temporary output directory for publish
const tempOutDir = path.join(tauriBinDir, 'temp-publish');

try {
  // Run dotnet publish
  const publishCmd = `dotnet publish "${bffProject}" -c Release -r ${runtimeIdentifier} --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=false -o "${tempOutDir}"`;
  console.log(`Running: ${publishCmd}`);
  execSync(publishCmd, { stdio: 'inherit' });

  // Locate the executable in the temp output directory
  const ext = platform === 'win32' ? '.exe' : '';
  const exeName = `Grabbe.API${ext}`;
  const srcPath = path.join(tempOutDir, exeName);
  const destPath = path.join(tauriBinDir, `grabbe-bff-${targetTriple}${ext}`);

  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${srcPath} to ${destPath}`);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Successfully created sidecar binary: ${destPath}`);
  } else {
    throw new Error(`Could not find published executable at ${srcPath}`);
  }
} catch (err) {
  console.error('Failed to build BFF sidecar:', err);
  process.exit(1);
} finally {
  // Clean up temp publish directory
  if (fs.existsSync(tempOutDir)) {
    fs.rmSync(tempOutDir, { recursive: true, force: true });
  }
}
