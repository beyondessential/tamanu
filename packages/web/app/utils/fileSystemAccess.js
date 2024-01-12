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
  if (extensions.includes('json')) {
    types.push({
      description: 'JSON Files',
      accept: { 'application/json': ['.json'] },
    });
  }
  if (extensions.includes('sql')) {
    types.push({
      description: 'SQL Files',
      accept: { 'text/sql': ['.sql'] },
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

export const saveFile = async ({
  defaultFileName,
  data, // The file data to write, in the form of an ArrayBuffer, TypedArray, DataView, Blob, or string.
  extensions, // An array of possible extensions. If only one is in the array it will default to this extension.
}) => {
  const fileHandle = await createFileSystemHandle({ defaultFileName, extensions });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
};
