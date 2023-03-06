import { showFileDialog } from './dialog';

export async function saveBlobAs(blob, { extensions, defaultFileName } = {}) {
  const path = await showFileDialog([{ extensions }], defaultFileName);
  if (!path) {
    // user cancelled
    return '';
  }
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = path;
  a.click();
  window.URL.revokeObjectURL(url);
  return path;
}
