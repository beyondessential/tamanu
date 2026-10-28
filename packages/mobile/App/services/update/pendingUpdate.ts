import mitt from 'mitt';

import { version as currentVersion } from '/root/package.json';
import { readConfig, writeConfig } from '~/services/config';

/**
 * Lets the update screen pick up a rejection that arrives while the app is already running, rather
 * than only on the next launch. Emits `recorded` with the address to update from.
 */
export const pendingUpdateEmitter = mitt();

/**
 * An outstanding update is remembered on the device rather than held in memory, so closing the app
 * part way through an update returns to the update screen rather than to a sign-in the server will
 * reject.
 */
const PENDING_UPDATE_URL = 'pendingUpdateUrl';
const PENDING_UPDATE_RECORDED_AT_VERSION = 'pendingUpdateRecordedAtVersion';
const INSTALL_ATTEMPTED_FROM_VERSION = 'updateInstallAttemptedFromVersion';

export async function recordPendingUpdate(updateUrl: string): Promise<void> {
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
  if (!updateUrl) return null;

  const recordedAtVersion = await readConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
  if (recordedAtVersion && recordedAtVersion !== currentVersion) {
    await writeConfig(PENDING_UPDATE_URL, '');
    await writeConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
    return null;
  }
  return updateUrl;
}

/**
 * Noted immediately before handing a package to Android, because nothing of ours runs after a
 * successful install: the process is killed as the app is replaced.
 */
export async function recordInstallAttempt(): Promise<void> {
  await writeConfig(INSTALL_ATTEMPTED_FROM_VERSION, currentVersion);
}

/**
 * Whether the app has already installed an update and is still being rejected for its version.
 * The version it installed from is compared with the version now running: a change means the
 * install took and the package did not satisfy the server, so downloading it again would loop.
 */
export async function hasInstalledUpdateAndStillOutOfDate(): Promise<boolean> {
  const attemptedFrom = await readConfig(INSTALL_ATTEMPTED_FROM_VERSION, '');
  return Boolean(attemptedFrom) && attemptedFrom !== currentVersion;
}

/**
 * Forgets everything about updating. Called once a sign-in succeeds, which is the point at which
 * the server has accepted the version now running.
 */
export async function clearUpdateState(): Promise<void> {
  await writeConfig(PENDING_UPDATE_URL, '');
  await writeConfig(PENDING_UPDATE_RECORDED_AT_VERSION, '');
  await writeConfig(INSTALL_ATTEMPTED_FROM_VERSION, '');
}
