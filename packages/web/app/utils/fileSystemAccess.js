const sanitizeFileName = fileName => {
  return fileName
    .replace(/CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9]/g, 'download') // replace windows reserved filenames
    .replace(/[-<>:"/\\|?*\s]+/g, '-') // replace any consecutive windows reserved characters
    .trim('-'); // prevent leading or trailing hyphen
};

const FILE_TYPES = {
  pdf: { description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } },
  jpeg: { description: 'JPEG Files', accept: { 'image/jpeg': ['.jpeg'] } },
  xlsx: {
    description: 'Excel Workbook',
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
  },
  csv: { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
  json: { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
  sql: { description: 'SQL Files', accept: { 'text/sql': ['.sql'] } },
};

const buildTypesArray = extensions => extensions.map(ext => FILE_TYPES[ext]).filter(Boolean);

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
