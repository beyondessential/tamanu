import { remote } from 'electron';

export async function showFileDialog(filters, filename) {
  return remote.dialog.showSaveDialog({
    filters,
    defaultPath: filename,
  });
}
