import { lstat, mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { log } from '../services/logging';

export function tmpdirPath() {
  return path.resolve(os.tmpdir());
}

export async function tmpdir() {
  const dir = tmpdirPath();
  await mkdir(dir, { recursive: true }); // on windows, os.tmpdir() can return a non-existent folder
  return dir;
}

// Uploads go to a directory of this process's own rather than straight into the
// system temp directory, which on a shared host anyone with an account can write
// to: they could otherwise plant a file there for an upload handler to read or
// delete, and could read the patient documents that pass through it. mkdtemp
// gives us a name nobody can predict and permissions nobody else holds, in one
// step, so there is no window where someone else's directory could stand in for
// ours.
let uploadDirectory = null;
let creatingUploadDirectory = null;

// The name carries the owning process's id, so that a later process can tell a
// directory left by one that died mid-upload from one still in use. The id is
// optional in the pattern because directories were once named without one.
const UPLOAD_DIRECTORY_PREFIX = 'tamanu-uploads-';
const UPLOAD_DIRECTORY_PATTERN = new RegExp(
  `^${UPLOAD_DIRECTORY_PREFIX}(?:(\\d+)-)?[A-Za-z0-9]{6}$`,
);

// Far longer than any handler holds an upload, so a directory untouched for this
// long is abandoned whoever its name says owns it.
const STALE_UPLOAD_DIRECTORY_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// A temp directory cleaner removes what has sat around long enough, which on a
// server left running is ours between one upload and the next. Forget it so the
// next upload makes another, rather than writing into one no longer there. It is
// only forgotten if it is still the directory we hold, since by now another
// caller may have replaced it with one of their own.
function forget(stale) {
  if (uploadDirectory !== stale) return;

  uploadDirectory = null;
  creatingUploadDirectory = null;
}

async function exists(directory) {
  try {
    await stat(directory);
    return true;
  } catch {
    return false;
  }
}

/**
 * The directory uploads are written to, creating it on first use.
 */
export async function uploadDir() {
  const current = uploadDirectory;
  if (current) {
    if (await exists(current)) return current;
    forget(current);
  }

  creatingUploadDirectory ??= tmpdir()
    .then(base => mkdtemp(path.join(base, `${UPLOAD_DIRECTORY_PREFIX}${process.pid}-`)))
    .then(dir => {
      uploadDirectory = dir;
      return dir;
    })
    .catch(error => {
      // Forget the failure, so the next upload tries again. Held onto, a temp
      // directory that was briefly full or unwritable would stop every upload
      // this process handles from then on.
      creatingUploadDirectory = null;
      throw error;
    });

  return creatingUploadDirectory;
}

/**
 * The upload directory, or null where nothing has been uploaded yet and so
 * no path can be one of ours.
 */
export function uploadDirPath() {
  return uploadDirectory;
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: it is running, as someone we may not signal.
    return error.code === 'EPERM';
  }
}

// A directory carrying our own id that is not the one we hold was left by an
// earlier process given the same id, as every restart of a container is.
function isLeftByDeadProcess(pid) {
  return pid === process.pid || !isRunning(pid);
}

// The age check catches what the id cannot: a dead process's id taken by another
// process, and a directory named before names carried an id. A live process's
// directory untouched this long goes too, and its next upload makes another.
function isStale(pid, stats) {
  if (pid && isLeftByDeadProcess(Number(pid))) return true;
  return Date.now() - stats.mtimeMs > STALE_UPLOAD_DIRECTORY_AGE_MS;
}

// Only a real directory we own: never follow a link someone else planted under
// one of our names, and leave another account's directories to that account.
function isOursToRemove(stats) {
  if (!stats.isDirectory()) return false;
  return typeof process.getuid !== 'function' || stats.uid === process.getuid();
}

/**
 * Removes upload directories left by processes that are no longer running, or
 * left untouched for a week. An upload is deleted by the handler that received
 * it, which never happens if the process dies first, and nothing else would ever
 * remove what it left. Run on startup. Never throws: a directory left behind must not stop the server.
 */
export async function sweepStaleUploadDirs() {
  let names;
  try {
    names = await readdir(tmpdirPath());
  } catch (error) {
    log.warn('Could not list the temp directory to sweep stale uploads', { error });
    return;
  }

  for (const name of names) {
    const directory = path.join(tmpdirPath(), name);
    const match = UPLOAD_DIRECTORY_PATTERN.exec(name);
    if (directory === uploadDirectory || !match) continue;

    try {
      const stats = await lstat(directory);
      if (!isOursToRemove(stats) || !isStale(match[1], stats)) continue;
      await rm(directory, { recursive: true, force: true });
      log.info('Removed a stale upload directory', { directory });
    } catch (error) {
      log.warn('Could not remove a stale upload directory', { directory, error });
    }
  }
}
