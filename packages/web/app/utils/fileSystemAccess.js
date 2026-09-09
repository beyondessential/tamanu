const sanitizeFileName = fileName => {
  return fileName
    .trim() // prevent leading or trailing whitespace
    .replace(/CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9]/g, 'download') // replace windows reserved filenames
    .replace(/[-<>:"/\\|?*\s]+/g, '-') // replace any consecutive windows reserved characters
    .trim('-'); // prevent leading or trailing hyphen
};

const FILE_TYPES = /** @type {const} */ ([
  { description: 'File', accept: { 'application/binary': ['.bin'] } },
  { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
  { description: 'JPEG Files', accept: { 'image/jpeg': ['.jpeg', '.jpg'] } },
  { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
  { description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } },
  { description: 'PNG Images', accept: { 'image/png': ['.png'] } },
  { description: 'SQL Files', accept: { 'text/sql': ['.sql'] } },
  {
    description: 'Excel Workbook',
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
  },
]);

const DEFAULT_FILE_TYPE = FILE_TYPES[0];

const fileTypeFromExtension = extension =>
  FILE_TYPES.find(fileType =>
    Object.entries(fileType.accept).some(([, exts]) => exts.includes(extension)),
  ) ?? DEFAULT_FILE_TYPE;

const fileTypeFromMimeType = mimeType =>
  FILE_TYPES.find(fileType => Object.keys(fileType.accept).includes(mimeType)) ?? DEFAULT_FILE_TYPE;

/** @returns {Promise<FileSystemFileHandle> } */
const createFileSystemHandle = async ({ defaultFileName, filetype }) =>
  await window.showSaveFilePicker({
    suggestedName: sanitizeFileName(`${defaultFileName}`),
    types: [filetype],
  });

/**
 * @param getData {Function} - Async function which returns the file data to write (ArrayBuffer,
 * TypedArray, DataView, Blob, or string)
 * @returns {Promise<boolean>} true on successful save, false if user cancelled the operation
 */
export const saveFile = async ({
  defaultFileName,
  getData,
  extension = null, // The file extension.
  mimetype = null,
}) => {
  let filetype;
  if (mimetype) {
    filetype = fileTypeFromMimeType(mimetype);
  } else if (extension?.startsWith('.')) {
    filetype = fileTypeFromExtension(extension.toLowerCase());
  } else if (extension) {
    filetype = fileTypeFromExtension(`.${extension.toLowerCase()}`);
  } else {
    filetype = DEFAULT_FILE_TYPE;
  }

  if ('showSaveFilePicker' in window) {
    // To avoid a SecurityError, get file handle before preparing file for download
    // See https://developer.chrome.com/docs/capabilities/web-apis/file-system-access#write-file
    let fileHandle;
    try {
      fileHandle = await createFileSystemHandle({ defaultFileName, filetype });
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      throw error;
    }

    /** @type {FileSystemWritableFileStream} */
    let writable;
    try {
      const [writable, data] = await Promise.all([fileHandle.createWritable(), getData()]);
      await writable.write(data);
      await writable.close();
    } catch (error) {
      try {
        await writable?.abort();
      } catch {
        // abort may fail if the stream is already closed
      }
      throw error;
    }
    return true;
  }

  // fallback to non-file-picker download if it's not available
  const data = await getData();
  const blob = new Blob([data], {
    type: Object.keys(filetype.accept)?.[0] ?? 'application/binary',
  });
  open(URL.createObjectURL(blob), '_blank');
  return true;
};
