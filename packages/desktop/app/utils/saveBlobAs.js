import fs from 'fs';
import { showFileDialog } from './dialog';

export async function saveBlobAs(blob, { extensions, defaultFileName } = {}) {
  const path = await showFileDialog([{ extensions }], defaultFileName);
  if (!path) {
    // user cancelled
    return '';
  }
  // save blob to disk
  const buffer = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(path, buffer);
  return path;
}
