import { mkdir, mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

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
    .then(base => mkdtemp(path.join(base, 'tamanu-uploads-')))
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
