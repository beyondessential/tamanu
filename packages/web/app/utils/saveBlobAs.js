import { createFileSystemHandle } from './fileSystemAccess';

export async function saveBlobAs(blob, { extension, defaultFileName } = {}) {
  const fileHandle = await createFileSystemHandle({
    defaultFileName,
    extensions: [extension],
  });

  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}
