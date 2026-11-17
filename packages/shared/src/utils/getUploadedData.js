import { unlink } from 'node:fs/promises';
import path from 'node:path';
import multiparty from 'multiparty';
import { InvalidParameterError } from '@tamanu/errors';

import { tmpdir, tmpdirPath } from './tmpdir';

// These keys describe a file the server itself received and stored, so they are
// only ever set from a multipart file part, never from what the caller sends.
// `deleteFileAfterImport` is no longer one of them: an upload is always deleted
// once its handler is done with it. It stays on this list so that a caller still
// cannot supply it, should anything come to read it again.
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

/**
 * Deletes every file the parser wrote to disk except the one being handed to the
 * caller, which that caller deletes once it is done with it. Anything else — a
 * part the caller never asked for, or the whole upload when parsing fails — has
 * nobody left to clean it up, so it would sit in the upload directory for good.
 * Never throws: a file left behind must not fail the request.
 */
async function deleteUploadsExcept(files, keep) {
  const paths = Object.values(files ?? {})
    .flat()
    .map(uploaded => uploaded?.path)
    .filter(uploadedPath => uploadedPath && uploadedPath !== keep);

  await Promise.all(paths.map(uploadedPath => unlink(uploadedPath).catch(() => {})));
}

async function getMultipartData(req) {
  const form = new multiparty.Form({ autoFiles: true, uploadDir: await tmpdir() });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          await deleteUploadsExcept(files);
          reject(err);
          return;
        }

        const { jsonData, ...otherFields } = fields;

        let parsedData;
        try {
          parsedData = jsonData ? JSON.parse(jsonData) : {};
        } catch (e) {
          await deleteUploadsExcept(files);
          reject(e);
          return;
        }

        const fileInfo = files.file
          ? {
              file: files.file[0].path,
              fileName: files.file[0].originalFilename,
              fileContentType: files.file[0].headers?.['content-type'],
            }
          : {};

        await deleteUploadsExcept(files, fileInfo.file);

        resolve({
          ...withoutUploadedFileKeys(parsedData),
          ...withoutUploadedFileKeys(otherFields),
          ...fileInfo,
        });
      } catch (e) {
        reject(e);
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
