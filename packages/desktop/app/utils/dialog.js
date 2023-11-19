export async function showFileDialog(filters, filename = '') {
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
