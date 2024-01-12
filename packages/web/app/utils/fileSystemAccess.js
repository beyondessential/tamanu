const sanitizeFileName = fileName => {
  return fileName
    .replace(/CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9]/g, 'download') // replace windows reserved filenames
    .replace(/[-<>:"/\\|?*\s]+/g, '-') // replace any consecutive windows reserved characters
    .trim('-'); // prevent leading or trailing hyphen
};

const buildTypesArray = extensions => {
  const types = [];
  if (extensions.includes('pdf')) {
    types.push({
      description: 'PDF Files',
      accept: { 'application/pdf': ['.pdf'] },
    });
  }
  if (extensions.includes('jpeg')) {
    types.push({
      description: 'JPEG Files',
      accept: { 'image/jpeg': ['.jpeg'] },
    });
  }
  if (extensions.includes('xlsx')) {
    types.push({
      description: 'Excel Workbook',
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    });
  }
  if (extensions.includes('csv')) {
    types.push({
      description: 'CSV Files',
      accept: { 'text/csv': ['.csv'] },
    });
  }
  return types;
};

export const createFileSystemHandle = async ({ defaultFileName, extensions }) => {
  const types = buildTypesArray(extensions);
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: sanitizeFileName(`${defaultFileName}`),
    types,
  });
  return fileHandle;
};