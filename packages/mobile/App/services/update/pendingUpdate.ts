import mitt from 'mitt';

import { version as currentVersion } from '/root/package.json';
import { readConfig, writeConfig } from '~/services/config';

/**
 * Lets the home screen banner and the Sync tab follow the server while the app is running, rather
 * than only on the next launch. Emits `recorded` with the address to update from each time the
 * server rejects this version, and `cleared` once it accepts it.
 */
export const pendingUpdateEmitter = mitt();

/** The outstanding update as last read or written. */
let cachedUpdateUrl: string | null = null;

/**
 * An outstanding update is remembered on the device rather than held in memory, so closing the app
 * part way through an update resumes it, with sync still paused and the banner still showing.
 */
const PENDING_UPDATE_URL = 'pendingUpdateUrl';
const PENDING_UPDATE_RECORDED_AT_VERSION = 'pendingUpdateRecordedAtVersion';
const INSTALL_ATTEMPTED_FROM_VERSION = 'updateInstallAttemptedFromVersion';
const INSTALL_ATTEMPTED_FOR_URL = 'updateInstallAttemptedForUrl';
const PACKAGE_FETCHED_FOR_URL = 'updatePackageFetchedForUrl';

export async function recordPendingUpdate(updateUrl: string): Promise<void> {
  cachedUpdateUrl = updateUrl;
  await writeConfig(PENDING_UPDATE_URL, updateUrl);
  await writeConfig(PENDING_UPDATE_RECORDED_AT_VERSION, currentVersion);
  pendingUpdateEmitter.emit('recorded', updateUrl);
}

/**
 * The outstanding update, if there is one for the version now running. An update recorded by an
 * earlier version has been installed since, so it is dropped and the server gets to decide afresh
 * whether this version is acceptable.
 */
export async function readPendingUpdate(): Promise<string | null> {
  const updateUrl = await readConfig(PENDING_UPDATE_URL, '');
  if (!updateUrl) {
    cachedUpdateUrl = null;
    return null;
  }

  const recordedAtVersion = await readConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
  if (recordedAtVersion && recordedAtVersion !== currentVersion) {
    await writeConfig(PENDING_UPDATE_URL, '');
    await writeConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
    cachedUpdateUrl = null;
    return null;
  }
  cachedUpdateUrl = updateUrl;
  return updateUrl;
}

/**
 * Notes the address the package on the device is being fetched from, returning whether it replaces
 * a different one. A package fetched for an address the server has since replaced is for another
 * release, so it has to be discarded rather than resumed or installed.
 */
export async function recordPackageSource(packageUrl: string): Promise<boolean> {
  const fetchedFor = await readConfig(PACKAGE_FETCHED_FOR_URL, '');
  await writeConfig(PACKAGE_FETCHED_FOR_URL, packageUrl);
  return Boolean(fetchedFor) && fetchedFor !== packageUrl;
}

/**
 * Noted immediately before handing a package to Android, because nothing of ours runs after a
 * successful install: the process is killed as the app is replaced.
 */
export async function recordInstallAttempt(): Promise<void> {
  await writeConfig(INSTALL_ATTEMPTED_FROM_VERSION, currentVersion);
  await writeConfig(INSTALL_ATTEMPTED_FOR_URL, cachedUpdateUrl ?? '');
}

/**
 * Whether the app has already installed the update the server is asking for, and is still being
 * rejected for its version. A changed running version means the install took; the server asking
 * for the same address again means that package did not satisfy it, so downloading it again would
 * loop. A different address is a newer release the server moved on to, which is downloaded.
 */
export async function hasInstalledUpdateAndStillOutOfDate(): Promise<boolean> {
  const attemptedFrom = await readConfig(INSTALL_ATTEMPTED_FROM_VERSION, '');
  const attemptedFor = await readConfig(INSTALL_ATTEMPTED_FOR_URL, '');
  return (
    Boolean(attemptedFrom) && attemptedFrom !== currentVersion && attemptedFor === cachedUpdateUrl
  );
}

/**
 * Forgets everything about updating. Called once a sync succeeds, which is the point at which the
 * server has accepted the version now running. Not on sign-in: the server lets an out-of-date app
 * sign in, so a sign-in proves nothing about its version.
 */
export async function clearUpdateState(): Promise<void> {
  cachedUpdateUrl = null;
  await writeConfig(PENDING_UPDATE_URL, '');
  await writeConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
  await writeConfig(INSTALL_ATTEMPTED_FROM_VERSION, '');
  await writeConfig(INSTALL_ATTEMPTED_FOR_URL, '');
  await writeConfig(PACKAGE_FETCHED_FOR_URL, '');
  pendingUpdateEmitter.emit('cleared');
}
