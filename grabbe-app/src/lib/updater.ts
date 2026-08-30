import { getVersion } from '@tauri-apps/api/app';
import pkg from '../../package.json';

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type?: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: GitHubAsset[];
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  publishedAt: string;
  assetUrl?: string;
  assetName?: string;
  assetSize?: number;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  done: boolean;
}

/**
 * Normalizes version strings and compares two Semantic Versions.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemVer(v1: string, v2: string): number {
  const clean1 = v1.trim().replace(/^v/i, '');
  const clean2 = v2.trim().replace(/^v/i, '');

  const [core1, pre1] = clean1.split('-');
  const [core2, pre2] = clean2.split('-');

  const parts1 = core1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = core2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  // If core versions are equal, a release with pre-release tag is older than one without
  if (pre1 && !pre2) return -1;
  if (!pre1 && pre2) return 1;
  if (pre1 && pre2) {
    return pre1.localeCompare(pre2);
  }

  return 0;
}

/**
 * Gets the running application version dynamically from Tauri or package fallback.
 */
export async function getCurrentAppVersion(): Promise<string> {
  try {
    const version = await getVersion();
    if (version) return version;
  } catch {
    // Fallback if running outside Tauri context or during dev
  }

  // Fallback dynamically to package.json version
  return pkg.version || '1.4.3';
}

/**
 * Selects the best installer asset for Windows from release assets.
 */
export function findPreferredAsset(assets: GitHubAsset[]): GitHubAsset | undefined {
  if (!assets || assets.length === 0) return undefined;

  // 1. Prefer -setup.exe (NSIS installer)
  const setupExe = assets.find(a => a.name.toLowerCase().endsWith('-setup.exe'));
  if (setupExe) return setupExe;

  // 2. Any .exe installer
  const anyExe = assets.find(a => a.name.toLowerCase().endsWith('.exe'));
  if (anyExe) return anyExe;

  // 3. MSI installer
  const msi = assets.find(a => a.name.toLowerCase().endsWith('.msi'));
  if (msi) return msi;

  return assets[0];
}

/**
 * Queries GitHub Releases for the latest version and compares with the running version.
 */
export async function checkAppUpdate(repo = 'RogerARocha/Grabbe'): Promise<UpdateCheckResult> {
  const currentVersion = await getCurrentAppVersion();

  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check for updates: GitHub API returned ${response.status}`);
  }

  const release: GitHubRelease = await response.json();
  const latestVersion = release.tag_name.replace(/^v/i, '');

  const isNewer = compareSemVer(latestVersion, currentVersion) > 0;
  const preferredAsset = findPreferredAsset(release.assets);

  return {
    updateAvailable: isNewer,
    currentVersion,
    latestVersion,
    releaseNotes: release.body || '',
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
    assetUrl: preferredAsset?.browser_download_url,
    assetName: preferredAsset?.name,
    assetSize: preferredAsset?.size,
  };
}
