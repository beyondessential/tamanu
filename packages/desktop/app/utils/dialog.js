import { remote } from 'electron';

export async function showFileDialog(filters, filename) {
  return new Promise(resolve => {
    remote.dialog.showSaveDialog(
      {
        filters,
        defaultPath: filename,
      },
      path => resolve(path),
    );
  });
}
