export async function showFileDialog(filters, filename = '') {
  // we require require() here as the import is dynamic
  // eslint-disable-next-line global-require
  const { dialog } = require('@electron/remote');
  const result = await dialog.showSaveDialog({
    filters,
    defaultPath: filename,
  });

  // mac just returns a string
  if (typeof result === 'string') {
    return result;
  }

  // windows returns an object
  const { canceled, filePath } = result;
  if (canceled) {
    return '';
  }

  return filePath;
}
