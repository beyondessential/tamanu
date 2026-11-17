import path from 'node:path';
import multiparty from 'multiparty';
import { InvalidParameterError } from '@tamanu/errors';

import { tmpdir, tmpdirPath } from './tmpdir';

// These keys describe a file the server itself received and stored, so they are
// only ever set from a multipart file part, never from what the caller sends.
const UPLOADED_FILE_KEYS = ['file', 'fileName', 'fileContentType', 'deleteFileAfterImport'];

function withoutUploadedFileKeys(data) {
  const cleaned = { ...data };
  for (const key of UPLOADED_FILE_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
}

/**
 * Throws unless `file` is a file the upload handler stored, i.e. directly inside
 * the upload directory. Call before reading or deleting an uploaded file.
 */
export function assertUploadedFilePath(file) {
  if (typeof file !== 'string' || path.dirname(path.resolve(file)) !== tmpdirPath()) {
    throw new InvalidParameterError('A file must be uploaded');
  }
}

async function getMultipartData(req) {
  const form = new multiparty.Form({ autoFiles: true, uploadDir: await tmpdir() });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        const { jsonData, ...otherFields } = fields;

        try {
          const parsedData = jsonData ? JSON.parse(jsonData) : {};

          const fileInfo = files.file
            ? {
                file: files.file[0].path,
                fileName: files.file[0].originalFilename,
                fileContentType: files.file[0].headers?.['content-type'],
                deleteFileAfterImport: true,
              }
            : {};

          resolve({
            ...withoutUploadedFileKeys(parsedData),
            ...withoutUploadedFileKeys(otherFields),
            ...fileInfo,
          });
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

export async function getUploadedData(req) {
  const contentType = (req.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  switch (contentType) {
    case 'multipart/form-data':
      return getMultipartData(req);
    case 'application/json':
      return withoutUploadedFileKeys(req.body);
    default:
      throw new Error(`Couldn't understand content type ${contentType}`);
  }
}
