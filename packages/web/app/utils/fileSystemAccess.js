const sanitizeFileName = fileName => {
  return fileName
    .trim() // prevent leading or trailing whitespace
    .replace(/CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9]/g, 'download') // replace windows reserved filenames
    .replace(/[-<>:"/\\|?*\s]+/g, '-') // replace any consecutive windows reserved characters
    .trim('-'); // prevent leading or trailing hyphen
};

const FILE_TYPES = {
  DEFAULT: { description: 'File', accept: { 'application/binary': ['.bin', ''] } },
  csv: { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
  jpeg: { description: 'JPEG Files', accept: { 'image/jpeg': ['.jpeg', '.jpg'] } },
  jpg: { description: 'JPEG Files', accept: { 'image/jpeg': ['.jpeg', '.jpg'] } },
  json: { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
  pdf: { description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } },
  png: { description: 'PNG Images', accept: { 'image/png': ['.png'] } },
  sql: { description: 'SQL Files', accept: { 'text/sql': ['.sql'] } },
  xlsx: {
    description: 'Excel Workbook',
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
  },
};

const createFileSystemHandle = async ({ defaultFileName, filetype }) =>
  window.showSaveFilePicker({
    suggestedName: sanitizeFileName(`${defaultFileName}`),
    types: [filetype],
  });

export const saveFile = async ({
  defaultFileName,
  data, // The file data to write, in the form of an ArrayBuffer, TypedArray, DataView, Blob, or string.
  extension, // The file extension.
}) => {
  const filetype = FILE_TYPES[(extension ?? '').toLowerCase()] ?? FILE_TYPES.DEFAULT;

  try {
    const fileHandle = await createFileSystemHandle({ defaultFileName, filetype });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (_) {
    // fallback to non-file-picker download if it's not available
    // or if the Transient User Activation window has closed
    const blob = new Blob([data], {
      type: Object.keys(filetype.accept)?.[0] ?? 'application/binary',
    });
    open(URL.createObjectURL(blob), '_blank');
  }
};
